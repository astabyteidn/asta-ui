"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

const KEYFRAMES = `@keyframes asta-plan-spin { to { transform: rotate(360deg) } }
@keyframes asta-plan-pop { from { opacity: 0; transform: scale(.6) } }
@keyframes asta-plan-draw { from { stroke-dashoffset: 1 } }
@keyframes asta-plan-in { from { opacity: 0; transform: translateY(4px) } }
@media (prefers-reduced-motion: reduce) { .asta-plan-a, .asta-plan-a * { animation: none !important; transition-duration: 0s !important } }`;

export type PlanStepStatus = "pending" | "running" | "done" | "skipped" | "failed";

export interface PlanStep {
  id: string;
  title: string;
  status: PlanStepStatus;
  /** The live log line while running, or a short result or reason once settled. */
  detail?: string;
  /** When the step started (epoch ms). A running step counts up from here. */
  startedAt?: number;
  /** How long it took in ms, once settled. */
  duration?: number;
  /** Smaller steps inside this one. They show when the row is open. */
  substeps?: PlanStep[];
}

export interface AgentPlanProps {
  /** What the agent is doing, e.g. "Migrate billing to usage-based plans". */
  title: string;
  steps: PlanStep[];
  /** Something on the right of the header, e.g. a Stop button. */
  action?: ReactNode;
  /** Shown under the list, e.g. Retry after a failure. */
  footer?: ReactNode;
  className?: string;
}

/** 4200 → "4.2s", 75000 → "1m 15s". */
export const formatStepTime = (ms: number) => {
  const s = Math.max(0, ms) / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  if (s < 60) return `${Math.floor(s)}s`;
  return `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, "0")}s`;
};

const settled = (s: PlanStepStatus) => s === "done" || s === "skipped" || s === "failed";

/** Current time while something runs, ticking four times a second. Rests offscreen and in hidden tabs. */
function useNow(on: boolean, el: RefObject<HTMLElement | null>) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!on) return;
    const node = el.current;
    let seen = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(Date.now());
    const sync = () => {
      clearInterval(timer);
      timer = undefined;
      if (seen && !document.hidden) {
        tick();
        timer = setInterval(tick, 250);
      }
    };
    const io = node
      ? new IntersectionObserver(([e]) => {
          seen = e.isIntersecting;
          sync();
        })
      : null;
    if (node) io?.observe(node);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      clearInterval(timer);
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [on, el]);
  return now;
}

function StatusIcon({ status, small }: { status: PlanStepStatus; small?: boolean }) {
  const box = small ? "h-3.5 w-3.5" : "h-[18px] w-[18px]";
  if (status === "running")
    return (
      <svg viewBox="0 0 18 18" className={cx(box, "asta-plan-a shrink-0 animate-[asta-plan-spin_.8s_linear_infinite] text-brand")} fill="none" aria-hidden>
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
        <path d="M16 9a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (status === "done")
    return (
      <span className={cx(box, "asta-plan-a grid shrink-0 place-items-center rounded-full bg-brand text-white animate-[asta-plan-pop_.35s_cubic-bezier(.16,1,.3,1)_both]")} aria-hidden>
        <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3.5 8.5 3 3 6-7" pathLength={1} strokeDasharray={1} className="asta-plan-a animate-[asta-plan-draw_.45s_cubic-bezier(.16,1,.3,1)_.1s_both]" />
        </svg>
      </span>
    );
  if (status === "failed")
    return (
      <span className={cx(box, "asta-plan-a grid shrink-0 place-items-center rounded-full bg-ink text-paper animate-[asta-plan-pop_.35s_cubic-bezier(.16,1,.3,1)_both]")} aria-hidden>
        <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M8 4v5M8 12h.01" />
        </svg>
      </span>
    );
  if (status === "skipped")
    return (
      <span className={cx(box, "grid shrink-0 place-items-center rounded-full text-mute shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_20%,transparent)]")} aria-hidden>
        <svg viewBox="0 0 16 16" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 8h6" />
        </svg>
      </span>
    );
  return <span className={cx(box, "shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_20%,transparent)]")} aria-hidden />;
}

const WORD: Record<PlanStepStatus, string> = { pending: "Pending", running: "Running", done: "Done", skipped: "Skipped", failed: "Failed" };

function elapsed(s: PlanStep, now: number) {
  if (s.status === "running" && s.startedAt) return Math.max(0, (now || s.startedAt) - s.startedAt);
  return s.duration;
}

/**
 * A task list an agent works through while you watch. Steps go from pending to running to done, skipped or
 * failed, each with its own timer. The running step opens by itself to show its live log line, and its check
 * draws in when it finishes. Failures use a word and an icon, not red.
 */
export function AgentPlan({ title, steps, action, footer, className }: AgentPlanProps) {
  const root = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const running = steps.some((s) => s.status === "running" || s.substeps?.some((x) => x.status === "running"));
  const now = useNow(running, root);

  const total = steps.length;
  const doneCount = steps.filter((s) => settled(s.status)).length;
  const failedAt = steps.findIndex((s) => s.status === "failed");
  const current = steps.findIndex((s) => s.status === "running");
  const allDone = total > 0 && doneCount === total && failedAt < 0;
  const spent = steps.reduce((a, s) => a + (elapsed(s, now) ?? 0), 0);

  const state = failedAt >= 0 ? `Stopped at step ${failedAt + 1}` : allDone ? "Done" : running ? "Running" : doneCount === 0 ? "Not started" : "Paused";
  const live =
    failedAt >= 0
      ? `Step ${failedAt + 1} failed: ${steps[failedAt].title}.`
      : current >= 0
        ? `Step ${current + 1} of ${total}: ${steps[current].title}.`
        : allDone
          ? `All ${total} steps done.`
          : "";

  return (
    <section
      ref={root}
      aria-label={title}
      className={cx(
        "asta-plan-a flex w-full flex-col rounded-[14px] bg-paper text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_1px_2px_rgb(0_0_0/0.04)]",
        className,
      )}
    >
      <style href="asta-agent-plan" precedence="asta">{KEYFRAMES}</style>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
      <header className="flex flex-col gap-3 px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12px] text-mute">
              {running && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand animate-[asta-plan-pop_1.2s_ease-in-out_infinite_alternate]" />}
              <span className={cx(failedAt >= 0 && "font-medium text-ink")}>{state}</span>
              {spent > 0 && <span className="tabular-nums">· {formatStepTime(spent)}</span>}
            </p>
            <h3 className="mt-0.5 text-[14.5px] font-medium leading-snug tracking-[-0.01em]">{title}</h3>
          </div>
          {action}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-paper-2">
            <span
              className={cx("absolute inset-0 origin-left transition-[transform,background-color] duration-700 motion-reduce:transition-none", failedAt >= 0 ? "bg-ink" : "bg-brand")}
              style={{ transform: `scaleX(${total ? doneCount / total : 0})`, transitionTimingFunction: CURVE }}
            />
          </div>
          <p className="shrink-0 text-[12px] tabular-nums text-mute">
            <span className="font-medium text-ink">{doneCount}</span> of {total}
          </p>
        </div>
      </header>

      {total === 0 ? (
        <p className="px-4 pb-5 text-[13px] text-mute">The plan shows up here once the agent has one.</p>
      ) : (
        <ol className="flex flex-col px-2 pb-2">
          {steps.map((s, i) => {
            const subs = s.substeps ?? [];
            const canOpen = !!s.detail || subs.length > 0;
            const open = canOpen && (pinned[s.id] ?? (s.status === "running" || s.status === "failed"));
            const t = elapsed(s, now);
            const bodyId = `plan-${s.id}`;
            const row = (
              <>
                <StatusIcon key={s.status} status={s.status} />
                <span
                  className={cx(
                    "min-w-0 flex-1 text-left text-[13.5px] leading-snug [overflow-wrap:anywhere]",
                    s.status === "pending" && "text-mute",
                    s.status === "running" && "font-medium text-ink",
                    s.status === "done" && "text-ink-2",
                    s.status === "skipped" && "text-mute line-through decoration-[color-mix(in_srgb,var(--color-ink)_30%,transparent)]",
                    s.status === "failed" && "font-medium text-ink",
                  )}
                >
                  {s.title}
                </span>
                {(s.status === "skipped" || s.status === "failed") && (
                  <span className={cx("shrink-0 rounded px-1.5 py-px text-[11px]", s.status === "failed" ? "bg-ink font-medium text-paper" : "bg-paper-2 text-mute")}>{WORD[s.status]}</span>
                )}
                {t !== undefined && s.status !== "skipped" && <span className="w-12 shrink-0 text-right text-[12px] tabular-nums text-mute">{formatStepTime(t)}</span>}
                {canOpen && (
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden
                    className={cx("h-3.5 w-3.5 shrink-0 text-mute transition-transform duration-300", open && "rotate-90")}
                    style={{ transitionTimingFunction: CURVE }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 4 4 4-4 4" />
                  </svg>
                )}
              </>
            );
            return (
              <li key={s.id} className="relative">
                {i < total - 1 && (
                  <span aria-hidden className="pointer-events-none absolute bottom-[-6px] left-[17px] top-[30px] w-px bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]" />
                )}
                {canOpen ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={bodyId}
                    onClick={() => setPinned((p) => ({ ...p, [s.id]: !open }))}
                    className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2 py-2 outline-none transition-colors duration-200 hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    {row}
                    <span className="sr-only">, {WORD[s.status]}</span>
                  </button>
                ) : (
                  <div className="flex min-h-10 w-full items-center gap-2.5 px-2 py-2">
                    {row}
                    <span className="sr-only">, {WORD[s.status]}</span>
                  </div>
                )}
                {open && (
                  <div id={bodyId} className="asta-plan-a flex flex-col gap-1.5 pb-2 pl-[38px] pr-2 animate-[asta-plan-in_.3s_cubic-bezier(.16,1,.3,1)_both]">
                    {s.detail && (
                      <p
                        key={s.detail}
                        className={cx(
                          "asta-plan-a truncate text-[12px] leading-relaxed animate-[asta-plan-in_.3s_cubic-bezier(.16,1,.3,1)_both]",
                          s.status === "running" ? "font-mono text-mute" : s.status === "failed" ? "whitespace-normal text-ink" : "text-mute",
                        )}
                        title={s.detail}
                      >
                        {s.detail}
                      </p>
                    )}
                    {subs.length > 0 && (
                      <ul className="flex flex-col gap-1">
                        {subs.map((x) => (
                          <li key={x.id} className="flex items-center gap-2 text-[12.5px]">
                            <StatusIcon key={x.status} status={x.status} small />
                            <span className={cx("min-w-0 flex-1 truncate", x.status === "pending" ? "text-mute" : x.status === "running" ? "text-ink" : "text-ink-2")}>{x.title}</span>
                            <span className="sr-only">, {WORD[x.status]}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {footer && <div className="px-4 pb-4">{footer}</div>}
    </section>
  );
}

export default AgentPlan;
