"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

const CSS = `
@keyframes aui044-in { from { opacity: 0; transform: translateY(70%) } }
@keyframes aui044-out { to { opacity: 0; transform: translateY(-70%) } }
@keyframes aui044-pop { from { opacity: 0; transform: translateY(var(--aui044-y, -4px)) scale(.96) } }
@keyframes aui044-row { from { opacity: 0; transform: translateX(-4px) } }
@media (prefers-reduced-motion: reduce) { .aui044 *, .aui044 { animation: none !important; transition: none !important } }
`;

export interface PillChoice {
  value: string;
  /** Text in the menu. */
  label: string;
  /** Text inside the sentence. Defaults to `label`. */
  pill?: string;
  /** Muted text on the right of the menu row. */
  hint?: string;
  disabled?: boolean;
}

export interface PillSelectProps {
  options?: PillChoice[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** What the pill picks, for screen readers, e.g. "Frequency". */
  label?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

const FREQ: PillChoice[] = [
  { value: "instant", label: "Instantly", pill: "instantly", hint: "Live" },
  { value: "hourly", label: "Hourly", pill: "every hour", hint: ":00" },
  { value: "daily", label: "Daily", pill: "daily", hint: "09:00" },
  { value: "weekly", label: "Weekly", pill: "weekly", hint: "Mon" },
];

/** Measured once on open: room below and to the right inside the nearest clipping box. */
function place(el: HTMLElement, h: number, w: number) {
  const r = el.getBoundingClientRect();
  let c = { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const s = getComputedStyle(p);
    if (/hidden|auto|scroll|clip/.test(s.overflowY + s.overflowX)) {
      c = p.getBoundingClientRect();
      break;
    }
  }
  const below = c.bottom - r.bottom;
  return { down: below >= h || below >= r.top - c.top, right: c.right - r.left < w && r.right - c.left >= w };
}

/** aui-044 · Inline pill: a select that lives inside a sentence, the word rolls when it changes. */
export function PillSelect({ options = FREQ, value, defaultValue, onChange, label = "Frequency", name, disabled, className }: PillSelectProps) {
  const [inner, setInner] = useState(defaultValue ?? options[2]?.value ?? options[0]?.value);
  const current = value ?? inner;
  const picked = Math.max(0, options.findIndex((o) => o.value === current));
  const sel = options[picked];
  const text = sel?.pill ?? sel?.label ?? "";
  // The word that is rolling out, if any. Updated during render when the value changes.
  const [last, setLast] = useState({ value: current, text });
  const [prev, setPrev] = useState<string | null>(null);
  if (last.value !== current) {
    setPrev(last.text);
    setLast({ value: current, text });
  }

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ down: true, right: false });
  const [active, setActive] = useState(picked);
  const root = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const buf = useRef("");
  const bufT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const uid = useId();

  useEffect(() => () => clearTimeout(bufT.current), []);
  useEffect(() => {
    if (open) list.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const show = () => {
    if (disabled || !btn.current) return;
    setPos(place(btn.current, options.length * 38 + 24, 216));
    setActive(picked);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    btn.current?.focus({ preventScroll: true });
  };
  const pick = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    onChange?.(o.value);
    close();
  };
  const step = (from: number, d: 1 | -1) => {
    let n = from;
    for (let k = 0; k < options.length; k++) {
      n = (n + d + options.length) % options.length;
      if (!options[n].disabled) return n;
    }
    return from;
  };
  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => step(a, 1));
    else if (e.key === "ArrowUp") setActive((a) => step(a, -1));
    else if (e.key === "Home") setActive(step(-1, 1));
    else if (e.key === "End") setActive(step(options.length, -1));
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return setOpen(false);
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      buf.current += e.key.toLowerCase();
      clearTimeout(bufT.current);
      bufT.current = setTimeout(() => (buf.current = ""), 500);
      const s = buf.current;
      const start = s.length === 1 ? active + 1 : active;
      for (let k = 0; k < options.length; k++) {
        const i = (start + k) % options.length;
        if (!options[i].disabled && options[i].label.toLowerCase().startsWith(s)) {
          setActive(i);
          break;
        }
      }
    } else return;
    e.preventDefault();
  };

  return (
    <span ref={root} className={cx("aui044 relative inline-block align-baseline", open && "z-40", className)}>
      <style href="asta-aui044" precedence="asta">{CSS}</style>
      <button
        ref={btn}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-label={`${label}: ${sel?.label ?? ""}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            show();
          }
        }}
        className={cx(
          "group/pill relative -my-1 inline-flex items-baseline gap-[0.3em] rounded-[8px] px-[0.4em] py-[0.08em] font-medium text-brand outline-none transition-[background-color,box-shadow,transform] duration-300 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-45",
          "bg-[color-mix(in_srgb,var(--color-brand)_9%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-brand)_15%,transparent)]",
          "focus-visible:shadow-[0_0_0_2px_var(--color-paper),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_45%,transparent)]",
          open && "bg-[color-mix(in_srgb,var(--color-brand)_15%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_45%,transparent)]",
        )}
      >
        <span className="relative inline-block overflow-hidden whitespace-nowrap align-baseline">
          <span key={current} className="inline-block" style={{ animation: prev ? `aui044-in .5s ${EASE} both` : undefined }}>
            {text}
          </span>
          {prev && (
            <span key={`out-${current}`} aria-hidden className="absolute left-0 top-0 inline-block" style={{ animation: `aui044-out .45s ${EASE} both` }}>
              {prev}
            </span>
          )}
        </span>
        <svg viewBox="0 0 12 12" className={cx("h-[0.55em] w-[0.55em] shrink-0 self-center opacity-70 transition-transform duration-300", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m3 4.5 3 3 3-3" />
        </svg>
      </button>
      {name && <input type="hidden" name={name} value={current ?? ""} />}

      {open && (
        <ul
          ref={list}
          id={`${uid}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${uid}-o-${active}`}
          onKeyDown={onListKey}
          onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}
          className={cx(
            "absolute z-50 w-[216px] rounded-[12px] bg-paper p-1 text-left text-[13.5px] font-normal leading-normal tracking-normal outline-none",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_18px_40px_-14px_rgb(0_0_0/0.28),0_4px_10px_-4px_rgb(0_0_0/0.08)]",
            pos.down ? "top-full mt-2" : "bottom-full mb-2 [--aui044-y:4px]",
            pos.right ? "right-0" : "left-0",
            pos.down ? (pos.right ? "origin-top-right" : "origin-top-left") : pos.right ? "origin-bottom-right" : "origin-bottom-left",
          )}
          style={{ animation: `aui044-pop .28s ${EASE} both` }}
        >
          <li role="presentation" className="px-2.5 pb-1 pt-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">
            {label}
          </li>
          {options.map((o, i) => {
            const on = i === picked;
            return (
              <li
                key={o.value}
                id={`${uid}-o-${i}`}
                role="option"
                aria-selected={on}
                aria-disabled={o.disabled || undefined}
                onPointerMove={() => !o.disabled && active !== i && setActive(i)}
                onClick={() => pick(i)}
                className={cx(
                  "flex h-[38px] cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 transition-colors duration-150",
                  i === active && !o.disabled ? "bg-paper-2 text-ink" : "text-ink-2",
                  o.disabled && "cursor-not-allowed opacity-40",
                )}
                style={{ animation: `aui044-row .35s ${EASE} ${40 + i * 30}ms both` }}
              >
                <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full transition-[transform,background-color] duration-300", on ? "scale-100 bg-brand" : "scale-50 bg-[color-mix(in_srgb,var(--color-ink)_25%,transparent)]")} aria-hidden />
                <span className={cx("min-w-0 flex-1 truncate", on && "font-medium text-ink")}>{o.label}</span>
                {o.hint && <span className="font-mono text-[11px] tabular-nums text-mute">{o.hint}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}

export default PillSelect;
