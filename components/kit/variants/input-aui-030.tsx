"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const ROW = 36;
const HEAD = 28;

const CSS = `
@keyframes aui030-pop { from { opacity: 0; transform: translateY(-6px) scale(.985) } to { opacity: 1; transform: none } }
@keyframes aui030-row { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui030 * { animation: none !important; transition: none !important } }
`;

export interface SearchFieldItem {
  label: string;
  /** Right-aligned meta, e.g. a section or a date. */
  meta?: string;
  /** "recent" rows get a clock and can be removed, "page" rows get an arrow. */
  kind?: "recent" | "page";
}

export interface SearchFieldProps {
  placeholder?: string;
  /** Past searches, newest first. Picking a query adds it here. */
  recent?: string[];
  /** Places you can jump to. Filtered as you type. */
  pages?: SearchFieldItem[];
  /** Called with the query when you press Enter or pick a row. */
  onSearch?: (query: string, item?: SearchFieldItem) => void;
  /** Focus the field with "/" or ⌘K / Ctrl K from anywhere on the page. */
  shortcut?: boolean;
  /** Start with the list open (for previews). */
  defaultOpen?: boolean;
  /** Dark field on an ink bar, or light on paper. */
  tone?: "dark" | "light";
  className?: string;
}

const RECENT = ["invoice template", "brand guidelines", "q4 roadmap"];
const PAGES: SearchFieldItem[] = [
  { label: "Projects", meta: "Workspace", kind: "page" },
  { label: "Team members", meta: "Settings", kind: "page" },
  { label: "Billing and invoices", meta: "Settings", kind: "page" },
];

function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-[var(--aui030-fg)] underline decoration-brand decoration-2 underline-offset-[3px]">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

const Icon = ({ d, className }: { d: ReactNode; className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-4 w-4 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

/**
 * aui-030 · Search with recents. Signature: the "/" shortcut chip turns into a clear button as you type,
 * and one highlight glides between rows of recent searches and pages.
 */
export function SearchField({
  placeholder = "Search Astabyte…",
  recent: recentProp = RECENT,
  pages = PAGES,
  onSearch,
  shortcut = true,
  defaultOpen = false,
  tone = "dark",
  className,
}: SearchFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState(recentProp);
  const dark = tone === "dark";

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    const r: SearchFieldItem[] = recent.filter((x) => !s || x.includes(s)).map((label) => ({ label, kind: "recent" }));
    const p = pages.filter((x) => !s || x.label.toLowerCase().includes(s));
    return { r, p, all: [...r, ...p] };
  }, [q, recent, pages]);

  // Row offsets from the fixed row and header heights, so the highlight never measures the DOM.
  const y = (i: number) => (items.r.length && i >= 0 ? HEAD : 0) + i * ROW + (i >= items.r.length && items.p.length ? HEAD : 0);
  const idx = Math.min(active, items.all.length - 1);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const pick = (item?: SearchFieldItem) => {
    const query = item?.label ?? q.trim();
    if (!query) return;
    if (!item || item.kind === "recent") setRecent((r) => [query, ...r.filter((x) => x !== query)].slice(0, 5));
    onSearch?.(query, item);
    setQ(item?.kind === "page" ? "" : query);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = items.all.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (n) setActive((a) => (Math.min(a, n - 1) + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(open && n && idx >= 0 ? items.all[idx] : undefined);
    } else if (e.key === "Escape") {
      if (open) setOpen(false);
      else if (q) setQ("");
      else input.current?.blur();
    } else if (e.key === "Tab") setOpen(false);
  };

  const clear = () => {
    setQ("");
    setActive(0);
    input.current?.focus();
  };

  const show = open && items.all.length > 0;
  const listH = items.all.length * ROW + (items.r.length ? HEAD : 0) + (items.p.length ? HEAD : 0);
  const optId = (i: number) => `${id}-o${i}`;

  const head = (label: string, action?: ReactNode) => (
    <li role="presentation" className="flex items-center justify-between px-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute" style={{ height: HEAD }}>
      {label}
      {action}
    </li>
  );

  const row = (item: SearchFieldItem, i: number) => (
    <li
      key={item.kind + item.label}
      id={optId(i)}
      role="option"
      aria-selected={i === idx}
      onPointerMove={() => setActive(i)}
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => pick(item)}
      className={cx(
        "group/r relative flex cursor-pointer items-center gap-3 rounded-[8px] px-3 text-[14px] transition-colors duration-200",
        i === idx ? "text-[var(--aui030-fg)]" : "text-[var(--aui030-dim)]",
      )}
      style={{ height: ROW, animation: `aui030-row .45s ${EASE} ${60 + i * 35}ms both` }}
    >
      {item.kind === "recent" ? (
        <Icon d={<><circle cx="8" cy="8" r="5.75" /><path d="M8 5v3l2 1.25" /></>} className="text-mute" />
      ) : (
        <Icon d={<><rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2.5" /><path d="M6 8h4M8.5 6 10.5 8l-2 2" /></>} className="text-mute" />
      )}
      <span className="min-w-0 flex-1 truncate">
        <Mark text={item.label} q={q.trim()} />
      </span>
      {item.kind === "recent" ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Remove ${item.label}`}
          onClick={(e) => {
            e.stopPropagation();
            setRecent((r) => r.filter((x) => x !== item.label));
          }}
          className="grid h-6 w-6 place-items-center rounded-[6px] text-mute opacity-0 transition-opacity duration-200 hover:text-[var(--aui030-fg)] group-hover/r:opacity-100"
        >
          <Icon d={<path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />} className="h-3 w-3" />
        </button>
      ) : (
        <span className="text-[12px] text-mute">{item.meta}</span>
      )}
      <Icon
        d={<path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />}
        className={cx("h-3.5 w-3.5 transition-[transform,opacity] duration-300", i === idx ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0")}
      />
    </li>
  );

  return (
    <div
      ref={root}
      className={cx("aui030 relative w-full", className)}
      style={
        {
          "--aui030-fg": dark ? "var(--color-paper)" : "var(--color-ink)",
          "--aui030-dim": dark ? "color-mix(in srgb, var(--color-paper) 70%, transparent)" : "var(--color-ink-2)",
        } as CSSProperties
      }
    >
      <style href="asta-input-aui-030" precedence="asta">
        {CSS}
      </style>
      <div
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            input.current?.focus();
          }
        }}
        className={cx(
          "group/s flex h-11 items-center gap-2.5 rounded-[10px] px-3.5 transition-[box-shadow,background-color] duration-300",
          dark
            ? "bg-[color-mix(in_srgb,var(--color-paper)_7%,transparent)] text-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-paper)_10%,transparent)] focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_28%,transparent)]"
            : "bg-paper text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        )}
      >
        <Icon d={<><circle cx="7" cy="7" r="4.75" /><path d="m10.5 10.5 3 3" /></>} className="text-mute transition-colors group-focus-within/s:text-[var(--aui030-fg)]" />
        <input
          ref={input}
          type="search"
          name="q"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-label={placeholder.replace(/…$/, "")}
          aria-expanded={show}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={show && idx >= 0 ? optId(idx) : undefined}
          value={q}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] sm:text-[14px] tracking-[-0.01em] outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
        />
        {/* The shortcut chip and the clear button share one slot and swap with a turn. */}
        <span className="relative grid h-6 w-8 shrink-0 place-items-center">
          <kbd
            aria-hidden
            className={cx(
              "absolute inset-0 grid place-items-center rounded-[6px] font-mono text-[11.5px] text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,currentColor_45%,transparent)] transition-[transform,opacity] duration-300",
              q ? "rotate-45 scale-50 opacity-0" : "opacity-100",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            /
          </kbd>
          <button
            type="button"
            aria-label="Clear search"
            tabIndex={q ? 0 : -1}
            onClick={clear}
            className={cx(
              "absolute inset-y-0 right-1 grid w-6 place-items-center rounded-full text-[var(--aui030-fg)] outline-none transition-[transform,opacity] duration-300 focus-visible:ring-2 focus-visible:ring-brand/60",
              dark ? "bg-[color-mix(in_srgb,var(--color-paper)_14%,transparent)]" : "bg-paper-2",
              q ? "rotate-0 scale-100 opacity-100" : "pointer-events-none -rotate-90 scale-50 opacity-0",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <Icon d={<path d="M5 5l6 6M11 5l-6 6" />} className="h-3 w-3" />
          </button>
        </span>
      </div>

      {show && (
        <div
          className={cx(
            "absolute inset-x-0 top-[calc(100%+8px)] z-20 origin-top rounded-[12px] p-1.5",
            dark
              ? "bg-[color-mix(in_srgb,var(--color-ink)_92%,var(--color-paper))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_10%,transparent),0_24px_48px_-16px_rgb(0_0_0/0.6)]"
              : "bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_18px_40px_-20px_rgb(0_0_0/0.3)]",
          )}
          style={{ animation: `aui030-pop .4s ${EASE} both` }}
        >
          <ul id={`${id}-list`} role="listbox" aria-label="Suggestions" className="relative" style={{ height: listH }}>
            {/* One highlight that glides to the active row. */}
            <span
              aria-hidden
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 rounded-[8px] transition-transform duration-300",
                dark ? "bg-[color-mix(in_srgb,var(--color-paper)_9%,transparent)]" : "bg-paper-2",
              )}
              style={{ height: ROW, transform: `translateY(${y(idx)}px)`, transitionTimingFunction: EASE }}
            />
            {items.r.length > 0 &&
              head(
                "Recent",
                <button
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setRecent([])}
                  className="rounded font-sans text-[11.5px] normal-case tracking-normal text-mute outline-none transition-colors hover:text-[var(--aui030-fg)] focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  Clear
                </button>,
              )}
            {items.r.map((it, i) => row(it, i))}
            {items.p.length > 0 && head("Jump to")}
            {items.p.map((it, i) => row(it, items.r.length + i))}
          </ul>
          <div className="mt-1 flex items-center gap-3 px-3 pb-1 pt-2 text-[11.5px] text-mute">
            <span className="flex items-center gap-1">
              <kbd className="font-mono">↑↓</kbd> to move
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono">↵</kbd> to open
            </span>
            <span className="ml-auto flex items-center gap-1">
              <kbd className="font-mono">esc</kbd> to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchField;
