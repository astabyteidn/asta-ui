"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-ctx-in { from { opacity: 0; transform: translate(var(--asta-ctx-dx, 0), var(--asta-ctx-dy, 0)) scale(.95) } }
@keyframes asta-ctx-out { to { opacity: 0; transform: scale(.98) } }`;

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  /** Shown on the right, e.g. "⌘C". Display only. */
  shortcut?: string;
  disabled?: boolean;
  onSelect?: () => void;
  /** Nested items open as a submenu to the side. */
  items?: ContextMenuEntry[];
}

/** An item, or the string "separator" for a thin rule between groups. */
export type ContextMenuEntry = ContextMenuItem | "separator";

export interface ContextMenuProps {
  items: ContextMenuEntry[];
  /** The area that listens for right-click, long-press and Shift+F10. */
  children: ReactNode;
  /** Accessible name for the menu. */
  label?: string;
  /** Keep the menu inside this area instead of the viewport. */
  contained?: boolean;
  disabled?: boolean;
  /** Long-press time on touch, in ms. */
  longPress?: number;
  onOpenChange?: (open: boolean) => void;
  /** Classes for the target area. */
  className?: string;
  /** Classes for the menu panel. */
  menuClassName?: string;
}

const PAD = 8;
const isItem = (e: ContextMenuEntry): e is ContextMenuItem => e !== "separator";

type Box = { left: number; top: number; right: number; bottom: number };
const viewport = (): Box => ({ left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight });

interface PanelProps {
  uid: string;
  items: ContextMenuEntry[];
  label?: string;
  /** Root: the pointer. Submenu: the item it hangs off. */
  at: { x: number; y: number } | { rect: DOMRect };
  bounds: () => Box;
  focusFirst: boolean;
  closing?: boolean;
  onExited?: () => void;
  /** Close everything (after an item was picked, or Escape on the root). */
  onCloseAll: (refocus: boolean) => void;
  /** Submenu only: close this level and go back to the parent item. */
  onBack?: () => void;
  /** Submenu only: the pointer is inside, keep it open. */
  onHold?: () => void;
  className?: string;
}

function Panel({ uid, items, label, at, bounds, focusFirst, closing, onExited, onCloseAll, onBack, onHold, className }: PanelProps) {
  const sub = "rect" in at;
  const el = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = items.map((it, i) => (isItem(it) && !it.disabled ? i : -1)).filter((i) => i >= 0);
  const [active, setActive] = useState(focusFirst ? (enabled[0] ?? -1) : -1);
  const [open, setOpen] = useState<{ i: number; focus: boolean; rect: DOMRect } | null>(null);
  const subTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const typed = useRef({ text: "", at: 0 });

  // Place it before paint: at the pointer (flipping left/up when there's no room), or beside the parent item.
  useLayoutEffect(() => {
    const p = el.current;
    if (!p) return;
    const b = bounds();
    const w = p.offsetWidth;
    const h = p.offsetHeight;
    let x: number;
    let y: number;
    let fromRight = false;
    let fromBottom = false;
    if ("rect" in at) {
      x = at.rect.right + 2;
      if (x + w > b.right - PAD && at.rect.left - w - 2 >= b.left + PAD) {
        x = at.rect.left - w - 2;
        fromRight = true;
      }
      // Line the first item up with the parent item (the panel has 6px of padding).
      y = at.rect.top - 6;
    } else {
      x = at.x;
      y = at.y;
      if (x + w > b.right - PAD && x - w >= b.left + PAD) {
        x -= w;
        fromRight = true;
      }
      if (y + h > b.bottom - PAD && y - h >= b.top + PAD) {
        y -= h;
        fromBottom = true;
      }
    }
    x = Math.max(b.left + PAD, Math.min(x, b.right - w - PAD));
    y = Math.max(b.top + PAD, Math.min(y, b.bottom - h - PAD));
    p.style.left = `${Math.round(x)}px`;
    p.style.top = `${Math.round(y)}px`;
    p.style.transformOrigin = `${fromRight ? "100%" : "0"} ${fromBottom ? "100%" : "0"}`;
    if (sub) p.style.setProperty("--asta-ctx-dx", fromRight ? "4px" : "-4px");
    p.focus({ preventScroll: true });
    // Only on mount: a menu doesn't follow the page once it's open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The highlighted item owns focus, so screen readers announce it.
  useEffect(() => {
    if (closing) return;
    if (active >= 0) refs.current[active]?.focus({ preventScroll: true });
  }, [active, closing]);

  useEffect(() => () => clearTimeout(subTimer.current), []);

  const openSub = (i: number, focus: boolean) => {
    clearTimeout(subTimer.current);
    const b = refs.current[i];
    setActive(i);
    if (b) setOpen({ i, focus, rect: b.getBoundingClientRect() });
  };
  const closeSub = (refocus: boolean) => {
    clearTimeout(subTimer.current);
    if (refocus && open) refs.current[open.i]?.focus({ preventScroll: true });
    setOpen(null);
  };

  const pick = (i: number, focus: boolean) => {
    const it = items[i];
    if (!isItem(it) || it.disabled) return;
    if (it.items) return openSub(i, focus);
    it.onSelect?.();
    onCloseAll(true);
  };

  const move = (dir: 1 | -1) => {
    if (!enabled.length) return;
    const at = enabled.indexOf(active);
    const next = at < 0 ? (dir === 1 ? 0 : enabled.length - 1) : (at + dir + enabled.length) % enabled.length;
    setActive(enabled[next]);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    // Keys from a submenu bubble up the React tree through its portal: let that level handle them.
    if (!e.currentTarget.contains(e.target as Node) || closing) return;
    const it = active >= 0 ? items[active] : undefined;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        return move(1);
      case "ArrowUp":
        e.preventDefault();
        return move(-1);
      case "Home":
      case "PageUp":
        e.preventDefault();
        return enabled.length && setActive(enabled[0]);
      case "End":
      case "PageDown":
        e.preventDefault();
        return enabled.length && setActive(enabled[enabled.length - 1]);
      case "ArrowRight":
        e.preventDefault();
        if (it && isItem(it) && it.items && !it.disabled) openSub(active, true);
        return;
      case "ArrowLeft":
        e.preventDefault();
        return onBack?.();
      case "Enter":
      case " ":
        e.preventDefault();
        if (active >= 0) pick(active, true);
        return;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        return onBack ? onBack() : onCloseAll(true);
      case "Tab":
        e.preventDefault();
        return onCloseAll(true);
    }
    // Type-ahead: jump to the next item whose label starts with what was typed.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = typed.current;
      t.text = e.timeStamp - t.at > 600 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
      t.at = e.timeStamp;
      const start = Math.max(0, enabled.indexOf(active) + (t.text.length === 1 ? 1 : 0));
      const order = [...enabled.slice(start), ...enabled.slice(0, start)];
      const hit = order.find((i) => (items[i] as ContextMenuItem).label.toLowerCase().startsWith(t.text));
      if (hit !== undefined) setActive(hit);
    }
  };

  const onItemMove = (i: number, e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || closing) return;
    const it = items[i] as ContextMenuItem;
    if (active !== i) setActive(it.disabled ? -1 : i);
    if (it.disabled) return;
    clearTimeout(subTimer.current);
    if (it.items) {
      if (open?.i !== i) subTimer.current = setTimeout(() => openSub(i, false), 100);
    } else if (open) {
      // A little grace, so the pointer can cut across a neighbour on its way into the submenu.
      subTimer.current = setTimeout(() => setOpen(null), 260);
    }
  };

  const node = (
    <div
      ref={el}
      role="menu"
      aria-label={label}
      aria-orientation="vertical"
      tabIndex={-1}
      data-asta-ctx={uid}
      data-state={closing ? "closed" : "open"}
      onKeyDown={onKey}
      onContextMenu={(e) => e.preventDefault()}
      onPointerEnter={() => {
        onHold?.();
        clearTimeout(subTimer.current);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse" && !open && !closing) {
          setActive(-1);
          el.current?.focus({ preventScroll: true });
        }
      }}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && closing) onExited?.();
      }}
      className={cx(
        "fixed left-0 top-0 z-50 min-w-[220px] max-w-[calc(100vw-16px)] select-none rounded-xl bg-paper p-1.5 text-ink outline-none",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_14px_36px_-14px_rgb(0_0_0/0.3),0_4px_10px_-6px_rgb(0_0_0/0.12)]",
        sub ? "animate-[asta-ctx-in_.2s_cubic-bezier(.16,1,.3,1)_both]" : "animate-[asta-ctx-in_.22s_cubic-bezier(.16,1,.3,1)_both]",
        "data-[state=closed]:pointer-events-none data-[state=closed]:animate-[asta-ctx-out_.12s_ease-in_both] motion-reduce:![animation-duration:1ms]",
        className,
      )}
    >
      {!sub && (
        <style href="asta-context-menu" precedence="asta">
          {KEYFRAMES}
        </style>
      )}
      {items.map((it, i) => {
        if (!isItem(it)) return <div key={`s${i}`} role="separator" className="mx-1.5 my-1.5 h-px bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]" />;
        const on = active === i;
        const expanded = open?.i === i;
        return (
          <button
            key={`${it.label}${i}`}
            ref={(b) => {
              refs.current[i] = b;
            }}
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-disabled={it.disabled || undefined}
            aria-haspopup={it.items ? "menu" : undefined}
            aria-expanded={it.items ? expanded : undefined}
            data-highlighted={on || expanded ? "" : undefined}
            onPointerMove={(e) => onItemMove(i, e)}
            onClick={(e) => pick(i, e.detail === 0)}
            className={cx(
              "group/item flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] outline-none transition-colors duration-150",
              it.disabled ? "cursor-not-allowed text-mute opacity-50" : "cursor-pointer text-ink data-[highlighted]:bg-paper-2",
            )}
          >
            {it.icon && <span className="inline-flex h-4 w-4 shrink-0 text-mute transition-colors group-data-[highlighted]/item:text-ink [&_svg]:h-4 [&_svg]:w-4">{it.icon}</span>}
            <span className="flex-1 truncate">{it.label}</span>
            {it.shortcut && !it.items && <kbd className="font-sans text-[11.5px] tracking-wide text-mute">{it.shortcut}</kbd>}
            {it.items && (
              <svg viewBox="0 0 16 16" className="-mr-1 h-3.5 w-3.5 text-mute" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 4 4 4-4 4" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );

  const child = open ? items[open.i] : undefined;

  return (
    <>
      {createPortal(node, document.body)}
      {open && child && isItem(child) && child.items && !closing && (
        <Panel
          key={open.i}
          uid={uid}
          items={child.items}
          label={child.label}
          at={{ rect: open.rect }}
          bounds={bounds}
          focusFirst={open.focus}
          onCloseAll={onCloseAll}
          onBack={() => closeSub(true)}
          onHold={() => clearTimeout(subTimer.current)}
          className={className}
        />
      )}
    </>
  );
}

/**
 * Right-click, long-press on touch, or Shift+F10 / the Menu key opens a menu at the pointer. It scales in
 * from the corner nearest the pointer, flips to stay inside the viewport (or the area, with `contained`),
 * and can nest one level of submenu. Arrows, Home/End, type-ahead, Enter, Escape and focus return all work.
 */
export function ContextMenu({ items, children, label, contained = false, disabled = false, longPress = 500, onOpenChange, className, menuClassName }: ContextMenuProps) {
  const uid = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; n: number; keyboard: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const restore = useRef<HTMLElement | null>(null);
  const press = useRef<{ t: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const lastOpen = useRef({ at: -1e9 });
  // Mirrors `open` right away, so a long-press timer or a second event in the same tick never reads a stale value.
  const openRef = useRef(false);

  const clearPress = () => {
    if (press.current) clearTimeout(press.current.t);
    press.current = null;
  };
  useEffect(() => clearPress, []);

  const show = (x: number, y: number, keyboard: boolean) => {
    if (disabled) return;
    if (!openRef.current) {
      const a = document.activeElement as HTMLElement | null;
      restore.current = a && wrap.current?.contains(a) ? a : wrap.current;
      onOpenChange?.(true);
    }
    lastOpen.current = { at: performance.now() };
    openRef.current = true;
    setMenu((m) => ({ x, y, n: (m?.n ?? 0) + 1, keyboard }));
    setOpen(true);
  };
  // The latest `show`, for the long-press timer (it fires after renders that changed `disabled` or `open`).
  const showRef = useRef(show);
  useLayoutEffect(() => {
    showRef.current = show;
  });

  const hide = (refocus: boolean) => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    onOpenChange?.(false);
    if (refocus) restore.current?.focus({ preventScroll: true });
  };

  const bounds = (): Box => {
    const v = viewport();
    if (!contained || !wrap.current) return v;
    const r = wrap.current.getBoundingClientRect();
    return { left: Math.max(v.left, r.left), top: Math.max(v.top, r.top), right: Math.min(v.right, r.right), bottom: Math.min(v.bottom, r.bottom) };
  };

  // While open: a press outside, a scroll, a resize or leaving the window closes it.
  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) => t instanceof Element && t.closest(`[data-asta-ctx="${CSS.escape(uid)}"]`);
    const onDown = (e: globalThis.PointerEvent) => {
      if (inside(e.target)) return;
      // A second right-click inside the area just moves the menu (handled by onContextMenu).
      if (e.button === 2 && wrap.current?.contains(e.target as Node)) return;
      hide(false);
    };
    const onScroll = (e: Event) => {
      if (!inside(e.target)) hide(false);
    };
    const onLose = () => hide(false);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onLose);
    window.addEventListener("blur", onLose);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onLose);
      window.removeEventListener("blur", onLose);
    };
    // hide only reads `open`, which is a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, uid]);

  // Ignore events that bubble up the React tree from the menu, which is portalled but still our child.
  const mine = (t: EventTarget) => !!wrap.current?.contains(t as Node);

  const onContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || !mine(e.target)) return;
    e.preventDefault();
    clearPress();
    // Already opened by our own long-press or key handler a moment ago: don't open twice.
    if (openRef.current && e.timeStamp - lastOpen.current.at < 700) return;
    // Keyboard-fired context menus report 0,0 in some browsers.
    if (e.clientX === 0 && e.clientY === 0) return openFromKeyboard();
    show(e.clientX, e.clientY, false);
  };

  const openFromKeyboard = () => {
    const a = document.activeElement;
    const r = (a instanceof HTMLElement && wrap.current?.contains(a) ? a : wrap.current)!.getBoundingClientRect();
    show(r.left + Math.min(16, r.width / 2), r.top + Math.min(r.height / 2, 20), true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !mine(e.target)) return;
    if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      openFromKeyboard();
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.pointerType === "mouse" || !mine(e.target)) return;
    clearPress();
    const { clientX: x, clientY: y } = e;
    press.current = {
      x,
      y,
      t: setTimeout(() => {
        press.current = null;
        showRef.current(x, y, false);
      }, longPress),
    };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) clearPress();
  };

  return (
    <div
      ref={wrap}
      tabIndex={0}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clearPress}
      onPointerCancel={clearPress}
      className={cx("outline-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-brand/50", className)}
    >
      {children}
      {menu && typeof document !== "undefined" && (
        <Panel
          key={menu.n}
          uid={uid}
          items={items}
          label={label}
          at={{ x: menu.x, y: menu.y }}
          bounds={bounds}
          focusFirst={menu.keyboard}
          closing={!open}
          onExited={() => setMenu(null)}
          onCloseAll={hide}
          className={menuClassName}
        />
      )}
    </div>
  );
}

export default ContextMenu;
