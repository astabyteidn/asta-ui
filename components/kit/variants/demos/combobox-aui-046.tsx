"use client";

import { useEffect, useRef, useState } from "react";
import { AssignCombobox } from "@/components/kit/variants/combobox-aui-046";

const EASE = "cubic-bezier(.16,1,.3,1)";

export default function Demo() {
  const [ids, setIds] = useState(["lena", "arif"]);
  const touched = useRef(false);
  // One-time hint: a teammate joins the stack shortly after mount.
  useEffect(() => {
    const t = setTimeout(() => !touched.current && setIds((v) => (v.includes("maya") ? v : [...v, "maya"])), 1400);
    return () => clearTimeout(t);
  }, []);
  const rise = (i: number) => ({ animation: `aui046d-rise .6s ${EASE} ${i * 60}ms both` });

  return (
    <div className="flex min-h-[400px] w-full items-start justify-center px-4 pb-6 pt-6 sm:px-8">
      <style href="asta-aui046d" precedence="asta">{`@keyframes aui046d-rise { from { opacity: 0; transform: translateY(10px) } } @media (prefers-reduced-motion: reduce) { .aui046d * { animation: none !important } }`}</style>
      <div className="aui046d w-full max-w-[420px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="flex items-center justify-between gap-3" style={rise(0)}>
          <p className="truncate text-[17px] font-medium tracking-[-0.02em] text-ink">Ship the new pricing page</p>
          <span className="flex shrink-0 items-center gap-1.5 rounded-[7px] bg-[color-mix(in_srgb,var(--color-brand)_9%,transparent)] px-2 py-1 text-[11.5px] font-medium text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            In progress
          </span>
        </div>
        <div className="relative z-10 mt-4" style={rise(2)}>
          <p className="mb-1.5 text-[12.5px] font-medium text-ink">Assignees</p>
          <AssignCombobox
            value={ids}
            onChange={(v) => {
              touched.current = true;
              setIds(v);
            }}
          />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2" style={rise(3)}>
          {[
            ["Ticket", "AB-214"],
            ["Due", "Fri, Nov 27"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[10px] bg-paper-2 px-3 py-2.5">
              <dt className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">{k}</dt>
              <dd className="mt-0.5 truncate text-[13px] font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
