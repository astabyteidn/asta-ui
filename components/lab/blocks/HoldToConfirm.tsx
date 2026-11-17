"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 1400;
const TICKS = 24;

/**
 * Destructive actions ask for commitment. Hold (pointer, Space or Enter) to fill: the label flips colour
 * exactly at the fill edge, a ruler of ticks lights up, and the button trembles harder near the end.
 * Let go early and it drains away.
 */
export default function HoldToConfirm() {
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(0);
  const raf = useRef(0);
  const holding = useRef(false);
  const progress = useRef(0);

  const loop = (dir: 1 | -1) => {
    let last = performance.now();
    const step = (t: number) => {
      const dt = t - last;
      last = t;
      progress.current = Math.max(0, Math.min(1, progress.current + (dir === 1 ? dt / DURATION : -dt / 380)));
      setP(progress.current);
      setShake(dir === 1 ? Math.sin(t / 22) * progress.current ** 2 * 1.8 : 0);
      if (dir === 1 && progress.current >= 1) {
        holding.current = false;
        setDone(true);
        setShake(0);
        navigator.vibrate?.(24);
        setTimeout(() => {
          setDone(false);
          progress.current = 0;
          setP(0);
        }, 1800);
        return;
      }
      if (dir === -1 && progress.current <= 0) return;
      raf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
  };

  const press = () => {
    if (done || holding.current) return;
    holding.current = true;
    loop(1);
  };
  const release = () => {
    if (!holding.current) return;
    holding.current = false;
    loop(-1);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const label = (
    <>
      {done ? (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" className="animate-[hold-draw_.5s_cubic-bezier(.16,1,.3,1)_both]" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
        </svg>
      )}
      {done ? "Deleted" : p > 0.02 ? "Keep holding" : "Hold to delete"}
    </>
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      <style>{`@keyframes hold-draw { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }`}</style>
      <button
        type="button"
        onPointerDown={press}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            press();
          }
        }}
        onKeyUp={(e) => (e.key === " " || e.key === "Enter") && release()}
        onBlur={release}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={done ? "Deleted" : "Hold to delete"}
        className="relative h-[60px] w-60 select-none overflow-hidden bg-paper-2 text-[15px] font-medium tracking-[-0.01em] text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] outline-none [touch-action:none] focus-visible:shadow-[inset_0_0_0_2px_var(--color-signal)]"
        style={{ transform: `translateX(${shake}px) scale(${1 - p * 0.04})` }}
      >
        <span className="absolute inset-0 flex items-center justify-center gap-2.5">{label}</span>
        {/* Same label in the fill colour, clipped to the fill: the colour change sits exactly on the edge. */}
        <span
          aria-hidden
          className={`absolute inset-0 flex items-center justify-center gap-2.5 bg-signal text-on-signal ${done ? "animate-[hold-flash_.6s_ease-out]" : ""}`}
          style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}
        >
          {label}
        </span>
        <style>{`@keyframes hold-flash { 0% { filter: brightness(1.6) } 100% { filter: none } }`}</style>
      </button>
      <div className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: TICKS }, (_, i) => {
          const lit = p * TICKS > i;
          return (
            <span
              key={i}
              className="w-[3px] transition-[height,background-color] duration-150"
              style={{ height: lit ? (i % 6 === 5 ? 14 : 10) : i % 6 === 5 ? 10 : 6, background: lit ? "var(--color-signal)" : "color-mix(in srgb, var(--color-ink) 18%, transparent)" }}
            />
          );
        })}
      </div>
    </div>
  );
}
