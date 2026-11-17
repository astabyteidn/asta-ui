"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
// A small spring: overshoots ~2% then settles.
const SPRING = "cubic-bezier(.3,1.18,.5,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Digits that roll to the new value instead of jumping. */
function Roll({ value }: { value: string }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-start leading-[1.15em] tabular-nums" aria-label={value}>
      {chars.map((c, i) => {
        const key = chars.length - i;
        if (!/\d/.test(c))
          return (
            <span key={`s${key}`} aria-hidden className="inline-block h-[1.15em]">
              {c}
            </span>
          );
        return (
          <span key={`d${key}`} aria-hidden className="relative inline-block h-[1.15em] overflow-hidden leading-[1.15em]">
            <span className="invisible">0</span>
            <span
              className="absolute left-0 top-0 flex flex-col transition-transform duration-700 motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(c) * 1.15}em)`, transitionTimingFunction: EASE }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.15em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

// Finishes stay inside the palette: greys from the ink token, plus the one accent.
const FINISHES = [
  { name: "Graphite", fill: "color-mix(in srgb, var(--color-ink) 14%, var(--color-paper-2))", mark: "var(--color-ink)" },
  { name: "Silver", fill: "color-mix(in srgb, var(--color-ink) 52%, var(--color-paper-2))", mark: "var(--color-paper)" },
  { name: "White", fill: "color-mix(in srgb, var(--color-ink) 94%, var(--color-paper))", mark: "var(--color-paper)" },
  { name: "Blue", fill: "var(--color-brand)", mark: "var(--color-paper)" },
];
const SIZES = [
  { label: "128 GB", price: 249 },
  { label: "256 GB", price: 299 },
  { label: "512 GB", price: 369 },
];

/** The product: a plain rounded device whose finish sweeps in from the left. */
function Device({ fill, mark }: { fill: string; mark: string }) {
  return (
    <span className="absolute inset-0 rounded-[22%]" style={{ background: fill }}>
      <span className="absolute inset-0 rounded-[22%] bg-[linear-gradient(160deg,rgb(255_255_255/0.16),transparent_45%,rgb(0_0_0/0.18))]" />
      <span className="absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${mark} 45%, transparent)` }} />
      <span className="absolute left-1/2 top-1/2 h-[9%] w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: mark, opacity: 0.7 }} />
      <span className="absolute bottom-[12%] left-1/2 h-[3%] w-[22%] -translate-x-1/2 rounded-full" style={{ background: mark, opacity: 0.35 }} />
    </span>
  );
}

/** One focused moment: pick a finish and it sweeps across the product; storage changes roll the price. Cycles until you pick. */
export default function VariantPicker() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState(0);
  const [size, setSize] = useState(1);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sw = useRef<(HTMLButtonElement | null)[]>([]);

  const pick = (i: number) => {
    if (i === cur) return;
    setPrev(cur);
    setCur(i);
    setTick((t) => t + 1);
  };
  const takeOver = () => {
    setPaused(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  useEffect(() => {
    if (paused) return;
    let n = 0;
    const id = setInterval(() => {
      n++;
      if (n % 3 === 0) setSize((s) => (s + 1) % SIZES.length);
      else {
        setCur((c) => {
          setPrev(c);
          return (c + 1) % FINISHES.length;
        });
        setTick((t) => t + 1);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [paused]);

  const f = FINISHES[cur];
  const p = FINISHES[prev];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[5cqh] px-5 pt-8" style={{ containerType: "size" }}>
      <style href="asta-variantpicker" precedence="asta">{`
        @keyframes lab-vp-sweep { from { -webkit-mask-position: 100% 0; mask-position: 100% 0 } to { -webkit-mask-position: 0 0; mask-position: 0 0 } }
        .lab-vp-sweep { -webkit-mask-image: linear-gradient(90deg, #000 38%, transparent 62%); mask-image: linear-gradient(90deg, #000 38%, transparent 62%); -webkit-mask-size: 300% 100%; mask-size: 300% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; will-change: mask-position }
        @keyframes lab-vp-name { from { opacity: 0; transform: translateY(35%); filter: blur(2px) } to { opacity: 1; transform: none; filter: none } }
        @media (prefers-reduced-motion: reduce) { .lab-vp-sweep, .lab-vp-name { animation: none !important } }
      `}</style>

      {/* Product */}
      <div className="relative shrink-0" style={{ width: "min(40cqh, 42cqw)", aspectRatio: "1" }}>
        <span className="absolute -bottom-[8%] left-[14%] right-[14%] h-[10%] rounded-[50%] bg-black/45 blur-lg" />
        <Device fill={p.fill} mark={p.mark} />
        <span key={tick} className="lab-vp-sweep absolute inset-0" style={{ animation: `lab-vp-sweep .95s ${EASE} both` }}>
          <Device fill={f.fill} mark={f.mark} />
        </span>
      </div>

      <div className="flex w-full max-w-[340px] flex-col gap-3">
        {/* Finish */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-ink-2">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-mute">Finish</span>
            <span key={f.name} className="lab-vp-name ml-2 inline-block text-ink" style={{ animation: `lab-vp-name .55s ${EASE} both` }}>
              {f.name}
            </span>
          </span>
          <div role="radiogroup" aria-label="Finish" className="relative flex gap-2">
            <span
              aria-hidden
              className="pointer-events-none absolute -left-[4px] -top-[4px] h-8 w-8 rounded-full transition-transform duration-[650ms] will-change-transform motion-reduce:transition-none"
              style={{ boxShadow: "inset 0 0 0 1.25px var(--color-ink)", transform: `translateX(${cur * 32}px)`, transitionTimingFunction: SPRING }}
            />
            {FINISHES.map((o, i) => (
              <button
                key={o.name}
                ref={(el) => {
                  sw.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={cur === i}
                aria-label={o.name}
                tabIndex={cur === i ? 0 : -1}
                onClick={() => {
                  takeOver();
                  pick(i);
                }}
                onKeyDown={(e) => {
                  const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                  if (!d) return;
                  e.preventDefault();
                  takeOver();
                  const n = (cur + d + FINISHES.length) % FINISHES.length;
                  pick(n);
                  sw.current[n]?.focus();
                }}
                className="relative h-6 w-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]" style={{ background: o.fill }} />
              </button>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div className="flex items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Storage" className={`relative grid flex-1 grid-cols-3 rounded-[9px] bg-paper-2 p-[3px] ${RING}`}>
            <span
              aria-hidden
              className="absolute bottom-[3px] top-[3px] rounded-[7px] bg-ink transition-transform duration-[650ms] will-change-transform motion-reduce:transition-none"
              style={{ left: 3, width: "calc((100% - 6px) / 3)", transform: `translateX(${size * 100}%)`, transitionTimingFunction: SPRING }}
            />
            {SIZES.map((s, i) => (
              <button
                key={s.label}
                type="button"
                role="radio"
                aria-checked={size === i}
                onClick={() => {
                  takeOver();
                  setSize(i);
                }}
                className={`relative z-10 h-8 rounded-[7px] text-[12.5px] font-medium tabular-nums outline-none transition-colors duration-500 focus-visible:ring-2 focus-visible:ring-brand/60 ${size === i ? "text-paper" : "text-mute hover:text-ink"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="w-[76px] text-right text-[20px] font-medium tracking-[-0.02em] text-ink">
            <Roll value={`$${SIZES[size].price}`} />
          </span>
        </div>
      </div>
    </div>
  );
}
