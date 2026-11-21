"use client";

import { useState, type CSSProperties } from "react";
import { useReplay } from "@/components/blog/DemoFrame";
import Icon from "@/components/icons/Icon";
import { Button } from "@/components/kit/button";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Slider } from "@/components/kit/slider";
import { CAP_CSS, LIST_CSS, ORDER_CSS } from "./code";

const EASE = "cubic-bezier(.16, 1, .3, 1)";
const DUR = 300;
const ring = "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_12px_28px_-14px_rgb(0_0_0/0.25)]";

const ROWS = [
  { icon: "receipt", title: "Invoice #1042 paid", meta: "Astabyte Studio · $1,240" },
  { icon: "truck", title: "Order #8815 shipped", meta: "Arrives Thursday" },
  { icon: "user", title: "New member joined", meta: "Design team" },
  { icon: "message", title: "2 new comments", meta: "Q4 roadmap" },
  { icon: "card", title: "Card ending 4242 updated", meta: "Billing" },
  { icon: "bell", title: "Weekly report ready", meta: "Analytics" },
] as const;

/** A feed that staggers in. One slider for the step, numbers for the total. */
export function StaggerList() {
  const [step, setStep] = useState(40);
  const n = useReplay();
  const last = (ROWS.length - 1) * step;
  return (
    <div className="grid h-full gap-6 p-5 sm:grid-cols-[1fr_1.3fr] sm:p-8">
      <style href="asta-blog-stg-list" precedence="asta">
        {LIST_CSS}
      </style>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex justify-between font-mono text-[12px] text-mute">
            <span id="stg-step">step</span>
            <span className="tabular-nums">{step}ms</span>
          </div>
          <Slider aria-labelledby="stg-step" value={step} onValueChange={setStep} min={0} max={120} step={10} format={(v) => `${v}ms`} />
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[12px]">
          <dt className="text-mute">rows</dt>
          <dd className="text-right tabular-nums text-ink">{ROWS.length}</dd>
          <dt className="text-mute">last row starts</dt>
          <dd className="text-right tabular-nums text-ink">{last}ms</dd>
          <dt className="text-mute">list done</dt>
          <dd className={`text-right tabular-nums ${last + DUR <= 600 ? "text-brand" : "text-ink"}`}>{last + DUR}ms</dd>
        </dl>
        <p className="text-[13px] text-mute">{step === 0 ? "No stagger. The list lands as one block." : step <= 60 ? "Reads as one list that flows in." : "Reads as rows arriving one by one."}</p>
      </div>
      <ul key={`${n}-${step}`} className="stg-list flex flex-col gap-1.5" style={{ "--step": `${step}ms`, "--ease": EASE } as CSSProperties}>
        {ROWS.map((r, i) => (
          <li key={r.title} className="flex items-center gap-3 rounded-[9px] bg-paper-2 px-3 py-2" style={{ "--i": i } as CSSProperties}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-paper text-ink">
              <Icon name={r.icon} className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium">{r.title}</span>
              <span className="block truncate text-[12px] text-mute">{r.meta}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A dialog: header, content, actions in order vs all at once. */
export function StaggerOrder() {
  const [mode, setMode] = useState("order");
  const n = useReplay();
  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
      <style href="asta-blog-stg-order" precedence="asta">
        {ORDER_CSS}
      </style>
      <SegmentedControl
        size="sm"
        label="Choreography"
        value={mode}
        onChange={setMode}
        className="self-start"
        segments={[
          { value: "order", label: "In order" },
          { value: "all", label: "All at once" },
        ]}
      />
      <div className="grid flex-1 place-items-center rounded-[10px] bg-paper-2 p-4">
        <div key={`${n}-${mode}`} className={`stg-order w-[min(340px,100%)] rounded-[12px] bg-paper p-4 ${ring}`} data-mode={mode} style={{ "--ease": EASE } as CSSProperties}>
          <div data-part="header" className="flex items-center justify-between">
            <p className="text-[15px] font-medium">New project</p>
            <span className="label text-mute">Step 1 of 2</span>
          </div>
          <div data-part="content" className="mt-3 flex flex-col gap-2">
            <div className="flex h-9 items-center rounded-[8px] bg-paper-2 px-3 text-[13px]">Astabyte Website</div>
            <div className="flex h-9 items-center rounded-[8px] bg-paper-2 px-3 text-[13px] text-mute">Team · Design</div>
          </div>
          <div data-part="actions" className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="soft" tabIndex={-1}>
              Cancel
            </Button>
            <Button size="sm" tabIndex={-1}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TILES = Array.from({ length: 18 }, (_, i) => ({ name: `Shot ${String(i + 1).padStart(2, "0")}`, tone: i % 3 }));
const TONE = ["bg-paper", "bg-brand/10", "bg-ink/[0.06]"];

/** 18 tiles at 50ms a step: uncapped vs capped at 6. */
export function StaggerCap() {
  const [mode, setMode] = useState("cap");
  const n = useReplay();
  const capped = mode === "cap";
  const last = (capped ? 6 : TILES.length - 1) * 50;
  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
      <style href="asta-blog-stg-cap" precedence="asta">
        {CAP_CSS}
      </style>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          size="sm"
          label="Cap"
          value={mode}
          onChange={setMode}
          segments={[
            { value: "none", label: "No cap" },
            { value: "cap", label: "Cap at 6" },
          ]}
        />
        <p className="font-mono text-[12px] text-ink">
          last tile starts at <span className={`tabular-nums ${capped ? "text-brand" : ""}`}>{last}ms</span>
        </p>
      </div>
      <ul key={`${n}-${mode}`} className="stg-cap grid grid-cols-3 gap-1.5 sm:grid-cols-6" style={{ "--cap": capped ? 6 : 999, "--ease": EASE } as CSSProperties}>
        {TILES.map((t, i) => (
          <li key={t.name} className="flex flex-col gap-1.5 rounded-[8px] bg-paper-2 p-1.5" style={{ "--i": i } as CSSProperties}>
            <span className={`block h-9 rounded-[5px] ${TONE[t.tone]}`} />
            <span className="truncate px-0.5 text-[11px] text-mute">{t.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
