"use client";

import { UsagePricing } from "@/components/kit/variants/pricing-aui-023";

const FACTS = [
  { k: "Volume pricing", v: "Every seat drops to the tier price, not just the extra ones." },
  { k: "Prorated daily", v: "Add or remove seats any day. You pay for the days you use." },
  { k: "Annual invoices", v: "Scale and Volume can pay yearly by bank transfer." },
];

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-[880px] flex-wrap items-center justify-center gap-x-10 gap-y-8">
        <div className="max-w-[270px] flex-1 basis-[220px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Pricing · Astabyte</p>
          <h2 className="mt-3 text-[40px] font-medium leading-[1.02] tracking-[-0.045em] text-ink">Pay per seat. Less as you grow.</h2>
          <dl className="mt-7 flex flex-col gap-4">
            {FACTS.map((f) => (
              <div key={f.k}>
                <dt className="text-[14px] font-medium text-ink">{f.k}</dt>
                <dd className="mt-0.5 text-[13px] leading-snug text-mute">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <UsagePricing intro />
      </div>
    </div>
  );
}
