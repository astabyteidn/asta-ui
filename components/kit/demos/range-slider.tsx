"use client";

import { useState } from "react";
import { RangeSlider, type RangeSliderValue } from "@/components/kit/range-slider";

// Fake listing prices, used to draw the histogram and count matches.
const PRICES = Array.from({ length: 240 }, (_, i) => Math.round(40 + 460 * Math.pow(((i * 37) % 240) / 240, 1.7)));
const BINS = 24;
const MIN = 40;
const MAX = 500;
const counts = Array.from({ length: BINS }, (_, b) => PRICES.filter((p) => Math.min(BINS - 1, Math.floor(((p - MIN) / (MAX - MIN)) * BINS)) === b).length);
const peak = Math.max(...counts);

const usd = (v: number) => `$${v}`;

export default function RangeSliderDemo() {
  const [range, setRange] = useState<RangeSliderValue>([90, 320]);
  const matches = PRICES.filter((p) => p >= range[0] && p <= range[1]).length;

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="rounded-xl bg-paper-2 p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">Price per night</p>
            <p className="text-[12.5px] tabular-nums text-mute">{matches} stays</p>
          </div>
          <div aria-hidden className="mt-5 flex h-14 items-end gap-[3px] px-[10px]">
            {counts.map((c, b) => {
              const from = MIN + ((MAX - MIN) / BINS) * b;
              const on = from + (MAX - MIN) / BINS > range[0] && from < range[1];
              return (
                <span
                  key={b}
                  className={"flex-1 origin-bottom rounded-[2px] transition-colors duration-300 " + (on ? "bg-[color-mix(in_srgb,var(--color-brand)_55%,transparent)]" : "bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]")}
                  style={{ height: `${Math.max(6, (c / peak) * 100)}%` }}
                />
              );
            })}
          </div>
          <RangeSlider min={MIN} max={MAX} step={5} minGap={20} value={range} onValueChange={setRange} format={usd} labels={["Minimum price", "Maximum price"]} className="-mt-3" />
          <div className="mt-2 flex justify-between text-[13px] tabular-nums">
            <span className="text-ink">{usd(range[0])}</span>
            <span className="text-ink">{range[1] === MAX ? `${usd(MAX)}+` : usd(range[1])}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-1">
          <p className="text-[13px] text-ink-2">Working hours</p>
          <RangeSlider min={0} max={24} step={0.5} minGap={1} defaultValue={[9, 17.5]} format={(v) => `${String(Math.floor(v)).padStart(2, "0")}:${v % 1 ? "30" : "00"}`} labels={["Start", "End"]} />
        </div>

        <p className="text-center text-[12.5px] text-mute">Drag either thumb or click the track. Thumbs keep a gap and never cross.</p>
      </div>
    </div>
  );
}
