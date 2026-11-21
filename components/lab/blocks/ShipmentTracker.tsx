"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";

/** eta = minutes left when the parcel reaches that stop. */
const STOPS = [
  { label: "Ordered", time: "09:12", eta: 4380 },
  { label: "Packed", time: "16:40", eta: 3300 },
  { label: "Shipped", time: "07:05", eta: 1980 },
  { label: "Out for delivery", time: "08:30", eta: 185 },
  { label: "Delivered", time: "11:36", eta: 0 },
];
const LAST = STOPS.length - 1;

type State = { stage: number; stamp: number; born: number[] };
const START: State = { stage: 0, stamp: 0, born: STOPS.map((_, i) => (i === 0 ? 0 : -1)) };

/** Go to a stop. Stops reached for the first time get a fresh stamp, so only their timestamps type in. */
function to(s: State, stage: number): State {
  if (s.stage === stage) return s;
  const stamp = s.stamp + 1;
  return { stage, stamp, born: s.born.map((b, i) => (i <= stage ? (i > s.stage ? stamp : b) : -1)) };
}

/** Tweens a number with an ease-out curve, so the ETA counts down instead of jumping. */
function useTween(target: number, ms: number, instant: boolean) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const from = cur.current;
    const still = instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let id = 0;
    const step = (t: number) => {
      const k = still ? 1 : Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 4);
      cur.current = from + (target - from) * e;
      setV(cur.current);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, ms, instant]);
  return v;
}

const fmt = (min: number) => {
  const m = Math.max(0, Math.round(min));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  return d > 0 ? `${d}d ${String(h).padStart(2, "0")}h` : `${h}h ${String(m % 60).padStart(2, "0")}m`;
};

/** Timestamp that types itself in, one character at a time. */
const Typed = ({ text, delay }: { text: string; delay: number }) => (
  <span aria-label={text}>
    {text.split("").map((c, i) => (
      <span key={i} aria-hidden className="lab-st-type" style={{ animationDelay: `${delay + i * 32}ms` }}>
        {c === " " ? " " : c}
      </span>
    ))}
  </span>
);

/** One focused moment: the van rides the route, pausing at each stop, until a check draws at the door. Loops until you take over. */
export default function ShipmentTracker() {
  const [s, setS] = useState<State>(START);
  const [fade, setFade] = useState(false);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stops = useRef<(HTMLButtonElement | null)[]>([]);

  const takeOver = () => {
    setPaused(true);
    setFade(false);
    setInstant(false);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  // Demo loop: one stop every 2.2s, hold on Delivered, fade out, reset unseen, fade back in.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const later = (ms: number, f: () => void) => t.push(setTimeout(() => alive && f(), ms));
    const run = () => {
      for (let i = 1; i <= LAST; i++) later(i * 2200, () => setS((v) => to(v, i)));
      const end = LAST * 2200 + 2800;
      later(end, () => setFade(true));
      later(end + 450, () => {
        setInstant(true);
        setS(START);
      });
      later(end + 520, () => setInstant(false));
      later(end + 560, () => setFade(false));
      later(end + 1100, run);
    };
    later(0, () => setS((v) => (v.stage === LAST ? START : v)));
    run();
    return () => {
      alive = false;
      t.forEach(clearTimeout);
    };
  }, [paused]);

  const go = (i: number) => {
    takeOver();
    setS((v) => to(v, i));
  };

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = Math.min(LAST, Math.max(0, s.stage + d));
    go(n);
    stops.current[n]?.focus();
  };

  const pct = s.stage / LAST;
  const done = s.stage === LAST;
  const eta = useTween(STOPS[s.stage].eta, 1100, instant);
  const move = (ms: number) => (instant ? "none" : `transform ${ms}ms ${EASE}`);

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11" style={{ containerType: "size" }}>
      <style href="asta-shipmenttracker" precedence="asta">{`
        @keyframes lab-st-type { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lab-st-swap { from { opacity: 0; transform: translateY(35%) } to { opacity: 1; transform: none } }
        @keyframes lab-st-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes lab-st-pulse { from { transform: scale(1); opacity: .5 } to { transform: scale(2.1); opacity: 0 } }
        .lab-st-type { display: inline-block; animation: lab-st-type .12s linear both }
        .lab-st-swap { animation: lab-st-swap .5s ${EASE} both }
        .lab-st-draw { stroke-dasharray: 1; animation: lab-st-draw .5s ${EASE} .75s both }
        .lab-st-pulse { animation: lab-st-pulse 1.2s ${EASE} .7s both }
        @media (prefers-reduced-motion: reduce) { .lab-st-type, .lab-st-swap, .lab-st-draw, .lab-st-pulse { animation: none } }
      `}</style>

      <div
        className="flex w-full max-w-[520px] flex-col gap-[max(12px,5cqh)]"
        style={{ opacity: fade ? 0 : 1, transition: `opacity .45s ${EASE}` }}
      >
        {/* Status + ETA */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-mute">Order · NW-48213</span>
            <div className="relative mt-1.5 h-[1.25em] overflow-hidden text-[clamp(17px,5.6cqmin,24px)] font-medium tracking-[-0.025em] text-ink" aria-live="polite">
              <span key={s.stage} className="lab-st-swap block truncate">
                {STOPS[s.stage].label}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-mute">{done ? "Signed by" : "Arrives in"}</div>
            <div className="relative mt-1.5 h-[1.25em] text-[clamp(15px,4.6cqmin,19px)] font-medium tabular-nums tracking-[-0.02em] text-ink">
              <span className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300" style={{ opacity: done ? 0 : 1 }}>
                {fmt(eta)}
              </span>
              <span className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-500" style={{ opacity: done ? 1 : 0 }}>
                Front desk
              </span>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="px-[9%] pt-[36px]">
          <div role="group" aria-label="Delivery progress" onKeyDown={onKey} className="relative h-[3px]">
            <div className="absolute inset-0 rounded-[2px] bg-ink/10" />
            <div
              className="absolute inset-0 origin-left rounded-[2px] bg-brand"
              style={{ transform: `scaleX(${pct})`, transition: move(1100) }}
            />

            {STOPS.map((st, i) => {
              const reached = i <= s.stage;
              return (
                <button
                  key={st.label}
                  ref={(el) => {
                    stops.current[i] = el;
                  }}
                  type="button"
                  onClick={() => go(i)}
                  tabIndex={i === s.stage ? 0 : -1}
                  aria-current={i === s.stage ? "step" : undefined}
                  aria-label={`${st.label}, ${i < s.stage ? `done, ${st.time}` : reached ? st.time : "not yet"}`}
                  className="group absolute top-1/2 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                  style={{ left: `${(i / LAST) * 100}%` }}
                >
                  <span className={`relative h-2.5 w-2.5 rounded-full bg-paper-2 ${RING} transition-transform duration-300 group-hover:scale-125`}>
                    <span
                      className="absolute inset-0 rounded-full bg-brand"
                      style={{
                        opacity: reached ? 1 : 0,
                        transform: reached ? "none" : "scale(.2)",
                        transition: instant ? "none" : `opacity .4s ${EASE} ${reached ? ".6s" : "0s"}, transform .5s ${EASE} ${reached ? ".6s" : "0s"}`,
                      }}
                    />
                  </span>
                </button>
              );
            })}

            {/* The van rides a full-width layer, so translateX(%) maps straight onto the route. */}
            <div className="pointer-events-none absolute inset-x-0 top-0" style={{ transform: `translateX(${pct * 100}%)`, transition: move(1100) }}>
              <div className="absolute bottom-[8px] left-0 h-[27px] w-[27px] -translate-x-1/2">
                {done && <span key={`p${s.stamp}`} className="lab-st-pulse absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 2px var(--color-brand)" }} />}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-brand text-paper shadow-[0_6px_14px_-6px_rgb(0_0_0/0.6)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="absolute h-[15px] w-[15px] transition-[opacity,transform] duration-500"
                    style={{ opacity: done ? 0 : 1, transform: done ? "scale(.5)" : "none", transitionDelay: done ? ".55s" : "0s" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M2.5 6.5h11v9h-11ZM13.5 9.5h4l3 3v3h-7" />
                    <circle cx="6.5" cy="17.5" r="1.6" />
                    <circle cx="16.5" cy="17.5" r="1.6" />
                  </svg>
                  {done && (
                    <svg key={`c${s.stamp}`} viewBox="0 0 24 24" className="absolute h-[14px] w-[14px]" fill="none" aria-hidden>
                      <path className="lab-st-draw" pathLength={1} d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="absolute left-1/2 top-full h-[6px] w-px -translate-x-1/2 bg-brand" />
              </div>
            </div>
          </div>

          {/* Labels + typed timestamps */}
          <div className="relative mt-3 h-[3.4em] text-[clamp(10.5px,3.1cqmin,12.5px)] leading-tight">
            {STOPS.map((st, i) => {
              const reached = i <= s.stage;
              return (
                <div
                  key={st.label}
                  className="absolute top-0 w-[26%] -translate-x-1/2 text-center"
                  style={{ left: `${(i / LAST) * 100}%` }}
                >
                  <div className={`transition-colors duration-500 ${reached ? "text-ink" : "text-mute"}`}>{st.label}</div>
                  <div className="mt-0.5 font-mono text-[0.88em] tabular-nums text-mute transition-opacity duration-300" style={{ opacity: reached ? 1 : 0 }}>
                    <Typed key={s.born[i]} text={st.time} delay={i === 0 && s.born[i] === 0 ? 200 : 650} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parcel */}
        <div className="flex items-center gap-3">
          <span className={`flex h-[clamp(34px,11cqmin,42px)] w-[clamp(34px,11cqmin,42px)] shrink-0 items-center justify-center rounded-[9px] bg-paper text-ink-2 ${RING}`}>
            <svg viewBox="0 0 24 24" className="h-[48%] w-[48%]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3 4 7v10l8 4 8-4V7ZM4 7l8 4 8-4M12 11v10M8 5l8 4" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-ink">Pour-over set · 2 items</div>
            <div className="truncate text-[12px] text-mute">Parcelnorth · 14 Harbor St</div>
          </div>
          <span className="hidden shrink-0 font-mono text-[10.5px] uppercase tracking-wider text-mute @min-[380px]:inline">Click a stop</span>
        </div>
      </div>
    </div>
  );
}
