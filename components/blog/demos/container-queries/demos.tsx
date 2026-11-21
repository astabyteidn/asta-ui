"use client";

import { useEffect, useRef, useState } from "react";
import { useReplay } from "@/components/blog/DemoFrame";
import { Button } from "@/components/kit/button";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Slider } from "@/components/kit/slider";
import { CARD_CSS, CHIPS_CSS, UNITS_CSS } from "./code";

/** Width of an element, kept in sync with a ResizeObserver. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Replay jumps through a few widths, then back to the slider value. No transition on width. */
function useSweep(steps: number[]) {
  const [sweep, setSweep] = useState<number | null>(null);
  const n = useReplay();
  const list = useRef(steps);
  useEffect(() => {
    if (!n) return;
    const ids = [...list.current, null].map((w, i) => setTimeout(() => setSweep(w), i * 800));
    return () => ids.forEach(clearTimeout);
  }, [n]);
  return sweep;
}

const layoutOf = (w: number) => (w >= 560 ? "wide" : w >= 360 ? "row" : "compact");

function ProductCard() {
  return (
    <article className="cq-card rounded-[12px] bg-paper p-3 text-ink shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- demo copy of a kit card, which ships a plain img tag */}
      <img src="/lab/headphones.jpg" alt="Astabyte Studio headphones" width={720} height={720} draggable={false} className="media w-full rounded-[8px] object-cover" />
      <div className="flex min-w-0 flex-col gap-2.5">
        <div>
          <p className="text-[15px] font-medium leading-snug">Studio Headphones</p>
          <p className="mt-0.5 text-[13px] text-mute">Astabyte Audio · 4.8 from 212 reviews</p>
        </div>
        <p className="desc text-[13px] leading-relaxed text-mute">Closed back, 40mm drivers and 30 hours on one charge.</p>
        <ul className="specs flex-wrap gap-1.5">
          {["Wireless", "30h battery", "USB-C"].map((s) => (
            <li key={s} className="rounded-[6px] bg-paper-2 px-2 py-1 text-[12px] text-mute">
              {s}
            </li>
          ))}
        </ul>
        <div className="buy flex flex-col gap-2">
          <span className="text-[17px] font-medium tabular-nums">$249</span>
          <Button size="sm">Add to cart</Button>
        </div>
      </div>
    </article>
  );
}

/** One card, one slider. The card picks its layout from the width of its slot. */
export function CardBreakpoints() {
  const [width, setWidth] = useState(420);
  const sweep = useSweep([280, 420, 640]);
  const [stage, avail] = useWidth<HTMLDivElement>();
  const w = sweep ?? width;
  const scale = avail ? Math.min(1, avail / w) : 1;
  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-8">
      <style href="asta-blog-cq-card" precedence="asta">
        {CARD_CSS + "\n" + CHIPS_CSS}
      </style>
      <div>
        <div className="flex justify-between font-mono text-[12px] text-mute">
          <span id="cq-width">Slot width</span>
          <span className="tabular-nums text-ink">
            {w}px · {layoutOf(w)}
          </span>
        </div>
        <Slider aria-labelledby="cq-width" value={width} onValueChange={setWidth} min={240} max={720} step={10} format={(v) => `${v}px`} />
      </div>
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        <div className="cq-slot origin-top-left rounded-[12px] bg-paper-2 p-0" style={{ width: w, transform: `scale(${scale})` }}>
          <p className="cq-chips flex gap-3 px-3 pb-2 pt-3 font-mono text-[12px] text-mute">
            <span className="compact">compact</span>
            <span className="row">≥ 360 row</span>
            <span className="wide">≥ 560 wide</span>
          </p>
          <div className="p-3 pt-0">
            <ProductCard />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The same card in a narrow sidebar and a wide main area, side by side. */
export function CardSlots() {
  const [side, setSide] = useState<"shown" | "hidden">("shown");
  const [aside, asideW] = useWidth<HTMLElement>();
  const [main, mainW] = useWidth<HTMLElement>();
  const [flip, setFlip] = useState(false);
  const n = useReplay();
  // Replay flips the sidebar for a moment, then returns to your choice.
  useEffect(() => {
    if (!n) return;
    const ids = [setTimeout(() => setFlip(true), 0), setTimeout(() => setFlip(false), 1200)];
    return () => ids.forEach(clearTimeout);
  }, [n]);
  const open = (side === "shown") !== flip;
  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-8">
      <style href="asta-blog-cq-card" precedence="asta">
        {CARD_CSS + "\n" + CHIPS_CSS}
      </style>
      <SegmentedControl
        size="sm"
        label="Sidebar"
        value={side}
        onChange={(v) => setSide(v as typeof side)}
        segments={[
          { value: "shown", label: "Sidebar shown" },
          { value: "hidden", label: "Sidebar hidden" },
        ]}
        className="self-start"
      />
      <div className={`grid items-start gap-4 ${open ? "sm:grid-cols-[220px_1fr]" : ""}`}>
        <aside ref={aside} hidden={!open} className="cq-slot min-w-0">
          <p className="mb-2 font-mono text-[12px] text-mute">
            Sidebar · {asideW}px · <span className="text-ink">{layoutOf(asideW)}</span>
          </p>
          <ProductCard />
        </aside>
        <section ref={main} className="cq-slot min-w-0">
          <p className="mb-2 font-mono text-[12px] text-mute">
            Main · {mainW}px · <span className="text-ink">{layoutOf(mainW)}</span>
          </p>
          <ProductCard />
        </section>
      </div>
    </div>
  );
}

const clampPx = (lo: number, v: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** A stat card whose padding and type are sized in container units. */
export function StatUnits() {
  const [width, setWidth] = useState(360);
  const sweep = useSweep([200, 360, 600]);
  const [stage, avail] = useWidth<HTMLDivElement>();
  const w = sweep ?? width;
  const scale = avail ? Math.min(1, avail / w) : 1;
  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-8">
      <style href="asta-blog-cq-units" precedence="asta">
        {UNITS_CSS}
      </style>
      <div>
        <div className="flex justify-between font-mono text-[12px] text-mute">
          <span id="cq-units-width">Container width</span>
          <span className="tabular-nums text-ink">{w}px</span>
        </div>
        <Slider aria-labelledby="cq-units-width" value={width} onValueChange={setWidth} min={200} max={640} step={10} format={(v) => `${v}px`} />
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] tabular-nums text-mute">
        <span>
          padding <span className="text-ink">{+clampPx(12, w * 0.06, 32).toFixed(1)}px</span>
        </span>
        <span>
          value <span className="text-ink">{+clampPx(24, w * 0.11, 56).toFixed(1)}px</span>
        </span>
        <span>
          label <span className="text-ink">{+clampPx(12, w * 0.032, 16).toFixed(1)}px</span>
        </span>
      </p>
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        <div className="cq-stats origin-top-left" style={{ width: w, transform: `scale(${scale})` }}>
          <div className="cq-stat bg-paper-2 text-ink">
            <p className="label text-mute">Revenue this month</p>
            <p className="value mt-3 font-medium tabular-nums tracking-[-0.03em]">$48,210</p>
            <p className="label mt-3">
              <span className="text-brand">+12.4%</span> <span className="text-mute">vs October</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
