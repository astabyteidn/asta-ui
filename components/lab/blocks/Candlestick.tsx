"use client";

import { useEffect, useRef, useState } from "react";

type C = { o: number; h: number; l: number; c: number };
const BUF = 64;
const NEW_EVERY = 3000;

function seed(): C[] {
  const out: C[] = [];
  let p = 1716;
  for (let i = 0; i < BUF; i++) {
    const o = p;
    const c = o + (Math.random() - 0.47) * 3.2;
    out.push({ o, c, h: Math.max(o, c) + Math.random() * 1.1, l: Math.min(o, c) - Math.random() * 1.1 });
    p = c;
  }
  return out;
}

/** Candles only: the live one grows, a new one opens every few seconds and the series slides left. */
export default function Candlestick() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [ohlc, setOhlc] = useState<C | null>(null);
  const S = useRef({ data: seed(), born: 0, lo: 0, hi: 0, hx: -1, hy: -1, raf: 0, last: 0, prev: 0, target: 0, onScreen: true });

  useEffect(() => {
    const cv = canvas.current!;
    const el = wrap.current!;
    const st = S.current;
    const ctx = cv.getContext("2d")!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let colors = { ink: "#e9e9e4", mute: "#888", paper: "#111", accent: "#e9e9e4" };

    const resize = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cs = getComputedStyle(el);
      colors = { ink: cs.getPropertyValue("--color-ink").trim() || colors.ink, mute: cs.getPropertyValue("--color-mute").trim() || colors.mute, paper: cs.getPropertyValue("--color-paper").trim() || colors.paper, accent: cs.getPropertyValue("--color-brand").trim() || colors.accent };
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => (st.onScreen = e.isIntersecting));
    io.observe(el);
    resize();
    st.born = performance.now();

    const draw = (now: number) => {
      st.raf = requestAnimationFrame(draw);
      if (!st.onScreen || document.hidden || !w) return;
      const d = st.data;

      const dt = Math.min(64, now - (st.prev || now));
      st.prev = now;
      const ease = (tau: number) => (still ? 1 : 1 - Math.exp(-dt / tau));

      // The live candle drifts towards a target that moves every ~400ms, so the close glides instead of stepping.
      const live = d[d.length - 1];
      if (!st.target) st.target = live.c;
      if (now - st.last > 400) {
        st.last = now;
        st.target += (Math.random() - 0.485) * 1.1;
      }
      live.c += (st.target - live.c) * ease(220);
      live.h = Math.max(live.h, live.c);
      live.l = Math.min(live.l, live.c);
      if (now - st.born > NEW_EVERY) {
        d.push({ o: live.c, c: live.c, h: live.c, l: live.c });
        st.target = live.c;
        if (d.length > BUF) d.shift();
        st.born = now;
      }

      const padL = 18;
      const tagW = 62;
      const top = 58;
      const bottom = 22;
      const plotW = w - padL - tagW;
      const n = Math.max(24, Math.min(40, Math.round(plotW / 15)));
      const cw = plotW / n;
      // Slide: a newly opened candle eases in from the right.
      const k = still ? 1 : Math.min(1, (now - st.born) / 800);
      // easeOutExpo-ish, matching cubic-bezier(.16,1,.3,1)
      const slide = Math.pow(1 - k, 4) * cw;
      const vis = d.slice(-(n + 1));

      let lo = Infinity;
      let hi = -Infinity;
      for (const c of vis) {
        lo = Math.min(lo, c.l);
        hi = Math.max(hi, c.h);
      }
      if (!st.hi) {
        st.lo = lo;
        st.hi = hi;
      }
      st.lo += (lo - st.lo) * ease(500);
      st.hi += (hi - st.hi) * ease(500);
      const span = Math.max(1, st.hi - st.lo);
      const y = (v: number) => top + (1 - (v - st.lo) / span) * (h - top - bottom);

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, padL + plotW, h);
      ctx.clip();
      vis.forEach((c, i) => {
        const cx = padL + plotW - cw / 2 + slide - (vis.length - 1 - i) * cw;
        const up = c.c >= c.o;
        ctx.fillStyle = ctx.strokeStyle = up ? colors.accent : colors.ink;
        ctx.globalAlpha = up ? (i === vis.length - 1 ? 1 : 0.9) : 0.55;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.round(cx) + 0.5, y(c.h));
        ctx.lineTo(Math.round(cx) + 0.5, y(c.l));
        ctx.stroke();
        const bw = Math.max(2, cw * 0.62);
        const yt = y(Math.max(c.o, c.c));
        const yb = y(Math.min(c.o, c.c));
        ctx.beginPath();
        if (up) {
          ctx.roundRect(cx - bw / 2, yt, bw, Math.max(1.5, yb - yt), Math.min(2, bw / 4));
          ctx.fill();
        } else {
          // Down candles are hollow: a crisp outline, the wick stops at the body.
          ctx.fillStyle = colors.paper;
          ctx.globalAlpha = 1;
          ctx.fillRect(cx - bw / 2, yt, bw, Math.max(1.5, yb - yt));
          ctx.globalAlpha = 0.55;
          ctx.strokeRect(Math.round(cx - bw / 2) + 0.5, Math.round(yt) + 0.5, Math.max(1, Math.round(bw) - 1), Math.max(1, Math.round(yb - yt)));
        }
      });
      ctx.restore();
      ctx.globalAlpha = 1;

      // Last price line + tag
      const cur = d[d.length - 1];
      const ly = y(cur.c);
      const col = colors.accent;
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, Math.round(ly) + 0.5);
      ctx.lineTo(w - tagW + 4, Math.round(ly) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(w - tagW + 6, ly - 10, tagW - 14, 20, 5);
      ctx.fill();
      ctx.fillStyle = colors.paper;
      ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cur.c.toFixed(2), w - tagW + 6 + (tagW - 14) / 2, ly + 0.5);

      // Crosshair
      if (st.hx >= 0) {
        ctx.strokeStyle = colors.ink;
        ctx.globalAlpha = 0.28;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(Math.round(st.hx) + 0.5, top - 8);
        ctx.lineTo(Math.round(st.hx) + 0.5, h - 8);
        ctx.moveTo(padL, Math.round(st.hy) + 0.5);
        ctx.lineTo(padL + plotW, Math.round(st.hy) + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        const i = vis.length - 1 - Math.round((padL + plotW - cw / 2 + slide - st.hx) / cw);
        const c = vis[Math.max(0, Math.min(vis.length - 1, i))];
        if (c) setOhlc((o) => (o === c ? o : c));
      }
    };
    st.raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(st.raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const move = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    S.current.hx = e.clientX - r.left;
    S.current.hy = e.clientY - r.top;
  };
  const f = (v: number) => v.toFixed(2);

  return (
    <div className="relative h-full w-full">
      <div
        ref={wrap}
        className="absolute inset-0 cursor-crosshair [touch-action:pan-y]"
        onPointerMove={move}
        onPointerDown={move}
        onPointerLeave={() => {
          S.current.hx = -1;
          setOhlc(null);
        }}
      >
        <canvas ref={canvas} className="block" aria-label="Live candlestick chart for ACME / USD" role="img" />
      </div>
      <div className="pointer-events-none absolute left-5 top-5 font-mono text-[11px] tabular-nums sm:left-6">
        {ohlc ? (
          <span className="text-mute">
            O <span className="text-ink">{f(ohlc.o)}</span> H <span className="text-ink">{f(ohlc.h)}</span> L <span className="text-ink">{f(ohlc.l)}</span> C{" "}
            <span style={{ color: ohlc.c >= ohlc.o ? "var(--color-brand)" : "var(--color-ink-2)" }}>{f(ohlc.c)}</span>
          </span>
        ) : (
          <span className="uppercase tracking-[0.12em] text-mute">ACME / USD · 1m</span>
        )}
      </div>
    </div>
  );
}
