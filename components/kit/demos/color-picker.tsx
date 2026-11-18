"use client";

import { useState } from "react";
import { ColorPicker } from "@/components/kit/color-picker";

const LABELS = [
  { value: "#2f54eb", name: "Blue" },
  { value: "#5b5bd6", name: "Indigo" },
  { value: "#7c5cd6", name: "Violet" },
  { value: "#4f8ef7", name: "Sky" },
  { value: "#52525b", name: "Graphite" },
  { value: "#111113", name: "Ink" },
];

export default function ColorPickerDemo() {
  const [color, setColor] = useState("#2f54eb");
  const name = LABELS.find((l) => l.value === color)?.name ?? "Custom";

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="rounded-xl bg-paper-2 p-5">
          <p className="text-[12px] text-mute">New label</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[13px] font-medium text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
              <span className="h-2 w-2 rounded-full transition-[background-color] duration-300" style={{ background: color }} />
              Design review
            </span>
            <span className="text-[12.5px] text-mute">{name}</span>
          </div>
          <div className="mt-5">
            <ColorPicker label="Label colour" swatches={LABELS} columns={6} value={color} onValueChange={setColor} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-[14px] text-ink-2">Swatches only</p>
          <ColorPicker label="Avatar colour" size="sm" custom={false} columns={5} />
        </div>

        <p className="text-center text-[12.5px] text-mute">Arrow keys move through the swatches. Type any hex and press Enter.</p>
      </div>
    </div>
  );
}
