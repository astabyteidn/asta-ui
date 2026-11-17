"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const BASE =
  "group/mb relative inline-flex h-11 shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-5 text-[14px] font-medium tracking-[-0.01em] outline-none " +
  "transition-[transform,background-color,color,box-shadow] duration-300 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-45";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]";
const LIFT = "shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.16),0_6px_14px_-8px_rgb(0_0_0/0.45)]";

type Btn = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { children?: ReactNode };

const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

const Styles = () => (
  <style href="asta-motion-button" precedence="asta">{`
@keyframes kit-beam { to { transform: rotate(1turn) } }
@keyframes kit-shine { from { transform: translateX(-120%) skewX(-20deg) } to { transform: translateX(340%) skewX(-20deg) } }
@keyframes kit-confirm { from { transform: scaleX(1) } to { transform: scaleX(0) } }
@keyframes kit-pop { 0% { transform: scale(.4); opacity: 0 } 60% { transform: scale(1.15) } 100% { transform: scale(1); opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .kit-motion, .kit-motion * { animation: none !important; transition-duration: 0s !important } }
`}</style>
);

/** The label rolls up letter by letter on hover, and the next copy rolls in from below. */
export function RollButton({ children, className, ...rest }: Btn & { children: string }) {
  const letters = [...children];
  return (
    <button type="button" {...rest} aria-label={rest["aria-label"] ?? children} className={cx(BASE, "kit-motion bg-ink text-paper", LIFT, className)}>
      <Styles />
      <span aria-hidden className="relative block overflow-hidden leading-[1.25]">
        <span className="flex">
          {letters.map((l, i) => (
            <span
              key={i}
              className={cx("relative inline-block whitespace-pre transition-transform duration-500 group-hover/mb:-translate-y-full group-focus-visible/mb:-translate-y-full", EASE)}
              style={{ transitionDelay: `${i * 18}ms` }}
            >
              {l}
              <span className="absolute left-0 top-full">{l}</span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

/** A circle of colour grows from where the pointer came in and shrinks toward where it leaves. */
export function FillButton({ children, className, ...rest }: Btn) {
  const ref = useRef<HTMLButtonElement>(null);
  const [on, setOn] = useState(false);
  const at = (e: React.PointerEvent) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--fx", `${e.clientX - r.left}px`);
    el.style.setProperty("--fy", `${e.clientY - r.top}px`);
  };
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onPointerEnter={(e) => {
        at(e);
        setOn(true);
      }}
      onPointerLeave={(e) => {
        at(e);
        setOn(false);
      }}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      className={cx(BASE, "kit-motion overflow-hidden bg-paper text-ink", RING, className)}
    >
      <span
        aria-hidden
        className={cx("absolute inset-0 bg-ink transition-[clip-path] duration-500", EASE)}
        style={{ clipPath: `circle(${on ? "150%" : "0%"} at var(--fx, 50%) var(--fy, 50%))` }}
      />
      <span className={cx("relative inline-flex items-center gap-2 transition-colors duration-300", on && "text-paper")}>{children}</span>
    </button>
  );
}

/** The arrow's circle grows to fill the button while the label slides over. */
export function ArrowButton({ children, className, ...rest }: Btn) {
  return (
    <button type="button" {...rest} className={cx(BASE, "kit-motion overflow-hidden bg-paper-2 !pl-5 !pr-1.5 text-ink", RING, className)}>
      <span
        aria-hidden
        className={cx(
          "absolute right-1.5 top-1.5 h-8 w-8 rounded-[7px] bg-brand transition-[width] duration-500 group-hover/mb:w-[calc(100%-12px)] group-focus-visible/mb:w-[calc(100%-12px)]",
          EASE,
        )}
      />
      <span className={cx("relative transition-[transform,color] duration-500 group-hover/mb:translate-x-1 group-hover/mb:text-white group-focus-visible/mb:text-white", EASE)}>
        {children}
      </span>
      <span className="relative ml-2 grid h-8 w-8 place-items-center overflow-hidden text-white">
        <ArrowIcon className={cx("col-start-1 row-start-1 transition-transform duration-500 group-hover/mb:translate-x-6", EASE)} />
        <ArrowIcon className={cx("col-start-1 row-start-1 -translate-x-6 transition-transform duration-500 group-hover/mb:translate-x-0", EASE)} />
      </span>
    </button>
  );
}

/** A streak of light sweeps across on hover (and once on mount, as a hint). */
export function ShineButton({ children, className, ...rest }: Btn) {
  const [k, setK] = useState(0);
  return (
    <button
      type="button"
      {...rest}
      onPointerEnter={() => setK((v) => v + 1)}
      onFocus={() => setK((v) => v + 1)}
      className={cx(BASE, "kit-motion overflow-hidden bg-brand text-white", LIFT, className)}
    >
      <Styles />
      <span
        key={k}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent"
        style={{ animation: "kit-shine .9s cubic-bezier(.16,1,.3,1) both" }}
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

/** A beam of light runs around the border forever; it speeds up on hover. */
export function BeamButton({ children, className, ...rest }: Btn) {
  return (
    <button type="button" {...rest} className={cx(BASE, "kit-motion overflow-hidden bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] !p-[1.5px]", className)}>
      <Styles />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 aspect-square w-[300%] -translate-x-1/2 -translate-y-1/2"
      >
        <span
          className="absolute inset-0 [animation:kit-beam_3s_linear_infinite] group-hover/mb:[animation-duration:1.2s]"
          style={{ background: "conic-gradient(from 0deg, transparent 0 32%, var(--color-brand) 50%, transparent 50% 82%, var(--color-brand) 100%)" }}
        />
      </span>
      <span className="relative inline-flex h-full w-full items-center justify-center gap-2 rounded-md bg-paper px-5 text-ink">{children}</span>
    </button>
  );
}

/** A chunky key with a visible edge: it travels down when pressed and springs back. */
export function PressButton({ children, className, ...rest }: Btn) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        BASE,
        "kit-motion !rounded-[9px] bg-ink text-paper !duration-100 active:!scale-100",
        "shadow-[0_5px_0_color-mix(in_srgb,var(--color-ink)_55%,black),0_8px_16px_-6px_rgb(0_0_0/0.45)]",
        "-translate-y-[2px] hover:-translate-y-[3px] hover:shadow-[0_6px_0_color-mix(in_srgb,var(--color-ink)_55%,black),0_10px_18px_-6px_rgb(0_0_0/0.45)]",
        "active:translate-y-[3px] active:shadow-[0_0_0_color-mix(in_srgb,var(--color-ink)_55%,black),0_2px_4px_-2px_rgb(0_0_0/0.45)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Copies `value`; the icon morphs into a check and the label says so for a moment. */
export function CopyButton({ value, children = "Copy", className, ...rest }: Btn & { value: string }) {
  const [done, setDone] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button
      type="button"
      {...rest}
      onClick={async (e) => {
        rest.onClick?.(e);
        try {
          await navigator.clipboard.writeText(value);
        } catch {}
        setDone(true);
        clearTimeout(t.current);
        t.current = setTimeout(() => setDone(false), 1600);
      }}
      className={cx(BASE, "kit-motion bg-paper text-ink", RING, className)}
    >
      <Styles />
      <span className="relative grid h-4 w-4 place-items-center">
        <svg
          viewBox="0 0 16 16"
          className={cx("col-start-1 row-start-1 h-4 w-4 transition-[transform,opacity] duration-300", EASE, done ? "scale-50 opacity-0" : "scale-100 opacity-100")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <rect x="5" y="5" width="8.5" height="8.5" rx="2" />
          <path d="M10.5 5V3.8A1.8 1.8 0 0 0 8.7 2H3.8A1.8 1.8 0 0 0 2 3.8v4.9a1.8 1.8 0 0 0 1.8 1.8H5" />
        </svg>
        {done && (
          <svg viewBox="0 0 16 16" className="col-start-1 row-start-1 h-4 w-4 text-[#30a46c]" style={{ animation: "kit-pop .45s cubic-bezier(.16,1,.3,1) both" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        )}
      </span>
      <span className="relative block h-[1.25em] overflow-hidden leading-[1.25]">
        <span className={cx("flex flex-col transition-transform duration-500", EASE, done && "-translate-y-1/2")}>
          <span>{children}</span>
          <span aria-hidden={!done}>Copied</span>
        </span>
      </span>
      <span role="status" className="sr-only">
        {done ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}

/** Two-step destructive action: the first click asks, a draining bar shows how long you have, the second click confirms. */
export function ConfirmButton({
  children = "Delete",
  confirmLabel = "Click again to confirm",
  doneLabel = "Deleted",
  timeout = 3000,
  onConfirm,
  className,
  ...rest
}: Btn & { confirmLabel?: string; doneLabel?: string; timeout?: number; onConfirm?: () => void }) {
  const [stage, setStage] = useState<"idle" | "ask" | "done">("idle");
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const reset = (ms: number) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setStage("idle"), ms);
  };
  return (
    <button
      type="button"
      {...rest}
      onClick={() => {
        if (stage === "idle") {
          setStage("ask");
          reset(timeout);
        } else if (stage === "ask") {
          setStage("done");
          onConfirm?.();
          reset(1800);
        }
      }}
      onBlur={() => stage === "ask" && setStage("idle")}
      aria-live="polite"
      className={cx(
        BASE,
        "kit-motion overflow-hidden",
        stage === "idle" && cx("bg-paper text-[#e5484d]", RING),
        stage === "ask" && cx("bg-[#e5484d] text-white", LIFT),
        stage === "done" && cx("bg-paper-2 text-ink-2"),
        className,
      )}
    >
      <Styles />
      {stage === "ask" && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-white/60"
          style={{ animation: `kit-confirm ${timeout}ms linear both` }}
        />
      )}
      <span key={stage} className="relative inline-flex items-center gap-2" style={{ animation: "kit-pop .4s cubic-bezier(.16,1,.3,1) both" }}>
        {stage === "done" ? (
          <>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
            {doneLabel}
          </>
        ) : stage === "ask" ? (
          confirmLabel
        ) : (
          <>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
              <path d="M2.5 4.5h11M6.5 7v4.5M9.5 7v4.5M4 4.5l.7 8.2a1.5 1.5 0 0 0 1.5 1.3h3.6a1.5 1.5 0 0 0 1.5-1.3l.7-8.2M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
            </svg>
            {children}
          </>
        )}
      </span>
    </button>
  );
}

export default RollButton;
