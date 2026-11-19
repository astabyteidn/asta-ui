"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-prop-in { from { opacity: 0; transform: translateY(-3px) } }
@media (prefers-reduced-motion: reduce) { .asta-prop-body { animation: none !important } }`;

const FIELD =
  "h-7 rounded-[6px] bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] text-[12px] text-ink transition-[background-color,box-shadow] duration-150 hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] focus-within:bg-paper focus-within:shadow-[inset_0_0_0_1.5px_var(--color-brand)]";

/* Panel + sections + rows */

export interface PropertiesPanelProps {
  /** Shown in the panel header, e.g. the selected layer's name. */
  title?: ReactNode;
  /** Small tag before the title, e.g. "Text" or "Frame". */
  kind?: string;
  /** Buttons on the right of the header. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The inspector of a design editor: a header for the selection, collapsible sections, compact number fields you
 * can drag to scrub (Shift for ×10, Alt for ×0.1), and a colour field with a swatch and a hex input.
 */
export function PropertiesPanel({ title, kind, actions, children, className }: PropertiesPanelProps) {
  return (
    <div className={cx("w-full overflow-hidden rounded-[12px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-16px_rgb(0_0_0/0.22)]", className)}>
      <style href="asta-properties-panel" precedence="asta">{KEYFRAMES}</style>
      {(title || kind || actions) && (
        <div className="flex h-11 items-center gap-2 px-3.5">
          {kind && <span className="rounded-[5px] bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] px-1.5 py-0.5 text-[11px] text-ink-2">{kind}</span>}
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{title}</span>
          {actions}
        </div>
      )}
      <div className="pb-1.5">{children}</div>
    </div>
  );
}

export interface PropSectionProps {
  title: string;
  /** A button on the right of the title, e.g. "+" to add a fill. */
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function PropSection({ title, action, defaultOpen = true, children }: PropSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="px-3.5 pt-2.5">
      <div className="flex h-7 items-center justify-between">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="group/sec flex cursor-pointer items-center gap-1 rounded-[4px] text-[11.5px] font-medium text-ink outline-none focus-visible:shadow-[0_0_0_2px_var(--color-brand)]">
          <svg viewBox="0 0 24 24" className={cx("h-3 w-3 text-mute transition-transform duration-200 ease-[cubic-bezier(.16,1,.3,1)]", open && "rotate-90")} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
            <path d="m9 6 6 6-6 6" />
          </svg>
          {title}
        </button>
        {action}
      </div>
      {open && (
        <div id={id} className="asta-prop-body animate-[asta-prop-in_.22s_cubic-bezier(.16,1,.3,1)_both] space-y-1.5 pb-2 pt-1">
          {children}
        </div>
      )}
    </section>
  );
}

export interface PropRowProps {
  /** Muted label on the left. Omit it to let the fields use the full width. */
  label?: string;
  /** How many equal columns the fields share. */
  cols?: 1 | 2 | 3 | 4;
  children: ReactNode;
}

const COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

export function PropRow({ label, cols = 2, children }: PropRowProps) {
  return (
    <div className={cx("grid items-center gap-2", label ? "grid-cols-[64px_1fr]" : "grid-cols-1")}>
      {label && <span className="truncate text-[11.5px] text-mute">{label}</span>}
      <div className={cx("grid gap-1.5", COLS[cols])}>{children}</div>
    </div>
  );
}

/* Scrub input */

export interface ScrubInputProps {
  /** A short prefix ("X", "W") or an icon. Drag it left and right to change the value. */
  label: ReactNode;
  /** Accessible name when the label is an icon or a single letter. */
  name?: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Decimals kept. */
  precision?: number;
  unit?: string;
  disabled?: boolean;
}

const clampTo = (v: number, min = -Infinity, max = Infinity, precision = 0) => {
  const f = 10 ** precision;
  return Math.min(max, Math.max(min, Math.round(v * f) / f));
};

export function ScrubInput({ label, name, value, onChange, step = 1, min, max, precision = 0, unit, disabled }: ScrubInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const drag = useRef({ x: 0, v: 0, moved: false });
  const input = useRef<HTMLInputElement>(null);
  const set = (v: number) => onChange(clampTo(v, min, max, precision));
  const factor = (e: { shiftKey: boolean; altKey: boolean }) => (e.shiftKey ? 10 : e.altKey ? 0.1 : 1);

  const down = (e: PointerEvent<HTMLSpanElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, v: value, moved: false };
    setScrubbing(true);
  };
  const move = (e: PointerEvent<HTMLSpanElement>) => {
    if (!scrubbing) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 2) drag.current.moved = true;
    if (drag.current.moved) set(drag.current.v + Math.round(dx / 2) * step * factor(e));
  };
  const up = () => {
    setScrubbing(false);
    if (!drag.current.moved) input.current?.select();
  };

  const commit = () => {
    if (draft === null) return;
    const n = Number(draft.replace(",", ".").replace(unit ?? "", "").trim());
    if (draft.trim() !== "" && Number.isFinite(n)) set(n);
    setDraft(null);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commit();
      input.current?.blur();
    } else if (e.key === "Escape") {
      setDraft(null);
      input.current?.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      setDraft(null);
      set(value + (e.key === "ArrowUp" ? 1 : -1) * step * factor(e));
    }
  };

  return (
    <label className={cx(FIELD, "flex min-w-0 items-center", disabled && "pointer-events-none opacity-45", scrubbing && "bg-paper shadow-[inset_0_0_0_1.5px_var(--color-brand)]")}>
      <span
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="grid h-full w-6 shrink-0 cursor-ew-resize touch-none select-none place-items-center text-[11px] text-mute [&>svg]:h-3.5 [&>svg]:w-3.5"
      >
        {label}
      </span>
      <input
        ref={input}
        aria-label={name ?? (typeof label === "string" ? label : undefined)}
        inputMode="decimal"
        disabled={disabled}
        value={draft ?? value.toFixed(precision)}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={onKey}
        className="h-full min-w-0 flex-1 bg-transparent pr-1.5 font-mono text-[11.5px] tabular-nums outline-none"
      />
      {unit && <span className="shrink-0 pr-2 text-[11px] text-mute">{unit}</span>}
    </label>
  );
}

/* Colour field */

export interface ColorFieldProps {
  /** Hex colour, "#2f54eb". */
  value: string;
  onChange: (hex: string) => void;
  name?: string;
  disabled?: boolean;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const norm = (v: string) => {
  const m = v.trim().match(HEX);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return `#${h.toLowerCase()}`;
};

export function ColorField({ value, onChange, name = "Colour", disabled }: ColorFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = norm(draft);
    if (n) onChange(n);
    setDraft(null);
  };
  return (
    <div className={cx(FIELD, "flex min-w-0 items-center", disabled && "pointer-events-none opacity-45")}>
      <label className="relative ml-1 h-5 w-5 shrink-0 cursor-pointer overflow-hidden rounded-[4px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_15%,transparent)]" style={{ background: value }}>
        <input type="color" aria-label={`${name} picker`} disabled={disabled} value={norm(value) ?? "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <input
        aria-label={`${name} hex`}
        disabled={disabled}
        value={draft ?? value.replace("#", "").toUpperCase()}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setDraft(null);
            (e.target as HTMLInputElement).blur();
          }
        }}
        spellCheck={false}
        className="h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-[11.5px] uppercase outline-none"
      />
    </div>
  );
}
