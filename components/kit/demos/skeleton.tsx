"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/kit/button";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/kit/skeleton";

function Loaded() {
  return (
    <div className="flex w-full animate-[kit-fade_.5s_cubic-bezier(.16,1,.3,1)] flex-col gap-4 rounded-xl bg-paper p-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
      <style>{`@keyframes kit-fade { from { opacity: 0; transform: translateY(4px) } }`}</style>
      <div className="flex aspect-[16/9] w-full items-end rounded-[10px] bg-accent p-4">
        <span className="text-[22px] font-medium leading-none tracking-[-0.03em] text-white">Field notes, vol. 3</span>
      </div>
      <div className="flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[13px] font-medium text-paper">MP</span>
        <div className="flex flex-col">
          <span className="text-[14px] font-medium tracking-[-0.01em]">Maya Putri</span>
          <span className="text-[12px] text-mute">4 min read</span>
        </div>
      </div>
      <p className="px-1 pb-1 text-[13px] leading-relaxed text-ink-2">What we learned shipping motion to a payments flow, and the three animations we cut.</p>
    </div>
  );
}

export default function SkeletonDemo() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="grid w-full max-w-xl items-start gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div aria-live="polite">{loading ? <SkeletonCard /> : <Loaded />}</div>
          <Button variant="soft" size="sm" onClick={() => setLoading(true)} disabled={loading} className="self-start">
            Reload
          </Button>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute">Line</span>
            <SkeletonText lines={3} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute">Circle</span>
            <div className="flex gap-2">
              <Skeleton shape="circle" width={28} />
              <Skeleton shape="circle" width={36} />
              <Skeleton shape="circle" width={44} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute">Block</span>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton shape="block" className="aspect-square" />
              <Skeleton shape="block" className="aspect-square" />
              <Skeleton shape="block" className="aspect-square" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
