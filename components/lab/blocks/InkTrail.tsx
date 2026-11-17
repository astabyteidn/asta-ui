"use client";

import { useEffect, useRef } from "react";

type P = { x: number; y: number; t: number };

/** Pointer leaves a ribbon that thins and fades out. */
export default function InkTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const css = getComputedStyle(canvas);
    const SIG = css.getPropertyValue("--color-signal").trim() || "#c5f82a";
    const ctx = canvas.getContext("2d")!;
    const pts: P[] = [];
    let raf = 0;
    let dpr = 1;
    const LIFE = 700;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    const loop = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      while (pts.length && now - pts[0].t > LIFE) pts.shift();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const life = 1 - (now - b.t) / LIFE;
        ctx.strokeStyle = SIG;
        ctx.globalAlpha = Math.max(0, life);
        ctx.lineWidth = 2 + life * 14;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pts.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas ref={ref} className="absolute inset-0 h-full w-full [touch-action:none]" />
      <span className="display pointer-events-none absolute inset-0 flex items-center justify-center text-3xl text-ink/15">draw here</span>
    </div>
  );
}
