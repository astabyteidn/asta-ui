"use client";

import type { CSSProperties } from "react";
import { MinimalNavbar } from "@/components/kit/variants/navbar-aui-009";

const FRAME =
  "relative w-full max-w-[920px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const at = (n: number) => ({ "--i": n }) as CSSProperties;

export default function Demo() {
  return (
    <div className="flex w-full items-center justify-center p-3 sm:p-6">
      <style href="asta-demo-navbar-aui-009" precedence="asta">{`
        @keyframes demo-009-rise { from { opacity: 0; transform: translateY(10px); } }
        .demo-009-in { animation: demo-009-rise .65s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(200ms + var(--i, 0) * 55ms); }
        @media (prefers-reduced-motion: reduce) { .demo-009-in { animation: none; } }
      `}</style>
      <div className={FRAME}>
        <div className="h-[360px] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <MinimalNavbar openOnMount="Product" />
          <section className="flex flex-col items-center px-5 pb-14 pt-12 text-center">
            <a href="#" onClick={(e) => e.preventDefault()} style={at(0)} className="demo-009-in inline-flex h-7 items-center gap-2 rounded-full bg-paper-2 pl-1 pr-3 text-[12.5px] text-ink-2">
              <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-paper">New</span>
              Roadmaps 2.0 is out
            </a>
            <h1 style={at(1)} className="demo-009-in mt-5 max-w-[18ch] text-[clamp(1.9rem,4.4vw,2.5rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink">
              Roadmaps your whole team actually reads.
            </h1>
            <p style={at(2)} className="demo-009-in mt-3 text-[14.5px] text-mute">
              Plan the quarter in one line, link every bar to real work.
            </p>
            <div style={at(3)} className="demo-009-in mt-6 flex gap-2">
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[13.5px] font-medium text-white transition-transform duration-300 hover:-translate-y-px active:scale-[.97]">
                Start free
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-9 items-center rounded-lg px-4 text-[13.5px] font-medium text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] transition-colors hover:bg-paper-2">
                Watch the tour
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
