"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const LINE = "bg-[color-mix(in_srgb,var(--color-ink)_16%,transparent)]";

const GOAL = "Draft the Q3 launch brief";
const AGENTS = [
  { role: "Research", task: "Compare pricing on 6 rival sites", unit: "sources", total: 6, end: 3300, found: "Rivals charge 12–18% more for teams" },
  { role: "Data", task: "Pull trial-to-paid for Q3", unit: "queries", total: 4, end: 2300, found: "Trial-to-paid reached 9.4% in October" },
  { role: "Writing", task: "Draft the headline and key messages", unit: "drafts", total: 3, end: 4300, found: "Headline plus 3 key messages drafted" },
];

type Phase = "plan" | "split" | "merge";
type S = { phase: Phase; prog: number[]; done: number[] };
const INIT: S = { phase: "plan", prog: AGENTS.map(() => 0), done: [] };

/** The whole run as [delay before, change]. Built once, so the loop can pause and resume anywhere. */
const STEPS: [number, (s: S) => S][] = (() => {
  const events: { at: number; f: (s: S) => S }[] = [{ at: 1000, f: (s) => ({ ...s, phase: "split" }) }];
  const WORK = 1500;
  AGENTS.forEach((a, i) => {
    for (let k = 1; k <= a.total; k++)
      events.push({ at: WORK + (a.end * k) / a.total, f: (s) => ({ ...s, prog: s.prog.map((p, j) => (j === i ? k : p)) }) });
    events.push({ at: WORK + a.end + 450, f: (s) => ({ ...s, done: [...s.done, i] }) });
  });
  const last = Math.max(...events.map((e) => e.at));
  events.push({ at: last + 900, f: (s) => ({ ...s, phase: "merge" }) });
  events.sort((a, b) => a.at - b.at);
  return events.map((e, i) => [e.at - (i ? events[i - 1].at : 0), e.f]);
})();

const Check = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

/** A lead agent splits a goal into three subagent tasks. They work, report back one by one and merge into a summary. Hover to pause. */
export default function AgentTeam() {
  const [s, setS] = useState<S>(INIT);
  const [fade, setFade] = useState(false);
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [visible, setVisible] = useState(true);
  const [run, setRun] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const k = useRef(0);
  const paused = hover || focusIn || !visible;

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
    const step = () => {
      if (k.current >= STEPS.length) {
        // Hold on the summary, then fade and start over.
        later(4200, () => setFade(true));
        later(4700, () => {
          k.current = 0;
          setS(INIT);
        });
        later(4800, () => setFade(false));
        later(5000, step);
        return;
      }
      const [wait, f] = STEPS[k.current];
      later(wait, () => {
        k.current++;
        setS(f);
        step();
      });
    };
    step();
    return () => {
      alive = false;
      t.forEach(clearTimeout);
    };
  }, [paused, run]);

  const restart = () => {
    k.current = 0;
    setS(INIT);
    setHover(false);
    setFocusIn(false);
    // The button goes away with the summary, so keep keyboard focus on the card.
    root.current?.focus();
    setRun((r) => r + 1);
  };
  const toggle = () => setHover((h) => !h);

  const out = s.phase !== "plan";
  const merged = s.phase === "merge";
  const running = AGENTS.length - s.done.length;
  const status = s.phase === "plan" ? "Planning" : merged ? "Done · 41 s" : s.done.length ? `${s.done.length} of 3 reported` : "3 running";

  return (
    <div
      ref={root}
      role="group"
      tabIndex={0}
      aria-label={`Agent team. Goal: ${GOAL}. ${status}. ${hover ? "Paused" : "Live"}. Press space to ${hover ? "resume" : "pause"}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      onPointerUp={(e) => e.pointerType !== "mouse" && !(e.target as HTMLElement).closest("button") && toggle()}
      onFocus={(e) => setFocusIn(e.target !== e.currentTarget)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocusIn(false)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          toggle();
        }
      }}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      style={{ containerType: "size" }}
    >
      <style href="asta-agentteam" precedence="asta">{`
        @keyframes lab-at-dot { 0%, 100% { opacity: .25 } 40% { opacity: 1 } }
        @keyframes lab-at-pop { from { transform: scale(.9); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-at-in { from { transform: translateY(6px); opacity: 0 } to { transform: none; opacity: 1 } }
        .lab-at-dot { animation: lab-at-dot 1.1s ${EASE} infinite }
        .lab-at-pop { animation: lab-at-pop .45s ${EASE} both }
        .lab-at-in { animation: lab-at-in .5s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-at-dot, .lab-at-pop, .lab-at-in { animation: none } .lab-at-move { transition: none !important } }
      `}</style>

      <div
        className={`flex w-full max-w-[520px] flex-col rounded-[14px] bg-paper p-[clamp(10px,3.4cqmin,16px)] ${RING} shadow-[0_18px_40px_-28px_rgb(0_0_0/0.35)]`}
        style={{ opacity: fade ? 0 : 1, transition: `opacity .45s ${EASE}` }}
      >
        {/* Lead agent */}
        <div className="relative z-10 flex items-center gap-2.5 rounded-[11px] bg-paper-2 p-[clamp(8px,2.6cqmin,11px)]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-brand text-paper">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M8 1.5c.4 3.2 1.4 4.6 4.8 5.2v.6C9.4 7.9 8.4 9.3 8 12.5h-.1c-.4-3.2-1.4-4.6-4.8-5.2v-.6C6.5 6.1 7.5 4.7 7.9 1.5zM12.6 10.5c.2 1.4.7 2 2 2.3-1.3.3-1.8.9-2 2.3-.2-1.4-.7-2-2-2.3 1.3-.3 1.8-.9 2-2.3z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[11px] text-mute">Lead agent</span>
            <span className="block truncate text-[13.5px] font-medium tracking-[-0.01em] text-ink">{GOAL}</span>
          </span>
          <span
            key={status}
            className={`lab-at-pop flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] tabular-nums ${merged ? "bg-brand text-paper" : "bg-paper text-ink-2"}`}
            aria-live="polite"
          >
            {s.phase === "plan" && (
              <span aria-hidden className="flex gap-[3px]">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="lab-at-dot h-1 w-1 rounded-full bg-current" style={{ animationDelay: `${d * 160}ms` }} />
                ))}
              </span>
            )}
            {merged && <Check className="h-3 w-3" />}
            {status}
          </span>
        </div>

        {/* Branches */}
        <div className="relative h-[clamp(12px,4.5cqh,22px)]" aria-hidden>
          <span className={`lab-at-move absolute left-1/2 top-0 h-1/2 w-px origin-top ${LINE}`} style={{ transform: `scaleY(${out && !merged ? 1 : 0})`, transition: `transform .35s ${EASE}` }} />
          <span className={`lab-at-move absolute left-[16.67%] right-[16.67%] top-1/2 h-px ${LINE}`} style={{ transform: `scaleX(${out && !merged ? 1 : 0})`, transition: `transform .45s ${EASE} ${out && !merged ? ".12s" : "0s"}` }} />
          {AGENTS.map((a, i) => (
            <span key={a.role} className="absolute top-1/2 h-1/2 w-px" style={{ left: `${16.67 + i * 33.33}%` }}>
              <span className={`lab-at-move absolute inset-0 origin-top ${LINE}`} style={{ transform: `scaleY(${out && !merged ? 1 : 0})`, transition: `transform .3s ${EASE} ${out && !merged ? ".3s" : "0s"}` }} />
              {/* A report travels back up as a blue fill. */}
              <span className="lab-at-move absolute inset-0 origin-bottom bg-brand" style={{ transform: `scaleY(${s.done.includes(i) && !merged ? 1 : 0})`, transition: `transform .4s ${EASE}` }} />
            </span>
          ))}
        </div>

        {/* Subagents, and the summary they merge into */}
        <div className="relative">
          <ol className="grid min-h-[100px] grid-cols-3 gap-[clamp(6px,2cqw,10px)]" aria-label="Subagents">
            {AGENTS.map((a, i) => {
              const done = s.done.includes(i);
              const p = s.prog[i] / a.total;
              const shown = out && !merged;
              return (
                <li
                  key={a.role}
                  className={`lab-at-move flex min-w-0 flex-col gap-[max(4px,1.4cqh)] rounded-[11px] bg-paper p-[clamp(7px,2.4cqmin,11px)] ${RING}`}
                  style={{
                    transform: shown ? "none" : `translate(${(1 - i) * 100}%, ${merged ? "-40%" : "-55%"}) scale(.9)`,
                    opacity: shown ? 1 : 0,
                    transition: `transform .6s ${EASE} ${shown ? `${i * 70}ms` : "0ms"}, opacity .45s ${EASE} ${shown ? `${i * 70}ms` : "0ms"}`,
                  }}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className="truncate font-mono text-[10px] uppercase tracking-wider text-ink-2">{a.role}</span>
                    <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${done ? "bg-brand text-paper" : RING}`} style={{ transition: `background-color .3s ${EASE}` }}>
                      {done && <Check className="lab-at-pop h-2 w-2" />}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-[12px] leading-snug text-ink">{a.task}</span>
                  <span className="mt-auto flex flex-col gap-1">
                    <span className="h-1 overflow-hidden rounded-full bg-paper-2">
                      <span className="lab-at-move block h-full origin-left rounded-full bg-brand" style={{ transform: `scaleX(${p})`, transition: `transform .5s ${EASE}` }} />
                    </span>
                    <span className="truncate text-[10.5px] tabular-nums text-mute">
                      {done ? "Reported" : `${s.prog[i]}/${a.total} ${a.unit}`}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          {merged && (
            <div className="lab-at-pop absolute inset-0 flex flex-col gap-[max(4px,1.2cqh)] rounded-[11px] bg-paper p-[clamp(8px,2.6cqmin,12px)] shadow-[inset_0_0_0_1.5px_var(--color-brand),0_14px_30px_-20px_rgb(0_0_0/0.5)]">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium tracking-[-0.01em] text-ink">Launch brief ready</span>
                <button
                  type="button"
                  onClick={restart}
                  className="shrink-0 rounded-[7px] bg-paper-2 px-2 py-1 text-[11px] font-medium text-ink outline-none hover:bg-[color-mix(in_srgb,var(--color-ink)_10%,var(--color-paper-2))] focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  Run it again
                </button>
              </div>
              <ul className="flex min-h-0 flex-col gap-[max(2px,0.8cqh)]">
                {s.done.map((i, n) => (
                  <li key={i} className="lab-at-in flex min-w-0 items-baseline gap-2 text-[11.5px] leading-snug" style={{ animationDelay: `${120 + n * 90}ms` }}>
                    <span className="w-[54px] shrink-0 font-mono text-[9.5px] uppercase tracking-wider text-mute">{AGENTS[i].role}</span>
                    <span className="truncate text-ink">{AGENTS[i].found}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <span className="sr-only" aria-live="polite">
          {merged ? "All three reports merged into the summary" : running < 3 ? `${s.done.length} of 3 subagents reported` : ""}
        </span>
      </div>
    </div>
  );
}
