"use client";

import { useEffect, useRef, useState } from "react";
import { EmailTagInput } from "@/components/kit/variants/tag-input-aui-048";

const EASE = "cubic-bezier(.16,1,.3,1)";

export default function Demo() {
  const [emails, setEmails] = useState(["lena@astabyte.com", "tom@kessler.studio"]);
  const touched = useRef(false);
  // One-time hint: a mistyped address lands, shakes and waits to be fixed.
  useEffect(() => {
    const t = setTimeout(() => !touched.current && setEmails((v) => (v.includes("arif@astabyte") ? v : [...v, "arif@astabyte"])), 1500);
    return () => clearTimeout(t);
  }, []);
  const rise = (i: number) => ({ animation: `aui048d-rise .6s ${EASE} ${i * 60}ms both` });

  return (
    <div className="flex min-h-[360px] w-full items-center justify-center px-4 py-8 sm:p-10">
      <style href="asta-aui048d" precedence="asta">{`@keyframes aui048d-rise { from { opacity: 0; transform: translateY(10px) } } @media (prefers-reduced-motion: reduce) { .aui048d * { animation: none !important } }`}</style>
      <div className="aui048d w-full max-w-[480px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="flex items-center gap-3" style={rise(0)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-paper-2 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_7%,transparent)]" aria-hidden>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M4 1.8h5.5L12.5 5v9.2H4Z M9.5 1.8V5h3 M6 8.5h4.5M6 11h3" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium tracking-[-0.02em] text-ink">Share “Q4 roadmap”</p>
            <p className="text-[12.5px] text-mute">Astabyte · Edited 2h ago</p>
          </div>
        </div>
        <div className="mt-4" style={rise(1)}>
          <EmailTagInput
            value={emails}
            onChange={(v) => {
              touched.current = true;
              setEmails(v);
            }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3" style={rise(2)}>
          <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-mute">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="8" cy="8" r="6" />
              <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
            </svg>
            <span className="truncate">Anyone at Astabyte can view</span>
          </span>
          <button type="button" className="h-8 shrink-0 rounded-[8px] bg-brand px-3.5 text-[13px] font-medium text-white outline-none transition-transform duration-200 hover:-translate-y-px active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
