"use client";

import { Tooltip as Tip } from "@base-ui/react/tooltip";
import { isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type TooltipSide = "top" | "right" | "bottom" | "left";

// Shared by every tooltip on the page: once one has been shown, the next opens instantly
// (as long as the pointer moves over within the grace period).
let warmUntil = 0;
const GRACE = 400;
// Base UI can report the next trigger's hover before the previous tooltip's close, so an open tooltip also counts as warm.
let shown = 0;

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
 * A tooltip on Base UI Tooltip: shows on hover or keyboard focus, hides on leave, blur, press or Escape, and
 * flips to the other side when it would leave the screen. After one has been shown, the next opens instantly.
 */
export function Tooltip({ content, side = "top", delay = 500, shortcut, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isOpen = useRef(false);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (isOpen.current) shown--;
    },
    [],
  );
  const set = (next: boolean) => {
    if (next === isOpen.current) return;
    isOpen.current = next;
    shown += next ? 1 : -1;
    setOpen(next);
  };

  // Base UI reports intent immediately (delay 0); the first-open delay and the page-wide warm window live here.
  const onOpenChange = (next: boolean) => {
    clearTimeout(timer.current);
    if (!next) {
      if (open) warmUntil = Date.now() + GRACE;
      set(false);
    } else if (shown > 0 || Date.now() < warmUntil) set(true);
    else timer.current = setTimeout(() => set(true), delay);
  };

  const trigger = isValidElement(children) ? (children as ReactElement) : <span className="inline-flex">{children}</span>;
  return (
    <Tip.Provider delay={0}>
      <Tip.Root open={open} onOpenChange={onOpenChange}>
        <Tip.Trigger delay={0} closeDelay={0} render={trigger} />
        <Tip.Portal>
          <Tip.Positioner side={side} sideOffset={8} collisionPadding={8} className="z-50">
            <Tip.Popup
              className={cx(
                "flex w-max max-w-[240px] select-none items-center gap-2 rounded-lg bg-ink px-2.5 py-1.5 text-[12px] font-medium leading-snug text-paper",
                "shadow-[0_6px_20px_-6px_rgb(0_0_0/0.35)] origin-[var(--transform-origin)]",
                // Enter: rise from the trigger side with the studio ease. Exit: a quicker fade.
                "transition-[opacity,transform] duration-200 ease-[cubic-bezier(.16,1,.3,1)] data-[ending-style]:duration-100 data-[ending-style]:ease-[cubic-bezier(.16,1,.3,1)]",
                "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:scale-[.97]",
                "data-[side=top]:data-[starting-style]:[transform:translateY(4px)_scale(.95)] data-[side=bottom]:data-[starting-style]:[transform:translateY(-4px)_scale(.95)]",
                "data-[side=left]:data-[starting-style]:[transform:translateX(4px)_scale(.95)] data-[side=right]:data-[starting-style]:[transform:translateX(-4px)_scale(.95)]",
                "motion-reduce:!transition-none",
                className,
              )}
            >
              {content}
              {shortcut && <kbd className="rounded bg-paper/15 px-1 font-sans text-[11px] text-paper/80">{shortcut}</kbd>}
              <Tip.Arrow className="flex data-[side=bottom]:top-[-5px] data-[side=left]:right-[-7.5px] data-[side=left]:-rotate-90 data-[side=right]:left-[-7.5px] data-[side=right]:rotate-90 data-[side=top]:bottom-[-5px] data-[side=bottom]:rotate-180">
                <svg width="10" height="5" viewBox="0 0 10 5" className="fill-ink" aria-hidden>
                  <path d="M0 0h10L5 5z" />
                </svg>
              </Tip.Arrow>
            </Tip.Popup>
          </Tip.Positioner>
        </Tip.Portal>
      </Tip.Root>
    </Tip.Provider>
  );
}

export default Tooltip;
