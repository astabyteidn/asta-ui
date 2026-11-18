"use client";

import { useState } from "react";
import { ToggleGroup } from "@/components/kit/toggle-group";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const ALIGN = [
  { value: "left", icon: <Icon d="M2.5 4h11M2.5 8h7M2.5 12h9" />, "aria-label": "Align left" },
  { value: "center", icon: <Icon d="M2.5 4h11M4.5 8h7M3.5 12h9" />, "aria-label": "Align centre" },
  { value: "right", icon: <Icon d="M2.5 4h11M6.5 8h7M4.5 12h9" />, "aria-label": "Align right" },
];

const STYLE = [
  { value: "bold", icon: <Icon d="M4.5 3h4.25a2.5 2.5 0 0 1 0 5H4.5zM4.5 8h5a2.5 2.5 0 0 1 0 5h-5z" />, "aria-label": "Bold" },
  { value: "italic", icon: <Icon d="M10 3H6.5M9.5 13H6M9 3 7 13" />, "aria-label": "Italic" },
  { value: "underline", icon: <Icon d="M4.5 2.5V7a3.5 3.5 0 0 0 7 0V2.5M3.5 13.5h9" />, "aria-label": "Underline" },
  { value: "strike", icon: <Icon d="M3 8h10M10.75 4.5C10.3 3.6 9.3 3 8 3 6.3 3 5 4 5 5.3c0 .9.6 1.6 1.5 2M5.25 11.5c.45.9 1.45 1.5 2.75 1.5 1.7 0 3-1 3-2.3 0-.4-.1-.8-.4-1.1" />, "aria-label": "Strikethrough" },
];

const RANGES = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

export default function ToggleGroupDemo() {
  const [align, setAlign] = useState("left");
  const [marks, setMarks] = useState<string[]>(["bold"]);
  const [range, setRange] = useState("1m");

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="rounded-xl p-4 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup type="multiple" label="Text style" size="sm" options={STYLE} value={marks} onValueChange={setMarks} />
            <ToggleGroup label="Text alignment" size="sm" options={ALIGN} value={align} onValueChange={setAlign} />
          </div>
          <p
            className="mt-4 text-[14px] leading-relaxed text-ink-2"
            style={{
              textAlign: align as "left" | "center" | "right",
              fontWeight: marks.includes("bold") ? 600 : 400,
              fontStyle: marks.includes("italic") ? "italic" : "normal",
              textDecoration: [marks.includes("underline") && "underline", marks.includes("strike") && "line-through"].filter(Boolean).join(" ") || "none",
            }}
          >
            Good tools get out of the way. You notice the work, not the buttons.
          </p>
        </div>

        <div className="flex flex-col gap-3 px-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-mute">Portfolio</span>
            <span className="text-[13px] tabular-nums text-brand">+4.2% · {RANGES.find((r) => r.value === range)?.label}</span>
          </div>
          <ToggleGroup label="Chart range" full options={RANGES} value={range} onValueChange={setRange} />
        </div>

        <p className="text-center text-[12.5px] text-mute">Style buttons stack: arrows move, Space presses. The others pick one as you arrow through.</p>
      </div>
    </div>
  );
}
