"use client";

import type { CSSProperties } from "react";
import { CenteredNavbar } from "@/components/kit/variants/navbar-aui-011";

const FRAME =
  "relative w-full max-w-[920px] overflow-hidden rounded-[14px] bg-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const at = (n: number) => ({ "--i": n }) as CSSProperties;

export default function Demo() {
  return (
    <div className="flex w-full items-center justify-center p-3 sm:p-6">
      <style href="asta-demo-navbar-aui-011" precedence="asta">{`
        @keyframes demo-011-rise { from { opacity: 0; transform: translateY(10px); } }
        .demo-011-in { animation: demo-011-rise .65s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(300ms + var(--i, 0) * 55ms); }
        @media (prefers-reduced-motion: reduce) { .demo-011-in { animation: none; } }
      `}</style>
      <div className={FRAME}>
        <div className="h-[360px] overflow-y-auto overscroll-contain bg-[radial-gradient(60%_80%_at_50%_100%,color-mix(in_srgb,var(--color-brand)_30%,transparent),transparent)] [scrollbar-width:thin]">
          <CenteredNavbar active={2} openOnMount="Shop" />
          <section className="flex flex-col items-center px-5 pb-14 pt-14 text-center text-paper">
            <p style={at(0)} className="demo-011-in font-mono text-[11px] uppercase tracking-[0.08em] text-paper/55">
              Autumn collection · 14 pieces
            </p>
            <h1 style={at(1)} className="demo-011-in mt-4 max-w-[20ch] text-[clamp(1.9rem,4.4vw,2.5rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
              Made slowly, for the table you use every day.
            </h1>
            <p style={at(2)} className="demo-011-in mt-3 text-[14.5px] text-paper/60">
              Hand-thrown in Porto. Fired twice, shipped in a week.
            </p>
            <div style={at(3)} className="demo-011-in mt-6 flex gap-2">
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[13.5px] font-medium text-white transition-transform duration-300 hover:-translate-y-px active:scale-[.97]">
                Shop the collection
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-9 items-center rounded-lg px-4 text-[13.5px] font-medium text-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_18%,transparent)] transition-colors hover:bg-paper/10">
                Visit the studio
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
