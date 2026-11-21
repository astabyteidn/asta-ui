"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { useReplay } from "@/components/blog/DemoFrame";
import { Button } from "@/components/kit/button";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Slider } from "@/components/kit/slider";
import { FLUID_CSS, WRAP_CSS } from "./code";

const MIN_W = 360;
const MAX_W = 1280;
/** The size clamp(min, base + slope·w, max) gives at width w. */
const at = (minPx: number, maxPx: number, w: number) => Math.min(maxPx, Math.max(minPx, minPx + ((maxPx - minPx) * (w - MIN_W)) / (MAX_W - MIN_W)));
const px = (v: number) => `${+v.toFixed(1)}px`;

/** Width of an element, kept in sync with a ResizeObserver. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** A page section whose type and padding follow the width of its box. */
export function FluidPage() {
  const [width, setWidth] = useState(720);
  const [sweep, setSweep] = useState<number | null>(null);
  const [stage, avail] = useWidth<HTMLDivElement>();
  const n = useReplay();
  // Replay jumps through 360, 820 and 1280, then back to your width. No transition on width.
  useEffect(() => {
    if (!n) return;
    const ids = [MIN_W, 820, MAX_W, null].map((w, i) => setTimeout(() => setSweep(w), i * 800));
    return () => ids.forEach(clearTimeout);
  }, [n]);

  const w = sweep ?? width;
  const scale = avail ? Math.min(1, avail / w) : 1;
  const state = w <= MIN_W ? "at the minimum" : w >= MAX_W ? "at the maximum" : "fluid";
  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-8">
      <style href="asta-blog-fluid-page" precedence="asta">
        {FLUID_CSS}
      </style>
      <div>
        <div className="flex justify-between font-mono text-[12px] text-mute">
          <span id="fl-width">Box width</span>
          <span className="tabular-nums text-ink">{w}px</span>
        </div>
        <Slider aria-labelledby="fl-width" value={width} onValueChange={setWidth} min={320} max={1440} step={10} format={(v) => `${v}px`} />
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] tabular-nums text-mute">
        <span>
          body <span className="text-ink">{px(at(16, 20, w))}</span>
        </span>
        <span>
          heading <span className="text-ink">{px(at(28, 48, w))}</span>
        </span>
        <span>
          padding <span className="text-ink">{px(at(16, 40, w))}</span>
        </span>
        <span className={state === "fluid" ? "text-brand" : "text-ink"}>{state}</span>
      </p>
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        <div className="fluid-page origin-top-left rounded-[10px] bg-paper-2 text-ink" style={{ width: w, transform: `scale(${scale})` }}>
          <div className="inner">
            <span className="label text-brand">Astabyte Studio</span>
            <h3 className="mt-3 font-medium tracking-[-0.03em]">Design systems that ship with the product</h3>
            <p className="mt-3 max-w-[60ch] text-mute">
              We build the components, the docs and the motion together. Your team gets one kit that works on day one and still fits a year later.
            </p>
            <Button size="sm" className="mt-5">
              Book a call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Wrap = "normal" | "balance" | "pretty";
const WRAPS: Wrap[] = ["normal", "balance", "pretty"];
const subscribe = () => () => {};

function Copy({ wrap, width, label }: { wrap: Wrap; width: number; label: string }) {
  return (
    <div className="wrap-demo min-w-0" style={{ "--wrap": wrap } as CSSProperties}>
      <p className="mb-2 font-mono text-[12px] text-mute">{label}</p>
      <div className="max-w-full rounded-[10px] bg-paper-2 p-4" style={{ width }}>
        <h3 className="text-[21px] font-medium leading-[1.15] tracking-[-0.02em] text-ink">A design system your whole team will want to use</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-mute">
          Astabyte builds the components, the docs and the motion together, so the product feels like one thing from the first screen to the last.
        </p>
      </div>
    </div>
  );
}

/** text-wrap: normal next to balance or pretty, at a width you pick. */
export function WrapDemo() {
  useReplay(); // Nothing to replay: claiming it keeps your settings.
  const [wrap, setWrap] = useState<Wrap>("balance");
  const [width, setWidth] = useState(230);
  const supported = useSyncExternalStore(
    subscribe,
    () => wrap === "normal" || CSS.supports("text-wrap", wrap),
    () => true,
  );
  return (
    <div className="flex h-full flex-col gap-5 p-5 sm:p-8">
      <style href="asta-blog-fluid-wrap" precedence="asta">
        {WRAP_CSS}
      </style>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SegmentedControl size="sm" label="text-wrap" value={wrap} onChange={(v) => setWrap(v as Wrap)} segments={WRAPS.map((v) => ({ value: v, label: v }))} />
        <div className="sm:w-56">
          <div className="flex justify-between font-mono text-[12px] text-mute">
            <span id="fl-wrap-width">Width</span>
            <span className="tabular-nums text-ink">{width}px</span>
          </div>
          <Slider aria-labelledby="fl-wrap-width" value={width} onValueChange={setWidth} min={200} max={340} step={5} format={(v) => `${v}px`} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Copy wrap="normal" width={width} label="text-wrap: normal" />
        <Copy wrap={wrap} width={width} label={`text-wrap: ${wrap}`} />
      </div>
      {!supported && <p className="text-[13px] text-mute">This browser doesn’t support {wrap} yet, so it falls back to normal.</p>}
    </div>
  );
}

const rem = (v: number) => +(v / 16).toFixed(3);

/** Turn a min and max size into a clamp(), step by step. */
export function ClampMath() {
  useReplay(); // Nothing to replay: claiming it keeps your settings.
  const [lo, setLo] = useState(16);
  const [hiRaw, setHi] = useState(20);
  const hi = Math.max(lo, hiRaw);
  const slope = (hi - lo) / (MAX_W - MIN_W);
  const base = lo - slope * MIN_W;
  const value = `clamp(${rem(lo)}rem, ${rem(base)}rem + ${+(slope * 100).toFixed(3)}vw, ${rem(hi)}rem)`;
  return (
    <div className="grid h-full gap-6 p-5 sm:grid-cols-[1fr_1.15fr] sm:p-8">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex justify-between font-mono text-[12px] text-mute">
            <span id="fl-lo">Size at 360px</span>
            <span className="tabular-nums text-ink">{lo}px</span>
          </div>
          <Slider aria-labelledby="fl-lo" value={lo} onValueChange={setLo} min={12} max={40} format={(v) => `${v}px`} />
        </div>
        <div>
          <div className="flex justify-between font-mono text-[12px] text-mute">
            <span id="fl-hi">Size at 1280px</span>
            <span className="tabular-nums text-ink">{hi}px</span>
          </div>
          <Slider aria-labelledby="fl-hi" value={hiRaw} onValueChange={setHi} min={12} max={72} format={(v) => `${v}px`} />
        </div>
        <ol className="flex flex-col gap-1.5 font-mono text-[12px] leading-relaxed text-mute">
          <li>
            slope = ({hi} − {lo}) ÷ (1280 − 360) = <span className="text-ink">{+slope.toFixed(5)}</span>
          </li>
          <li>
            middle = <span className="text-ink">{+(slope * 100).toFixed(3)}vw</span>
          </li>
          <li>
            base = {lo} − {+slope.toFixed(5)} × 360 = <span className="text-ink">{+base.toFixed(2)}px</span>
          </li>
        </ol>
        <p className="break-all rounded-[8px] bg-paper-2 px-3 py-2.5 font-mono text-[12px] text-brand">{value}</p>
      </div>
      <div className="grid grid-cols-3 items-end gap-3">
        {[MIN_W, 820, MAX_W].map((w) => {
          const size = at(lo, hi, w);
          return (
            <div key={w} className="flex min-w-0 flex-col items-start gap-2 rounded-[10px] bg-paper-2 p-3">
              <span className="font-medium leading-none tracking-[-0.03em] text-ink" style={{ fontSize: size }}>
                Aa
              </span>
              <span className="font-mono text-[11px] tabular-nums text-mute">
                {w}px wide
                <br />
                <span className="text-ink">{px(size)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
