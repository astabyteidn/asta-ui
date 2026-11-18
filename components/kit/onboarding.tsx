"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/kit/button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const CURVE = "cubic-bezier(.16,1,.3,1)";

export interface OnboardingStep {
  id: string;
  title: string;
  description: ReactNode;
  /** Label of the button that completes the step. */
  action?: string;
  /** Rough time, e.g. "2 min". */
  duration?: string;
}
export interface OnboardingProps {
  title?: string;
  subtitle?: string;
  steps: OnboardingStep[];
  defaultCompleted?: string[];
  /** Runs when a step's button is pressed. Return a promise and the button shows progress until it resolves. */
  onStep?: (id: string) => void | Promise<void>;
  /** The done state's button. Leave it out to hide the button. */
  onFinish?: () => void;
  finishLabel?: string;
  className?: string;
}

const Check = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 8.5l2.5 2.5 5.5-6" />
  </svg>
);

function Mark({ done, current }: { done: boolean; current: boolean }) {
  return (
    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
      <span
        className={cx(
          "absolute inset-0 rounded-full transition-[opacity,transform] duration-300",
          EASE,
          done ? "scale-75 opacity-0" : "scale-100 opacity-100",
          current
            ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
            : "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]",
        )}
      />
      <span
        className={cx(
          "absolute inset-0 flex items-center justify-center rounded-full bg-brand text-white transition-[opacity,transform] duration-500",
          EASE,
          done ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <Check className="h-3 w-3" />
      </span>
    </span>
  );
}

/**
 * A setup checklist. One step is open at a time. Completing it ticks the mark, fills the bar and opens
 * the next step that is still to do. When everything is done the card turns into a short done state.
 */
export function Onboarding({ title = "Get set up", subtitle, steps, defaultCompleted = [], onStep, onFinish, finishLabel = "Go to dashboard", className }: OnboardingProps) {
  const [done, setDone] = useState<string[]>(defaultCompleted);
  // Latest done list, so completions that resolve together don't overwrite each other.
  const doneRef = useRef(done);
  const firstOpen = steps.find((s) => !defaultCompleted.includes(s.id))?.id ?? null;
  const [open, setOpen] = useState<string | null>(firstOpen);
  const [busy, setBusy] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const uid = useId();

  const total = steps.length;
  const count = steps.filter((s) => done.includes(s.id)).length;
  const finished = count === total && !review;

  const complete = async (id: string) => {
    try {
      const r = onStep?.(id);
      if (r instanceof Promise) {
        setBusy(id);
        await r;
      }
    } catch (err) {
      // A failed step stays open and to do. The caller owns the error message.
      console.error(err);
      return;
    } finally {
      setBusy((b) => (b === id ? null : b));
    }
    const next = doneRef.current.includes(id) ? doneRef.current : [...doneRef.current, id];
    doneRef.current = next;
    setDone((d) => (d.includes(id) ? d : [...d, id]));
    // Open the next step still to do, looking forward first, then from the top.
    const i = steps.findIndex((s) => s.id === id);
    const after = [...steps.slice(i + 1), ...steps.slice(0, i)].find((s) => !next.includes(s.id));
    setOpen(after?.id ?? null);
  };

  return (
    <div
      className={cx(
        "kit-ob relative w-full max-w-[440px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_18px_40px_-24px_rgb(0_0_0/0.3)]",
        className,
      )}
    >
      <style href="asta-onboarding" precedence="asta">{`
        @keyframes kit-ob-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes kit-ob-pop { 0% { opacity: 0; transform: scale(.6); } 60% { opacity: 1; transform: scale(1.06); } 100% { transform: none; } }
        @media (prefers-reduced-motion: reduce) { .kit-ob, .kit-ob * { animation: none !important; transition-duration: 0s !important; } }
      `}</style>

      {finished ? (
        <div className="flex flex-col items-center px-8 py-12 text-center" style={{ animation: `kit-ob-in .5s ${CURVE} both` }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white" style={{ animation: `kit-ob-pop .6s ${CURVE} .1s both` }}>
            <Check className="h-6 w-6" />
          </span>
          <h3 className="mt-5 text-[18px] font-medium tracking-[-0.02em] text-ink">You are all set</h3>
          <p className="mt-1.5 max-w-[30ch] text-[13.5px] leading-relaxed text-mute">Every step is done. You can come back to this list from Settings.</p>
          <div className="mt-6 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setReview(true)}>
              Review steps
            </Button>
            {onFinish && (
              <Button size="sm" onClick={onFinish}>
                {finishLabel}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="px-5 pb-4 pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
              <span className="text-[12.5px] tabular-nums text-mute">
                {count} of {total}
              </span>
            </div>
            {subtitle && <p className="mt-1 text-[13px] text-mute">{subtitle}</p>}
            <div
              role="progressbar"
              aria-label="Setup progress"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={count}
              className="mt-4 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]"
            >
              <div className={cx("h-full origin-left rounded-full bg-brand transition-transform duration-700", EASE)} style={{ transform: `scaleX(${count / total})` }} />
            </div>
          </div>

          <ol className="px-2 pb-2">
            {steps.map((s) => {
              const isDone = done.includes(s.id);
              const isOpen = open === s.id;
              const panel = `${uid}-${s.id}`;
              return (
                <li key={s.id} className={cx("rounded-[10px] transition-colors duration-300", isOpen && "bg-paper-2")}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panel}
                    onClick={() => setOpen(isOpen ? null : s.id)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    <Mark done={isDone} current={isOpen} />
                    <span className={cx("flex-1 text-[14px] transition-colors duration-300", isDone && !isOpen ? "text-mute" : "text-ink")}>
                      {s.title}
                      {isDone && <span className="sr-only"> (done)</span>}
                    </span>
                    {s.duration && !isDone && <span className="text-[12px] tabular-nums text-mute">{s.duration}</span>}
                    <svg
                      viewBox="0 0 16 16"
                      className={cx("h-3.5 w-3.5 shrink-0 text-mute transition-transform duration-300", EASE, isOpen && "rotate-180")}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      aria-hidden
                    >
                      <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
                    </svg>
                  </button>
                  <div id={panel} role="region" aria-label={s.title} className={cx("grid transition-[grid-template-rows] duration-500", EASE, isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden" inert={!isOpen}>
                      <div className={cx("pb-4 pl-11 pr-4 transition-[opacity,transform] duration-500", EASE, isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0")}>
                        <div className="text-[13px] leading-relaxed text-mute">{s.description}</div>
                        <div className="mt-3.5 flex items-center gap-2">
                          {isDone ? (
                            <span className="flex items-center gap-1.5 text-[12.5px] text-mute">
                              <Check className="h-3.5 w-3.5 text-brand" />
                              Done
                            </span>
                          ) : (
                            <Button size="sm" loading={busy === s.id} onClick={() => complete(s.id)}>
                              {s.action ?? "Mark as done"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

export default Onboarding;
