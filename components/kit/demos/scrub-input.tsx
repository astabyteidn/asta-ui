"use client";

import { useEffect, useRef, useState } from "react";
import { ScrubInput, ScrubRow } from "@/components/kit/scrub-input";

const icon = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const ROTATE = icon("M13 8a5 5 0 1 1-1.6-3.7M13 2.5v2.8h-2.8");
const RADIUS = icon("M3 13V8a5 5 0 0 1 5-5h5");
const OPACITY = icon("M8 2.5a5.5 5.5 0 1 0 0 11zM8 2.5a5.5 5.5 0 0 1 0 11");

// The canvas is drawn at this size and scaled to fit its box.
const CANVAS = { w: 560, h: 300 };

export default function ScrubInputDemo() {
  const [f, setF] = useState({ x: 140, y: 70, w: 280, h: 160, r: 0, radius: 12, o: 100 });
  const [locked, setLocked] = useState(false);
  const [scale, setScale] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const set = (k: keyof typeof f) => (v: number) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / CANVAS.w));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const resize = (k: "w" | "h") => (v: number) =>
    setF((p) => {
      if (!locked) return { ...p, [k]: v };
      const ratio = p.w / p.h;
      return k === "w" ? { ...p, w: v, h: Math.round((v / ratio) * 100) / 100 } : { ...p, h: v, w: Math.round(v * ratio * 100) / 100 };
    });

  return (
    <div className="flex min-h-[560px] w-full items-center justify-center p-4 sm:p-10">
      <div className="grid w-full max-w-[880px] gap-4 md:grid-cols-[1fr_300px]">
        <div ref={stage} className="relative aspect-[56/30] overflow-hidden rounded-[14px] bg-paper-2">
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: CANVAS.w, height: CANVAS.h, transform: `scale(${scale})` }}>
            <div
              className="absolute left-0 top-0"
              style={{ width: f.w, height: f.h, transform: `translate(${f.x}px, ${f.y}px) rotate(${f.r}deg)`, opacity: f.o / 100 }}
            >
              <div
                className="flex h-full w-full flex-col justify-between overflow-hidden bg-paper p-4 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_-16px_rgb(0_0_0/0.3)]"
                style={{ borderRadius: f.radius }}
              >
                <p className="text-[11px] font-medium text-brand">Astabyte · Spring launch</p>
                <p className="text-[22px] font-medium leading-[1.05] tracking-[-0.03em] text-ink">Ship the beta in two weeks</p>
              </div>
              {/* Selection chrome, as a design tool draws it. */}
              <div aria-hidden className="pointer-events-none absolute -inset-px shadow-[0_0_0_1.5px_var(--color-brand)]">
                {["-left-1 -top-1", "-right-1 -top-1", "-bottom-1 -left-1", "-bottom-1 -right-1"].map((p) => (
                  <span key={p} className={`absolute h-2 w-2 bg-paper shadow-[inset_0_0_0_1.5px_var(--color-brand)] ${p}`} />
                ))}
                <span className="absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-brand px-1.5 text-[11px] leading-[18px] tabular-nums text-white">
                  {Math.round(f.w)} × {Math.round(f.h)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <section aria-label="Frame properties" className="rounded-[12px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-16px_rgb(0_0_0/0.22)]">
          <header className="flex h-11 items-center gap-2 px-3.5">
            <span className="rounded-[5px] bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] px-1.5 py-0.5 text-[11px] text-ink-2">Frame</span>
            <span className="truncate text-[13px] font-medium text-ink">Hero card</span>
          </header>
          <div className="space-y-2 px-3.5 pb-3.5">
            <ScrubRow label="Position">
              <ScrubInput label="X" title="X position" value={f.x} onChange={set("x")} unit="px" />
              <ScrubInput label="Y" title="Y position" value={f.y} onChange={set("y")} unit="px" />
            </ScrubRow>
            <ScrubRow label="Size">
              <ScrubInput label="W" title="Width" value={f.w} onChange={resize("w")} min={1} max={560} unit="px" />
              <ScrubInput label="H" title="Height" value={f.h} onChange={resize("h")} min={1} max={300} unit="px" />
            </ScrubRow>
            <div className="-mt-0.5 flex justify-end">
              <button
                type="button"
                aria-pressed={locked}
                onClick={() => setLocked((l) => !l)}
                className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 aria-pressed:text-brand"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  {locked ? <path d="M6.5 9.5 9.5 6.5M5 7.5 3.8 8.7a2.5 2.5 0 0 0 3.5 3.5L8.5 11M7.5 5l1.2-1.2a2.5 2.5 0 0 1 3.5 3.5L11 8.5" /> : <path d="M5 7.5 3.8 8.7a2.5 2.5 0 0 0 3.5 3.5L8.5 11M7.5 5l1.2-1.2a2.5 2.5 0 0 1 3.5 3.5L11 8.5" />}
                </svg>
                {locked ? "Ratio locked" : "Lock ratio"}
              </button>
            </div>
            <ScrubRow label="Shape">
              <ScrubInput label={ROTATE} title="Rotation" value={f.r} onChange={set("r")} min={-180} max={180} unit="°" />
              <ScrubInput label={RADIUS} title="Corner radius" value={f.radius} onChange={set("radius")} min={0} max={80} unit="px" />
            </ScrubRow>
            <ScrubRow label="Layer" cols={1}>
              <ScrubInput label={OPACITY} title="Opacity" value={f.o} onChange={set("o")} min={0} max={100} unit="%" />
            </ScrubRow>
          </div>
          <p className="px-3.5 pb-3.5 text-[12px] leading-relaxed text-mute">
            Drag a label to scrub. Shift ×10, Alt ×0.1. Or type <span className="text-ink-2">1.5rem</span>, <span className="text-ink-2">24*2</span> or <span className="text-ink-2">+8</span> and press Enter.
          </p>
        </section>
      </div>
    </div>
  );
}
