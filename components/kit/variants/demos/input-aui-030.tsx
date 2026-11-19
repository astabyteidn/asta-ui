"use client";

import { useState, type CSSProperties } from "react";
import { SearchField } from "@/components/kit/variants/input-aui-030";

const EASE = "cubic-bezier(.16,1,.3,1)";
const rise = (i: number): CSSProperties => ({ animation: `aui030d-rise .6s ${EASE} ${100 + i * 55}ms both` });

const PROJECTS = [
  { name: "Brand refresh", who: "RA", when: "Edited 2h ago", tag: "Design" },
  { name: "Client portal", who: "DK", when: "Edited yesterday", tag: "Build" },
  { name: "Launch film", who: "MS", when: "Edited Mon", tag: "Motion" },
];

export default function Demo() {
  const [last, setLast] = useState("");
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center p-4 sm:p-8">
      <style href="asta-input-aui-030-demo" precedence="asta">{`@keyframes aui030d-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } } @media (prefers-reduced-motion: reduce) { .aui030d * { animation: none !important } }`}</style>
      <div className="aui030d relative min-h-[356px] w-full max-w-[560px] overflow-visible rounded-[14px] bg-ink text-paper shadow-[0_1px_2px_rgb(0_0_0/0.08),0_24px_48px_-24px_rgb(0_0_0/0.5)]">
        <div aria-hidden className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-brand)_80%,transparent),transparent)]" />
        <header className="relative z-10 flex items-center gap-3 px-4 pb-3 pt-4" style={rise(0)}>
          <span className="hidden items-center gap-2 text-[15px] font-semibold tracking-[-0.04em] sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-paper text-[13px] text-ink">A</span>
            Astabyte
          </span>
          <div className="min-w-0 flex-1 sm:ml-4">
            <SearchField defaultOpen shortcut={false} onSearch={(q) => setLast(q)} pages={[{ label: "Projects", meta: "Workspace", kind: "page" }, { label: "Billing and invoices", meta: "Settings", kind: "page" }]} />
          </div>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-medium text-paper">RA</span>
        </header>
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-baseline justify-between" style={rise(1)}>
            <h3 className="text-[20px] font-medium tracking-[-0.03em]">Projects</h3>
            <span className="text-[12.5px] text-mute">{last ? `Searched “${last}”` : "12 active"}</span>
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {PROJECTS.map((p, i) => (
              <li
                key={p.name}
                className="flex items-center gap-3 rounded-[9px] bg-[color-mix(in_srgb,var(--color-paper)_5%,transparent)] px-3 py-2.5"
                style={rise(2 + i)}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-paper)_12%,transparent)] text-[11px] font-medium">{p.who}</span>
                <span className="min-w-0 flex-1 truncate text-[14px]">{p.name}</span>
                <span className="hidden text-[12px] text-mute sm:inline">{p.when}</span>
                <span className="rounded-[6px] px-2 py-0.5 text-[11.5px] text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_14%,transparent)]">{p.tag}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
