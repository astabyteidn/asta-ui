"use client";

import { useEffect, useRef } from "react";

/** A string you can pluck: the midpoint follows the pointer, then springs back with a wobble. */
export default function ElasticString() {
  const box = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = box.current!;
    let w = el.clientWidth;
    let h = el.clientHeight;
    let cx = w / 2;
    let cy = h / 2;
    let vx = 0;
    let vy = 0;
    let target: { x: number; y: number } | null = null;
    let raf = 0;

    const draw = () => {
      const left = w * 0.12;
      const right = w * 0.88;
      path.current?.setAttribute("d", `M${left},${h / 2} Q${cx},${cy} ${right},${h / 2}`);
    };
    const loop = () => {
      const tx = target ? target.x : w / 2;
      const ty = target ? target.y : h / 2;
      vx += (tx - cx) * (target ? 0.25 : 0.12);
      vy += (ty - cy) * (target ? 0.25 : 0.12);
      vx *= target ? 0.6 : 0.86;
      vy *= target ? 0.6 : 0.86;
      cx += vx;
      cy += vy;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // Grab only when the pointer is close to the string.
      if (target || Math.abs(y - h / 2) < 40) target = { x, y: h / 2 + (y - h / 2) * 2 };
      if (Math.abs(y - h / 2) > 110) target = null;
    };
    const leave = () => {
      target = null;
    };
    const ro = new ResizeObserver(() => {
      w = el.clientWidth;
      h = el.clientHeight;
    });
    ro.observe(el);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={box} className="relative h-full w-full [touch-action:none]">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <path ref={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] absolute bottom-4 left-0 right-0 text-center text-mute">Pluck the string</span>
    </div>
  );
}
