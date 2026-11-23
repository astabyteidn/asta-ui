"use client";

import { useEffect, useState } from "react";
import { Thinking } from "@/components/kit/thinking";

const STEPS = [
  "Pulling the October and November invoices for the Astabyte workspace.",
  "Comparing line items. Seats are flat at 24, so the change is in usage.",
  "API requests rose from 1.9M to 2.6M, most of it from the nightly export job.",
  "The export job has retried on timeouts since Nov 12, doubling its calls.",
  "Checking credits. The $120 launch credit expired on Nov 1.",
];

const ANSWER =
  "Your bill went up 18% for two reasons. API usage rose 37%, almost all of it from the nightly export retrying after timeouts since Nov 12. And the $120 launch credit ran out on Nov 1. Fixing the retries should bring December back to about $1,240.";

export default function ThinkingDemo() {
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);

  // Stream one reasoning line at a time, then finish.
  useEffect(() => {
    const timers = STEPS.map((_, i) => setTimeout(() => setShown(i + 1), 700 + i * 1500));
    timers.push(setTimeout(() => setDone(true), 700 + STEPS.length * 1500));
    return () => timers.forEach(clearTimeout);
  }, [run]);

  const again = () => {
    setShown(0);
    setDone(false);
    setRun((r) => r + 1);
  };

  return (
    <div className="flex min-h-[460px] w-full flex-col items-center justify-center gap-8 p-4 sm:p-10">
      <div className="w-full max-w-[560px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_1px_2px_rgb(0_0_0/0.04)]">
        <p className="ml-auto w-fit max-w-[80%] rounded-xl bg-paper-2 px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">
          Why did our November invoice go up 18%?
        </p>
        <div className="mt-5 flex min-h-[148px] flex-col gap-2">
          <Thinking key={run} status={done ? "done" : "thinking"} steps={STEPS.slice(0, shown)} defaultOpen summary="Usage up 37% from export retries, and a $120 credit expired." />
          {done && <p className="text-[14px] leading-relaxed text-ink animate-[asta-thinking-in_.5s_cubic-bezier(.16,1,.3,1)_both]">{ANSWER}</p>}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={again}
            disabled={!done}
            className="rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-brand outline-none transition-[background-color,opacity] duration-200 hover:bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)] focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-40"
          >
            Ask again
          </button>
        </div>
      </div>

      <div className="flex w-full max-w-[560px] flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px] text-mute">
        <span className="flex items-center gap-2">
          Inline <Thinking variant="inline" size="sm" status="thinking" label="Searching the docs" />
        </span>
        <Thinking variant="inline" size="sm" status="done" seconds={4} />
        <Thinking variant="inline" size="sm" status="stopped" seconds={9} />
      </div>
    </div>
  );
}
