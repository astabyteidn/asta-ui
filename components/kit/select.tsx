"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  hint?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Adds a filter box at the top of the list. */
  searchable?: boolean;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * A custom listbox. Arrows move, Enter picks, Escape closes, Home/End jump. Without a search box, typing
 * jumps to the first option starting with what you typed (type-ahead).
 */
export function Select({ options, value, defaultValue, onChange, placeholder = "Select…", searchable, label, size = "md", className }: SelectProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const uid = useId();

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? options.filter((o) => o.label.toLowerCase().includes(t)) : options;
  }, [options, q]);

  const show = (v: boolean) => {
    setOpen(v);
    setQ("");
    if (v) setActive(Math.max(0, options.findIndex((o) => o.value === current)));
  };

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    (searchable ? search.current : listRef.current)?.focus();
    return () => document.removeEventListener("pointerdown", away);
  }, [open, searchable]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (o: SelectOption | undefined) => {
    if (!o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    onChange?.(o.value);
    setOpen(false);
    trigger.current?.focus();
  };

  const move = (from: number, step: number) => {
    let n = from;
    for (let k = 0; k < shown.length; k++) {
      n = Math.min(shown.length - 1, Math.max(0, n + step));
      if (!shown[n]?.disabled) break;
    }
    return n;
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => move(a, 1));
    else if (e.key === "ArrowUp") setActive((a) => move(a, -1));
    else if (e.key === "Home") setActive(move(-1, 1));
    else if (e.key === "End") setActive(move(shown.length, -1));
    else if (e.key === "Enter") pick(shown[active]);
    else if (e.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === "Tab") setOpen(false);
    else if (!searchable && e.key.length === 1) {
      const now = e.timeStamp;
      typed.current = { text: (now - typed.current.at > 600 ? "" : typed.current.text) + e.key.toLowerCase(), at: now };
      const i = shown.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) setActive(i);
    } else return;
    e.preventDefault();
  };

  const h = size === "sm" ? "h-8 rounded-md px-2.5 text-[13px]" : "h-10 rounded-lg px-3 text-[14px]";

  return (
    <div ref={root} className={cx("relative w-full", className)}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-label={label}
        onClick={() => show(!open)}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            show(true);
          }
        }}
        className={cx(
          "flex w-full items-center gap-2 bg-paper text-left outline-none transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-accent/50",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)]",
          open && "!shadow-[inset_0_0_0_1px_var(--color-accent),0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]",
          h,
        )}
      >
        {selected?.icon && <span className="inline-flex shrink-0 text-ink-2 [&_svg]:h-4 [&_svg]:w-4">{selected.icon}</span>}
        <span className={cx("min-w-0 flex-1 truncate", selected ? "text-ink" : "text-mute")}>{selected?.label ?? placeholder}</span>
        <svg
          viewBox="0 0 16 16"
          className={cx("h-4 w-4 shrink-0 text-mute transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 origin-top overflow-hidden rounded-xl bg-paper p-1 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-8px_rgb(0_0_0/0.22),0_4px_8px_-4px_rgb(0_0_0/0.08)] animate-[kit-select-in_.22s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none"
          onKeyDown={onListKey}
        >
          <style>{`@keyframes kit-select-in { from { opacity: 0; transform: translateY(-4px) scale(.97) } to { opacity: 1; transform: none } }`}</style>
          {searchable && (
            <div className="mb-1 flex items-center gap-2 rounded-lg bg-paper-2 px-2.5">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3" />
              </svg>
              <input
                ref={search}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Search"
                role="combobox"
                aria-expanded
                aria-controls={`${uid}-list`}
                aria-activedescendant={shown[active] ? `${uid}-o-${active}` : undefined}
                className="h-9 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-mute"
              />
            </div>
          )}
          <ul
            ref={listRef}
            id={`${uid}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={!searchable && shown[active] ? `${uid}-o-${active}` : undefined}
            className="max-h-60 overflow-y-auto outline-none [scrollbar-width:thin]"
          >
            {shown.map((o, i) => {
              const on = o.value === current;
              return (
                <li
                  key={o.value}
                  id={`${uid}-o-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={on}
                  aria-disabled={o.disabled || undefined}
                  onPointerMove={() => !o.disabled && setActive(i)}
                  onClick={() => pick(o)}
                  className={cx(
                    "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] transition-colors duration-150",
                    i === active && !o.disabled ? "bg-paper-2 text-ink" : "text-ink-2",
                    o.disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {o.icon && <span className="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4">{o.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="text-[12px] text-mute">{o.hint}</span>}
                  <svg viewBox="0 0 16 16" className={cx("h-4 w-4 shrink-0 text-accent transition-opacity", on ? "opacity-100" : "opacity-0")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m3.5 8.5 3 3 6-7" />
                  </svg>
                </li>
              );
            })}
            {shown.length === 0 && <li className="px-2.5 py-6 text-center text-[13px] text-mute">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Select;
