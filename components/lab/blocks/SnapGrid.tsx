"use client";

import { useRef, useState } from "react";

const CELL = 44;

/** Drag the block anywhere; on release it springs to the nearest cell. The grid only shows while you drag. */
export default function SnapGrid() {
  const [pos, setPos] = useState({ x: CELL * 2, y: CELL * 1 });
  const [dragging, setDragging] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const off = useRef({ x: 0, y: 0 });

  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    off.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setDragging(true);
  };
  const move = (e: React.PointerEvent) => {
    if (!dragging) return;
    const r = area.current!.getBoundingClientRect();
    setPos({
      x: Math.max(0, Math.min(r.width - CELL, e.clientX - off.current.x)),
      y: Math.max(0, Math.min(r.height - CELL, e.clientY - off.current.y)),
    });
  };
  const up = () => {
    if (!dragging) return;
    setDragging(false);
    const r = area.current!.getBoundingClientRect();
    const maxX = Math.floor(r.width / CELL) - 1;
    const maxY = Math.floor(r.height / CELL) - 1;
    setPos((p) => ({
      x: Math.min(maxX, Math.round(p.x / CELL)) * CELL,
      y: Math.min(maxY, Math.round(p.y / CELL)) * CELL,
    }));
    navigator.vibrate?.(8);
  };

  const cx = Math.round(pos.x / CELL);
  const cy = Math.round(pos.y / CELL);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-5">
      <div
        ref={area}
        className="relative h-[176px] w-[264px] border border-line"
        style={{
          backgroundImage: "linear-gradient(rgba(233,233,228,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(233,233,228,.08) 1px, transparent 1px)",
          backgroundSize: `${CELL}px ${CELL}px`,
          backgroundPosition: "-1px -1px",
          backgroundColor: "transparent",
          transition: "opacity .3s",
        }}
      >
        <div className={`pointer-events-none absolute inset-0 bg-paper transition-opacity duration-300 ${dragging ? "opacity-0" : "opacity-100"}`} />
        <div
          className="pointer-events-none absolute left-0 top-0 border border-dashed border-signal/60 transition-[transform,opacity] duration-150"
          style={{ width: CELL, height: CELL, transform: `translate(${cx * CELL}px, ${cy * CELL}px)`, opacity: dragging ? 1 : 0 }}
        />
        <div
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className={`absolute grid cursor-grab place-items-center bg-signal text-paper [touch-action:none] active:cursor-grabbing ${dragging ? "scale-110 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-signal)_25%,transparent)]" : "transition-[left,top,transform] duration-500 ease-[cubic-bezier(.5,1.8,.4,.8)]"}`}
          style={{ left: pos.x, top: pos.y, width: CELL, height: CELL }}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.08em]">AB</span>
        </div>
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] tabular-nums text-mute">
        X {String(cx).padStart(2, "0")} · Y {String(cy).padStart(2, "0")}
      </span>
    </div>
  );
}
