"use client";

import { useEffect, useState } from "react";
import { PlanRadio } from "@/components/kit/variants/radio-group-aui-055";

export default function Demo() {
  const [plan, setPlan] = useState("team");
  // One hint after mount: the ring glides down to Business, the total and button roll.
  useEffect(() => {
    const t = setTimeout(() => setPlan((p) => (p === "team" ? "business" : p)), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center p-5 sm:p-8">
      <PlanRadio value={plan} onChange={setPlan} />
    </div>
  );
}
