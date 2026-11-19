"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AffixInput } from "@/components/kit/variants/input-aui-031";

const EASE = "cubic-bezier(.16,1,.3,1)";
const rise = (i: number): CSSProperties => ({ animation: `aui031d-rise .6s ${EASE} ${120 + i * 55}ms both` });
const SUB = "studio";
const group = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const Label = ({ htmlFor, children }: { htmlFor: string; children: string }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium tracking-[-0.01em] text-ink">
    {children}
  </label>
);

export default function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState("");
  const [budget, setBudget] = useState("2,400");
  const [unit, setUnit] = useState("min");
  const touched = useRef(false);

  // Types the subdomain once so the suffix can be seen riding along.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setSub(SUB);
      for (let i = 1; i <= SUB.length; i++) timers.push(setTimeout(() => !touched.current && setSub(SUB.slice(0, i)), 800 + i * 90));
    });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="flex min-h-[340px] w-full items-center justify-center p-5 sm:p-8">
      <style href="asta-input-aui-031-demo" precedence="asta">{`@keyframes aui031d-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } } @media (prefers-reduced-motion: reduce) { .aui031d * { animation: none !important } }`}</style>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="aui031d w-full max-w-[460px] rounded-[14px] bg-paper p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]"
      >
        <div className="flex items-start justify-between gap-4" style={rise(0)}>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Publish</p>
            <h3 className="mt-1 text-[20px] font-medium tracking-[-0.02em] text-ink">Your client portal</h3>
          </div>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-paper-2 px-2.5 py-1 text-[12px] text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Draft
          </span>
        </div>

        <div className="mt-5" style={rise(1)}>
          <Label htmlFor="aui031-sub">Site address</Label>
          <AffixInput
            id="aui031-sub"
            value={sub}
            onChange={(e) => {
              touched.current = true;
              setSub(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            copy
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" style={rise(2)}>
          <div>
            <Label htmlFor="aui031-budget">Monthly budget</Label>
            <AffixInput id="aui031-budget" prefix="$" suffix="USD" ride={false} inputMode="numeric" value={budget} onChange={(e) => setBudget(group(e.target.value))} placeholder="0" />
          </div>
          <div>
            <Label htmlFor="aui031-idle">Sign out after</Label>
            <AffixInput id="aui031-idle" prefix={null} units={["min", "hours", "days"]} unit={unit} onUnitChange={setUnit} inputMode="numeric" defaultValue="30" placeholder="30" />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3" style={rise(3)}>
          <span className="text-[12.5px] text-mute">SSL is issued in about a minute.</span>
          <button
            type="submit"
            className="group inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-brand px-4 text-[13.5px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.98] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Publish
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
