"use client";

import { GroupedSelect } from "@/components/kit/variants/select-aui-045";

const EASE = "cubic-bezier(.16,1,.3,1)";
const GUESTS = ["LM", "AR", "TK", "SN"];

export default function Demo() {
  const rise = (i: number) => ({ animation: `aui045d-rise .6s ${EASE} ${i * 60}ms both` });
  return (
    <div className="flex min-h-[400px] w-full items-start justify-center px-4 pb-6 pt-6 sm:px-8">
      <style href="asta-aui045d" precedence="asta">{`@keyframes aui045d-rise { from { opacity: 0; transform: translateY(10px) } } @media (prefers-reduced-motion: reduce) { .aui045d * { animation: none !important } }`}</style>
      <div className="aui045d w-full max-w-[400px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="flex items-center justify-between gap-3" style={rise(0)}>
          <p className="text-[17px] font-medium tracking-[-0.02em] text-ink">Design review</p>
          <span className="rounded-[7px] bg-paper-2 px-2 py-1 font-mono text-[11.5px] tabular-nums text-ink">Thu · 10:00–10:45</span>
        </div>
        <div className="relative z-10 mt-4" style={rise(1)}>
          <p className="mb-1.5 text-[12.5px] font-medium text-ink">Time zone</p>
          <GroupedSelect defaultValue="jakarta" />
        </div>
        <div className="mt-5 flex items-center justify-between" style={rise(2)}>
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5">
              {GUESTS.map((g, i) => (
                <span
                  key={g}
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-full text-[10.5px] font-semibold shadow-[0_0_0_2px_var(--color-paper)] " +
                    (i === 0 ? "bg-brand text-white" : i === 1 ? "bg-ink text-paper" : "bg-paper-2 text-ink")
                  }
                >
                  {g}
                </span>
              ))}
            </div>
            <span className="text-[12.5px] text-mute">4 guests, 3 time zones</span>
          </div>
          <button type="button" className="h-8 rounded-[8px] bg-ink px-3.5 text-[13px] font-medium text-paper outline-none transition-transform duration-200 hover:-translate-y-px active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
