"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type TooltipSide = "top" | "right" | "bottom" | "left";

// Shared by every tooltip on the page: once one has been shown, the next opens instantly
// (as long as the pointer moves over within the grace period).
let warmUntil = 0;
const GRACE = 400;

const PLACE: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2 origin-top",
  left: "right-full top-1/2 mr-2 -translate-y-1/2 origin-right",
  right: "left-full top-1/2 ml-2 -translate-y-1/2 origin-left",
};
// Where it slides in from while hidden.
const FROM: Record<TooltipSide, string> = {
  top: "translate-y-1",
  bottom: "-translate-y-1",
  left: "translate-x-1",
  right: "-translate-x-1",
};
const ARROW: Record<TooltipSide, string> = {
  top: "left-1/2 top-full -translate-x-1/2 -translate-y-1/2",
  bottom: "left-1/2 bottom-full -translate-x-1/2 translate-y-1/2",
  left: "top-1/2 left-full -translate-y-1/2 -translate-x-1/2",
  right: "top-1/2 right-full -translate-y-1/2 translate-x-1/2",
};

export interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  /** First-open delay in ms. Later tooltips open instantly while "warm". */
  delay?: number;
  /** Optional shortcut shown at the end, e.g. "⌘S". */
  shortcut?: string;
  children: ReactNode;
  className?: string;
}

/** Wraps a focusable trigger. Shows on hover or keyboard focus, hides on leave, blur or Escape. */
export function Tooltip({ content, side = "top", delay = 500, shortcut, children, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    clearTimeout(timer.current);
    if (Date.now() < warmUntil) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen((was) => {
      if (was) warmUntil = Date.now() + GRACE;
      return false;
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <span
      className={cx("relative inline-flex", className)}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      onPointerDown={hide}
      aria-describedby={open ? id : undefined}
    >
      {children}
      <span
        id={id}
        role="tooltip"
        className={cx(
          "pointer-events-none absolute z-50 flex w-max max-w-[240px] items-center gap-2 rounded-lg bg-ink px-2.5 py-1.5 text-[12px] font-medium leading-snug text-paper",
          "shadow-[0_6px_20px_-6px_rgb(0_0_0/0.35)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
          PLACE[side],
          open ? "scale-100 opacity-100" : cx("scale-95 opacity-0", FROM[side]),
        )}
      >
        {content}
        {shortcut && <kbd className="rounded bg-paper/15 px-1 font-sans text-[11px] text-paper/80">{shortcut}</kbd>}
        <span aria-hidden className={cx("absolute h-2 w-2 rotate-45 rounded-[1px] bg-ink", ARROW[side])} />
      </span>
    </span>
  );
}

export default Tooltip;
