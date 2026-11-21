"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface ColorPickerSwatch {
  /** A hex colour, e.g. "#2f54eb". */
  value: string;
  /** Name read to screen readers and shown on hover, e.g. "Ocean". */
  name?: string;
}

export interface ColorPickerProps {
  /** The picked colour as lowercase `#rrggbb`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  swatches?: (string | ColorPickerSwatch)[];
  /** Show the hex field for a custom colour. */
  custom?: boolean;
  /** Swatches per row. */
  columns?: number;
  size?: "sm" | "md";
  /** Accessible name, e.g. "Label colour". */
  label?: string;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_SWATCHES: ColorPickerSwatch[] = [
  { value: "#111113", name: "Ink" },
  { value: "#52525b", name: "Graphite" },
  { value: "#a1a1aa", name: "Stone" },
  { value: "#e4e4e7", name: "Mist" },
  { value: "#2f54eb", name: "Blue" },
  { value: "#4f8ef7", name: "Sky" },
  { value: "#93b4ff", name: "Haze" },
  { value: "#5b5bd6", name: "Indigo" },
  { value: "#7c5cd6", name: "Violet" },
  { value: "#b4a7e8", name: "Lilac" },
];

/** Parse "#abc", "abc", "#aabbcc" or "aabbcc" into lowercase "#aabbcc". Null when it isn't a hex colour. */
const parseHex = (input: string): string | null => {
  const s = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) return `#${[...s].map((c) => c + c).join("")}`;
  if (/^[0-9a-f]{6}$/.test(s)) return `#${s}`;
  return null;
};

// Pale swatches get a hairline so they don't vanish on a white ground.
const light = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 200;
};

/**
 * A calm swatch picker. The ring around the picked swatch scales in, arrow keys move through the grid, and an
 * optional hex field takes any colour. The field previews as you type and only commits a valid hex.
 */
export function ColorPicker({ value, defaultValue, onValueChange, swatches = DEFAULT_SWATCHES, custom = true, columns = 5, size = "md", label = "Colour", disabled, className }: ColorPickerProps) {
  const list = swatches.map((s) => (typeof s === "string" ? { value: s } : s)).map((s) => ({ ...s, value: parseHex(s.value) ?? s.value }));
  const [inner, setInner] = useState(() => parseHex(defaultValue ?? "") ?? list[0]?.value ?? "#000000");
  const current = parseHex(value ?? "") ?? inner;

  const grid = useRef<HTMLDivElement>(null);
  const uid = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  const pickedIdx = list.findIndex((s) => s.value === current);
  const stop = focusIdx !== null && focusIdx < list.length ? focusIdx : Math.max(0, pickedIdx);

  const pick = (hex: string) => {
    if (hex === current) return;
    if (value === undefined) setInner(hex);
    onValueChange?.(hex);
  };

  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = list.length;
    if (!n) return;
    let i = stop;
    if (e.key === "ArrowRight") i = (stop + 1) % n;
    else if (e.key === "ArrowLeft") i = (stop - 1 + n) % n;
    else if (e.key === "ArrowDown") i = Math.min(n - 1, stop + columns);
    else if (e.key === "ArrowUp") i = Math.max(0, stop - columns);
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = n - 1;
    else return;
    e.preventDefault();
    setFocusIdx(i);
    pick(list[i].value);
    grid.current?.querySelectorAll<HTMLElement>("[role=radio]")[i]?.focus();
  };

  const preview = draft !== null ? parseHex(draft) : current;
  const invalid = draft !== null && draft.trim() !== "" && !parseHex(draft);

  const commit = () => {
    if (draft === null) return;
    const hex = parseHex(draft);
    if (hex) pick(hex);
    setDraft(null);
  };

  const px = size === "sm" ? 22 : 28;

  return (
    <div className={cx("inline-flex flex-col gap-3", disabled && "pointer-events-none opacity-50", className)}>
      <div
        ref={grid}
        role="radiogroup"
        aria-label={label}
        aria-disabled={disabled || undefined}
        onKeyDown={move}
        className="grid w-max"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, columns)}, ${px}px)`, gap: size === "sm" ? 8 : 10 }}
      >
        {list.map((s, i) => {
          const on = s.value === current;
          return (
            <button
              key={`${s.value}-${i}`}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={s.name ? `${s.name}, ${s.value}` : s.value}
              title={s.name ?? s.value}
              tabIndex={disabled ? -1 : i === stop ? 0 : -1}
              onFocus={() => setFocusIdx(i)}
              onClick={() => pick(s.value)}
              className="group/sw relative rounded-full outline-none transition-[scale] duration-200 ease-[cubic-bezier(.16,1,.3,1)] hover:scale-110 active:scale-95 motion-reduce:transition-none"
              style={{ width: px, height: px }}
            >
              <span
                aria-hidden
                className={cx(
                  "pointer-events-none absolute -inset-[4px] rounded-full shadow-[0_0_0_1.5px_var(--color-ink)] transition-[opacity,scale] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
                  on ? "scale-100 opacity-100" : "scale-75 opacity-0",
                  "group-focus-visible/sw:shadow-[0_0_0_1.5px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_22%,transparent)] group-focus-visible/sw:scale-100 group-focus-visible/sw:opacity-100",
                )}
              />
              <span
                aria-hidden
                className={cx("absolute inset-0 rounded-full", light(s.value) && "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]")}
                style={{ background: s.value }}
              />
            </button>
          );
        })}
      </div>

      {custom && (
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="relative h-8 w-8 shrink-0 rounded-[8px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] transition-[background-color] duration-200"
            style={{ background: preview ?? "transparent" }}
          >
            {!preview && <span className="absolute inset-0 flex items-center justify-center text-[12px] text-mute">?</span>}
          </span>
          <label htmlFor={`${uid}-hex`} className="sr-only">
            Custom hex colour
          </label>
          <div className="flex h-8 min-w-0 flex-1 items-center rounded-[8px] bg-paper-2 pl-2.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)] transition-shadow duration-200 focus-within:shadow-[inset_0_0_0_1.5px_var(--color-brand)]">
            <span aria-hidden className="text-[13px] text-mute">
              #
            </span>
            <input
              id={`${uid}-hex`}
              value={(draft ?? current).replace(/^#/, "")}
              onChange={(e) => setDraft(e.target.value.replace(/^#/, "").slice(0, 7))}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                } else if (e.key === "Escape" && draft !== null) {
                  e.preventDefault();
                  setDraft(null);
                }
              }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={7}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? `${uid}-hint` : undefined}
              className="h-full w-full min-w-0 bg-transparent pl-1 pr-2.5 font-mono text-[16px] sm:text-[13px] uppercase tracking-[0.02em] text-ink outline-none placeholder:text-mute"
              placeholder="2F54EB"
            />
          </div>
          <span id={`${uid}-hint`} aria-live="polite" className={cx("w-14 text-[12px] text-mute transition-opacity duration-200", invalid ? "opacity-100" : "opacity-0")}>
            {invalid ? "Not a hex" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
