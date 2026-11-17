"use client";

import { useRef, useState } from "react";

const CODE = [4, 0, 4];

/** Three wheels: drag, scroll, or use arrow keys. Find the code and the shackle pops. */
export default function ComboLock() {
  const [d, setD] = useState([1, 7, 2]);
  const [focus, setFocus] = useState(0);
  const drag = useRef<{ i: number; y: number; v: number } | null>(null);
  const open = d.every((v, i) => v === CODE[i]);

  const set = (i: number, v: number) => setD((cur) => cur.map((x, k) => (k === i ? ((v % 10) + 10) % 10 : x)));

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <svg viewBox="0 0 40 24" className={`h-6 w-10 transition-all duration-500 ease-[cubic-bezier(.5,1.8,.4,.8)] ${open ? "-translate-y-2 text-signal" : "text-mute"}`} fill="none" stroke="currentColor" strokeWidth="3">
        <path d={open ? "M10 24V12a10 10 0 0 1 20 0v2" : "M10 24V12a10 10 0 0 1 20 0v12"} />
      </svg>
      <div
        tabIndex={0}
        role="group"
        aria-label={`Lock, code ${d.join("")}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setFocus((f) => (f + 2) % 3);
          if (e.key === "ArrowRight") setFocus((f) => (f + 1) % 3);
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            set(focus, d[focus] + (e.key === "ArrowUp" ? 1 : -1));
          }
        }}
        className={`flex gap-1 border p-1 outline-none transition-colors ${open ? "border-signal" : "border-line focus-visible:border-ink/40"}`}
      >
        {d.map((v, i) => (
          <div
            key={i}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { i, y: e.clientY, v };
              setFocus(i);
            }}
            onPointerMove={(e) => {
              if (drag.current?.i !== i) return;
              set(i, drag.current.v + Math.round((drag.current.y - e.clientY) / 18));
            }}
            onPointerUp={() => (drag.current = null)}
            onWheel={(e) => set(i, v + Math.sign(e.deltaY))}
            className={`relative h-[108px] w-14 cursor-ns-resize select-none overflow-hidden bg-paper-2 [touch-action:none] ${focus === i ? "outline outline-1 outline-ink/20" : ""}`}
          >
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 font-mono text-[28px] leading-[36px] tabular-nums">
              {[-1, 0, 1].map((o) => (
                <div key={o} className={`text-center transition-colors ${o === 0 ? (open ? "text-signal" : "text-ink") : "text-ink/20"}`}>
                  {(((v + o) % 10) + 10) % 10}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">{open ? "Unlocked" : "Hint: page not found"}</span>
    </div>
  );
}
