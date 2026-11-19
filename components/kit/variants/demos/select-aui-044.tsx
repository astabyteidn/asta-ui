"use client";

import { useEffect, useRef, useState } from "react";
import { PillSelect } from "@/components/kit/variants/select-aui-044";

const EASE = "cubic-bezier(.16,1,.3,1)";
const NEXT: Record<string, string> = { instant: "As it happens", hourly: "Today at 15:00", daily: "Tomorrow at 09:00", weekly: "Monday at 09:00" };

const ABOUT = [
  { value: "mentions", label: "Mentions", pill: "mentions", hint: "@you" },
  { value: "replies", label: "Mentions and replies", pill: "mentions and replies" },
  { value: "all", label: "All activity", pill: "all activity" },
];
const WHERE = [
  { value: "redesign", label: "Website redesign", hint: "12" },
  { value: "brand", label: "Brand refresh", hint: "4" },
  { value: "all", label: "All projects", pill: "all projects", hint: "16" },
];

export default function Demo() {
  const [freq, setFreq] = useState("weekly");
  const touched = useRef(false);
  // One-time hint: the first pill rolls to a new word shortly after mount.
  useEffect(() => {
    const t = setTimeout(() => !touched.current && setFreq("daily"), 1300);
    return () => clearTimeout(t);
  }, []);
  const rise = (i: number) => ({ animation: `aui044d-rise .6s ${EASE} ${i * 60}ms both` });

  return (
    <div className="flex min-h-[380px] w-full items-center justify-center px-4 py-8 sm:p-10">
      <style href="asta-aui044d" precedence="asta">{`@keyframes aui044d-rise { from { opacity: 0; transform: translateY(10px) } } @keyframes aui044d-swap { from { opacity: 0; transform: translateY(6px) } } @media (prefers-reduced-motion: reduce) { .aui044d * { animation: none !important } }`}</style>
      <div className="aui044d w-full max-w-[460px] rounded-[14px] bg-paper p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="flex items-center justify-between" style={rise(0)}>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Email digest</span>
          <span className="flex items-center gap-1.5 text-[12px] text-mute">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            lena@astabyte.com
          </span>
        </div>
        <p className="relative z-10 mt-4 text-[21px] font-medium leading-[1.65] tracking-[-0.025em] text-ink sm:text-[23px]" style={rise(1)}>
          Email me{" "}
          <PillSelect
            label="Frequency"
            value={freq}
            onChange={(v) => {
              touched.current = true;
              setFreq(v);
            }}
          />{" "}
          about <PillSelect label="Topic" options={ABOUT} defaultValue="mentions" /> in{" "}
          <PillSelect label="Project" options={WHERE} defaultValue="redesign" />.
        </p>
        <div className="mt-6 flex items-center gap-3 rounded-[11px] bg-paper-2 px-4 py-3" style={rise(2)}>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Next digest</p>
            <p key={freq} className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink" style={{ animation: `aui044d-swap .45s ${EASE} both` }}>
              {NEXT[freq]}
            </p>
          </div>
          <span className="text-[12.5px] tabular-nums text-mute">4 updates waiting</span>
        </div>
      </div>
    </div>
  );
}
