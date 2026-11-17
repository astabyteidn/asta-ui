"use client";

import { useState } from "react";

const COLS = 7;
const ROWS = 4;

/** Pop every bubble — press, or drag across to pop a whole row. */
export default function BubbleWrap() {
  const [popped, setPopped] = useState<boolean[]>(() => Array(COLS * ROWS).fill(false));
  const left = popped.filter((p) => !p).length;

  const pop = (i: number) => {
    if (popped[i]) return;
    navigator.vibrate?.(6);
    setPopped((p) => p.map((v, k) => (k === i ? true : v)));
  };

  const fromPoint = (e: React.PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const i = el?.dataset.bubble;
    if (i !== undefined) pop(Number(i));
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4">
      <div
        onPointerDown={(e) => {
          e.currentTarget.releasePointerCapture?.(e.pointerId);
          fromPoint(e);
        }}
        onPointerMove={(e) => e.buttons && fromPoint(e)}
        className="grid select-none gap-2 [touch-action:none]"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {popped.map((p, i) => (
          <span
            key={i}
            data-bubble={i}
            className={`h-8 w-8 rounded-full transition-all duration-200 ease-[cubic-bezier(.5,1.8,.4,.8)] sm:h-9 sm:w-9 ${
              p ? "scale-[.82] border border-dashed border-line bg-transparent" : "cursor-pointer bg-paper-2 shadow-[inset_-3px_-4px_8px_rgba(0,0,0,.45),inset_3px_3px_6px_rgba(233,233,228,.12)] hover:scale-105"
            }`}
          />
        ))}
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.08em] flex items-center gap-3 text-mute">
        <span className="tabular-nums">{left} left</span>
        <span>·</span>
        <button type="button" onClick={() => setPopped(Array(COLS * ROWS).fill(false))} className={left === 0 ? "text-signal" : "hover:text-ink"}>
          Refill
        </button>
      </div>
    </div>
  );
}
