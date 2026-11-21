"use client";

import { useEffect, useRef, useState } from "react";
import { usePaused, useReducedMotion } from "@/components/blog/DemoFrame";
import { Button } from "@/components/kit/button";
import { LANES_CSS } from "./code";

const inOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

/** Two dots, same motion. One is a CSS animation, one is a rAF loop. Block the main thread and compare. */
export function SmoothLanes() {
  const paused = usePaused();
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const gapOut = useRef<HTMLSpanElement>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef(0);

  // Lane 2: the JS-driven dot. Runs only while the demo is on screen and motion is allowed.
  useEffect(() => {
    if (paused || reduced) return;
    let id = 0;
    let last = 0;
    let worst = 0;
    const loop = (now: number) => {
      if (last) {
        const gap = now - last;
        if (gap > worst + 1) {
          worst = gap;
          if (gapOut.current) gapOut.current.textContent = `${Math.round(worst)}ms`;
        }
      }
      last = now;
      const t = (now % 3200) / 1600;
      const p = t < 1 ? t : 2 - t;
      dot.current?.style.setProperty("--p", String(inOut(p)));
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [paused, reduced]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const block = () => {
    setBusy(true);
    // Let the "busy" label paint first, then hold the main thread for 1000ms.
    timer.current = window.setTimeout(() => {
      const end = performance.now() + 1000;
      while (performance.now() < end) {
        /* busy */
      }
      setBusy(false);
    }, 60);
  };

  return (
    <div className="smooth-lanes flex h-full flex-col justify-center gap-5 px-5 py-7 sm:px-8">
      <style href="asta-blog-smooth-lanes" precedence="asta">
        {LANES_CSS}
      </style>
      {[
        { cls: "css", name: "CSS animation · transform", note: "compositor" },
        { cls: "js", name: "requestAnimationFrame loop", note: "main thread" },
      ].map((l, i) => (
        <div key={l.cls} className={l.cls}>
          <div className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[12px]">
            <span className={i === 0 ? "text-brand" : "text-ink"}>{l.name}</span>
            <span className="text-mute">{l.note}</span>
          </div>
          <div className="track rounded-[9px] bg-paper-2 p-1.5">
            <div ref={i === 1 ? dot : undefined} className={`dot h-7 w-7 rounded-[7px] ${i === 0 ? "bg-brand" : "bg-ink"}`} />
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button size="sm" variant={busy ? "soft" : "solid"} onClick={block} disabled={busy}>
          {busy ? "Main thread busy…" : "Block main thread for 1s"}
        </Button>
        <span className="font-mono text-[12px] text-mute">
          Longest JS frame gap <span ref={gapOut} className="tabular-nums text-ink">–</span>
        </span>
      </div>
    </div>
  );
}

const ROWS = ["Invoices", "Customers", "Payouts", "Disputes", "Reports", "Team", "Billing", "API keys"];

/** A live card inside a scroll box. Its loop runs only while the card is visible. */
export function SmoothPause() {
  const paused = usePaused();
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const framesOut = useRef<HTMLSpanElement>(null);
  const [running, setRunning] = useState(false);
  const frames = useRef(0);

  useEffect(() => {
    if (!card.current || !box.current) return;
    let id = 0;
    let inView = false;
    const draw = () => {
      frames.current += 1;
      if (framesOut.current) framesOut.current.textContent = frames.current.toLocaleString("en-US");
      if (bar.current && !reduced) bar.current.style.transform = `scaleX(${(frames.current % 120) / 120})`;
    };
    const run = () => {
      if (id || !inView || document.hidden || paused) return;
      const tick = () => {
        draw();
        id = requestAnimationFrame(tick);
      };
      id = requestAnimationFrame(tick);
      setRunning(true);
    };
    const stop = () => {
      cancelAnimationFrame(id);
      id = 0;
      setRunning(false);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        if (inView) run();
        else stop();
      },
      { root: box.current },
    );
    const onVis = () => (document.hidden ? stop() : run());
    io.observe(card.current);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [paused, reduced]);

  return (
    <div className="grid h-full gap-5 p-5 sm:grid-cols-[1fr_12rem] sm:p-8">
      <div ref={box} className="h-[236px] overflow-y-auto overscroll-contain rounded-[12px] bg-paper p-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent)]">
        {ROWS.map((r) => (
          <div key={r} className="flex h-11 items-center justify-between rounded-[8px] px-3 text-[14px] text-ink-2">
            {r}
            <span className="text-mute">›</span>
          </div>
        ))}
        <div ref={card} className="mt-2 rounded-[10px] bg-paper-2 p-4">
          <p className="text-[13px] text-mute">Live sync</p>
          <p className="mt-1 text-[15px] font-medium text-ink">Importing Astabyte orders</p>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-ink/10">
            <span ref={bar} className="block h-full origin-left rounded-full bg-brand" style={{ transform: "scaleX(0)" }} />
          </span>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-3 font-mono text-[12px]">
        <p className="text-mute">Scroll the list down to the card, then back up.</p>
        <p className="flex items-center gap-2 text-ink">
          <span className={`h-2 w-2 rounded-full ${running ? "bg-brand" : "bg-ink/25"}`} />
          {running ? "Loop running" : "Loop paused"}
        </p>
        <p className="text-mute">
          Frames run <span ref={framesOut} className="tabular-nums text-ink">0</span>
        </p>
      </div>
    </div>
  );
}
