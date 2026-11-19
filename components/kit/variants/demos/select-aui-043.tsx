"use client";

import { RichSelect } from "@/components/kit/variants/select-aui-043";

const RISE = "aui043d-rise .6s cubic-bezier(.16,1,.3,1) both";

export default function Demo() {
  return (
    <div className="flex min-h-[400px] w-full items-start justify-center px-4 pb-6 pt-6 sm:px-8">
      <style href="asta-aui043d" precedence="asta">{`@keyframes aui043d-rise { from { opacity: 0; transform: translateY(10px) } } @media (prefers-reduced-motion: reduce) { .aui043d * { animation: none !important } }`}</style>
      <div className="aui043d w-full max-w-[380px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="flex items-center gap-3" style={{ animation: RISE }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-ink text-[15px] font-semibold tracking-[-0.04em] text-paper">A</span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium tracking-[-0.02em] text-ink">Invite to Astabyte</p>
            <p className="text-[12.5px] text-mute">Design studio · 12 members</p>
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">3 seats left</span>
        </div>
        <div className="relative z-10 mt-5" style={{ animation: RISE, animationDelay: "60ms" }}>
          <p className="mb-1.5 text-[12.5px] font-medium text-ink">Invite as</p>
          <RichSelect label="Invite as" defaultOpen />
        </div>
        <div className="mt-3.5" style={{ animation: RISE, animationDelay: "120ms" }}>
          <label htmlFor="aui043d-email" className="mb-1.5 block text-[12.5px] font-medium text-ink">Email</label>
          <input
            id="aui043d-email"
            type="email"
            defaultValue="lena@astabyte.com"
            className="h-10 w-full rounded-[9px] bg-paper-2 px-3 text-[14px] text-ink outline-none transition-shadow placeholder:text-mute focus-visible:bg-paper focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]"
          />
        </div>
        <div className="mt-5 flex items-center justify-between" style={{ animation: RISE, animationDelay: "180ms" }}>
          <span className="text-[12px] text-mute">Link expires in 7 days</span>
          <button type="button" className="h-9 rounded-[8px] bg-brand px-4 text-[13px] font-medium text-white outline-none transition-transform duration-200 hover:-translate-y-px active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
            Send invite
          </button>
        </div>
      </div>
    </div>
  );
}
