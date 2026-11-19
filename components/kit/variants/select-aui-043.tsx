"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const ROW = 48;

const CSS = `
@keyframes aui043-pop { from { opacity: 0; transform: translateY(var(--aui043-y, -6px)) scale(.97) } }
@keyframes aui043-row { from { opacity: 0; transform: translateY(6px) } }
@keyframes aui043-draw { from { stroke-dashoffset: 16 } }
@media (prefers-reduced-motion: reduce) { .aui043 *, .aui043 { animation: none !important; transition: none !important } }
`;

export interface RichOption {
  value: string;
  label: string;
  description?: string;
  /** An icon, shown in a tile. */
  icon?: ReactNode;
  /** Initials for an avatar tile when there is no icon. */
  initials?: string;
  /** Short muted text next to the label, e.g. a price or a count. */
  meta?: string;
  disabled?: boolean;
}

export interface RichSelectProps {
  options?: RichOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  /** Open on mount, without taking focus. Handy for a preview. */
  defaultOpen?: boolean;
  /** Form field name. */
  name?: string;
  disabled?: boolean;
  className?: string;
}

const icon = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const ROLES: RichOption[] = [
  { value: "owner", label: "Owner", description: "Billing, members and every project", icon: icon("M2.5 11.5 4 5l3 3 1-4 1 4 3-3 1.5 6.5ZM3 13.5h10"), meta: "1 seat" },
  { value: "admin", label: "Admin", description: "Manage members and settings", icon: icon("M8 1.8 13 4v4c0 3-2.2 5.2-5 6.2C5.2 13.2 3 11 3 8V4Z M5.8 8l1.6 1.6L10.5 6.5") },
  { value: "editor", label: "Editor", description: "Create and publish in any project", icon: icon("m10.5 2.5 3 3L6 13H3v-3Z M9 4l3 3") },
  { value: "viewer", label: "Viewer", description: "Read and comment, no edits", icon: icon("M1.8 8S4 3.5 8 3.5 14.2 8 14.2 8 12 12.5 8 12.5 1.8 8 1.8 8Z M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z") },
];

/** Measured once on open: does the list fit below, inside the nearest clipping box? */
function roomBelow(el: HTMLElement, need: number) {
  const r = el.getBoundingClientRect();
  let top = 0;
  let bottom = window.innerHeight;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (/hidden|auto|scroll|clip/.test(getComputedStyle(p).overflowY)) {
      const c = p.getBoundingClientRect();
      top = c.top;
      bottom = c.bottom;
      break;
    }
  }
  const below = bottom - r.bottom;
  return below >= need || below >= r.top - top;
}

function Tile({ o, on, big }: { o?: RichOption; on?: boolean; big?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex shrink-0 items-center justify-center rounded-[9px] text-[12px] font-semibold tracking-[-0.01em] transition-colors duration-300 [&_svg]:h-[17px] [&_svg]:w-[17px]",
        big ? "h-9 w-9" : "h-8 w-8",
        on
          ? "bg-brand text-white shadow-[0_6px_14px_-6px_color-mix(in_srgb,var(--color-brand)_80%,transparent)]"
          : "bg-paper-2 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_7%,transparent)]",
      )}
    >
      {o?.icon ?? o?.initials ?? o?.label.slice(0, 1)}
    </span>
  );
}

/** aui-043 · Rich options: icon tiles and descriptions, a highlight that glides between rows and a check that slides to the pick. */
export function RichSelect({ options = ROLES, value, defaultValue, onChange, label = "Role", defaultOpen = false, name, disabled, className }: RichSelectProps) {
  const [inner, setInner] = useState(defaultValue ?? options[2]?.value ?? options[0]?.value);
  const current = value ?? inner;
  const picked = Math.max(0, options.findIndex((o) => o.value === current));
  const sel = options[picked];
  const [open, setOpen] = useState(defaultOpen);
  const [down, setDown] = useState(true);
  const [active, setActive] = useState(picked);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const wantFocus = useRef(false);
  const buf = useRef("");
  const bufT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const uid = useId();

  useEffect(() => () => clearTimeout(bufT.current), []);

  useEffect(() => {
    if (open && wantFocus.current) list.current?.focus({ preventScroll: true });
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
    setDown(roomBelow(btn.current, options.length * ROW + 20));
    setActive(picked);
    wantFocus.current = true;
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btn.current?.focus({ preventScroll: true });
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

  const glide = (i: number): CSSProperties => ({ height: ROW, transform: `translateY(${i * ROW}px)`, transition: `transform .42s ${EASE}` });

  return (
    <div ref={root} className={cx("aui043 relative w-full", open && "z-40", className)}>
      <style href="asta-aui043" precedence="asta">{CSS}</style>
      <button
        ref={btn}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-label={`${label}: ${sel?.label ?? ""}`}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => {
          if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            show();
          }
        }}
        className={cx(
          "group flex h-[60px] w-full items-center gap-3 rounded-[11px] bg-paper pl-3 pr-3.5 text-left outline-none transition-[box-shadow,transform] duration-300 active:scale-[.995] disabled:cursor-not-allowed disabled:opacity-45",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_1px_2px_rgb(0_0_0/0.04)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent),0_1px_2px_rgb(0_0_0/0.04)]",
          "focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
          open && "!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        )}
      >
        <Tile o={sel} big />
        <span key={sel?.value} className="min-w-0 flex-1" style={{ animation: `aui043-row .45s ${EASE} both` }}>
          <span className="block truncate text-[14px] font-medium tracking-[-0.01em] text-ink">{sel?.label}</span>
          <span className="block truncate text-[12.5px] text-mute">{sel?.description}</span>
        </span>
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-mute transition-colors group-hover:text-ink" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 6.2 3-3 3 3M5 9.8l3 3 3-3" />
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
            "absolute inset-x-0 z-50 rounded-[13px] bg-paper p-1.5 outline-none",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_22px_48px_-16px_rgb(0_0_0/0.3),0_4px_10px_-4px_rgb(0_0_0/0.08)]",
            down ? "top-full mt-2 origin-top" : "bottom-full mb-2 origin-bottom [--aui043-y:6px]",
          )}
          style={{ animation: `aui043-pop .32s ${EASE} both` }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-1.5 top-1.5 rounded-[9px] bg-paper-2" style={glide(active)} />
          <span aria-hidden className="pointer-events-none absolute right-4 top-1.5 z-10 flex items-center" style={glide(picked)}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-[0_4px_10px_-4px_color-mix(in_srgb,var(--color-brand)_80%,transparent)]">
              <svg key={current} viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16" style={{ animation: `aui043-draw .5s ${EASE} .15s both` }}>
                <path d="m4 8.5 2.6 2.5L12 5.5" />
              </svg>
            </span>
          </span>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${uid}-o-${i}`}
              role="option"
              aria-selected={i === picked}
              aria-disabled={o.disabled || undefined}
              onPointerMove={() => !o.disabled && active !== i && setActive(i)}
              onClick={() => pick(i)}
              className={cx("relative flex cursor-pointer select-none items-center gap-3 rounded-[9px] pl-2.5 pr-12", o.disabled && "cursor-not-allowed opacity-40")}
              style={{ height: ROW, animation: `aui043-row .45s ${EASE} ${60 + i * 40}ms both` }}
            >
              <Tile o={o} on={i === picked} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-[13.5px] font-medium tracking-[-0.01em] text-ink">{o.label}</span>
                  {o.meta && <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.06em] text-mute">{o.meta}</span>}
                </span>
                {o.description && <span className="block truncate text-[12px] text-mute">{o.description}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RichSelect;
