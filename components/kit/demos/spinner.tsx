"use client";

import { useEffect, useState } from "react";
import { Progress, Spinner, type SpinnerVariant } from "@/components/kit/spinner";

const VARIANTS: SpinnerVariant[] = ["ring", "dots", "bars", "orbit"];

export default function SpinnerDemo() {
  const [upload, setUpload] = useState(12);

  // Fake an upload that restarts when it finishes.
  useEffect(() => {
    const id = setInterval(() => setUpload((v) => (v >= 100 ? 0 : Math.min(100, v + 4 + Math.random() * 10))), 600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {VARIANTS.map((v) => (
            <div key={v} className="flex flex-col items-center gap-4 rounded-xl bg-paper px-4 py-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
              <Spinner variant={v} className="text-[28px] text-ink" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-mute">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-ink-2">
          <span className="flex items-center gap-2">
            <Spinner className="text-accent" /> Syncing
          </span>
          <span className="flex items-center gap-2">
            <Spinner variant="dots" className="w-[1.4em] text-mute" /> Typing
          </span>
          <span className="flex items-center gap-2">
            <Spinner variant="bars" className="text-[#30a46c]" /> Listening
          </span>
        </div>
        <div className="flex flex-col gap-5">
          <Progress value={upload} label="Uploading design.fig" showValue />
          <Progress label="Preparing export" />
        </div>
      </div>
    </div>
  );
}
