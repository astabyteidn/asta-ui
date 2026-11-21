"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePaused, useReplay } from "@/components/blog/DemoFrame";
import Icon from "@/components/icons/Icon";
import { Button } from "@/components/kit/button";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Slider } from "@/components/kit/slider";
import { DISTANCE_CSS, DRAWER_CSS, EXIT_CSS } from "./code";

const EASE = "cubic-bezier(.16, 1, .3, 1)";
const ring = "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_12px_28px_-14px_rgb(0_0_0/0.25)]";

/** On Replay: close, wait until the exit is done, then open again so the full entrance plays. Also opens once on first view. */
function useReopen(set: (open: boolean) => void, wait = 450) {
  const n = useReplay();
  const ms = useRef(wait);
  useEffect(() => {
    ms.current = wait;
  }, [wait]);
  useEffect(() => {
    if (!n) return;
    const id = requestAnimationFrame(() => set(false));
    const t = setTimeout(() => set(true), ms.current + 100);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [n, set]);
  // First time the demo is on screen: open it once, so nobody lands on an empty stage.
  const paused = usePaused();
  const shown = useRef(false);
  useEffect(() => {
    if (paused || shown.current) return;
    const t = setTimeout(() => {
      shown.current = true;
      set(true);
    }, 400);
    return () => clearTimeout(t);
  }, [paused, set]);
}

const CART = [
  { name: "Astabyte Desk Lamp", price: 89 },
  { name: "Astabyte Notebook, A5", price: 18 },
  { name: "Astabyte Cable Kit", price: 32 },
];

function label(ms: number) {
  if (ms <= 140) return "Too fast to follow";
  if (ms <= 260) return "Feels right";
  if (ms <= 420) return "Calm, a little slow";
  return "Sluggish";
}

/** A cart drawer with a duration slider. */
export function DurationDrawer() {
  const [dur, setDur] = useState(200);
  const [open, setOpen] = useState(false);
  useReopen(setOpen, dur);
  return (
    <div className="flex flex-col">
      <style href="asta-blog-dur-drawer" precedence="asta">
        {DRAWER_CSS}
      </style>
      <div className="px-5 pt-4 sm:px-8">
        <div className="flex items-baseline justify-between font-mono text-[12px]">
          <span id="dur-ms" className="text-mute">
            duration
          </span>
          <span className="tabular-nums text-ink">
            {dur}ms · <span className={dur > 140 && dur <= 260 ? "text-brand" : "text-mute"}>{label(dur)}</span>
          </span>
        </div>
        <Slider aria-labelledby="dur-ms" value={dur} onValueChange={setDur} min={100} max={800} step={50} format={(v) => `${v}ms`} />
      </div>
      <div
        className="dur-drawer relative mx-3 mb-3 mt-4 h-[230px] overflow-hidden rounded-[10px] bg-paper-2"
        data-open={open}
        style={{ "--dur": `${dur}ms`, "--ease": EASE } as CSSProperties}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[14px] font-medium">Astabyte Store</span>
          <Button size="sm" onClick={() => setOpen(true)}>
            Cart · 3
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-[8px] bg-paper" />
          ))}
        </div>
        <div className="scrim absolute inset-0 bg-ink/15" onClick={() => setOpen(false)} aria-hidden style={{ pointerEvents: open ? "auto" : "none" }} />
        <aside className={`sheet absolute inset-y-2 right-2 flex w-[min(250px,78%)] flex-col rounded-[10px] bg-paper p-4 ${ring}`} aria-hidden={!open}>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium">Your cart</span>
            <button type="button" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className="text-[13px] text-mute hover:text-ink">
              Close
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-2 text-[13px]">
            {CART.map((c) => (
              <li key={c.name} className="flex justify-between gap-2">
                <span className="truncate">{c.name}</span>
                <span className="tabular-nums text-mute">${c.price}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex h-9 items-center justify-center rounded-[8px] bg-ink text-[13px] font-medium text-paper">Checkout · $139</div>
        </aside>
      </div>
    </div>
  );
}

/** A tooltip, a menu and a drawer. Scaled durations vs one duration for all. */
export function DurationDistance() {
  const [mode, setMode] = useState("scaled");
  const [open, setOpen] = useState(false);
  useReopen(setOpen);
  return (
    <div className="dur-dist flex flex-col gap-4 p-5 sm:p-6" data-open={open} data-same={mode === "same"} style={{ "--ease": EASE } as CSSProperties}>
      <style href="asta-blog-dur-dist" precedence="asta">
        {DISTANCE_CSS}
      </style>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          size="sm"
          label="Durations"
          value={mode}
          onChange={setMode}
          segments={[
            { value: "scaled", label: "Scaled to distance" },
            { value: "same", label: "Same 300ms" },
          ]}
        />
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide all" : "Show all"}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
        <div className="relative flex h-[170px] flex-col items-center justify-center rounded-[10px] bg-paper-2">
          <div className="tip mb-2 rounded-[6px] bg-ink px-2 py-1 text-[12px] text-paper">Copy link</div>
          <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-paper">
            <Icon name="link" className="h-4 w-4" />
          </div>
          <span className="label absolute bottom-2 text-mute">{mode === "same" ? "4px · 300ms" : "4px · 150ms"}</span>
        </div>
        <div className="relative flex h-[170px] flex-col items-center rounded-[10px] bg-paper-2 pt-5">
          <div className="h-8 rounded-[7px] bg-paper px-3 text-[13px] leading-8">Sort</div>
          <div className={`menu mt-1.5 w-32 origin-top rounded-[8px] bg-paper p-1 text-[12.5px] ${ring}`}>
            <div className="rounded-[5px] px-2 py-1 text-brand">Newest</div>
            <div className="px-2 py-1">Price</div>
          </div>
          <span className="label absolute bottom-2 text-mute">{mode === "same" ? "8px · 300ms" : "8px · 200ms"}</span>
        </div>
        <div className="relative h-[170px] overflow-hidden rounded-[10px] bg-paper-2">
          <div className={`sheet absolute bottom-8 right-2 top-2 w-[70%] rounded-[8px] bg-paper p-3 text-[13px] ${ring}`}>
            <div className="font-medium">Filters</div>
            <div className="mt-2 h-2 w-3/4 rounded-full bg-paper-2" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-paper-2" />
          </div>
          <span className="label absolute bottom-2 left-3 text-mute">Full width · 300ms</span>
        </div>
      </div>
    </div>
  );
}

/** A dialog that enters in 300ms and leaves in 300ms or 200ms. */
export function DurationExit() {
  const [exit, setExit] = useState("200");
  const [open, setOpen] = useState(true);
  // Replay: close, so you see the exit, then open again.
  useReopen(setOpen, 600);
  return (
    <div className="dur-exit flex flex-col gap-4 p-5 sm:p-6" data-open={open} style={{ "--exit": `${exit}ms`, "--ease": EASE } as CSSProperties}>
      <style href="asta-blog-dur-exit" precedence="asta">
        {EXIT_CSS}
      </style>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          size="sm"
          label="Exit duration"
          value={exit}
          onChange={setExit}
          segments={[
            { value: "300", label: "Exit 300ms" },
            { value: "200", label: "Exit 200ms" },
          ]}
        />
        <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Open"}
        </Button>
      </div>
      <div className="grid h-[200px] place-items-center rounded-[10px] bg-paper-2">
        <div className={`card w-[min(300px,90%)] rounded-[12px] bg-paper p-4 ${ring}`} aria-hidden={!open}>
          <p className="text-[15px] font-medium">Remove 2 items?</p>
          <p className="mt-1 text-[13px] text-mute">They go back to your Astabyte wishlist.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="soft" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
