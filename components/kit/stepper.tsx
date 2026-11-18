"use client";

import { useId, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface StepItem {
  title: string;
  description?: string;
  content?: ReactNode;
}

export interface StepperControls {
  step: number;
  next: () => void;
  back: () => void;
  goTo: (step: number) => void;
  isFirst: boolean;
  isLast: boolean;
  /** True once `step` has moved past the last step. */
  isComplete: boolean;
}

export interface StepperProps {
  steps: StepItem[];
  /** Current step, 0-based. `steps.length` means every step is done. */
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Lets people click a finished step to go back to it. */
  clickable?: boolean;
  /** Shown in place of step content once every step is done. */
  complete?: ReactNode;
  /** Rendered under the content, e.g. Back / Next buttons. A function gets the controls. */
  children?: ReactNode | ((controls: StepperControls) => ReactNode);
  className?: string;
}

const KEYFRAMES = `@keyframes kit-step-next { from { opacity: 0; transform: translateX(32px) } }
@keyframes kit-step-back { from { opacity: 0; transform: translateX(-32px) } }`;

function Mark({ index, state }: { index: number; state: "done" | "current" | "todo" }) {
  const done = state === "done";
  return (
    <span
      className={cx(
        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-medium tabular-nums transition-[background-color,box-shadow,color] duration-300",
        done && "bg-brand text-white",
        state === "current" && "bg-paper text-brand shadow-[inset_0_0_0_1.5px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        state === "todo" && "bg-paper text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_16%,transparent)]",
      )}
    >
      <span className={cx("transition-[opacity,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none", done ? "scale-50 opacity-0" : "scale-100 opacity-100")}>
        {index + 1}
      </span>
      <svg viewBox="0 0 16 16" className="absolute h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path
          d="m3.5 8.5 3 3 6-7"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={done ? 0 : 1}
          className="transition-[stroke-dashoffset] delay-150 duration-[450ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
        />
      </svg>
    </span>
  );
}

/**
 * A step header plus the step's content. Finished steps turn into a check that draws itself in, the line
 * between steps fills with blue, and the content slides in from the side you're heading.
 */
export function Stepper({ steps, step, defaultStep = 0, onStepChange, clickable = true, complete, children, className }: StepperProps) {
  const [inner, setInner] = useState(defaultStep);
  const current = Math.max(0, Math.min(steps.length, step ?? inner));
  const uid = useId();

  // Track direction from the previous step (adjusting state during render, no effect needed).
  const [prev, setPrev] = useState(current);
  const [dir, setDir] = useState<1 | -1>(1);
  if (prev !== current) {
    setDir(current > prev ? 1 : -1);
    setPrev(current);
  }

  const goTo = (n: number) => {
    const next = Math.max(0, Math.min(steps.length, n));
    if (next === current) return;
    if (step === undefined) setInner(next);
    onStepChange?.(next);
  };

  const isComplete = current >= steps.length;
  const controls: StepperControls = {
    step: current,
    next: () => goTo(current + 1),
    back: () => goTo(current - 1),
    goTo,
    isFirst: current === 0,
    isLast: current === steps.length - 1,
    isComplete,
  };

  const body = isComplete ? complete : steps[current]?.content;

  return (
    <div className={cx("flex w-full flex-col", className)}>
      <style href="asta-stepper" precedence="asta">{KEYFRAMES}</style>
      <ol aria-label="Progress" className="flex items-start">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          const canClick = clickable && state === "done" && !isComplete;
          const label = (
            <>
              <Mark index={i} state={state} />
              <span className={cx("min-w-0 flex-col text-left", state === "current" ? "flex" : "hidden sm:flex")}>
                <span className={cx("truncate text-[13px] font-medium tracking-[-0.01em] transition-colors duration-300", state === "todo" ? "text-mute" : "text-ink")}>{s.title}</span>
                {s.description && <span className="truncate text-[12px] text-mute">{s.description}</span>}
              </span>
            </>
          );
          return (
            <li key={s.title} aria-current={state === "current" ? "step" : undefined} className={cx("flex min-w-0 items-center", i < steps.length - 1 && "flex-1")}>
              {canClick ? (
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${s.title}, done. Go back to this step`}
                  className="-m-1 flex min-w-0 items-center gap-2.5 rounded-lg p-1 outline-none transition-transform duration-200 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.98]"
                >
                  {label}
                </button>
              ) : (
                <span className="flex min-w-0 items-center gap-2.5">
                  {label}
                  <span className="sr-only">{state === "done" ? ", done" : state === "todo" ? ", not started" : ""}</span>
                </span>
              )}
              {i < steps.length - 1 && (
                <span aria-hidden className="relative mx-3 h-[2px] min-w-6 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
                  <span
                    className="absolute inset-0 origin-left rounded-full bg-brand transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
                    style={{ transform: `scaleX(${i < current ? 1 : 0})` }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 overflow-hidden">
        <div
          key={current}
          id={`${uid}-panel`}
          role="region"
          aria-label={isComplete ? "Done" : steps[current]?.title}
          className={cx(
            "motion-reduce:!animate-none",
            dir === 1 ? "animate-[kit-step-next_.42s_cubic-bezier(.16,1,.3,1)_both]" : "animate-[kit-step-back_.42s_cubic-bezier(.16,1,.3,1)_both]",
          )}
        >
          {body}
        </div>
      </div>

      {children && <div className="mt-6">{typeof children === "function" ? children(controls) : children}</div>}
    </div>
  );
}

export default Stepper;
