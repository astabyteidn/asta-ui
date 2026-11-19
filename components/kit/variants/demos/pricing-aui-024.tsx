"use client";

import { useState } from "react";
import { PricingTiers } from "@/components/kit/variants/pricing-aui-024";

const INVOICES = [
  { id: "INV-2041", date: "Nov 1, 2026", plan: "Hobby", amount: "$0.00" },
  { id: "INV-1987", date: "Oct 1, 2026", plan: "Hobby", amount: "$0.00" },
  { id: "INV-1932", date: "Sep 1, 2026", plan: "Hobby", amount: "$0.00" },
  { id: "INV-1874", date: "Aug 1, 2026", plan: "Hobby", amount: "$0.00" },
  { id: "INV-1820", date: "Jul 1, 2026", plan: "Hobby", amount: "$0.00" },
];

export default function Demo() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-3 sm:p-6">
      <div className="relative min-h-[580px] w-full max-w-[860px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div aria-hidden className="select-none">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[10px] font-semibold text-paper">NS</span>
              <span className="text-[14px] font-medium text-ink">Astabyte</span>
            </div>
            <div className="hidden gap-5 text-[13px] text-mute sm:flex">
              <span>Projects</span>
              <span>Members</span>
              <span className="text-ink">Billing</span>
            </div>
          </div>
          <div className="px-6 pb-8 pt-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Settings · Billing</p>
            <h2 className="mt-2 text-[40px] font-medium leading-[1.02] tracking-[-0.045em] text-ink">Billing and plan</h2>
            <p className="mt-2 text-[14px] text-mute">You are on Hobby, which includes 1 seat. Your studio has 12 members.</p>
            <table className="mt-8 w-full text-left text-[13.5px]">
              <thead className="text-[12px] text-mute">
                <tr>
                  <th className="pb-3 font-normal">Invoice</th>
                  <th className="pb-3 font-normal">Date</th>
                  <th className="hidden pb-3 font-normal sm:table-cell">Plan</th>
                  <th className="pb-3 text-right font-normal">Amount</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                {INVOICES.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 font-mono text-[12.5px]">{r.id}</td>
                    <td className="py-2.5">{r.date}</td>
                    <td className="hidden py-2.5 sm:table-cell">{r.plan}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/15 p-4 backdrop-blur-[1.5px]">
          <PricingTiers hint onChange={() => setPicked(null)} onContinue={setPicked} />
          <p className="h-4 text-[12px] text-paper" aria-live="polite">
            {picked && `Continuing with ${picked}`}
          </p>
        </div>
      </div>
    </div>
  );
}
