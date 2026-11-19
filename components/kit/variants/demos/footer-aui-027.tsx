"use client";

import { CtaFooter } from "@/components/kit/variants/footer-aui-027";

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[920px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <CtaFooter />
      </div>
    </div>
  );
}
