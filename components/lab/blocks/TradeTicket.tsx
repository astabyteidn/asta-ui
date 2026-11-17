"use client";

import { useEffect, useRef, useState } from "react";

const UP = "var(--color-brand)";
const DOWN = "var(--color-ink)";
const EASE = "cubic-bezier(.16,1,.3,1)";
const PRICE = 1842.5;
const BALANCE = { buy: 4600, sell: 2.4 }; // USD to spend / ACME to sell
const DETENTS = [0, 25, 50, 75, 100];

type Side = "buy" | "sell";
type Phase = "idle" | "sending" | "done";

/** Buy or sell: one slider, one big number, one button. Plays a short demo until you touch it. */
export default function TradeTicket() {
  const [side, setSide] = useState<Side>("buy");
  const [pct, setPct] = useState(40);
  const [glide, setGlide] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const touched = useRef(false);
  const track = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // The value on screen chases `pct` with a frame-rate independent ease, so the thumb, fill and number move together.
  const [shown, setShown] = useState(40);
  const target = useRef({ pct: 40, glide: true });
  useEffect(() => {
    target.current = { pct, glide };
  }, [pct, glide]);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let v = target.current.pct;
    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const t = target.current;
      if (still || !t.glide) v = t.pct;
      else v += (t.pct - v) * (1 - Math.exp(-dt / 160));
      if (Math.abs(t.pct - v) < 0.02) v = t.pct;
      setShown((o) => (o === v ? o : v));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const amount = side === "buy" ? ((BALANCE.buy * shown) / 100) / PRICE : (BALANCE.sell * shown) / 100;
  const usd = amount * PRICE;
  const color = side === "buy" ? UP : DOWN;

  const submit = () => {
    if (phase !== "idle" || pct === 0) return;
    setPhase("sending");
    timers.current.push(setTimeout(() => setPhase("done"), 900));
    timers.current.push(setTimeout(() => setPhase("idle"), 2400));
  };

  // Demo loop: glide to a value, place the order, sometimes flip side. Stops for good once touched.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let n = 0;
    const T = timers.current;
    const loop = () => {
      if (touched.current) return;
      n++;
      if (n % 3 === 0) setSide((s) => (s === "buy" ? "sell" : "buy"));
      setGlide(true);
      setPct(DETENTS[1 + Math.floor(Math.random() * 4)]);
      T.push(setTimeout(() => !touched.current && setPhase("sending"), 1300));
      T.push(setTimeout(() => !touched.current && setPhase("done"), 2200));
      T.push(setTimeout(() => !touched.current && setPhase("idle"), 3600));
      T.push(setTimeout(loop, 4400));
    };
    T.push(setTimeout(loop, 900));
    return () => T.forEach(clearTimeout);
  }, []);

  const stopDemo = () => {
    if (touched.current) return;
    touched.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("idle");
  };

  const fromX = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    let v = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const near = DETENTS.find((d) => Math.abs(d - v) < 3);
    if (near !== undefined) v = near;
    setPct(Math.round(v));
  };

  return (
    <div className="flex h-full w-full items-center justify-center px-6 pb-6 pt-14">
      <div className="flex w-full max-w-[340px] flex-col gap-[clamp(14px,4vh,26px)]">
        {/* Side toggle */}
        <div className="relative grid grid-cols-2 rounded-[10px] bg-paper-2 p-1 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[7px] transition-[transform,background-color] duration-500 motion-reduce:transition-none"
            style={{ transform: side === "sell" ? "translateX(100%)" : "none", background: color, transitionTimingFunction: EASE }}
          />
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => {
                stopDemo();
                setSide(s);
              }}
              className={`relative z-10 h-9 rounded-[7px] text-[14px] font-medium capitalize outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-signal/60 ${side === s ? "text-paper" : "text-mute hover:text-ink"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Big amount */}
        <div className="text-center">
          <div className="text-[clamp(2.2rem,7vw,3.4rem)] font-medium leading-none tracking-[-0.045em] text-ink tabular-nums">
            {amount.toFixed(3)}
            <span className="ml-2 text-[0.42em] font-normal tracking-normal text-mute">ACME</span>
          </div>
          <p className="mt-2 font-mono text-[12px] tabular-nums text-mute">≈ ${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        {/* Slider */}
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label="Order size"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct}% of balance`}
          className="group relative h-8 cursor-pointer outline-none [touch-action:none]"
          onPointerDown={(e) => {
            stopDemo();
            setGlide(false);
            e.currentTarget.setPointerCapture(e.pointerId);
            fromX(e.clientX);
          }}
          onPointerMove={(e) => e.buttons && fromX(e.clientX)}
          onPointerUp={() => setGlide(true)}
          onKeyDown={(e) => {
            const i = DETENTS.findIndex((d) => d >= pct);
            if (e.key === "ArrowRight" || e.key === "ArrowUp") setPct(DETENTS[Math.min(4, DETENTS[i] === pct ? i + 1 : i)]);
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPct(DETENTS[Math.max(0, i - 1)]);
            else return;
            e.preventDefault();
            stopDemo();
            setGlide(true);
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]" />
          <div
            className="absolute inset-x-0 top-1/2 h-1.5 origin-left rounded-full"
            style={{ transform: `translateY(-50%) scaleX(${shown / 100})`, background: color, transition: `background-color .5s ${EASE}` }}
          />
          {DETENTS.map((d) => (
            <span
              key={d}
              aria-hidden
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors duration-300"
              style={{ left: `${d}%`, borderColor: d <= shown + 0.5 ? color : "color-mix(in srgb, var(--color-ink) 18%, transparent)", background: "var(--color-paper)" }}
            />
          ))}
          <span
            aria-hidden
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink shadow-[0_2px_8px_rgb(0_0_0/0.45)] ring-4 ring-transparent transition-shadow group-focus-visible:ring-signal/40"
            style={{ left: `${shown}%` }}
          />
          <span className="absolute -bottom-4 right-0 font-mono text-[11px] tabular-nums text-mute">{Math.round(shown)}%</span>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={() => {
            stopDemo();
            submit();
          }}
          disabled={pct === 0}
          className="relative mt-2 flex h-12 items-center justify-center overflow-hidden rounded-[10px] text-[15px] font-medium text-paper outline-none transition-[background-color,transform,opacity] duration-300 active:scale-[0.98] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-signal/60"
          style={{ background: color }}
        >
          <span className={`absolute flex items-center gap-2 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${phase === "idle" ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}>
            <span className="capitalize">{side}</span> ACME
          </span>
          <span className={`absolute transition-[transform,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${phase === "sending" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
            <svg viewBox="0 0 16 16" className="h-5 w-5 animate-spin" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
              <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className={`absolute flex items-center gap-2 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${phase === "done" ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
            Filled {amount.toFixed(3)}
          </span>
        </button>
      </div>
    </div>
  );
}
