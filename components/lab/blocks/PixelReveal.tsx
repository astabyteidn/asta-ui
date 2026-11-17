"use client";

import { useEffect, useRef } from "react";

const PX = 12;

/** A wall of pixels hides a message. Rub it away with the pointer; it slowly grows back. */
export default function PixelReveal() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let cells = new Float32Array(0); // 1 = covered, 0 = cleared
    let idle = new Float32Array(0); // ms since cleared
    let raf = 0;
    let last = performance.now();
    let visible = true;

    const size = () => {
      const r = cv.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cols = Math.ceil(w / PX);
      rows = Math.ceil(h / PX);
      cells = new Float32Array(cols * rows).fill(1);
      idle = new Float32Array(cols * rows);
    };

    const draw = (t: number) => {
      const dt = t - last;
      last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < cells.length; i++) {
        if (cells[i] < 1) {
          idle[i] += dt;
          if (idle[i] > 1800) cells[i] = Math.min(1, cells[i] + dt / 900);
        }
        const v = cells[i];
        if (v <= 0.02) continue;
        const x = (i % cols) * PX;
        const y = Math.floor(i / cols) * PX;
        const s = PX * v;
        const shade = 20 + ((i * 7919) % 9);
        ctx.fillStyle = `rgb(${shade} ${shade + 1} ${shade - 1})`;
        ctx.fillRect(x + (PX - s) / 2, y + (PX - s) / 2, s, s);
      }
      if (visible) raf = requestAnimationFrame(draw);
    };

    const move = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const R = 34;
      for (let y = Math.max(0, Math.floor((py - R) / PX)); y <= Math.min(rows - 1, Math.floor((py + R) / PX)); y++) {
        for (let x = Math.max(0, Math.floor((px - R) / PX)); x <= Math.min(cols - 1, Math.floor((px + R) / PX)); x++) {
          const d = Math.hypot(x * PX + PX / 2 - px, y * PX + PX / 2 - py);
          if (d < R) {
            const i = y * cols + x;
            cells[i] = Math.min(cells[i], d / R - 0.3 < 0 ? 0 : (d / R) * 0.6);
            idle[i] = 0;
          }
        }
      }
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      last = performance.now();
      if (visible) raf = requestAnimationFrame(draw);
    });
    io.observe(cv);
    cv.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cv.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <p className="font-medium leading-[0.92] tracking-[-0.05em] text-[clamp(2rem,4.2vw,3.2rem)] text-signal">
          Made by
          <br />
          hand.
        </p>
      </div>
      <canvas ref={ref} className="absolute inset-0 h-full w-full [touch-action:none]" aria-label="Rub to reveal" />
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] pointer-events-none absolute bottom-3 left-4 text-mute">Rub to reveal</span>
    </div>
  );
}
