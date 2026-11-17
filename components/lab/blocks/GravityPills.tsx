"use client";

import { useEffect, useRef } from "react";

const WORDS = ["motion", "type", "rust", "grid", "lab", "brand", "spring", "ui", "craft", "pixels"];
type Body = { x: number; y: number; vx: number; vy: number; r: number; word: string; hot: boolean };

/** Words as physical discs: they fall, pile up, and can be grabbed and thrown. */
export default function GravityPills() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const css = getComputedStyle(cv);
    const SIG = css.getPropertyValue("--color-signal").trim() || "#c5f82a";
    const ON = css.getPropertyValue("--color-on-signal").trim() || "#0a0b0a";
    const ctx = cv.getContext("2d")!;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let bodies: Body[] = [];
    let grab: { b: Body; ox: number; oy: number; px: number; py: number } | null = null;

    const reset = () => {
      bodies = WORDS.map((word, i) => ({
        x: w * (0.2 + ((i * 0.37) % 0.6)),
        y: -40 - i * 45,
        vx: 0,
        vy: 0,
        r: Math.max(22, Math.min(w * 0.09, 14 + word.length * 4.2)),
        word,
        hot: i === 4,
      }));
    };

    const size = () => {
      const r = cv.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      if (!bodies.length) reset();
    };

    const step = () => {
      for (const b of bodies) {
        if (grab?.b === b) continue;
        b.vy += 0.45;
        b.vx *= 0.995;
        b.x += b.vx;
        b.y += b.vy;
        if (b.y > h - b.r) {
          b.y = h - b.r;
          b.vy *= -0.35;
          b.vx *= 0.9;
        }
        if (b.x < b.r) {
          b.x = b.r;
          b.vx *= -0.5;
        }
        if (b.x > w - b.r) {
          b.x = w - b.r;
          b.vx *= -0.5;
        }
      }
      for (let k = 0; k < 3; k++) {
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i];
            const b = bodies[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy) || 0.01;
            const min = a.r + b.r;
            if (d < min) {
              const push = (min - d) / 2;
              const nx = dx / d;
              const ny = dy / d;
              const ag = grab?.b === a;
              const bg = grab?.b === b;
              if (!ag) {
                a.x -= nx * push * (bg ? 2 : 1);
                a.y -= ny * push * (bg ? 2 : 1);
              }
              if (!bg) {
                b.x += nx * push * (ag ? 2 : 1);
                b.y += ny * push * (ag ? 2 : 1);
              }
              const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (rv < 0) {
                const imp = -rv * 0.6;
                if (!ag) {
                  a.vx -= imp * nx;
                  a.vy -= imp * ny;
                }
                if (!bg) {
                  b.vx += imp * nx;
                  b.vy += imp * ny;
                }
              }
            }
          }
        }
      }
    };

    const draw = () => {
      step();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const b of bodies) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.hot ? SIG : grab?.b === b ? "#e9e9e4" : "#141513";
        ctx.fill();
        ctx.strokeStyle = b.hot ? SIG : "rgba(233,233,228,.22)";
        ctx.stroke();
        ctx.fillStyle = b.hot || grab?.b === b ? ON : "#e9e9e4";
        ctx.font = `500 ${Math.round(b.r * 0.42)}px ui-sans-serif, system-ui`;
        ctx.fillText(b.word, b.x, b.y + 1);
      }
      raf = requestAnimationFrame(draw);
    };

    const pos = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      const p = pos(e);
      const b = [...bodies].reverse().find((b) => Math.hypot(b.x - p.x, b.y - p.y) < b.r);
      if (!b) return;
      cv.setPointerCapture(e.pointerId);
      grab = { b, ox: b.x - p.x, oy: b.y - p.y, px: p.x, py: p.y };
    };
    const move = (e: PointerEvent) => {
      if (!grab) return;
      const p = pos(e);
      grab.b.vx = p.x - grab.px;
      grab.b.vy = p.y - grab.py;
      grab.b.x = Math.max(grab.b.r, Math.min(w - grab.b.r, p.x + grab.ox));
      grab.b.y = Math.max(grab.b.r, Math.min(h - grab.b.r, p.y + grab.oy));
      grab.px = p.x;
      grab.py = p.y;
    };
    const up = () => {
      grab = null;
    };
    const dbl = () => reset();

    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    raf = requestAnimationFrame(draw);
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("dblclick", dbl);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      cv.removeEventListener("pointercancel", up);
      cv.removeEventListener("dblclick", dbl);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas ref={ref} className="absolute inset-0 h-full w-full cursor-grab [touch-action:none] active:cursor-grabbing" aria-label="Throwable words" />
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] pointer-events-none absolute left-4 top-3 text-mute">Grab &amp; throw · double-click to drop again</span>
    </div>
  );
}
