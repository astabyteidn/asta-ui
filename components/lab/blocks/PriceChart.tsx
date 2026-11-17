"use client";

import { useEffect, useRef, useState } from "react";

const N = 64;
const UP = "var(--color-brand)";
const DOWN = "var(--color-mute)";
const EASE = "cubic-bezier(.16,1,.3,1)";

function walk(n: number, start: number) {
  const out = [start];
  let m = 0;
  for (let i = 1; i < n; i++) {
    m = m * 0.6 + (Math.random() - 0.46) * 2.6;
    out.push(out[i - 1] + m);
  }
  return out;
}

/** One digit column that rolls to its value. */
function Roll({ text }: { text: string }) {
  return (
    <span className="inline-flex tabular-nums">
      {text.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="relative inline-block h-[1em] w-[0.6em] overflow-hidden leading-none">
            <span
              className="absolute left-0 top-0 flex flex-col transition-transform duration-700 motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(ch) * 10}%)`, transitionTimingFunction: EASE }}
            >
              {"0123456789".split("").map((d) => (
                <span key={d} className="block h-[1em] leading-none">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} className="inline-block h-[1em] leading-none">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

const TICK = 1000;

/** A live price line: the series flows left at a constant speed, the head eases to each new tick, scrub for a tooltip. */
export default function PriceChart() {
  const [data, setData] = useState<number[]>(() => walk(N, 1820));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovering, setHovering] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const area = useRef<SVGPathElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const cross = useRef<SVGGElement>(null);
  const crossLine = useRef<SVGLineElement>(null);
  const crossDot = useRef<SVGCircleElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const tipText = useRef<HTMLSpanElement>(null);
  const live = useRef({
    data: [] as number[],
    next: 0,
    head: 0,
    t0: 0,
    raf: 0,
    m: 0,
    last: 0,
    lo: 0,
    hi: 1,
    hoverX: null as number | null,
    hx: 0,
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ticks: a new price arrives every second. The displayed head value is committed to the series, so nothing jumps.
  useEffect(() => {
    const L = live.current;
    L.data = data.slice(0, -1);
    L.next = data[data.length - 1];
    L.head = L.data[L.data.length - 1];
    L.lo = Math.min(...data);
    L.hi = Math.max(...data);
    L.t0 = performance.now();
    const id = setInterval(() => {
      if (document.hidden) return;
      L.m = L.m * 0.6 + (Math.random() - 0.47) * 2.6;
      const v = L.next + L.m;
      L.data = [...L.data.slice(1), L.head];
      L.next = v;
      L.t0 = performance.now();
      setData([...L.data.slice(1), L.head, v]);
    }, TICK);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = live.current;
    const { w, h } = size;
    if (!w || !h) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    L.last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(64, now - L.last);
      L.last = now;
      const k = (tau: number) => (still ? 1 : 1 - Math.exp(-dt / tau));
      // Constant-speed scroll: phase goes 0→1 linearly between ticks.
      const p = still ? 0 : Math.min(1, (now - L.t0) / TICK);
      L.head += (L.next - L.head) * k(260);
      const d = L.data;
      const pts = [...d, L.head];
      let lo = Infinity;
      let hi = -Infinity;
      for (const v of pts) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      L.lo += (lo - L.lo) * k(600);
      L.hi += (hi - L.hi) * k(600);
      const span = Math.max(1, L.hi - L.lo);
      const pad = h * 0.12;
      const right = 92;
      const dx = (w - right) / (N - 1);
      const endX = (N - 1) * dx;
      const y = (v: number) => pad + (1 - (v - L.lo) / span) * (h - pad * 2);
      const xs: number[] = [];
      let path = "";
      pts.forEach((v, i) => {
        const x = i === pts.length - 1 ? endX : (i + 1 - p) * dx;
        xs.push(x);
        path += `${i ? "L" : "M"}${x.toFixed(2)},${y(v).toFixed(2)}`;
      });
      line.current?.setAttribute("d", path);
      area.current?.setAttribute("d", `${path}L${endX.toFixed(2)},${h}L${xs[0].toFixed(2)},${h}Z`);
      if (dot.current) dot.current.style.transform = `translate3d(${endX}px, ${y(L.head)}px, 0)`;
      if (tag.current) tag.current.textContent = L.head.toFixed(2);

      // Crosshair follows the flowing line under the pointer.
      if (L.hoverX !== null) {
        L.hx += (Math.min(endX, Math.max(0, L.hoverX)) - L.hx) * k(70);
        let j = 0;
        while (j < xs.length - 2 && xs[j + 1] < L.hx) j++;
        const t = Math.max(0, Math.min(1, (L.hx - xs[j]) / Math.max(0.001, xs[j + 1] - xs[j])));
        const v = pts[j] + (pts[j + 1] - pts[j]) * t;
        crossLine.current?.setAttribute("x1", L.hx.toFixed(2));
        crossLine.current?.setAttribute("x2", L.hx.toFixed(2));
        crossDot.current?.setAttribute("cx", L.hx.toFixed(2));
        crossDot.current?.setAttribute("cy", y(v).toFixed(2));
        if (tip.current) tip.current.style.transform = `translate3d(${Math.min(Math.max(8, L.hx - 60), w - 132)}px,0,0)`;
        if (tipText.current) tipText.current.textContent = `${v.toFixed(2)}  ${Math.max(0, Math.round((endX - L.hx) / dx))}s ago`;
      }
      L.raf = requestAnimationFrame(step);
    };
    L.raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(L.raf);
  }, [size]);

  const price = data[data.length - 1];
  const open = data[0];
  const up = price >= open;
  const color = UP;
  const pill = up ? UP : DOWN;
  const pct = ((price - open) / open) * 100;
  const { w, h } = size;

  const point = (clientX: number) => {
    const L = live.current;
    const r = box.current!.getBoundingClientRect();
    const x = clientX - r.left;
    if (L.hoverX === null) L.hx = x;
    L.hoverX = x;
    setHovering(true);
  };
  const leave = () => {
    live.current.hoverX = null;
    setHovering(false);
  };
  const nudge = (dir: number) => {
    const L = live.current;
    const dx = w ? (w - 92) / (N - 1) : 0;
    const x = (L.hoverX ?? (N - 1) * dx) + dir * dx;
    if (L.hoverX === null) L.hx = x;
    L.hoverX = Math.max(0, Math.min((N - 1) * dx, x));
    setHovering(true);
  };

  return (
    <div className="relative flex h-full w-full flex-col p-5 sm:p-6">
      <div className="relative z-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">ACME / USD</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-[clamp(1.9rem,5.5vw,3rem)] font-medium leading-none tracking-[-0.04em] text-ink">
            <Roll text={price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
          </span>
          <span
            className="rounded-md px-2 py-1 font-mono text-[12px] leading-none tabular-nums transition-[color,background-color] duration-700"
            style={{ color: pill, background: `color-mix(in srgb, ${pill} 14%, transparent)`, transitionTimingFunction: EASE }}
          >
            {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
          </span>
        </div>
      </div>

      <div
        ref={box}
        className="relative -mx-5 mt-4 min-h-0 flex-1 cursor-crosshair outline-none [touch-action:pan-y] sm:-mx-6"
        tabIndex={0}
        aria-label="Price chart. Arrow keys move the crosshair."
        onPointerMove={(e) => point(e.clientX)}
        onPointerDown={(e) => point(e.clientX)}
        onPointerLeave={leave}
        onBlur={leave}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") nudge(-1);
          else if (e.key === "ArrowRight") nudge(1);
          else if (e.key === "Escape") leave();
          else return;
          e.preventDefault();
        }}
      >
        {w > 0 && (
          <svg width={w} height={h} className="absolute inset-0 overflow-hidden">
            <defs>
              <linearGradient id="pc-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity="0.18" />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path ref={area} fill="url(#pc-fill)" />
            <path ref={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            <g
              ref={cross}
              className="transition-opacity duration-300"
              style={{ opacity: hovering ? 1 : 0, transitionTimingFunction: EASE }}
            >
              <line ref={crossLine} y1={0} y2={h} stroke="var(--color-ink)" strokeOpacity="0.25" strokeDasharray="3 4" />
              <circle ref={crossDot} r="4.5" fill="var(--color-paper)" stroke={color} strokeWidth="2" />
            </g>
          </svg>
        )}

        {/* Live end dot + price tag */}
        <div ref={dot} className="pointer-events-none absolute left-0 top-0 will-change-transform" style={{ transform: "translate(-99px,-99px)" }}>
          <span className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] rounded-full" style={{ background: color }} />
          <span className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] animate-ping rounded-full opacity-60 motion-reduce:hidden" style={{ background: color }} />
          <span
            ref={tag}
            className="absolute left-3 -translate-y-1/2 rounded-[5px] px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-paper"
            style={{ background: color }}
          />
        </div>

        <div
          ref={tip}
          className="pointer-events-none absolute left-0 top-1 rounded-md bg-paper-2 px-2.5 py-1.5 font-mono text-[11px] tabular-nums text-ink shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] transition-opacity duration-300"
          style={{ opacity: hovering ? 1 : 0, transitionTimingFunction: EASE }}
        >
          <span ref={tipText} className="whitespace-pre" />
        </div>
      </div>
    </div>
  );
}
