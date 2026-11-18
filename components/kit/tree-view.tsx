"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-tree-in { from { opacity: 0; transform: translateY(-4px) } }`;

export interface TreeViewNode {
  id: string;
  label: string;
  /** Replaces the default folder or file icon. */
  icon?: ReactNode;
  /** Muted text on the right, e.g. a size or a count. */
  meta?: string;
  /** Present (even empty) = a folder. */
  children?: TreeViewNode[];
  disabled?: boolean;
}

export interface TreeViewProps {
  nodes: TreeViewNode[];
  selected?: string | null;
  defaultSelected?: string | null;
  onSelect?: (id: string, node: TreeViewNode) => void;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Accessible name for the tree. */
  label?: string;
  className?: string;
}

interface Row {
  node: TreeViewNode;
  level: number;
  parent: string | null;
}

const isFolder = (n: TreeViewNode) => n.children !== undefined;

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
      {open ? <path d="M2 12.5v-8a1 1 0 0 1 1-1h3l1.5 1.5H12a1 1 0 0 1 1 1V7M2 12.5 3.8 8a1 1 0 0 1 .9-.6h9.1a.6.6 0 0 1 .6.8l-1.6 4.3h-11Z" /> : <path d="M2 4.5a1 1 0 0 1 1-1h3L7.5 5H13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z" />}
    </svg>
  );
}
function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
      <path d="M4 2.5h5L12.5 6v7.5H4zM9 2.5V6h3.5" />
    </svg>
  );
}

/**
 * Nested folders and files. Click a row to select it, or a folder to open it too. The chevron turns and the
 * children fade in below. Full WAI-ARIA tree keys: Up/Down, Right to open or step in, Left to close or step
 * out, Home/End, `*` to open siblings, Enter/Space to select, and type-ahead on labels.
 */
export function TreeView({ nodes, selected, defaultSelected = null, onSelect, expanded, defaultExpanded = [], onExpandedChange, label, className }: TreeViewProps) {
  const [innerSel, setInnerSel] = useState<string | null>(defaultSelected);
  const [innerExp, setInnerExp] = useState<string[]>(defaultExpanded);
  const sel = selected !== undefined ? selected : innerSel;
  const exp = useMemo(() => new Set(expanded ?? innerExp), [expanded, innerExp]);
  // Folders opened by the user: only their children animate in, not the first render.
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLLIElement>());
  const tree = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  // Every node by id, with its parent and depth.
  const index = useMemo(() => {
    const m = new Map<string, Row>();
    const walk = (list: TreeViewNode[], level: number, parent: string | null) => {
      for (const n of list) {
        m.set(n.id, { node: n, level, parent });
        if (n.children) walk(n.children, level + 1, n.id);
      }
    };
    walk(nodes, 1, null);
    return m;
  }, [nodes]);

  // What's on screen, top to bottom.
  const visible = useMemo(() => {
    const out: Row[] = [];
    const walk = (list: TreeViewNode[], level: number, parent: string | null) => {
      for (const n of list) {
        out.push({ node: n, level, parent });
        if (n.children && exp.has(n.id)) walk(n.children, level + 1, n.id);
      }
    };
    walk(nodes, 1, null);
    return out;
  }, [nodes, exp]);

  // The one row in the tab order: the focused one if still on screen, else the selection, else the first row.
  const visibleIds = new Set(visible.map((r) => r.node.id));
  const tabId = focusId && visibleIds.has(focusId) ? focusId : sel && visibleIds.has(sel) ? sel : (visible[0]?.node.id ?? null);

  const setExp = (next: Set<string>) => {
    const ids = [...next];
    if (expanded === undefined) setInnerExp(ids);
    onExpandedChange?.(ids);
  };

  const isAncestor = (id: string, of: string | null) => {
    for (let p = of ? index.get(of)?.parent : null; p; p = index.get(p)?.parent) if (p === id) return true;
    return false;
  };

  const toggle = (id: string, open = !exp.has(id)) => {
    if (open === exp.has(id)) return;
    const next = new Set(exp);
    if (open) {
      next.add(id);
      setOpened((o) => (o.has(id) ? o : new Set(o).add(id)));
    } else {
      next.delete(id);
      // Closing a folder that hides the focused row moves focus up to the folder.
      if (isAncestor(id, focusId)) setFocusId(id);
    }
    setExp(next);
  };

  const choose = (n: TreeViewNode) => {
    if (n.disabled) return;
    if (selected === undefined) setInnerSel(n.id);
    onSelect?.(n.id, n);
  };

  const focus = (id: string | undefined | null) => {
    if (!id) return;
    setFocusId(id);
    refs.current.get(id)?.focus();
  };

  // Keep DOM focus on the focused row when it moves while the tree has focus (e.g. after collapsing a parent).
  useEffect(() => {
    if (!focusId || !tree.current?.contains(document.activeElement)) return;
    const el = refs.current.get(focusId);
    if (el && document.activeElement !== el) el.focus();
  }, [focusId, visible]);

  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const i = visible.findIndex((r) => r.node.id === tabId);
    const row = visible[i];
    if (!row) return;
    const n = row.node;
    let handled = true;
    switch (e.key) {
      case "ArrowDown":
        focus(visible[i + 1]?.node.id);
        break;
      case "ArrowUp":
        focus(visible[i - 1]?.node.id);
        break;
      case "Home":
        focus(visible[0]?.node.id);
        break;
      case "End":
        focus(visible[visible.length - 1]?.node.id);
        break;
      case "ArrowRight":
        if (isFolder(n) && !n.disabled) {
          if (!exp.has(n.id)) toggle(n.id, true);
          else if (n.children!.length) focus(n.children![0].id);
        }
        break;
      case "ArrowLeft":
        if (isFolder(n) && exp.has(n.id)) toggle(n.id, false);
        else focus(row.parent);
        break;
      case "Enter":
        choose(n);
        if (isFolder(n) && !n.disabled) toggle(n.id);
        break;
      case " ":
        choose(n);
        break;
      case "*": {
        const siblings = row.parent ? index.get(row.parent)!.node.children! : nodes;
        const next = new Set(exp);
        const fresh: string[] = [];
        for (const s of siblings)
          if (isFolder(s) && !s.disabled && !next.has(s.id)) {
            next.add(s.id);
            fresh.push(s.id);
          }
        if (fresh.length) {
          setOpened((o) => new Set([...o, ...fresh]));
          setExp(next);
        }
        break;
      }
      default:
        handled = false;
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const t = typed.current;
          t.text = e.timeStamp - t.at > 600 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
          t.at = e.timeStamp;
          const start = t.text.length === 1 ? i + 1 : i;
          const order = [...visible.slice(start), ...visible.slice(0, start)];
          const hit = order.find((r) => r.node.label.toLowerCase().startsWith(t.text));
          if (hit) {
            focus(hit.node.id);
            handled = true;
          }
        }
    }
    if (handled) e.preventDefault();
  };

  const renderList = (list: TreeViewNode[], level: number, parent: string | null): ReactNode =>
    list.map((n, k) => {
      const folder = isFolder(n);
      const open = folder && exp.has(n.id);
      const isSel = sel === n.id;
      const animate = parent !== null && opened.has(parent);
      return (
        <li
          key={n.id}
          ref={(el) => {
            if (el) refs.current.set(n.id, el);
            else refs.current.delete(n.id);
          }}
          role="treeitem"
          tabIndex={tabId === n.id ? 0 : -1}
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={k + 1}
          aria-expanded={folder ? open : undefined}
          aria-selected={isSel}
          aria-disabled={n.disabled || undefined}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusId(n.id);
          }}
          className={cx(
            "outline-none [&:focus-visible>div:first-child]:ring-2 [&:focus-visible>div:first-child]:ring-inset [&:focus-visible>div:first-child]:ring-brand/50",
            animate && "animate-[asta-tree-in_.32s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none",
          )}
          style={animate ? { animationDelay: `${Math.min(k, 8) * 24}ms` } : undefined}
        >
          <div
            data-selected={isSel || undefined}
            onClick={() => {
              if (n.disabled) return;
              focus(n.id);
              choose(n);
              if (folder) toggle(n.id);
            }}
            style={{ paddingLeft: 8 + (level - 1) * 18 }}
            className={cx(
              "group/row flex h-8 select-none items-center gap-2 rounded-lg pr-2.5 text-[13px] transition-colors duration-150",
              n.disabled ? "cursor-not-allowed text-mute opacity-50" : "cursor-pointer",
              isSel ? "bg-paper-2 text-ink" : !n.disabled && "text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-paper-2)_60%,transparent)] hover:text-ink",
            )}
          >
            <span
              aria-hidden
              onClick={(e) => {
                // The chevron toggles without selecting.
                if (!folder || n.disabled) return;
                e.stopPropagation();
                focus(n.id);
                toggle(n.id);
              }}
              className="grid h-4 w-4 shrink-0 place-items-center text-mute"
            >
              {folder && (
                <svg viewBox="0 0 16 16" className={cx("h-3 w-3 transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none", open && "rotate-90")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 4 4 4-4 4" />
                </svg>
              )}
            </span>
            <span className={cx("inline-flex h-4 w-4 shrink-0 transition-colors [&_svg]:h-4 [&_svg]:w-4", isSel ? "text-brand" : "text-mute group-hover/row:text-ink-2")}>{n.icon ?? (folder ? <FolderIcon open={open} /> : <FileIcon />)}</span>
            <span className="flex-1 truncate">{n.label}</span>
            {n.meta && <span className="shrink-0 text-[11.5px] tabular-nums text-mute">{n.meta}</span>}
          </div>
          {open && n.children!.length > 0 && (
            <ul role="group" className="flex flex-col gap-px pt-px">
              {renderList(n.children!, level + 1, n.id)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <ul ref={tree} role="tree" aria-label={label} onKeyDown={onKey} className={cx("flex flex-col gap-px", className)}>
      <style href="asta-tree-view" precedence="asta">
        {KEYFRAMES}
      </style>
      {renderList(nodes, 1, null)}
    </ul>
  );
}

export default TreeView;
