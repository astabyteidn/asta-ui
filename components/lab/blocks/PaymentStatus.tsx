"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const OK = "var(--color-brand)";
const BAD = "var(--color-ink-2)";
const R = 44;
const C = 2 * Math.PI * R;

type Phase = "processing" | "verifying" | "paid" | "declined";
const WORD: Record<Phase, string> = { processing: "Processing…", verifying: "Verifying…", paid: "Paid", declined: "Declined" };

/** One ring tells the whole story: it spins, fills, then turns into a check (or, now and then, a cross). */
export default function PaymentStatus() {
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>("processing");
  const [fading, setFading] = useState(false);
  const spinner = useRef<SVGGElement>(null);
  const spinning = useRef(true);
  useEffect(() => {
    spinning.current = phase === "processing";
  }, [phase]);

  // The arc spins while processing, then glides to rest at 12 o'clock instead of snapping back.
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let a = 0;
    let v = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      if (still) a = 0;
      else if (spinning.current) {
        v += (400 - v) * (1 - Math.exp(-dt / 0.25));
        a += v * dt;
      } else {
        const rest = Math.ceil(a / 360) * 360;
        a += (rest - a) * (1 - Math.exp(-dt / 0.18));
        v = 0;
        if (rest - a < 0.05) a = 0;
      }
      spinner.current?.setAttribute("transform", `rotate(${(a % 360).toFixed(2)} 50 50)`);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const end: Phase = run % 3 === 2 ? "declined" : "paid";
    const t = still
      ? [setTimeout(() => setPhase(end), 0)]
      : [
          setTimeout(() => setPhase("verifying"), 1600),
          setTimeout(() => setPhase(end), 3200),
          setTimeout(() => setFading(true), 6000),
          setTimeout(() => {
            setFading(false);
            setPhase("processing");
            setRun((r) => r + 1);
          }, 6400),
        ];
    return () => t.forEach(clearTimeout);
  }, [run]);

  const done = phase === "paid" || phase === "declined";
  const color = phase === "paid" ? OK : phase === "declined" ? BAD : "var(--color-ink)";
  const dash = phase === "processing" ? C * 0.75 : 0;

  const replay = () => {
    setFading(false);
    setPhase("processing");
    setRun((r) => r + 1);
  };

  return (
    <button
      type="button"
      onClick={replay}
      aria-label={`Payment ${WORD[phase]}. Click to replay`}
      className="lab-ps flex h-full w-full cursor-pointer items-center justify-center px-6 pb-6 pt-12 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      style={{ containerType: "size" }}
    >
      <style href="asta-paymentstatus" precedence="asta">{`
        .lab-ps-body { display: flex; flex-direction: column; align-items: center; gap: min(5cqh, 18px); }
        .lab-ps-ring { width: min(38cqh, 30cqw, 132px); }
        .lab-ps-text { align-items: center; text-align: center; }
        @container (aspect-ratio > 1.9) {
          .lab-ps-body { flex-direction: row; gap: min(6cqw, 36px); }
          .lab-ps-ring { width: min(58cqh, 22cqw, 132px); }
          .lab-ps-text { align-items: flex-start; text-align: left; }
        }
        @keyframes lab-ps-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes lab-ps-pulse { from { transform: scale(1); opacity: .55 } to { transform: scale(1.5); opacity: 0 } }
        @keyframes lab-ps-word { from { transform: translateY(40%); opacity: 0; filter: blur(3px) } to { transform: none; opacity: 1; filter: none } }
        .lab-ps-draw { stroke-dasharray: 1; animation: lab-ps-draw .5s ${EASE} .15s both }
        .lab-ps-pulse { animation: lab-ps-pulse 1.1s ${EASE} both; transform-origin: 50% 50% }
        .lab-ps-word { animation: lab-ps-word .45s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-ps-draw, .lab-ps-pulse, .lab-ps-word { animation: none } }
      `}</style>

      <div className="lab-ps-body">
        <div className="lab-ps-ring relative aspect-square shrink-0">
          {done && <span key={`p${run}`} className="lab-ps-pulse absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 2px ${color}` }} />}
          <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden>
            <circle cx="50" cy="50" r={R} stroke="var(--color-ink)" strokeOpacity="0.1" strokeWidth="4" />
            <g ref={spinner}>
              <circle
                cx="50"
                cy="50"
                r={R}
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={dash}
                transform="rotate(-90 50 50)"
                style={{
                  transition: `stroke-dashoffset ${phase === "verifying" ? 1.5 : 0.7}s ${phase === "verifying" ? "cubic-bezier(.45,0,.2,1)" : EASE}, stroke .5s`,
                }}
              />
            </g>
            <g style={{ opacity: fading ? 0 : 1, transition: `opacity .4s ${EASE}` }}>
            {done && (
              <circle cx="50" cy="50" r={R - 9} fill={color} fillOpacity="0.12" style={{ transition: "fill .4s" }} />
            )}
            {phase === "paid" && <path key={`c${run}`} className="lab-ps-draw" pathLength={1} d="M34 51 45 62 67 39" stroke={OK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
            {phase === "declined" && (
              <path key={`x${run}`} className="lab-ps-draw" pathLength={1} d="M38 38 62 62M62 38 38 62" stroke={BAD} strokeWidth="5" strokeLinecap="round" />
            )}
            </g>
          </svg>
        </div>

        <div className="lab-ps-text flex flex-col gap-1.5">
          <span className="font-medium tabular-nums tracking-[-0.03em] text-ink" style={{ fontSize: "clamp(26px, 11cqh, 44px)", lineHeight: 1 }}>
            $248.50
          </span>
          <span key={phase} className="lab-ps-word text-[14px]" style={{ color: done ? color : "var(--color-mute)", opacity: fading ? 0 : 1, transition: `opacity .4s ${EASE}` }}>
            {WORD[phase]}
          </span>
        </div>
      </div>
    </button>
  );
}
