"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const FREE_AT = 150;

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

// Monochrome line glyphs, so the items stay in the palette.
const G = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-[46%] w-[46%]" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const CATALOG: { name: string; price: number; art: ReactNode }[] = [
  { name: "Orbit lamp", price: 70, art: <G d="M12 3v3M7 10a5 5 0 0 1 10 0v2H7ZM9 21h6M12 12v9" /> },
  { name: "Field notebook", price: 34, art: <G d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6ZM9 3v18M12 8h4M12 11h4" /> },
  { name: "Stone mug", price: 28, art: <G d="M5 7h11v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4ZM16 9h1.5a2.5 2.5 0 0 1 0 5H16" /> },
  { name: "Brass pen", price: 22, art: <G d="M16 4l4 4L9 19l-5 1 1-5ZM14 6l4 4" /> },
];

/** Tweens a number over ~600ms with an ease-out curve, so totals count instead of jumping. */
function useTween(target: number, ms = 600) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  const cur = useRef(target);
  useEffect(() => {
    from.current = cur.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let id = 0;
    const step = (t: number) => {
      const k = still ? 1 : Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 4);
      cur.current = from.current + (target - from.current) * e;
      setV(cur.current);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, ms]);
  return v;
}

const Check = () => (
  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

/** One focused moment: items drop into the cart until the free-shipping bar fills and unlocks. Loops until you take over. */
export default function CartDrawer() {
  const [n, setN] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = leaving ? 0 : CATALOG.slice(0, n).reduce((s, it) => s + it.price, 0);
  const free = total >= FREE_AT;
  const pct = Math.min(1, total / FREE_AT);
  const away = Math.max(0, FREE_AT - total);
  const shownTotal = useTween(total, 650);

  const takeOver = () => {
    setPaused(true);
    setLeaving(false);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  // Demo loop: add one item every 1.5s, hold the unlocked state, then let everything drain away
  // (chips fade out one by one, the bar empties, the total counts down) before starting over.
  useEffect(() => {
    if (paused) return;
    const t: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const reset = () => {
      if (!alive) return;
      setN(0);
      setLeaving(false);
    };
    const run = () => {
      CATALOG.forEach((_, i) => t.push(setTimeout(() => alive && setN(i + 1), 900 + i * 1500)));
      const end = 900 + CATALOG.length * 1500 + 1800;
      t.push(setTimeout(() => alive && setLeaving(true), end));
      t.push(setTimeout(reset, end + 1000));
      t.push(setTimeout(() => alive && run(), end + 1300));
    };
    t.push(setTimeout(reset, 0));
    run();
    return () => {
      alive = false;
      t.forEach(clearTimeout);
    };
  }, [paused]);

  const shown = Math.min(n, CATALOG.length);

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pt-8" style={{ containerType: "size" }}>
      <style>{`
        @keyframes lab-cd-pop { 0% { transform: translateY(-14px) scale(.6); opacity: 0 } 55% { opacity: 1 } 70% { transform: translateY(1px) scale(1.04) } 100% { transform: none; opacity: 1 } }
        @keyframes lab-cd-swap { from { opacity: 0; transform: translateY(30%); filter: blur(2px) } to { opacity: 1; transform: none; filter: none } }
        @keyframes lab-cd-shine { from { transform: translateX(-100%) } to { transform: translateX(320%) } }
        @media (prefers-reduced-motion: reduce) { .lab-cd-anim { animation: none !important } }
      `}</style>

      <div className="flex w-full flex-col gap-[4.5cqh]" style={{ maxWidth: 440 }}>
        {/* Label + total */}
        <div className="flex items-end justify-between gap-4">
          <div className="relative min-w-0 text-[clamp(14px,4.2cqmin,18px)] font-medium leading-tight text-ink">
            {free ? (
              <span key="free" className="lab-cd-anim flex items-center gap-2 text-ink" style={{ animation: `lab-cd-swap .6s ${EASE} both` }}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-paper">
                  <Check />
                </span>
                Free shipping unlocked
              </span>
            ) : (
              <span key="away" className="lab-cd-anim block" style={{ animation: `lab-cd-swap .6s ${EASE} both` }}>
                <Roll value={`$${away}`} /> <span className="text-ink-2">away from free shipping</span>
              </span>
            )}
          </div>
        </div>

        {/* The bar */}
        <div className="relative">
          <div className="relative h-2 overflow-hidden rounded-[3px] bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
            <div
              className="absolute inset-0 origin-left rounded-[3px] transition-transform will-change-transform motion-reduce:transition-none"
              style={{
                transform: `scaleX(${pct})`,
                background: "var(--color-accent)",
                transitionDuration: leaving ? "900ms" : "800ms",
                transitionTimingFunction: leaving ? "cubic-bezier(.65,0,.35,1)" : EASE,
              }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3px]">
              {free && (
                <span
                  key="shine"
                  aria-hidden
                  className="lab-cd-anim absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{ animation: `lab-cd-shine 1.1s cubic-bezier(.65,0,.35,1) .45s both` }}
                />
              )}
            </div>
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10.5px] uppercase tracking-wider text-mute">
            <span>$0</span>
            <span>${FREE_AT}</span>
          </div>
        </div>

        {/* Items + total */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {CATALOG.slice(0, shown).map((it, i) => (
              <span
                key={`${it.name}-${i}`}
                title={`${it.name} · $${it.price}`}
                className="flex transition-[opacity,transform] duration-500 motion-reduce:transition-none"
                style={{
                  opacity: leaving ? 0 : 1,
                  transform: leaving ? "translateY(6px) scale(.85)" : "none",
                  transitionDelay: leaving ? `${i * 70}ms` : "0ms",
                  transitionTimingFunction: EASE,
                }}
              >
                <span
                  className="lab-cd-anim flex h-[clamp(34px,11cqmin,46px)] w-[clamp(34px,11cqmin,46px)] items-center justify-center rounded-[9px] bg-paper-2 text-ink-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]"
                  style={{ animation: `lab-cd-pop .7s ${EASE} both` }}
                >
                  {it.art}
                </span>
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                takeOver();
                setN((v) => (v >= CATALOG.length ? 1 : v + 1));
              }}
              className="flex h-[clamp(34px,11cqmin,46px)] shrink-0 items-center gap-1 whitespace-nowrap rounded-[9px] px-2.5 text-[13px] text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] border border-dashed border-transparent outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              + add
            </button>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute">Total</div>
            <div className="text-[clamp(18px,6cqmin,26px)] font-medium tracking-[-0.02em] text-ink" aria-live="polite">
              <span className="tabular-nums">${shownTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
