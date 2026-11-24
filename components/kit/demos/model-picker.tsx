"use client";

import { useState } from "react";
import { ModelPicker, type ModelOption } from "@/components/kit/model-picker";

const MODELS: ModelOption[] = [
  { value: "astra-2-pro", label: "Astra 2 Pro", group: "Astra 2", tag: "Pro", hint: "Deep reasoning for hard, multi-step work", speed: 2, intelligence: 5, context: "1M", isNew: true },
  { value: "astra-2", label: "Astra 2", group: "Astra 2", tag: "Default", hint: "Balanced for everyday writing and code", speed: 4, intelligence: 4, context: "400K" },
  { value: "astra-2-mini", label: "Astra 2 Mini", group: "Astra 2", tag: "Mini", hint: "Quick answers, summaries and triage", speed: 5, intelligence: 3, context: "200K" },
  { value: "astra-fast", label: "Astra Fast", group: "Realtime", tag: "Fast", hint: "Lowest latency for voice and autocomplete", speed: 5, intelligence: 2, context: "32K" },
  { value: "astra-vision", label: "Astra Vision", group: "Realtime", tag: "Vision", hint: "Reads screenshots, charts and scans", speed: 3, intelligence: 4, context: "128K", isNew: true },
  { value: "astra-1-5", label: "Astra 1.5", group: "Legacy", tag: "1.5", hint: "Kept for older workflows", speed: 3, intelligence: 3, context: "128K", disabled: true, disabledReason: "Retired on Dec 1. Pick Astra 2." },
];

export default function ModelPickerDemo() {
  const [model, setModel] = useState("astra-2");
  const picked = MODELS.find((m) => m.value === model);

  return (
    <div className="flex min-h-[520px] w-full justify-center p-4 pt-10 sm:p-10">
      <div className="flex w-full max-w-[340px] flex-col gap-2">
        <span className="text-[13px] font-medium text-ink">Default model</span>
        <ModelPicker models={MODELS} value={model} onChange={setModel} name="model" />
        <p className="text-[12.5px] text-mute">
          New chats in Astabyte start on <span className="text-ink-2">{picked?.label}</span>. Type to search, or use the arrow keys.
        </p>
      </div>
    </div>
  );
}
