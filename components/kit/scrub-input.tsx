"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-scrub-tip { from { opacity: 0; transform: translateY(-3px) } }
@media (prefers-reduced-motion: reduce) { .asta-scrub-a, .asta-scrub-a * { animation: none !important; transition-duration: 0s !important } }`;

/* ---------- Units and the expression parser ---------- */

// Each unit belongs to a family and has a factor to that family's base (px, deg, %, ms).
const UNITS: Record<string, [family: string, factor: number]> = {
  px: ["len", 1],
  rem: ["len", 16],
  em: ["len", 16],
  pt: ["len", 4 / 3],
  deg: ["ang", 1],
  "°": ["ang", 1],
  rad: ["ang", 180 / Math.PI],
  turn: ["ang", 360],
  "%": ["pct", 1],
  ms: ["time", 1],
  s: ["time", 1000],
};

type Token = { t: "num"; v: number } | { t: "op"; v: string };

function tokenize(src: string, unit?: string): Token[] | null {
  const out: Token[] = [];
  const base = unit ? UNITS[unit] : undefined;
  const re = /\s*(?:(\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-z%°]*)|([-+*/×÷()]))\s*/giy;
  let i = 0;
  while (i < src.length) {
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) return null;
    i = re.lastIndex;
    if (m[3]) {
      out.push({ t: "op", v: m[3] === "×" ? "*" : m[3] === "÷" ? "/" : m[3] });
      continue;
    }
    let v = Number(m[1]);
    const u = m[2].toLowerCase();
    if (u && u !== unit) {
      const typed = UNITS[u];
      // A unit from another family ("12px" in an angle field) can't be read.
      if (!typed || !base || typed[0] !== base[0]) return null;
      v = (v * typed[1]) / base[1];
    }
    out.push({ t: "num", v });
  }
  return out;
}

/**
 * Reads what was typed into a scrub field without eval: numbers with an optional unit ("12px", "1.5rem", "45°"),
 * + − × ÷ and brackets. A leading +, * or / works on the current value ("+8", "*2"). Returns null when it can't.
 */
export function parseScrubValue(text: string, current: number, unit?: string): number | null {
  let src = text.trim().replace(/,/g, ".").replace(/−/g, "-");
  if (!src || src.length > 64) return null;
  let rel: string | null = null;
  if (/^[+*/×÷]/.test(src)) {
    rel = src[0] === "×" ? "*" : src[0] === "÷" ? "/" : src[0];
    src = src.slice(1);
  }
  const tokens = tokenize(src, unit);
  if (!tokens?.length) return null;
  let p = 0;
  const isOp = (...ops: string[]) => tokens[p]?.t === "op" && ops.includes(tokens[p].v as string);
  const factor = (): number => {
    const tk = tokens[p++];
    if (!tk) return NaN;
    if (tk.t === "num") return tk.v;
    if (tk.v === "-") return -factor();
    if (tk.v === "+") return factor();
    if (tk.v === "(") {
      const v = expr();
      return tokens[p++]?.v === ")" ? v : NaN;
    }
    return NaN;
  };
  const term = (): number => {
    let v = factor();
    while (isOp("*", "/")) v = tokens[p++].v === "*" ? v * factor() : v / factor();
    return v;
  };
  const expr = (): number => {
    let v = term();
    while (isOp("+", "-")) v = tokens[p++].v === "+" ? v + term() : v - term();
    return v;
  };
  let v = expr();
  if (p !== tokens.length || !Number.isFinite(v)) return null;
  if (rel === "+") v = current + v;
  else if (rel === "*") v = current * v;
  else if (rel === "/") v = v === 0 ? NaN : current / v;
  return Number.isFinite(v) ? v : null;
}

/* ---------- The field ---------- */

export interface ScrubInputProps {
  /** Short prefix you drag to scrub: "X", "W" or a small icon. */
  label: ReactNode;
  /** Full name for screen readers and the tooltip, e.g. "Rotation". Needed when the label is an icon or one letter. */
  title?: string;
  value?: number;
  defaultValue?: number;
  /** Fires on every change, also while scrubbing. */
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** One arrow press, or 2px of drag. Shift is ×10, Alt is ×0.1. */
  step?: number;
  /** Most decimals kept. Trailing zeros are hidden. */
  precision?: number;
  /** Unit of the value: px, rem, °, %, ms… Typed units of the same kind convert ("1.5rem" → 24 in a px field). */
  unit?: string;
  /** Submits the number with a form through a hidden input. */
  name?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const round = (v: number, precision: number) => Math.round(v * 10 ** precision) / 10 ** precision;
const fmt = (v: number, precision: number) => String(round(v, precision)).replace(/^-0$/, "0");
const factorOf = (e: { shiftKey: boolean; altKey: boolean }) => (e.shiftKey ? 10 : e.altKey ? 0.1 : 1);

/**
 * The number field of a design tool. Drag the label left or right to scrub (Shift ×10, Alt ×0.1), or click and
 * type. It reads units and simple sums like "24*2" or "+8" on Enter. Arrow keys step. At min or max the value
 * nudges toward the edge and a short bar shows which limit it hit.
 */
export function ScrubInput({ label, title, value, defaultValue = 0, onChange, min = -Infinity, max = Infinity, step = 1, precision = 2, unit, name, disabled, size = "md", className }: ScrubInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [scrub, setScrub] = useState<null | 1 | 10 | 0.1>(null);
  const [limit, setLimit] = useState<"min" | "max" | null>(null);
  const [status, setStatus] = useState("");
  const [tipEnd, setTipEnd] = useState(false);
  const root = useRef<HTMLLabelElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const drag = useRef({ x: 0, raw: 0, moved: false, id: -1 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const errId = useId();

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      document.documentElement.style.cursor = "";
    },
    [],
  );

  /** Clamps, rounds and reports. Flags the limit when the wanted value was outside the range. */
  const set = (want: number) => {
    const next = round(Math.min(max, Math.max(min, want)), precision);
    if (want < min || want > max) {
      const side = want < min ? "min" : "max";
      setLimit(side);
      setStatus(`${side === "min" ? "Minimum" : "Maximum"} is ${fmt(side === "min" ? min : max, precision)}${unit ?? ""}`);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setLimit(null), 420);
    }
    if (next !== current) {
      if (value === undefined) setInner(next);
      onChange?.(next);
    }
  };

  /** Reads the draft. With keepFocus an unreadable draft stays for fixing; otherwise it's dropped. */
  const commit = (keepFocus: boolean) => {
    if (draft === null) return true;
    const n = parseScrubValue(draft, current, unit);
    if (n === null && keepFocus) {
      // Open the hint toward the side with room, measured once.
      const r = root.current?.getBoundingClientRect();
      const edge = root.current?.closest("[role=group],section")?.getBoundingClientRect().right ?? window.innerWidth;
      setTipEnd(!!r && r.left + 220 > edge);
      setInvalid(true);
      setStatus(`Couldn't read “${draft.trim()}”.`);
      return false;
    }
    if (n === null) setStatus(`Kept ${fmt(current, precision)}${unit ?? ""}.`);
    else set(n);
    setDraft(null);
    setInvalid(false);
    return true;
  };

  const reselect = () => setTimeout(() => input.current?.select());

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (commit(true)) reselect();
    } else if (e.key === "Escape") {
      if (draft === null) return;
      e.preventDefault();
      setDraft(null);
      setInvalid(false);
      reselect();
    } else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(e.key)) {
      e.preventDefault();
      const base = draft === null ? current : (parseScrubValue(draft, current, unit) ?? current);
      const dir = e.key === "ArrowUp" || e.key === "PageUp" ? 1 : -1;
      setDraft(null);
      setInvalid(false);
      set(base + dir * step * (e.key.startsWith("Page") ? 10 : factorOf(e)));
      reselect();
    }
  };

  /* Scrubbing. Each move adds its own distance × the current modifier, so switching Shift or Alt mid-drag never jumps. */
  const down = (e: PointerEvent<HTMLSpanElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    commit(false);
    drag.current = { x: e.clientX, raw: current, moved: false, id: e.pointerId };
    setScrub(factorOf(e));
    document.documentElement.style.cursor = "ew-resize";
  };
  const move = (e: PointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    if (scrub === null || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 3) return;
    d.moved = true;
    d.x = e.clientX;
    const f = factorOf(e);
    if (f !== scrub) setScrub(f);
    const want = d.raw + (dx / 2) * step * f;
    // The raw value stays inside the range, so dragging back responds at once.
    d.raw = Math.min(max, Math.max(min, want));
    // Snap to the step in use, so a plain drag gives whole steps and Alt gives tenths.
    const grid = step * f;
    set(want < min || want > max ? want : Math.round(want / grid) * grid);
  };
  const up = (e: PointerEvent<HTMLSpanElement>) => {
    if (scrub === null || e.pointerId !== drag.current.id) return;
    drag.current.id = -1;
    setScrub(null);
    document.documentElement.style.cursor = "";
    if (!drag.current.moved) {
      input.current?.focus();
      input.current?.select();
    }
  };

  const sm = size === "sm";
  const a11yName = title ?? (typeof label === "string" ? label : undefined);

  return (
    <label
      ref={root}
      data-scrubbing={scrub !== null || undefined}
      data-limit={limit ?? undefined}
      className={cx(
        "asta-scrub-a group/scrub relative flex min-w-0 items-center rounded-[7px] bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] text-ink transition-[background-color,box-shadow] duration-150",
        "hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] focus-within:bg-paper focus-within:shadow-[inset_0_0_0_1.5px_var(--color-brand)]",
        "data-[scrubbing]:bg-paper data-[scrubbing]:shadow-[inset_0_0_0_1.5px_var(--color-brand)]",
        invalid && "!shadow-[inset_0_0_0_1.5px_var(--color-ink)]",
        sm ? "h-8 sm:h-7" : "h-9 sm:h-8",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
    >
      <style href="asta-scrub-input" precedence="asta">{KEYFRAMES}</style>
      <span
        aria-hidden
        title={a11yName ? `${a11yName}: drag to change` : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onLostPointerCapture={up}
        className={cx(
          "grid h-full shrink-0 cursor-ew-resize touch-none select-none place-items-center text-[11.5px] font-medium text-mute transition-colors duration-150 hover:text-ink group-data-[scrubbing]/scrub:text-brand [&>svg]:h-3.5 [&>svg]:w-3.5",
          sm ? "w-6" : "w-7",
        )}
      >
        {label}
      </span>
      <input
        ref={input}
        role="spinbutton"
        aria-label={a11yName}
        aria-valuenow={current}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        aria-valuetext={`${fmt(current, precision)}${unit ? ` ${unit}` : ""}`}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errId : undefined}
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={draft ?? fmt(current, precision)}
        onChange={(e) => {
          setDraft(e.target.value);
          setInvalid(false);
        }}
        onFocus={(e) => e.target.select()}
        onBlur={() => commit(false)}
        onKeyDown={onKey}
        className={cx(
          "h-full min-w-0 flex-1 bg-transparent pr-1 text-[16px] tabular-nums tracking-[-0.01em] outline-none transition-transform duration-200 ease-[cubic-bezier(.16,1,.3,1)] selection:bg-[color-mix(in_srgb,var(--color-brand)_22%,transparent)]",
          sm ? "sm:text-[12px]" : "sm:text-[12.5px]",
          limit === "max" && "translate-x-[3px]",
          limit === "min" && "-translate-x-[3px]",
        )}
      />
      {scrub !== null && scrub !== 1 ? (
        <span aria-hidden className="mr-1.5 shrink-0 rounded-[4px] bg-brand px-1 text-[10.5px] font-medium leading-4 tabular-nums text-white">
          ×{scrub}
        </span>
      ) : (
        unit && (
          <span aria-hidden className="shrink-0 pr-2 text-[11.5px] text-mute">
            {unit}
          </span>
        )
      )}
      {/* The limit you hit: a short bar on that edge fades in, then out. */}
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-y-1.5 w-[2px] rounded-full bg-brand transition-opacity ease-[cubic-bezier(.16,1,.3,1)]",
          limit ? "opacity-100 duration-100" : "opacity-0 duration-500",
          limit === "min" ? "left-0.5" : "right-0.5",
        )}
      />
      {invalid && (
        <span
          id={errId}
          className={cx(
            "absolute top-[calc(100%+6px)] z-10 w-max max-w-[220px] rounded-[8px] bg-ink px-2.5 py-1.5 text-[12px] leading-snug text-paper shadow-[0_8px_24px_-10px_rgb(0_0_0/0.4)] [animation:asta-scrub-tip_.2s_cubic-bezier(.16,1,.3,1)]",
            tipEnd ? "right-0" : "left-0",
          )}
        >
          Try 24, 1.5rem or 24*2. Esc puts it back.
        </span>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
      {name && <input type="hidden" name={name} value={current} />}
    </label>
  );
}

/* ---------- A labelled row of fields ---------- */

export interface ScrubRowProps {
  /** Muted label on the left, e.g. "Position". */
  label?: string;
  cols?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

const COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

export function ScrubRow({ label, cols = 2, children, className }: ScrubRowProps) {
  return (
    <div role="group" aria-label={label} className={cx("grid items-center gap-x-3", label ? "grid-cols-[64px_1fr]" : "grid-cols-1", className)}>
      {label && <span className="truncate text-[12px] text-mute">{label}</span>}
      <div className={cx("grid min-w-0 gap-1.5", COLS[cols])}>{children}</div>
    </div>
  );
}

export default ScrubInput;
