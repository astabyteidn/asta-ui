"use client";

import { useState, type CSSProperties } from "react";
import { AppNavbar } from "@/components/kit/variants/navbar-aui-012";

const FRAME =
  "relative w-full max-w-[920px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]";

const REVENUE = [42, 48, 45, 53, 51, 58, 62, 60, 67, 71, 69, 78];
const at = (n: number) => ({ "--i": n }) as CSSProperties;

function Chart() {
  const w = 300;
  const h = 84;
  const max = 84;
  const min = 36;
  const pts = REVENUE.map((v, i) => [(i / (REVENUE.length - 1)) * w, h - ((v - min) / (max - min)) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 4}`} className="mt-auto h-[64px] w-full overflow-visible pt-3" preserveAspectRatio="none" aria-hidden>
      <path d={`${line} L${w} ${h + 4} L0 ${h + 4} Z`} fill="color-mix(in srgb, var(--color-brand) 10%, transparent)" />
      <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinejoin="round" pathLength={1} className="demo-012-line" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="var(--color-brand)" />
    </svg>
  );
}

export default function Demo() {
  const [unread, setUnread] = useState(3);
  return (
    <div className="flex w-full items-center justify-center p-3 sm:p-6">
      <style href="asta-demo-navbar-aui-012" precedence="asta">{`
        @keyframes demo-012-rise { from { opacity: 0; transform: translateY(12px); } }
        @keyframes demo-012-draw { from { stroke-dashoffset: 1; } }
        .demo-012-in { animation: demo-012-rise .7s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(250ms + var(--i, 0) * 60ms); }
        .demo-012-line { stroke-dasharray: 1; animation: demo-012-draw 1.4s .5s cubic-bezier(.16,1,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .demo-012-in, .demo-012-line { animation: none; } }
      `}</style>
      <div className={FRAME}>
        <div className="h-[360px] overflow-y-auto overscroll-contain bg-paper [scrollbar-width:thin]">
          <AppNavbar shortcut={false} tour unread={unread} onNotifications={() => setUnread(0)} />
          <main className="px-4 pb-10 pt-6 sm:px-6">
            <div style={at(0)} className="demo-012-in flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Finance · November</p>
                <h1 className="mt-1 text-[clamp(1.6rem,3.4vw,2rem)] font-semibold leading-none tracking-[-0.04em] text-ink">Good morning, Mara</h1>
              </div>
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13px] font-medium text-paper transition-transform duration-300 hover:-translate-y-px">
                <span aria-hidden>+</span> New invoice
              </a>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <section style={at(1)} className={`demo-012-in flex flex-col rounded-[12px] bg-paper p-4 ${RING}`}>
                <div className="flex items-baseline justify-between">
                  <p className="text-[13px] text-mute">Revenue, last 12 weeks</p>
                  <span className="rounded-[5px] bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-1.5 py-0.5 text-[11.5px] font-medium text-brand">+18.4%</span>
                </div>
                <p className="mt-1 flex items-start text-[30px] font-medium leading-none tracking-[-0.04em] text-ink">
                  <span className="mr-0.5 mt-1 text-[16px]">€</span>184,920
                </p>
                <Chart />
              </section>
              <section style={at(2)} className="demo-012-in grid grid-rows-2 gap-3">
                <div className={`rounded-[12px] bg-paper p-4 ${RING}`}>
                  <p className="text-[13px] text-mute">Outstanding</p>
                  <p className="mt-1 text-[20px] font-medium tracking-[-0.03em] text-ink">€14,260</p>
                  <p className="mt-0.5 text-[12px] text-mute">2 invoices · 1 overdue</p>
                </div>
                <div className="rounded-[12px] bg-ink p-4 text-paper">
                  <p className="text-[13px] text-paper/60">Next payout</p>
                  <p className="mt-1 text-[20px] font-medium tracking-[-0.03em]">€8,410</p>
                  <p className="mt-0.5 text-[12px] text-paper/55">Arrives Friday, 22 Nov</p>
                </div>
              </section>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
