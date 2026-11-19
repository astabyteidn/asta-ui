"use client";

import { SinglePlan } from "@/components/kit/variants/pricing-aui-022";

const ART = "/lab/art/parasol.webp";

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-3 sm:p-6">
      <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[14px] px-4 py-10 sm:px-10 sm:py-14">
        <img src={ART} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl" />
        <div aria-hidden className="absolute inset-0 bg-paper/25" />
        <SinglePlan image={ART} hint className="relative" />
      </div>
    </div>
  );
}
