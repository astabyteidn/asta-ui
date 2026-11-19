"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FloatingInput } from "@/components/kit/variants/input-aui-029";

const EASE = "cubic-bezier(.16,1,.3,1)";
const rise = (i: number): CSSProperties => ({ animation: `aui029d-rise .6s ${EASE} ${120 + i * 55}ms both` });
const NAME = "Astabyte Studio";

export default function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("billing@astabyte.com");
  const touched = useRef(false);

  // Types the workspace name once, the first time the card scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setName(NAME);
      for (let i = 1; i <= NAME.length; i++)
        timers.push(setTimeout(() => !touched.current && setName(NAME.slice(0, i)), 700 + i * 55));
    });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="flex min-h-[340px] w-full items-center justify-center p-5 sm:p-8">
      <style href="asta-input-aui-029-demo" precedence="asta">{`@keyframes aui029d-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } } @media (prefers-reduced-motion: reduce) { .aui029d * { animation: none !important } }`}</style>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="aui029d w-full max-w-[400px] rounded-[14px] bg-paper p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]"
      >
        <div className="flex items-center gap-3" style={rise(0)}>
          <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-ink text-[15px] font-semibold tracking-[-0.04em] text-paper">A</span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Settings · General</p>
            <h3 className="text-[18px] font-medium tracking-[-0.02em] text-ink">Workspace</h3>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <div style={rise(1)}>
            <FloatingInput
              label="Workspace name"
              value={name}
              maxLength={32}
              counter
              onChange={(e) => {
                touched.current = true;
                setName(e.target.value);
              }}
              hint="Shown on invoices and invites."
            />
          </div>
          <div style={rise(2)}>
            <FloatingInput
              label="Billing email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              start={
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="2" />
                  <path d="m2.5 4.5 5.5 4 5.5-4" />
                </svg>
              }
            />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3" style={rise(3)}>
          <span className="text-[12.5px] text-mute">Last saved 2 min ago</span>
          <button
            type="submit"
            className="h-9 rounded-[8px] bg-ink px-4 text-[13.5px] font-medium text-paper outline-none transition-transform duration-200 hover:-translate-y-px active:scale-[.98] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
