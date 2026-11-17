"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { buttonClass, type ButtonVariant } from "@/components/kit/button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  /** Shown on the right, e.g. "⌘D". Display only. */
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}
export interface MenuGroup {
  label?: string;
  items: MenuItem[];
}

export interface DropdownMenuProps {
  /** Trigger content. */
  children: ReactNode;
  groups: MenuGroup[];
  align?: "start" | "end";
  variant?: ButtonVariant;
  className?: string;
  /** Accessible name for the trigger when its content is only an icon. */
  label?: string;
}

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

/**
 * An action menu. Opens from its trigger with a short scale-in; arrow keys, Home/End and type-ahead
 * move the highlight, Enter selects, Escape or Tab closes and focus returns to the trigger.
 */
export function DropdownMenu({ children, groups, align = "start", variant = "outline", className, label }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const typed = useRef({ text: "", at: 0 });
  const id = useId();

  const flat = groups.flatMap((g) => g.items);
  const enabled = flat.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  const focusAt = (i: number) => {
    setActive(i);
    items.current[i]?.focus();
  };
  const show = (first: "first" | "last" | "none" = "none") => {
    setOpen(true);
    requestAnimationFrame(() => {
      if (first === "first") focusAt(enabled[0]);
      else if (first === "last") focusAt(enabled[enabled.length - 1]);
      else menu.current?.focus();
    });
  };
  const hide = (refocus = true) => {
    setOpen(false);
    setActive(-1);
    if (refocus) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !trigger.current?.contains(t)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const move = (dir: 1 | -1) => {
    const pos = enabled.indexOf(active);
    const next = pos < 0 ? (dir === 1 ? 0 : enabled.length - 1) : (pos + dir + enabled.length) % enabled.length;
    focusAt(enabled[next]);
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") move(1);
    else if (e.key === "ArrowUp") move(-1);
    else if (e.key === "Home") focusAt(enabled[0]);
    else if (e.key === "End") focusAt(enabled[enabled.length - 1]);
    else if (e.key === "Escape") hide();
    else if (e.key === "Tab") return hide(false);
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Type-ahead: jump to the next item starting with what was typed.
      const now = e.timeStamp;
      typed.current.text = (now - typed.current.at > 600 ? "" : typed.current.text) + e.key.toLowerCase();
      typed.current.at = now;
      const hit = enabled.find((i) => flat[i].label.toLowerCase().startsWith(typed.current.text));
      if (hit !== undefined) focusAt(hit);
    } else return;
    e.preventDefault();
  };

  const select = (it: MenuItem) => {
    if (it.disabled) return;
    it.onSelect?.();
    hide();
  };

  const offset = groups.map((_, gi) => groups.slice(0, gi).reduce((a, g) => a + g.items.length, 0));
  return (
    <div className={cx("relative inline-block", className)}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            show("first");
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            show("last");
          }
        }}
        className={cx(buttonClass({ variant }), "data-[open=true]:bg-paper-2")}
        data-open={open}
      >
        {children}
        <svg
          viewBox="0 0 16 16"
          className={cx("-mr-1 h-3.5 w-3.5 text-mute transition-transform duration-300", EASE, open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>

      <div
        ref={menu}
        id={id}
        role="menu"
        tabIndex={-1}
        aria-hidden={!open}
        onKeyDown={onMenuKey}
        onPointerLeave={() => setActive(-1)}
        className={cx(
          "absolute top-[calc(100%+6px)] z-30 min-w-[232px] rounded-xl bg-paper p-1.5 outline-none",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-12px_rgb(0_0_0/0.28),0_4px_10px_-6px_rgb(0_0_0/0.12)]",
          "transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none",
          EASE,
          align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          open ? "visible scale-100 opacity-100" : "invisible pointer-events-none scale-[0.96] -translate-y-1 opacity-0",
        )}
      >
        {groups.map((g, gi) => (
          <div key={gi} role="group" aria-label={g.label} className={cx(gi > 0 && "mt-1.5 border-t border-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] pt-1.5")}>
            {g.label && <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-mute">{g.label}</p>}
            {g.items.map((it, ii) => {
              const i = offset[gi] + ii;
              const on = active === i;
              return (
                <button
                  key={it.label}
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={on ? 0 : -1}
                  aria-disabled={it.disabled || undefined}
                  onPointerMove={() => !it.disabled && active !== i && focusAt(i)}
                  onClick={() => select(it)}
                  className={cx(
                    "flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13.5px] outline-none transition-colors duration-150",
                    it.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                    it.danger ? "text-[#e5484d]" : "text-ink",
                    on && (it.danger ? "bg-[#e5484d]/10" : "bg-paper-2"),
                  )}
                >
                  {it.icon && (
                    <span className={cx("inline-flex h-4 w-4 shrink-0 [&_svg]:h-4 [&_svg]:w-4", it.danger ? "" : on ? "text-ink" : "text-mute")}>{it.icon}</span>
                  )}
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.shortcut && <kbd className="font-sans text-[11.5px] tracking-wide text-mute">{it.shortcut}</kbd>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DropdownMenu;
