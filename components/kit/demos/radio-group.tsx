"use client";

import { useState } from "react";
import { RadioGroup } from "@/components/kit/radio-group";

const PLANS = [
  { value: "starter", label: "Starter", aside: "$0", description: "For side projects and trying things out." },
  { value: "pro", label: "Pro", aside: "$24", description: "Unlimited projects and a custom domain." },
  { value: "team", label: "Team", aside: "$79", description: "Shared workspaces, roles and audit logs." },
];

const SHIPPING = [
  { value: "standard", label: "Standard", aside: "Free", description: "3–5 business days" },
  { value: "express", label: "Express", aside: "$12", description: "Next business day" },
  { value: "pickup", label: "Pick up in store", aside: "Free", disabled: true, description: "Not available near you" },
];

export default function RadioGroupDemo() {
  const [plan, setPlan] = useState("pro");

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-[640px] flex-col gap-8">
        <div>
          <p className="mb-3 text-[13px] text-mute">
            Plan · <span className="text-ink">{PLANS.find((p) => p.value === plan)?.label}</span>
          </p>
          <RadioGroup label="Plan" options={PLANS} value={plan} onChange={setPlan} />
        </div>
        <div className="max-w-sm">
          <p className="mb-3 text-[13px] text-mute">Shipping</p>
          <RadioGroup label="Shipping" variant="list" options={SHIPPING} defaultValue="standard" />
        </div>
      </div>
    </div>
  );
}
