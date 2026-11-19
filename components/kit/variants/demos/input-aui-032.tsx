"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ValidatedInput, type ValidatedInputStatus } from "@/components/kit/variants/input-aui-032";

const EASE = "cubic-bezier(.16,1,.3,1)";
const rise = (i: number): CSSProperties => ({ animation: `aui032d-rise .6s ${EASE} ${120 + i * 55}ms both` });
const TYPO = "rani@astabyte.co";
const TEAM = [
  { i: "DK", c: "bg-ink text-paper" },
  { i: "MS", c: "bg-paper-2 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]" },
  { i: "AL", c: "bg-brand text-paper" },
];

export default function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [sent, setSent] = useState(false);
  const touched = useRef(false);

  // Types an address with a typo, then takes the suggested fix, once.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      for (let i = 1; i <= TYPO.length; i++) timers.push(setTimeout(() => !touched.current && setEmail(TYPO.slice(0, i)), 700 + i * 60));
      timers.push(setTimeout(() => !touched.current && setEmail(`${TYPO}m`), 700 + TYPO.length * 60 + 2200));
    });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="flex min-h-[340px] w-full items-center justify-center p-5 sm:p-8">
      <style href="asta-input-aui-032-demo" precedence="asta">{`@keyframes aui032d-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } } @media (prefers-reduced-motion: reduce) { .aui032d * { animation: none !important } }`}</style>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) setSent(true);
        }}
        className="aui032d w-full max-w-[400px] rounded-[14px] bg-paper p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]"
      >
        <div className="flex items-center justify-between" style={rise(0)}>
          <div>
            <h3 className="text-[20px] font-medium tracking-[-0.02em] text-ink">Invite a teammate</h3>
            <p className="mt-1 text-[13.5px] text-mute">They join the Astabyte workspace as an editor.</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2" style={rise(1)}>
          <span className="flex -space-x-2">
            {TEAM.map((t) => (
              <span key={t.i} className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-medium ring-2 ring-paper ${t.c}`}>
                {t.i}
              </span>
            ))}
          </span>
          <span className="text-[12.5px] text-mute">3 of 5 seats used</span>
        </div>
        <div className="mt-5" style={rise(2)}>
          <ValidatedInput
            value={email}
            onChange={(v) => {
              touched.current = true;
              setSent(false);
              setEmail(v);
            }}
            onStatus={(s: ValidatedInputStatus) => setOk(s.kind === "valid")}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3" style={rise(3)}>
          <span className="text-[12.5px] text-mute" role="status">
            {sent ? `Invite sent to ${email.trim()}.` : "Links expire in 7 days."}
          </span>
          <button
            type="submit"
            disabled={!ok}
            className="h-9 shrink-0 rounded-[8px] bg-ink px-4 text-[13.5px] font-medium text-paper outline-none transition-[transform,opacity] duration-300 enabled:hover:-translate-y-px enabled:active:scale-[.98] disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Send invite
          </button>
        </div>
      </form>
    </div>
  );
}
