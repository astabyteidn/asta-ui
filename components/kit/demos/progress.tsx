"use client";

import { useEffect, useState } from "react";
import { ProgressBar, ProgressRing } from "@/components/kit/progress";

export default function ProgressDemo() {
  const [sent, setSent] = useState(0);

  // Fake an upload: a few uneven chunks, then start over.
  useEffect(() => {
    const t = setTimeout(() => setSent((s) => (s >= 100 ? 0 : Math.min(100, s + 8 + Math.round(Math.random() * 18)))), sent >= 100 ? 1800 : 700);
    return () => clearTimeout(t);
  }, [sent]);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="rounded-xl bg-paper-2 p-5">
          <ProgressBar label="brand-film-final.mov" value={sent} showValue valueText={sent >= 100 ? "Done" : `${sent}%`} />
          <p className="mt-2 text-[12px] tabular-nums text-mute">{sent >= 100 ? "Uploaded · 248 MB" : `${Math.round(2.48 * sent)} of 248 MB`}</p>
        </div>

        <div className="flex items-center gap-4 px-1">
          <ProgressRing label="Storage used" value={72} showValue size={52} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium tracking-[-0.01em] text-ink">Storage</p>
            <p className="text-[12.5px] tabular-nums text-mute">72 of 100 GB used</p>
          </div>
          <ProgressRing label="Syncing" size={20} thickness={2.5} />
        </div>

        <ProgressBar label="Preparing export" hideLabel size="sm" />
        <p className="text-center text-[12.5px] text-mute">Pass a value to fill, leave it out for a loading state.</p>
      </div>
    </div>
  );
}
