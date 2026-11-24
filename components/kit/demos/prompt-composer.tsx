"use client";

import { useEffect, useRef, useState } from "react";
import { ModelPicker, type ModelOption } from "@/components/kit/model-picker";
import { PromptComposer, type ComposerCommand, type ComposerMention, type ComposerMessage } from "@/components/kit/prompt-composer";

const MENTIONS: ComposerMention[] = [
  { id: "f1", type: "file", label: "pricing-v3.fig", hint: "Design" },
  { id: "f2", type: "file", label: "q3-revenue.csv", hint: "Finance" },
  { id: "f3", type: "file", label: "signup-form.tsx", hint: "app/onboarding" },
  { id: "p1", type: "person", label: "Rani Wijaya", hint: "Design lead" },
  { id: "p2", type: "person", label: "Theo Marsh", hint: "Engineering" },
  { id: "p3", type: "person", label: "Maya Sato", hint: "Support" },
  { id: "d1", type: "doc", label: "Launch plan", hint: "Edited 2d ago" },
  { id: "d2", type: "doc", label: "Pricing FAQ", hint: "Help center" },
];

const COMMANDS: ComposerCommand[] = [
  { id: "summarize", label: "summarize", hint: "A short summary" },
  { id: "draft", label: "draft", hint: "Write a first version" },
  { id: "review", label: "review", hint: "Find problems" },
  { id: "plan", label: "plan", hint: "List steps first" },
  { id: "translate", label: "translate", hint: "Into another language" },
];

const MODELS: ModelOption[] = [
  { value: "astra-2-pro", label: "Astra 2 Pro", group: "Astra 2", hint: "Deep reasoning for hard tasks", speed: 2, intelligence: 5, context: "1M", isNew: true },
  { value: "astra-2", label: "Astra 2", group: "Astra 2", hint: "Balanced for everyday work", speed: 4, intelligence: 4, context: "400K" },
  { value: "astra-fast", label: "Astra Fast", group: "Realtime", hint: "Lowest latency", speed: 5, intelligence: 2, context: "32K" },
];

export default function PromptComposerDemo() {
  const [model, setModel] = useState("astra-2");
  const [running, setRunning] = useState(false);
  const [sent, setSent] = useState<ComposerMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Pretend the agent works for a few seconds.
  const send = (msg: ComposerMessage) => {
    setSent(msg);
    setRunning(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setRunning(false), 4500);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setRunning(false);
  };

  return (
    <div className="flex min-h-[460px] w-full flex-col items-center justify-end gap-6 p-4 pb-8 sm:p-10">
      <div className="flex w-full max-w-[640px] flex-1 flex-col justify-end">
        {sent ? (
          <div className="ml-auto max-w-[85%] rounded-xl bg-paper-2 px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">
            {sent.parts.map((p, i) =>
              p.type === "text" ? (
                <span key={i} className="whitespace-pre-wrap">
                  {p.text}
                </span>
              ) : (
                <span key={i} className={p.type === "command" ? "rounded-[5px] bg-ink px-1.5 font-medium text-paper" : "rounded-[5px] bg-brand/10 px-1.5 font-medium text-brand"}>
                  {p.type === "command" ? `/${p.item.label}` : p.item.label}
                </span>
              ),
            )}
            {sent.files.length > 0 && <p className="mt-1 text-[12px] text-mute">{sent.files.map((f) => f.name).join(", ")}</p>}
          </div>
        ) : (
          <p className="text-center text-[13px] text-mute">Type @ to mention a file, person or doc, or / for a command.</p>
        )}
      </div>
      <div className="w-full max-w-[640px]">
        <PromptComposer
          mentions={MENTIONS}
          commands={COMMANDS}
          running={running}
          onSend={send}
          onStop={stop}
          model={<ModelPicker variant="chip" side="top" models={MODELS} value={model} onChange={setModel} />}
        />
      </div>
    </div>
  );
}
