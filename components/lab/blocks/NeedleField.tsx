"use client";

import { useEffect, useRef } from "react";

/** A field of compass needles that all turn to face the pointer; the nearest ones glow. */
export default function NeedleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const css = getComputedStyle(cv);
    const SIG = css.getPropertyValue("--color-signal").trim() || "#c5f82a";
    const ctx = cv.getContext("2d")!;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    const target = { x: 0, y: 0, active: false };
    const cur = { x: 0, y: 0 };

    const size = () => {
      const r = cv.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    };

    const draw = (t: number) => {
      if (!target.active) {
        target.x = w / 2 + Math.cos(t / 1400) * w * 0.3;
        target.y = h / 2 + Math.sin(t / 1100) * h * 0.28;
      }
      cur.x += (target.x - cur.x) * 0.15;
      cur.y += (target.y - cur.y) * 0.15;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const gap = 26;
      const cols = Math.floor(w / gap);
      const rows = Math.floor(h / gap);
      const ox = (w - (cols - 1) * gap) / 2;
      const oy = (h - (rows - 1) * gap) / 2;
      ctx.lineCap = "square";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = ox + c * gap;
          const y = oy + r * gap;
          const a = Math.atan2(cur.y - y, cur.x - x);
          const d = Math.hypot(cur.x - x, cur.y - y);
          const k = Math.max(0, 1 - d / 120);
          const len = 5 + k * 6;
          ctx.strokeStyle = k > 0.35 ? SIG : `rgba(233,233,228,${0.25 + k})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len);
          ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
          ctx.stroke();
        }
      }
      if (visible) raf = requestAnimationFrame(draw);
    };

    const move = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      target.active = true;
    };
    const leave = () => (target.active = false);

    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    });
    io.observe(cv);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full [touch-action:none]" aria-label="Needles following the pointer" />;
}
