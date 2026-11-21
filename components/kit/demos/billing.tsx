"use client";

import { useState } from "react";
import { Billing } from "@/components/kit/billing";

const GB = (n: number) => `${Math.round(n)} GB`;

export default function BillingDemo() {
  const [note, setNote] = useState("");
  return (
    <div className="flex min-h-[640px] w-full justify-center p-4 sm:p-8">
      <div className="w-full max-w-[920px]">
        <div className="mb-6">
          <h2 className="text-[20px] font-medium tracking-[-0.03em]">Billing</h2>
          <p className="mt-1 text-[13px] text-mute">Astabyte workspace · 8 members</p>
        </div>
        <Billing
          currentPlan="team"
          renewsOn="Dec 1, 2026"
          daysLeft={10}
          periodDays={30}
          plans={[
            { id: "starter", name: "Starter", price: 12, blurb: "For one person", features: ["3 projects", "10 GB storage", "Email support"] },
            { id: "team", name: "Team", price: 48, blurb: "For small teams", features: ["Unlimited projects", "100 GB storage", "Shared libraries"] },
            { id: "scale", name: "Scale", price: 120, blurb: "For growing studios", features: ["Everything in Team", "1 TB storage", "SSO and audit log"] },
          ]}
          usage={[
            { label: "Storage", value: 82, max: 100, format: GB },
            { label: "Seats", value: 8, max: 10 },
            { label: "API requests", value: 412_000, max: 1_000_000, format: (n) => `${Math.round(n / 1000)}k` },
            { label: "Exports", value: 37, max: 200 },
          ]}
          card={{ last4: "4821", expires: "08/28", holder: "Astabyte Studio" }}
          onUpdateCard={() => setNote("Card form would open here (demo).")}
          onChangePlan={() => new Promise((r) => setTimeout(r, 1100))}
          invoices={[
            { id: "INV-2026-0111", date: "Nov 1, 2026", amount: 48, status: "paid", href: "#" },
            { id: "INV-2026-0098", date: "Oct 1, 2026", amount: 48, status: "paid", href: "#" },
            { id: "INV-2026-0083", date: "Sep 1, 2026", amount: 36.8, status: "paid", href: "#" },
            { id: "INV-2026-0067", date: "Aug 1, 2026", amount: 12, status: "paid", href: "#" },
          ]}
        />
        <p className="mt-2 h-5 text-[12.5px] text-mute" aria-live="polite">
          {note}
        </p>
      </div>
    </div>
  );
}
