"use client";

import { useRef, useState } from "react";

const TICKS = 31;
const MIN_A = -135;
const MAX_A = 135;

/** A rotary control: drag around it, scroll, or use arrow keys. Detents every 10. */
export default function DialKnob() {
  const [v, setV] = useState(35);
  const knob = useRef<HTMLDivElement>(null);
  const last = useRef(35);

  const set = (n: number) => {
    const c = Math.max(0, Math.min(100, Math.round(n)));
    if (Math.floor(c / 10) !== Math.floor(last.current / 10)) navigator.vibrate?.(5);
    last.current = c;
    setV(c);
  };

  const fromPointer = (e: React.PointerEvent) => {
    const r = knob.current!.getBoundingClientRect();
    let a = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    a = Math.max(MIN_A, Math.min(MAX_A, a));
    set(((a - MIN_A) / (MAX_A - MIN_A)) * 100);
  };

  const angle = MIN_A + (v / 100) * (MAX_A - MIN_A);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <div className="relative h-44 w-44">
        {Array.from({ length: TICKS }, (_, i) => {
          const a = MIN_A + (i / (TICKS - 1)) * (MAX_A - MIN_A);
          const on = (i / (TICKS - 1)) * 100 <= v;
          return (
            <span
              key={i}
              className={`absolute left-1/2 top-0 h-full w-px origin-center transition-colors duration-150`}
              style={{ transform: `translateX(-50%) rotate(${a}deg)` }}
            >
              <span className={`block w-px ${i % 5 === 0 ? "h-3" : "h-2"} ${on ? "bg-signal" : "bg-line"}`} />
            </span>
          );
        })}
        <div
          ref={knob}
          role="slider"
          tabIndex={0}
          aria-label="Gain"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={v}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            fromPointer(e);
          }}
          onPointerMove={(e) => e.buttons && fromPointer(e)}
          onWheel={(e) => set(v - Math.sign(e.deltaY) * 3)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowRight") set(v + 2);
            if (e.key === "ArrowDown" || e.key === "ArrowLeft") set(v - 2);
          }}
          className="absolute inset-6 cursor-grab rounded-full border border-line bg-paper-2 outline-none [touch-action:none] focus-visible:border-signal active:cursor-grabbing"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span className="absolute left-1/2 top-2.5 h-5 w-[3px] -translate-x-1/2 bg-signal" />
        </div>
        <span className="label pointer-events-none absolute inset-0 grid place-items-center tabular-nums text-ink">{String(v).padStart(3, "0")}</span>
      </div>
      <span className="label text-mute">Turn it · scroll · arrows</span>
    </div>
  );
}
