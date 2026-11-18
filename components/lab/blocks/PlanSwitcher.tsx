"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const PLANS = [
  { name: "Starter", note: "Just you", month: 9, year: 7, has: 2 },
  { name: "Pro", note: "Growing work", month: 29, year: 24, has: 4 },
  { name: "Team", note: "The whole crew", month: 79, year: 66, has: 5 },
];
const FEATURES = ["Core editor", "Version history", "Custom domain", "Priority support", "Shared workspace"];

/** The idle tour: [plan, yearly]. Every step is a real change, so the loop never snaps. */
const DEMO: [number, boolean][] = [
  [1, true],
  [2, true],
  [2, false],
  [0, false],
  [0, true],
  [1, false],
];

type State = { sel: number; yearly: boolean; stamp: number; born: number[] };

/** Move to a plan. Features the new plan adds get a fresh stamp, so only they replay the slide-in. */
function next(s: State, sel: number, yearly: boolean): State {
  if (s.sel === sel && s.yearly === yearly) return s;
  const stamp = s.stamp + 1;
  const born = s.born.map((b, i) => (i < PLANS[sel].has && i >= PLANS[s.sel].has ? stamp : b));
  return { sel, yearly, stamp, born };
}

/** Digits that roll to the new value instead of jumping. */
function Roll({ value }: { value: string }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-start leading-[1.1em] tabular-nums" aria-label={value}>
      {chars.map((c, i) => {
        const key = chars.length - i;
        if (!/\d/.test(c))
          return (
            <span key={`s${key}`} aria-hidden className="inline-block h-[1.1em]">
              {c}
            </span>
          );
        return (
          <span key={`d${key}`} aria-hidden className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1em]">
            <span className="invisible">0</span>
            <span
              className="absolute left-0 top-0 flex flex-col transition-transform duration-700 motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(c) * 1.1}em)`, transitionTimingFunction: EASE }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.1em]">
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

const Check = () => (
  <svg viewBox="0 0 16 16" className="h-[62%] w-[62%]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

/** One focused moment: switching plan glides the ring, rolls the price and diffs the feature list. Loops until you take over. */
export default function PlanSwitcher() {
  const [s, setS] = useState<State>({ sel: 1, yearly: false, stamp: 0, born: FEATURES.map(() => -1) });
  const [paused, setPaused] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);

  const takeOver = () => {
    setPaused(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const [p, y] = DEMO[i % DEMO.length];
      setS((v) => next(v, p, y));
      i++;
      id = setTimeout(tick, 2100);
    };
    id = setTimeout(tick, 1400);
    return () => clearTimeout(id);
  }, [paused]);

  const pick = (sel: number, yearly = s.yearly) => {
    takeOver();
    setS((v) => next(v, sel, yearly));
  };

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (s.sel + d + PLANS.length) % PLANS.length;
    pick(n);
    radios.current[n]?.focus();
  };

  const plan = PLANS[s.sel];
  const price = s.yearly ? plan.year : plan.month;
  const save = (plan.month - plan.year) * 12;

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11" style={{ containerType: "size" }}>
      <style href="asta-planswitcher" precedence="asta">{`
        .lab-pl-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: min(6cqw, 32px); align-items: center }
        .lab-pl-note { display: none }
        @container (min-width: 500px) { .lab-pl-note { display: block } }
        @container (max-width: 400px) { .lab-pl-row { display: none } }
        @container (aspect-ratio < 1.05) { .lab-pl-body { grid-template-columns: minmax(0, 1fr); gap: 16px } }
        @keyframes lab-pl-tick { 0% { transform: scale(.3); opacity: 0 } 55% { transform: scale(1.18); opacity: 1 } 80% { transform: scale(.94) } 100% { transform: none; opacity: 1 } }
        @keyframes lab-pl-in { from { transform: translateX(-10px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-pl-pop { 0% { transform: translateY(6px) scale(.7); opacity: 0 } 55% { transform: scale(1.07); opacity: 1 } 80% { transform: scale(.98) } 100% { transform: none; opacity: 1 } }
        .lab-pl-tick { animation: lab-pl-tick .6s ${EASE} both }
        .lab-pl-in { animation: lab-pl-in .55s ${EASE} both }
        .lab-pl-pop { animation: lab-pl-pop .6s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-pl-tick, .lab-pl-in, .lab-pl-pop { animation: none } }
      `}</style>

      <div className="lab-pl-body w-full max-w-[520px]">
        {/* Billing switch + plans */}
        <div className="flex min-w-0 flex-col gap-3">
          <button
              type="button"
              role="switch"
              aria-checked={s.yearly}
              aria-label="Bill yearly"
              onClick={() => pick(s.sel, !s.yearly)}
              className={`relative grid h-8 w-full grid-cols-2 rounded-full bg-paper-2 p-[3px] text-[11.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${RING}`}
            >
              <span
                aria-hidden
                className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-full bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.18)] transition-transform duration-500 motion-reduce:transition-none"
                style={{ transform: s.yearly ? "translateX(100%)" : "none", transitionTimingFunction: EASE }}
              />
              <span className={`relative px-2.5 leading-[22px] transition-opacity duration-300 ${s.yearly ? "text-mute" : "text-ink"}`}>Monthly</span>
              <span className={`relative px-2.5 leading-[22px] transition-opacity duration-300 ${s.yearly ? "text-ink" : "text-mute"}`}>Yearly</span>
            </button>

          <div role="radiogroup" aria-label="Plan" onKeyDown={onKey} className="relative flex flex-col">
            {/* The ring glides to the picked plan. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-[10px] bg-paper shadow-[inset_0_0_0_1.5px_var(--color-brand),0_6px_16px_-10px_rgb(0_0_0/0.5)] transition-transform duration-[650ms] motion-reduce:transition-none"
              style={{ transform: `translateY(${s.sel * 100}%)`, transitionTimingFunction: EASE }}
            />
            {PLANS.map((p, i) => (
              <button
                key={p.name}
                ref={(el) => {
                  radios.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={s.sel === i}
                tabIndex={s.sel === i ? 0 : -1}
                onClick={() => pick(i)}
                className="relative flex h-[clamp(40px,14cqh,52px)] items-center justify-between gap-3 rounded-[10px] px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={`relative h-3.5 w-3.5 shrink-0 rounded-full ${RING}`}>
                    <span
                      className="absolute inset-[3px] rounded-full bg-brand transition-[opacity,transform] duration-500 motion-reduce:transition-none"
                      style={{ opacity: s.sel === i ? 1 : 0, transform: s.sel === i ? "none" : "scale(.3)", transitionTimingFunction: EASE }}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium leading-tight text-ink">{p.name}</span>
                    <span className="lab-pl-note truncate text-[11.5px] leading-tight text-mute">{p.note}</span>
                  </span>
                </span>
                <span className="lab-pl-row shrink-0 text-[12px] tabular-nums text-ink-2">${s.yearly ? p.year : p.month}/mo</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price + feature diff */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-end gap-1.5">
            <span className="font-medium tracking-[-0.04em] text-ink" style={{ fontSize: "clamp(30px, 12cqmin, 46px)", lineHeight: 1 }} aria-live="polite">
              $<Roll value={String(price)} />
            </span>
            <span className="pb-[3px] text-[13px] text-mute">/mo</span>
          </div>
          <div className="relative mt-2 h-6">
            <span
              className="absolute left-0 top-0 text-[12px] leading-6 text-mute transition-opacity duration-300"
              style={{ opacity: s.yearly ? 0 : 1 }}
              aria-hidden={s.yearly}
            >
              Billed monthly
            </span>
            <span
              className="absolute left-0 top-0 transition-[opacity,transform] duration-500 motion-reduce:transition-none"
              style={{ opacity: s.yearly ? 1 : 0, transform: s.yearly ? "none" : "translateY(4px) scale(.92)", transitionTimingFunction: EASE }}
              aria-hidden={!s.yearly}
            >
              <span
                key={s.yearly ? "y" : "m"}
                className={`inline-flex h-6 items-center whitespace-pre rounded-full bg-brand px-2.5 text-[11.5px] font-medium text-paper ${s.yearly ? "lab-pl-pop" : ""}`}
              >
                {"You save $"}
                <Roll value={String(save)} />
                {"/yr"}
              </span>
            </span>
          </div>

          <ul className="mt-[max(10px,3.5cqh)] flex flex-col gap-[max(4px,1.4cqh)]" aria-label={`${plan.name} features`}>
            {FEATURES.map((f, i) => {
              const on = i < plan.has;
              const fresh = s.born[i] >= 0;
              return (
                <li key={f} className="flex items-center gap-2.5 text-[clamp(12px,3.6cqmin,14px)] leading-snug" aria-hidden={!on}>
                  <span className={`relative h-4 w-4 shrink-0 rounded-full ${RING}`}>
                    <span
                      className="absolute inset-0 transition-[opacity,transform] duration-500 motion-reduce:transition-none"
                      style={{ opacity: on ? 1 : 0, transform: on ? "none" : "scale(.4)", transitionTimingFunction: EASE }}
                    >
                      <span key={s.born[i]} className={`flex h-full w-full items-center justify-center rounded-full bg-brand text-paper ${fresh ? "lab-pl-tick" : ""}`}>
                        <Check />
                      </span>
                    </span>
                  </span>
                  <span className="relative min-w-0 transition-opacity duration-500" style={{ opacity: on ? 1 : 0.32 }}>
                    <span key={s.born[i]} className={`block truncate ${on ? "text-ink" : "text-mute"} ${fresh ? "lab-pl-in" : ""}`}>
                      {f}
                    </span>
                    {/* Removed features get a strike that draws across. */}
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-px w-full origin-left bg-current text-mute transition-transform duration-500 motion-reduce:transition-none"
                      style={{ transform: on ? "scaleX(0)" : "scaleX(1)", transitionTimingFunction: EASE }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
