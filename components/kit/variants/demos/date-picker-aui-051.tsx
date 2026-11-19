"use client";

import { PresetDatePicker } from "@/components/kit/variants/date-picker-aui-051";

const RISE = "aui051d-rise .6s cubic-bezier(.16,1,.3,1) both";

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-start justify-center px-4 pb-6 pt-3 sm:px-8">
      <style href="asta-aui051d" precedence="asta">{`@keyframes aui051d-rise { from { opacity: 0; transform: translateY(10px) } } @media (prefers-reduced-motion: reduce) { .aui051d * { animation: none !important } }`}</style>
      <div className="aui051d w-full max-w-[460px] rounded-[14px] bg-ink p-5 text-paper shadow-[0_1px_2px_rgb(0_0_0/0.1),0_24px_48px_-24px_rgb(0_0_0/0.6)]">
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-paper)_45%,transparent)]" style={{ animation: RISE }}>
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-paper text-[11px] font-semibold normal-case tracking-[-0.04em] text-ink">A</span>
          Astabyte / Website / New task
        </div>
        <p className="mt-3 text-[17px] font-medium tracking-[-0.02em]" style={{ animation: RISE, animationDelay: "60ms" }}>
          Ship the Q4 case study
        </p>
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2" style={{ animation: RISE, animationDelay: "120ms" }}>
          <PresetDatePicker defaultOpen />
          <span className="flex h-10 items-center gap-2 rounded-[9px] px-3 text-[13px] text-[color-mix(in_srgb,var(--color-paper)_70%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_12%,transparent)]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-white">L</span>
            Lena
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between" style={{ animation: RISE, animationDelay: "180ms" }}>
          <span className="text-[12px] text-[color-mix(in_srgb,var(--color-paper)_45%,transparent)]">Press 1–7 for a preset</span>
          <button type="button" className="h-9 rounded-[8px] bg-paper px-4 text-[13px] font-medium text-ink outline-none transition-transform duration-200 hover:-translate-y-px active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/60">
            Create task
          </button>
        </div>
      </div>
    </div>
  );
}
