"use client";

import { PricingTable } from "@/components/kit/variants/pricing-aui-021";

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-3xl flex-col gap-7">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Pricing · Astabyte</p>
            <h2 className="mt-2 text-[40px] font-medium leading-[1.02] tracking-[-0.045em] text-ink">Compare every plan.</h2>
          </div>
          <p className="max-w-[300px] text-[14px] leading-relaxed text-mute">Every plan includes unlimited viewers and SOC 2 reports. Switch or cancel any time.</p>
        </div>
        <PricingTable maxHeight={380} hint />
      </div>
    </div>
  );
}
