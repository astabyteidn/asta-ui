"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-menubar-in { from { opacity: 0; transform: translateY(-4px) scale(.97) } }
@media (prefers-reduced-motion: reduce) { .asta-menubar-panel { animation: none !important } }`;

interface Common {
  label: string;
  shortcut?: string;
  disabled?: boolean;
}
export type MenubarItem =
  | (Common & { type?: "item"; icon?: ReactNode; onSelect?: () => void })
  | (Common & { type: "checkbox"; checked: boolean; onCheckedChange: (checked: boolean) => void })
  | (Common & { type: "radio"; checked: boolean; onSelect: () => void })
  | { type: "separator" }
  | { type: "label"; label: string };

export interface MenubarMenu {
  label: string;
  items: MenubarItem[];
}

export interface MenubarProps {
  menus: MenubarMenu[];
  /** Accessible name for the bar. */
  label?: string;
  className?: string;
}

type Actionable = Exclude<MenubarItem, { type: "separator" } | { type: "label" }>;
const actionable = (it: MenubarItem): it is Actionable => it.type !== "separator" && it.type !== "label";
const enabled = (it: MenubarItem) => actionable(it) && !it.disabled;

const Check = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);

/**
 * The menu row of a desktop-style app: File, Edit, View. Click or press ↓ to open a menu. While one is open,
 * pointing at another switches to it at once, and ← → walk between them. Items take shortcuts, check marks and
 * radio dots. Escape closes and hands focus back, and type-ahead jumps to an item by its first letter.
 */
export function Menubar({ menus, label = "Menu bar", className }: MenubarProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [focus, setFocus] = useState(0);
  const [hi, setHi] = useState(-1);
  // Opening from closed animates; switching between open menus does not, like a native menu bar.
  const [instant, setInstant] = useState(false);
  const [shift, setShift] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const tops = useRef<(HTMLButtonElement | null)[]>([]);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const panel = useRef<HTMLDivElement>(null);

  const first = (m: number, from = -1, dir = 1) => {
    const list = menus[m].items;
    for (let k = 1; k <= list.length; k++) {
      const i = (from + dir * k + list.length * 2) % list.length;
      if (enabled(list[i])) return i;
    }
    return -1;
  };

  const show = (m: number | null, highlight = -1) => {
    setInstant(open !== null && m !== null);
    setOpen(m);
    setHi(highlight);
    if (m !== null) setFocus(m);
  };
  const close = (refocus = true) => {
    const m = open;
    show(null);
    if (refocus && m !== null) tops.current[m]?.focus();
  };

  // Keep the open panel inside the viewport on narrow screens. Measured once per open.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const over = r.right - (window.innerWidth - 8);
    setShift(over > 0 ? -Math.min(over, r.left - 8) : 0);
  }, [open]);

  // Move DOM focus to the highlighted item.
  useEffect(() => {
    if (open !== null && hi >= 0) items.current[hi]?.focus();
  }, [open, hi]);

  // Close on a pointer down outside.
  useEffect(() => {
    if (open === null) return;
    const down = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(null);
        setHi(-1);
      }
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  const activate = (it: MenubarItem) => {
    if (!enabled(it)) return;
    if (it.type === "checkbox") it.onCheckedChange(!it.checked);
    else if (it.type === "radio" || it.type === undefined || it.type === "item") it.onSelect?.();
    close();
  };

  const onTopKey = (e: KeyboardEvent, i: number) => {
    const n = menus.length;
    const go = (j: number) => {
      e.preventDefault();
      setFocus(j);
      tops.current[j]?.focus();
      if (open !== null) show(j, first(j));
    };
    if (e.key === "ArrowRight") go((i + 1) % n);
    else if (e.key === "ArrowLeft") go((i - 1 + n) % n);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(n - 1);
    else if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      show(i, first(i));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      show(i, first(i, 0, -1));
    } else if (e.key === "Escape" && open !== null) {
      e.preventDefault();
      close();
    }
  };

  const onMenuKey = (e: KeyboardEvent) => {
    if (open === null) return;
    const list = menus[open].items;
    const n = menus.length;
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      setHi(first(open, hi < 0 && k === "ArrowUp" ? 0 : hi, k === "ArrowDown" ? 1 : -1));
    } else if (k === "Home" || k === "End") {
      e.preventDefault();
      setHi(k === "Home" ? first(open) : first(open, 0, -1));
    } else if (k === "ArrowRight" || k === "ArrowLeft") {
      e.preventDefault();
      const j = (open + (k === "ArrowRight" ? 1 : -1) + n) % n;
      show(j, first(j));
    } else if (k === "Escape") {
      e.preventDefault();
      close();
    } else if (k === "Tab") {
      close(false);
    } else if (k.length === 1 && /\S/.test(k)) {
      const ch = k.toLowerCase();
      for (let s = 1; s <= list.length; s++) {
        const i = (hi + s) % list.length;
        const it = list[i];
        if (enabled(it) && actionable(it) && it.label.toLowerCase().startsWith(ch)) {
          setHi(i);
          break;
        }
      }
    }
  };

  return (
    <div ref={root} role="menubar" aria-label={label} className={cx("relative flex items-center gap-0.5", className)}>
      <style href="asta-menubar" precedence="asta">{KEYFRAMES}</style>
      {menus.map((m, i) => {
        const isOpen = open === i;
        return (
          <div key={m.label} className="relative">
            <button
              ref={(el) => {
                tops.current[i] = el;
              }}
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              tabIndex={focus === i ? 0 : -1}
              onClick={() => (isOpen ? close() : show(i))}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse" && open !== null && open !== i) show(i);
              }}
              onKeyDown={(e) => onTopKey(e, i)}
              className={cx(
                "flex h-8 select-none items-center rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-brand/50",
                isOpen ? "bg-paper-2 text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
              )}
            >
              {m.label}
            </button>
            {isOpen && (
              <div
                ref={panel}
                role="menu"
                aria-label={m.label}
                onKeyDown={onMenuKey}
                style={{ transform: shift ? `translateX(${shift}px)` : undefined }}
                className={cx(
                  "asta-menubar-panel absolute left-0 top-full z-50 mt-1.5 flex min-w-[232px] origin-top-left flex-col rounded-[11px] bg-paper p-1",
                  "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_12px_32px_-12px_rgb(0_0_0/0.28),0_2px_6px_-2px_rgb(0_0_0/0.08)]",
                  !instant && "animate-[asta-menubar-in_.18s_cubic-bezier(.16,1,.3,1)_both]",
                )}
              >
                {m.items.map((it, j) => {
                  if (it.type === "separator") return <div key={`s${j}`} role="separator" className="mx-2 my-1 h-px bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]" />;
                  if (it.type === "label")
                    return (
                      <p key={`l${j}`} className="px-2.5 pb-1 pt-2 font-mono text-[10.5px] uppercase tracking-wider text-mute">
                        {it.label}
                      </p>
                    );
                  const role = it.type === "checkbox" ? "menuitemcheckbox" : it.type === "radio" ? "menuitemradio" : "menuitem";
                  const checked = it.type === "checkbox" || it.type === "radio" ? it.checked : undefined;
                  return (
                    <button
                      key={it.label}
                      ref={(el) => {
                        items.current[j] = el;
                      }}
                      type="button"
                      role={role}
                      aria-checked={checked}
                      aria-disabled={it.disabled || undefined}
                      tabIndex={-1}
                      onClick={() => activate(it)}
                      onPointerMove={() => !it.disabled && hi !== j && setHi(j)}
                      className={cx(
                        "flex h-8 w-full select-none items-center gap-2 rounded-[7px] px-2 text-left text-[13px] outline-none",
                        hi === j ? "bg-paper-2 text-ink" : "text-ink-2",
                        it.disabled && "opacity-45",
                      )}
                    >
                      <span className="flex w-4 shrink-0 justify-center text-ink">
                        {it.type === "checkbox" && it.checked && <Check />}
                        {it.type === "radio" && it.checked && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        {(it.type === undefined || it.type === "item") && it.icon && <span className="flex text-mute [&_svg]:h-3.5 [&_svg]:w-3.5">{it.icon}</span>}
                      </span>
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.shortcut && <span className="pl-4 text-[12px] tracking-wide text-mute">{it.shortcut}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Menubar;
