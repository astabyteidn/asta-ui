"use client";

import { CreatableCombobox } from "@/components/kit/variants/combobox-aui-047";

const EASE = "cubic-bezier(.16,1,.3,1)";

export default function Demo() {
  const rise = (i: number) => ({ animation: `aui047d-rise .6s ${EASE} ${i * 60}ms both` });
  return (
    <div className="flex min-h-[400px] w-full items-start justify-center px-4 pb-6 pt-6 sm:px-8">
      <style href="asta-aui047d" precedence="asta">{`@keyframes aui047d-rise { from { opacity: 0; transform: translateY(10px) } } @media (prefers-reduced-motion: reduce) { .aui047d * { animation: none !important } }`}</style>
      <div className="aui047d w-full max-w-[440px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-mute" style={rise(0)}>
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-ink font-sans text-[11px] font-semibold normal-case tracking-[-0.03em] text-paper">A</span>
          Astabyte <span aria-hidden>/</span> Website <span aria-hidden>/</span> New issue
        </div>
        <p className="mt-3 text-[17px] font-medium tracking-[-0.02em] text-ink" style={rise(1)}>
          Checkout button jumps on Safari
        </p>
        <p className="mt-1 text-[13px] leading-[1.55] text-mute" style={rise(1)}>
          The pay button shifts 4px down when the card form gets focus on iOS 18.
        </p>
        <div className="relative z-10 mt-4" style={rise(2)}>
          <CreatableCombobox />
        </div>
        <div className="mt-4 flex items-center justify-between" style={rise(3)}>
          <span className="flex items-center gap-2 text-[12.5px] text-mute">
            <span className="flex gap-0.5" aria-hidden>
              <span className="h-3 w-1 rounded-full bg-ink" />
              <span className="h-3 w-1 rounded-full bg-ink" />
              <span className="h-3 w-1 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_20%,transparent)]" />
            </span>
            Medium priority
          </span>
          <button type="button" className="h-8 rounded-[8px] bg-brand px-3.5 text-[13px] font-medium text-white outline-none transition-transform duration-200 hover:-translate-y-px active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
            Create issue
          </button>
        </div>
      </div>
    </div>
  );
}
