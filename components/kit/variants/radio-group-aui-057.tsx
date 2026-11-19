"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui057-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui057-pop { from { opacity: 0; transform: scale(.6) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui057 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui057-rise .6s ${EASE} ${80 + i * 50}ms both` });

export interface SwatchOption {
  value: string;
  name: string;
  /** Any CSS colour, ideally a token mix. */
  color: string;
  /** Colour of the mark drawn on top. */
  on: string;
}

const mix = (a: string, p: number, b: string) => `color-mix(in srgb, var(--color-${a}) ${p}%, var(--color-${b}))`;

const SWATCHES: SwatchOption[] = [
  { value: "ink", name: "Ink", color: "var(--color-ink)", on: "var(--color-paper)" },
  { value: "graphite", name: "Graphite", color: mix("ink", 62, "paper"), on: "var(--color-paper)" },
  { value: "fog", name: "Fog", color: mix("ink", 9, "paper"), on: "var(--color-ink)" },
  { value: "cobalt", name: "Cobalt", color: "var(--color-brand)", on: "#fff" },
  { value: "midnight", name: "Midnight", color: mix("brand", 45, "ink"), on: "#fff" },
  { value: "ice", name: "Ice", color: mix("brand", 16, "paper"), on: "var(--color-brand)" },
];

export interface SwatchRadioProps {
  swatches?: SwatchOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  title?: string;
  description?: string;
  /** Letter on the icon preview. */
  mark?: string;
  name?: string;
  className?: string;
}

/**
 * aui-057 · An app icon colour picker. Signature: a ring springs around the chosen swatch, the colour name rolls
 * into place and the big icon cross-fades with a small bounce.
 */
export function SwatchRadio({ swatches = SWATCHES, value, defaultValue = "cobalt", onChange, title = "App icon", description = "How Astabyte looks on your dock and home screen.", mark = "A", name, className }: SwatchRadioProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const index = Math.max(0, swatches.findIndex((s) => s.value === current));
  const icon = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    icon.current?.animate([{ transform: "scale(1)" }, { transform: "scale(.92)", offset: 0.3 }, { transform: "scale(1)" }], { duration: 520, easing: SPRING });
  }, [index]);

  const pick = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  return (
    <div
      className={cx(
        "aui057 w-full max-w-[440px] rounded-[14px] bg-paper p-5 sm:p-6",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-aui057" precedence="asta">
        {CSS}
      </style>
      <div className="flex items-center gap-5">
        {/* Icon preview: every colour is stacked, only opacity changes. */}
        <div ref={icon} aria-hidden className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[22px] shadow-[0_1px_2px_rgb(0_0_0/0.08),0_12px_28px_-14px_rgb(0_0_0/0.45)]" style={{ animation: `aui057-pop .7s ${SPRING} 80ms both` }}>
          {swatches.map((s, i) => (
            <span key={s.value} className="absolute inset-0 grid place-items-center transition-opacity duration-500" style={{ background: s.color, opacity: i === index ? 1 : 0, transitionTimingFunction: EASE }}>
              <span className="text-[38px] font-semibold leading-none tracking-[-0.06em]" style={{ color: s.on }}>
                {mark}
              </span>
            </span>
          ))}
          <span className="absolute inset-0 rounded-[22px] bg-[linear-gradient(180deg,rgb(255_255_255/0.22),transparent_45%)] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]" />
        </div>
        <div className="min-w-0" style={rise(1)}>
          <h3 id={`${uid}-t`} className="text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink">
            {title}
          </h3>
          <p className="mt-1 text-[13px] leading-snug text-mute">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3" style={rise(2)}>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Colour</p>
        <span className="relative block h-5 w-24 overflow-hidden text-right text-[14px] font-medium tracking-[-0.01em] text-ink" aria-live="polite">
          <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500" style={{ transform: `translateY(${-index * 20}px)`, transitionTimingFunction: EASE }}>
            {swatches.map((s, i) => (
              <span key={s.value} aria-hidden={i !== index} className="block h-5 leading-5">
                {s.name}
              </span>
            ))}
          </span>
        </span>
      </div>

      <div role="radiogroup" aria-labelledby={`${uid}-t`} className="-mx-1 mt-3 grid justify-items-center gap-1" style={{ gridTemplateColumns: `repeat(${swatches.length}, minmax(0, 1fr))` }}>
        {swatches.map((s, i) => {
          const on = i === index;
          const id = `${uid}-${s.value}`;
          return (
            <label key={s.value} htmlFor={id} title={s.name} className="group/sw relative grid h-10 w-10 cursor-pointer sm:h-11 sm:w-11 place-items-center rounded-full" style={{ animation: `aui057-pop .5s ${SPRING} ${220 + i * 45}ms both` }}>
              <input id={id} type="radio" name={name ?? uid} value={s.value} checked={on} onChange={() => pick(s.value)} aria-label={s.name} className="peer sr-only" />
              <span aria-hidden className="absolute inset-0 rounded-full shadow-[inset_0_0_0_2px_var(--color-ink)] transition-[transform,opacity] duration-500" style={{ opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(.7)", transitionTimingFunction: SPRING }} />
              <span aria-hidden className="absolute inset-[-3px] rounded-full opacity-0 shadow-[0_0_0_2px_var(--color-brand)] peer-focus-visible:opacity-100" />
              <span
                aria-hidden
                className="relative h-7 w-7 rounded-full sm:h-8 sm:w-8 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08),inset_0_1px_0_rgb(255_255_255/0.2)] transition-transform duration-300 group-hover/sw:scale-110 group-active/sw:scale-95"
                style={{ background: s.color, transform: on ? "scale(.82)" : undefined, transitionTimingFunction: SPRING }}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default SwatchRadio;
