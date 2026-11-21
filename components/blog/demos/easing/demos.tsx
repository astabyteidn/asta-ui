"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useReplay } from "@/components/blog/DemoFrame";
import { Button } from "@/components/kit/button";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Slider } from "@/components/kit/slider";
import { MENU_CSS, RACE_CSS } from "./code";

const LANES = [
  { cls: "out", name: "ease-out", value: "cubic-bezier(.16, 1, .3, 1)" },
  { cls: "in-out", name: "ease-in-out", value: "cubic-bezier(.65, 0, .35, 1)" },
  { cls: "linear", name: "linear", value: "linear" },
];

/** Three dots, one distance, one duration. Only the curve differs. */
export function EasingRace() {
  return (
    <div className="ease-race flex h-full flex-col justify-center gap-5 px-5 py-8 sm:px-8">
      <style href="asta-blog-ease-race" precedence="asta">
        {RACE_CSS}
      </style>
      {LANES.map((l, i) => (
        <div key={l.cls} className={l.cls}>
          <div className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[12px]">
            <span className={i === 0 ? "text-brand" : "text-ink"}>{l.name}</span>
            <span className="truncate text-mute">{l.value}</span>
          </div>
          <div className="track rounded-[9px] bg-paper-2 p-1.5">
            <div className={`dot h-7 w-7 rounded-[7px] ${i === 0 ? "bg-brand" : "bg-ink"}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

const EASE = {
  "ease-out": "cubic-bezier(.16, 1, .3, 1)",
  "ease-in-out": "cubic-bezier(.65, 0, .35, 1)",
  "ease-in": "cubic-bezier(.7, 0, .84, 0)",
  linear: "linear",
} as const;
type Curve = keyof typeof EASE;
const ITEMS = ["Newest first", "Price, low to high", "Price, high to low", "Most popular"];

/** The same menu, four curves. Open it a few times with each. */
export function EasingMenu() {
  const [curve, setCurve] = useState<Curve>("ease-in");
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(0);
  const n = useReplay();
  // Replay: close, then open again two frames later so the entrance plays.
  useEffect(() => {
    if (!n) return;
    let id = requestAnimationFrame(() => {
      setOpen(false);
      id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setOpen(true))));
    });
    return () => cancelAnimationFrame(id);
  }, [n]);
  return (
    <div className="ease-menu flex h-full flex-col gap-6 p-5 sm:p-8" style={{ "--ease": EASE[curve] } as CSSProperties}>
      <style href="asta-blog-ease-menu" precedence="asta">
        {MENU_CSS}
      </style>
      <SegmentedControl
        size="sm"
        label="Curve"
        value={curve}
        onChange={(v) => setCurve(v as Curve)}
        segments={(Object.keys(EASE) as Curve[]).map((k) => ({ value: k, label: k }))}
        className="self-start"
      />
      <div className="relative">
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Sort: {ITEMS[pick]}
        </Button>
        <div className="panel absolute left-0 top-10 z-10 w-56 rounded-[10px] bg-paper p-1 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_12px_28px_-14px_rgb(0_0_0/0.25)]" data-open={open}>
          {ITEMS.map((it, i) => (
            <button
              key={it}
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setPick(i);
                setOpen(false);
              }}
              className={`flex h-9 w-full items-center rounded-[7px] px-3 text-left text-[14px] hover:bg-paper-2 ${i === pick ? "text-brand" : "text-ink"}`}
            >
              {it}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (time: number) => {
    let lo = 0;
    let hi = 1;
    let t = time;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (at(x1, x2, t) < time) lo = t;
      else hi = t;
    }
    return at(y1, y2, t);
  };
}

const PRESETS: Record<string, [number, number, number, number]> = {
  "Astabyte ease-out": [0.16, 1, 0.3, 1],
  "CSS ease": [0.25, 0.1, 0.25, 1],
  "ease-in-out": [0.65, 0, 0.35, 1],
  "ease-in": [0.7, 0, 0.84, 0],
};

/** Read a curve by its numbers: how far along is it at each quarter of the time? */
export function EasingNumbers() {
  const [p, setP] = useState<[number, number, number, number]>(PRESETS["Astabyte ease-out"]);
  const f = useMemo(() => bezier(...p), [p]);
  const rows = [0.1, 0.25, 0.5, 0.75];
  const set = (i: number, v: number) => setP((q) => q.map((x, j) => (j === i ? v : x)) as typeof p);
  return (
    <div className="grid h-full gap-8 p-5 sm:grid-cols-[1fr_1.1fr] sm:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PRESETS).map(([k, v]) => (
            <Button key={k} size="xs" variant={v.join() === p.join() ? "solid" : "soft"} onClick={() => setP(v)}>
              {k}
            </Button>
          ))}
        </div>
        <p className="font-mono text-[13px] text-ink">
          cubic-bezier({p.map((x) => +x.toFixed(2)).join(", ")})
        </p>
        {(["x1", "y1", "x2", "y2"] as const).map((k, i) => (
          <div key={k}>
            <div className="flex justify-between font-mono text-[12px] text-mute">
              <span id={`bz-${k}`}>{k}</span>
              <span className="tabular-nums">{p[i].toFixed(2)}</span>
            </div>
            <Slider aria-labelledby={`bz-${k}`} value={Math.round(p[i] * 100)} onValueChange={(v) => set(i, v / 100)} min={i % 2 ? -50 : 0} max={i % 2 ? 150 : 100} format={(v) => (v / 100).toFixed(2)} />
          </div>
        ))}
      </div>
      <div className="flex flex-col justify-center gap-3">
        <p className="label text-mute">Progress at each point in time</p>
        {rows.map((t) => {
          const y = f(t);
          return (
            <div key={t} className="grid grid-cols-[3.2rem_1fr_3.2rem] items-center gap-3 font-mono text-[12px]">
              <span className="text-mute">{Math.round(t * 100)}% time</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-paper-2">
                <span className="block h-full origin-left rounded-full bg-brand transition-transform duration-300 ease-expo" style={{ transform: `scaleX(${Math.max(0, Math.min(1, y))})` }} />
              </span>
              <span className="text-right tabular-nums text-ink">{Math.round(y * 100)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
