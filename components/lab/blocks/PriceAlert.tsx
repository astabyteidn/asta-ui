"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const TARGET = 2450;
const OPEN = 2391.2;
const LO = 2350;
const HI = 2490;
const WINDOW = 16;
// The price path: drifts, dips, then climbs through the alert.
const PATH = [
  2381.4, 2388.2, 2379.6, 2385.1, 2392.8, 2387.3, 2396.5, 2391.2, 2399.8, 2405.6, 2398.1, 2410.4, 2404.9, 2416.2, 2421.7, 2414.3,
  2426.8, 2419.5, 2431.2, 2437.9, 2429.6, 2441.3, 2446.8, 2439.2, 2448.1, 2457.1, 2463.4, 2458.9, 2466.2,
];
const FIRST = WINDOW;

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Digits that roll to the new value instead of jumping. */
function Roll({ value, instant }: { value: string; instant: boolean }) {
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
              className="absolute left-0 top-0 flex flex-col motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(c) * 1.1}em)`, transition: instant ? "none" : `transform .6s ${EASE} ${(chars.length - i) * 18}ms` }}
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

const Bell = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1H3zM6.5 14h3" />
  </svg>
);

/** The price walks toward an alert line, crosses it, and the alert drops in while the bell rings. Hover to pause. */
export default function PriceAlert() {
  const [n, setN] = useState(FIRST);
  const [fade, setFade] = useState(false);
  const [instant, setInstant] = useState(false);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const k = useRef(FIRST);
  const paused = hover || !visible;

  // Rest while off screen or in a hidden tab.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = true;
    const sync = () => setVisible(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const t: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const later = (ms: number, f: () => void) => t.push(setTimeout(() => alive && f(), ms));
    const cycle = () => {
      if (k.current >= PATH.length) {
        setFade(true);
        later(450, () => {
          k.current = FIRST;
          setInstant(true);
          setN(FIRST);
        });
        later(560, () => setInstant(false));
        later(620, () => setFade(false));
        later(1300, cycle);
        return;
      }
      setN(++k.current);
      const crossed = PATH[k.current - 1] >= TARGET && PATH[k.current - 2] < TARGET;
      later(crossed ? 2600 : k.current === PATH.length ? 2400 : 750, cycle);
    };
    later(800, cycle);
    return () => {
      alive = false;
      t.forEach(clearTimeout);
      setFade(false);
    };
  }, [paused]);

  const pts = PATH.slice(0, n);
  const price = pts[pts.length - 1];
  const change = ((price - OPEN) / OPEN) * 100;
  const hitAt = PATH.findIndex((v) => v >= TARGET);
  const hit = n > hitAt;

  const W = 300;
  const H = 120;
  const step = W / (WINDOW - 1);
  const y = (v: number) => H - ((v - LO) / (HI - LO)) * H;
  const xy = (i: number) => `${(i * step).toFixed(1)} ${y(pts[i]).toFixed(1)}`;
  const last = pts.length - 1;
  const line = pts.slice(0, -1).map((_, i) => `${i ? "L" : "M"}${xy(i)}`).join(" ");
  const tail = `M${xy(last - 1)} L${xy(last)}`;
  const area = `${pts.map((_, i) => `${i ? "L" : "M"}${xy(i)}`).join(" ")} L${(last * step).toFixed(1)} ${H} L0 ${H} Z`;
  const shift = (pts.length - WINDOW) * step;
  const ty = (y(TARGET) / H) * 100;
  const toggle = () => setHover((h) => !h);

  return (
    <div
      ref={root}
      role="group"
      tabIndex={0}
      aria-label={`ASTA ${money(price)}. Alert at ${money(TARGET)}${hit ? " triggered" : ""}. ${hover ? "Paused" : "Live"}. Press space to ${hover ? "resume" : "pause"}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      onPointerUp={(e) => e.pointerType !== "mouse" && toggle()}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      style={{ containerType: "size" }}
    >
      <style href="asta-pricealert" precedence="asta">{`
        @keyframes lab-pa-drop { from { transform: translateY(-130%) scale(.96); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-pa-ring { 0%, 100% { transform: rotate(0) } 15% { transform: rotate(18deg) } 30% { transform: rotate(-16deg) } 45% { transform: rotate(12deg) } 60% { transform: rotate(-8deg) } 75% { transform: rotate(4deg) } }
        @keyframes lab-pa-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes lab-pa-pulse { from { transform: scale(1); opacity: .5 } to { transform: scale(3); opacity: 0 } }
        .lab-pa-drop { animation: lab-pa-drop .6s ${EASE} both }
        .lab-pa-ring { transform-origin: 50% 15%; animation: lab-pa-ring .9s ${EASE} .2s both }
        .lab-pa-draw { stroke-dasharray: 1; animation: lab-pa-draw .55s ${EASE} both }
        .lab-pa-pulse { transform-box: fill-box; transform-origin: center; animation: lab-pa-pulse 1.4s ${EASE} infinite }
        @media (prefers-reduced-motion: reduce) { .lab-pa-drop, .lab-pa-ring, .lab-pa-draw, .lab-pa-pulse { animation: none } }
      `}</style>

      <div
        className={`relative flex w-full max-w-[460px] flex-col gap-[max(8px,2.6cqh)] rounded-[14px] bg-paper p-[clamp(12px,3.8cqmin,16px)] ${RING} shadow-[0_18px_40px_-28px_rgb(0_0_0/0.35)]`}
        style={{ opacity: fade ? 0 : 1, transition: `opacity .45s ${EASE}` }}
      >
        {/* Alert toast */}
        <div className="pointer-events-none absolute inset-x-[clamp(12px,3.8cqmin,16px)] top-[clamp(12px,3.8cqmin,16px)] z-10" aria-live="assertive">
          {hit && (
            <div className="lab-pa-drop flex items-center gap-2.5 rounded-[11px] bg-ink px-3 py-2.5 text-paper shadow-[0_14px_30px_-14px_rgb(0_0_0/0.6)]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand">
                <Bell className="lab-pa-ring h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[12.5px] font-medium">ASTA crossed {money(TARGET)}</span>
                <span className="block truncate text-[11.5px] opacity-70">Your price alert · just now</span>
              </span>
              <span className="shrink-0 text-[12.5px] font-medium tabular-nums">{money(PATH[hitAt])}</span>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-mute">
              <span className="font-semibold text-ink">ASTA</span> · Astabyte Inc.
            </p>
            <p className="mt-1 font-medium tracking-[-0.035em] text-ink" style={{ fontSize: "clamp(22px, 8cqmin, 32px)", lineHeight: 1 }}>
              <Roll value={money(price)} instant={instant} />
            </p>
            <p className={`mt-1 text-[12px] tabular-nums ${change >= 0 ? "text-brand" : "text-mute"}`}>
              <span aria-hidden>{change >= 0 ? "▲" : "▼"}</span>
              <span className="sr-only">{change >= 0 ? "Up" : "Down"}</span> {Math.abs(change).toFixed(2)}% today
            </p>
          </div>
          <span className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium ${hit ? "bg-brand text-paper" : "bg-paper-2 text-ink-2"}`} style={{ transition: `background-color .4s ${EASE}, color .4s ${EASE}` }}>
            <span key={hit ? "on" : "off"} className={`flex ${hit ? "lab-pa-ring" : ""}`}>
              <Bell className="h-3.5 w-3.5" />
            </span>
            {hit ? "Triggered" : `Above ${money(TARGET).replace(".00", "")}`}
          </span>
        </div>

        <div className="relative h-[clamp(90px,34cqh,150px)]">
          <span aria-hidden className="absolute inset-x-0 border-t border-dashed border-[color-mix(in_srgb,var(--color-ink)_35%,transparent)]" style={{ top: `${ty}%` }} />
          <span aria-hidden className="absolute left-0 -translate-y-full pb-1 font-mono text-[10px] text-mute" style={{ top: `${ty}%` }}>
            Alert {money(TARGET).replace(".00", "")}
          </span>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-hidden" fill="none" aria-hidden>
            <defs>
              <linearGradient id="lab-pa-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--color-brand)" stopOpacity="0.2" />
                <stop offset="1" stopColor="var(--color-brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g style={{ transform: `translateX(${-shift}px)`, transition: instant ? "none" : `transform .7s ${EASE}` }}>
              <path d={area} fill="url(#lab-pa-area)" />
              <path d={line} stroke="var(--color-brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path key={`t${last}`} d={tail} pathLength={1} stroke="var(--color-brand)" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" className={instant ? "" : "lab-pa-draw"} />
            </g>
          </svg>
          {/* The live dot sits outside the stretched svg so it stays round. */}
          <span aria-hidden className="absolute right-0 h-2 w-2 -translate-y-1/2 translate-x-1/2" style={{ top: `${(y(price) / H) * 100}%`, transition: instant ? "none" : `top .7s ${EASE}` /* perf-ok */ }}>
            <span className="lab-pa-pulse absolute inset-0 rounded-full bg-brand" />
            <span className="absolute inset-0 rounded-full bg-brand ring-2 ring-paper" />
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-mute">
          <span>10:30</span>
          <span>11:00</span>
          <span>11:30</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
