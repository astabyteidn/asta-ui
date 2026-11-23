"use client";

import { useState } from "react";
import { ContextBreakdown, ContextMeter, type ContextSegment } from "@/components/kit/context-meter";

const FULL: ContextSegment[] = [
  { label: "Conversation", tokens: 129_900 },
  { label: "Files", tokens: 41_200 },
  { label: "Tools", tokens: 8_400 },
  { label: "System prompt", tokens: 3_100 },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ContextMeterDemo() {
  const [segments, setSegments] = useState(FULL);
  const compacted = segments[0].tokens < FULL[0].tokens;

  // Summarise the conversation: keep decisions and open tasks, drop the back-and-forth.
  const compact = async () => {
    await wait(1100);
    setSegments((s) => s.map((p) => (p.label === "Conversation" ? { ...p, tokens: 12_800 } : p)));
  };

  return (
    <div className="flex min-h-[480px] w-full items-center justify-center p-4 sm:p-10">
      <div className="grid w-full max-w-[820px] items-start gap-6 md:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-3">
          <div className="rounded-[14px] bg-paper p-1.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_1px_2px_rgb(0_0_0/0.04)]">
            <label htmlFor="ctx-demo-prompt" className="sr-only">
              Message
            </label>
            <textarea
              id="ctx-demo-prompt"
              name="prompt"
              rows={3}
              placeholder="e.g. Move the invoice emails to the new template"
              className="block w-full resize-none bg-transparent px-3 py-2.5 text-[16px] leading-relaxed text-ink outline-none placeholder:text-mute sm:text-[14px]"
            />
            <div className="flex items-center gap-2 px-1.5 pb-0.5">
              <span className="shrink-0 whitespace-nowrap rounded-md bg-paper-2 px-2 py-1 text-[12px] text-ink-2">Astra 2 Pro</span>
              <span className="hidden truncate text-[12px] text-mute sm:block">14 files</span>
              <span className="ml-auto" />
              <ContextMeter segments={segments} max={200_000} model="Astra 2 Pro" onCompact={compact} />
              <button
                type="button"
                aria-label="Send message"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white outline-none transition-transform duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 px-1 text-[12.5px] text-mute">
            <span>Open the ring above the composer, or use the panel.</span>
            <button
              type="button"
              onClick={() => setSegments(FULL)}
              disabled={!compacted}
              className="shrink-0 rounded-md px-2 py-1 font-medium text-brand outline-none transition-[background-color,opacity] duration-200 hover:bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)] focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-40"
            >
              Refill context
            </button>
          </div>
          <div className="flex items-center gap-4 px-1 text-[12.5px] text-mute">
            Small
            <ContextMeter size="sm" segments={segments} max={200_000} />
            <ContextMeter size="sm" segments={[{ label: "Conversation", tokens: 21_400 }]} max={128_000} />
          </div>
        </div>

        <ContextBreakdown
          segments={segments}
          max={200_000}
          model="Astra 2 Pro"
          onCompact={compact}
          className="rounded-[14px] bg-paper p-4 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_1px_2px_rgb(0_0_0/0.04)]"
        />
      </div>
    </div>
  );
}
