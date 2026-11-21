"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const TOTAL = 186.4;
const PEOPLE = [
  { name: "You", tone: "bg-ink text-paper" },
  { name: "Ingrid S.", tone: "bg-brand text-paper" },
  { name: "Kwame A.", tone: "bg-paper-2 text-ink" },
  { name: "Yuki T.", tone: "bg-[color-mix(in_srgb,var(--color-brand)_16%,var(--color-paper))] text-brand" },
];
// Phases: 1–4 people at the table, 5 requests sent, 6–8 friends pay one by one.
const LAST = 8;

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const initials = (n: string) => (n === "You" ? "Y" : n.replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0]).join(""));

/** Digits that roll to the new value instead of jumping. */
function Roll({ value, instant }: { value: string; instant: boolean }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-start leading-[1.1em] tabular-nums" aria-label={value}>
      {chars.map((c, i) => {
        const key = chars.length - i;
        if (!/\d/.test(c))
          return (
            <span key={`s${key}`} aria-hidden className="inline-block h-[1.1em]">
              {c}
            </span>
          );
        return (
          <span key={`d${key}`} aria-hidden className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1em]">
            <span className="invisible">0</span>
            <span
              className="absolute left-0 top-0 flex flex-col motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(c) * 1.1}em)`, transition: instant ? "none" : `transform .8s ${EASE} ${(chars.length - i) * 22}ms` }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.1em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const Check = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m3.5 8.5 3 3 6-7" pathLength={1} className="lab-sb-draw" />
  </svg>
);

/** Friends join the bill and everyone's share rolls down; requests go out and each one ticks to Paid. Hover to pause. */
export default function SplitBill() {
  const [phase, setPhase] = useState(1);
  const [fade, setFade] = useState(false);
  const [instant, setInstant] = useState(false);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const k = useRef(1);
  const paused = hover || !visible;

  // Rest while off screen or in a hidden tab.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = true;
    const sync = () => setVisible(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const t: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const later = (ms: number, f: () => void) => t.push(setTimeout(() => alive && f(), ms));
    const cycle = () => {
      if (k.current >= LAST) {
        setFade(true);
        later(450, () => {
          k.current = 1;
          setInstant(true);
          setPhase(1);
        });
        later(560, () => setInstant(false));
        later(620, () => setFade(false));
        later(1700, cycle);
        return;
      }
      setPhase(++k.current);
      later(k.current === 4 || k.current === 5 ? 2000 : 1500, cycle);
    };
    later(1200, cycle);
    return () => {
      alive = false;
      t.forEach(clearTimeout);
      setFade(false);
    };
  }, [paused]);

  const n = Math.min(phase, 4);
  const share = Math.round((TOTAL / n) * 100) / 100;
  const sent = phase >= 5;
  const paidCount = Math.max(0, phase - 5);
  const collected = sent ? share * (1 + paidCount) : share;
  const toggle = () => setHover((h) => !h);

  return (
    <div
      ref={root}
      role="group"
      tabIndex={0}
      aria-label={`Split bill ${money(TOTAL)} between ${n}. ${money(share)} each. ${hover ? "Paused" : "Live"}. Press space to ${hover ? "resume" : "pause"}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      onPointerUp={(e) => e.pointerType !== "mouse" && toggle()}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      style={{ containerType: "size" }}
    >
      <style href="asta-splitbill" precedence="asta">{`
        @keyframes lab-sb-pop { 0% { transform: scale(.4); opacity: 0 } 60% { transform: scale(1.12) } 100% { transform: none; opacity: 1 } }
        @keyframes lab-sb-in { from { opacity: 0; transform: translateY(-30%) } }
        @keyframes lab-sb-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        .lab-sb-pop { animation: lab-sb-pop .5s ${EASE} both }
        .lab-sb-in { animation: lab-sb-in .5s ${EASE} both }
        .lab-sb-draw { stroke-dasharray: 1; animation: lab-sb-draw .5s ${EASE} .1s both }
        @media (prefers-reduced-motion: reduce) { .lab-sb-pop, .lab-sb-in, .lab-sb-draw { animation: none } }
      `}</style>

      <div
        className={`flex w-full max-w-[400px] flex-col gap-[max(8px,2.8cqh)] rounded-[14px] bg-paper p-[clamp(12px,4cqmin,18px)] ${RING} shadow-[0_18px_40px_-28px_rgb(0_0_0/0.35)]`}
        style={{ opacity: fade ? 0 : 1, transition: `opacity .45s ${EASE}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-mute">Dinner at Juniper · Fri</p>
            <p className="text-[13.5px] font-medium text-ink">Total {money(TOTAL)}</p>
          </div>
          <div className="flex -space-x-1.5" aria-hidden>
            {PEOPLE.slice(0, n).map((p) => (
              <span key={p.name} className={`lab-sb-pop grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold ring-2 ring-paper ${p.tone}`}>
                {initials(p.name)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[11px] bg-paper-2 px-3.5 py-3">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-mute">Each pays · split {n} ways</p>
          <p className="mt-1 font-medium tracking-[-0.035em] text-ink" style={{ fontSize: "clamp(24px, 9cqmin, 36px)", lineHeight: 1 }}>
            <Roll value={money(share)} instant={instant} />
          </p>
        </div>

        <ul className="flex flex-col gap-0.5" aria-live="polite">
          {PEOPLE.slice(0, n).map((p, i) => {
            const paid = i === 0 || i <= paidCount;
            return (
              <li key={p.name} className={`flex h-[clamp(28px,9cqh,36px)] items-center gap-2.5 px-1 ${instant ? "" : "lab-sb-in"}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9.5px] font-semibold ${p.tone}`}>{initials(p.name)}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{p.name}</span>
                <span className="text-[12.5px] tabular-nums text-ink-2">{money(share)}</span>
                <span className="flex w-[78px] shrink-0 justify-end">
                  {i === 0 ? (
                    <span className="text-[11px] text-mute">Paid the bill</span>
                  ) : paid ? (
                    <span key="paid" className="lab-sb-pop inline-flex items-center gap-1 rounded-md bg-brand/12 px-1.5 py-0.5 text-[11px] font-medium text-brand">
                      <Check className="h-3 w-3" />
                      Paid
                    </span>
                  ) : sent ? (
                    <span key="req" className="lab-sb-pop rounded-md bg-paper-2 px-1.5 py-0.5 text-[11px] text-ink-2">
                      Requested
                    </span>
                  ) : (
                    <span className="text-[11px] text-mute">Joined</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-mute">Collected</span>
            <span className="tabular-nums text-ink">
              {money(Math.min(TOTAL, collected))} of {money(TOTAL)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full origin-left rounded-full bg-brand"
              style={{ transform: `scaleX(${Math.min(1, collected / TOTAL)})`, transition: instant ? "none" : `transform .8s ${EASE}` }}
            />
          </div>
          <div
            className={`relative mt-1 flex h-9 items-center justify-center overflow-hidden rounded-[9px] text-[13px] font-medium ${sent ? "bg-paper-2 text-ink" : "bg-ink text-paper"}`}
            style={{ transition: `background-color .4s ${EASE}, color .4s ${EASE}` }}
          >
            {sent ? (
              <span key="s" className="lab-sb-in inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-brand" />
                {paidCount >= 3 ? "Everyone’s paid" : `Requests sent · ${paidCount} of 3 paid`}
              </span>
            ) : (
              <span key="r">{n === 1 ? "Add friends to split" : `Request ${money(share)} from ${n - 1} ${n === 2 ? "friend" : "friends"}`}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
