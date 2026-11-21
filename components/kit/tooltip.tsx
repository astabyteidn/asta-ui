"use client";

import { Tooltip as Tip } from "radix-ui";
import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";

// Spread rather than a literal `asChild` attribute: the shadcn CLI rewrites `asChild` to `render` in Base UI
// projects (base-* styles), which Radix doesn't understand.
const SLOT = { asChild: true } as const;

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type TooltipSide = "top" | "right" | "bottom" | "left";

// Shared by every tooltip on the page: once one has been shown, the next opens instantly
// (as long as the pointer moves over within the grace period).
let warmUntil = 0;
const GRACE = 400;

const KEYFRAMES = `@keyframes kit-tip-in { from { opacity: 0; transform: var(--kit-tip-from) scale(.95) } }
@keyframes kit-tip-out { to { opacity: 0; transform: scale(.97) } }`;

export interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  /** First-open delay in ms. Later tooltips open instantly while "warm". */
  delay?: number;
  /** Optional shortcut shown at the end, e.g. "⌘S". */
  shortcut?: string;
  /** A focusable element (a button, a link). Anything else gets wrapped in a span. */
  children: ReactNode;
  /** Extra classes for the tooltip bubble. */
  className?: string;
}

/**
 * A tooltip on Radix Tooltip: shows on hover or keyboard focus, hides on leave, blur, press or Escape, and
 * flips to the other side when it would leave the screen. After one has been shown, the next opens instantly.
 */
export function Tooltip({ content, side = "top", delay = 500, shortcut, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const cancel = () => clearTimeout(timer.current);
  const onOpenChange = (next: boolean) => {
    clearTimeout(timer.current);
    if (!next) {
      if (open) warmUntil = Date.now() + GRACE;
      setOpen(false);
    } else if (Date.now() < warmUntil) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), delay);
  };

  return (
    <Tip.Provider delayDuration={0} skipDelayDuration={0}>
      <Tip.Root open={open} onOpenChange={onOpenChange}>
        {/* Outside the content: Radix copies the content into a hidden role="tooltip" node for screen readers.
            React 19 dedupes it by href, so a page of tooltips adds it once. */}
        <style href="kit-tooltip" precedence="default">
          {KEYFRAMES}
        </style>
        {/* Radix doesn't report a close for a tooltip that never opened, so drop a pending open here. */}
        <Tip.Trigger {...SLOT} onPointerLeave={cancel} onBlur={cancel} onPointerDown={cancel}>{isValidElement(children) ? children : <span className="inline-flex">{children}</span>}</Tip.Trigger>
        <Tip.Portal>
          <Tip.Content
            side={side}
            sideOffset={8}
            collisionPadding={8}
            className={cx(
              "z-50 flex w-max max-w-[240px] select-none items-center gap-2 rounded-lg bg-ink px-2.5 py-1.5 text-[12px] font-medium leading-snug text-paper",
              "shadow-[0_6px_20px_-6px_rgb(0_0_0/0.35)] origin-[var(--radix-tooltip-content-transform-origin)]",
              "data-[side=top]:[--kit-tip-from:translateY(4px)] data-[side=bottom]:[--kit-tip-from:translateY(-4px)] data-[side=left]:[--kit-tip-from:translateX(4px)] data-[side=right]:[--kit-tip-from:translateX(-4px)]",
              "animate-[kit-tip-in_.2s_cubic-bezier(.16,1,.3,1)_both] data-[state=closed]:animate-[kit-tip-out_.1s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:!animate-none",
              className,
            )}
          >
            {content}
            {shortcut && <kbd className="rounded bg-paper/15 px-1 font-sans text-[11px] text-paper/80">{shortcut}</kbd>}
            <Tip.Arrow width={10} height={5} className="fill-ink" />
          </Tip.Content>
        </Tip.Portal>
      </Tip.Root>
    </Tip.Provider>
  );
}

export default Tooltip;
