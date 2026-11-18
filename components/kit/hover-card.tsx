"use client";

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-hovercard-in { from { opacity: 0; transform: translateY(var(--asta-hc-y, 6px)) scale(.98) } }
@keyframes asta-hovercard-out { to { opacity: 0; transform: translateY(calc(var(--asta-hc-y, 6px) / 2)) } }`;

export type HoverCardSide = "top" | "bottom";
export type HoverCardAlign = "start" | "center" | "end";

export interface HoverCardProps {
  /** A focusable element, usually a link. It gets the hover and focus handlers merged in. */
  trigger: ReactElement;
  /** Card content. */
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Wait this long on hover or focus before opening, in ms. */
  openDelay?: number;
  /** Wait this long after the pointer leaves before closing, in ms. */
  closeDelay?: number;
  side?: HoverCardSide;
  align?: HoverCardAlign;
  /** Gap between the trigger and the card, in px. */
  offset?: number;
  /** Accessible name for the card. */
  label?: string;
  /** Extra classes for the card (width, padding). */
  className?: string;
}

const PAD = 8;
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function assignRef(r: Ref<HTMLElement> | undefined, el: HTMLElement | null) {
  if (typeof r === "function") r(el);
  else if (r) (r as { current: HTMLElement | null }).current = el;
}


/**
 * A preview card for a link, like a profile peek. It opens after a short hover or on keyboard focus, and
 * stays open while the pointer travels into it, so you can use what's inside. It fades and lifts in, flips
 * when there's no room, and closes on leave, blur or Escape. Touch taps just follow the link.
 */
export function HoverCard({ trigger, children, open, defaultOpen = false, onOpenChange, openDelay = 500, closeDelay = 220, side = "bottom", align = "center", offset = 8, label, className }: HoverCardProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const [present, setPresent] = useState(isOpen);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (isOpen && !present) setPresent(true);

  // The latest open state for timers and handlers that fire before the next render.
  const cur = useRef(isOpen);
  useLayoutEffect(() => {
    cur.current = isOpen;
  });

  const setOpen = (next: boolean) => {
    clearTimeout(timer.current);
    if (next === cur.current) return;
    if (open === undefined) {
      cur.current = next;
      setInner(next);
    }
    onOpenChange?.(next);
  };
  const later = (next: boolean) => {
    clearTimeout(timer.current);
    if (next === cur.current) return;
    timer.current = setTimeout(() => setOpen(next), next ? openDelay : closeDelay);
  };
  const hold = () => clearTimeout(timer.current);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Position before paint: flip top/bottom if needed, clamp sideways, follow scroll and resize.
  useLayoutEffect(() => {
    if (!present || !anchor) return;
    const place = () => {
      const el = card.current;
      if (!el) return;
      const a = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let s = side;
      const room = { top: a.top, bottom: vh - a.bottom };
      const other = s === "top" ? "bottom" : "top";
      if (room[s] < h + offset + PAD && room[other] > room[s]) s = other;
      let x = align === "start" ? a.left : align === "end" ? a.right - w : a.left + a.width / 2 - w / 2;
      x = Math.min(Math.max(PAD, x), vw - w - PAD);
      const y = s === "bottom" ? a.bottom + offset : a.top - offset - h;
      const ox = Math.min(Math.max(16, a.left + a.width / 2 - x), w - 16);
      el.style.left = `${Math.round(x)}px`;
      el.style.top = `${Math.round(y)}px`;
      el.style.transformOrigin = `${ox}px ${s === "bottom" ? "0" : "100%"}`;
      el.style.setProperty("--asta-hc-y", s === "bottom" ? "6px" : "-6px");
      el.style.setProperty("--asta-hc-gap", `${offset + 2}px`);
      el.dataset.side = s;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(card.current!);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [present, anchor, side, align, offset]);

  const focusables = () => [...(card.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];

  // Focus leaving both the trigger and the card closes it.
  const onBlurOut = (to: EventTarget | null) => {
    if (to instanceof Node && (anchor?.contains(to) || card.current?.contains(to))) return;
    later(false);
  };

  // Trigger listeners go on the DOM node, so they always see the latest state and the trigger's own
  // handlers stay untouched.
  const handlers = {
    enter: (e: globalThis.PointerEvent) => e.pointerType === "mouse" && later(true),
    leave: (e: globalThis.PointerEvent) => e.pointerType === "mouse" && later(false),
    // Keyboard focus only: a mouse click shouldn't pop the card a second time.
    focus: (e: globalThis.FocusEvent) => (e.currentTarget as HTMLElement).matches(":focus-visible") && later(true),
    blur: (e: globalThis.FocusEvent) => onBlurOut(e.relatedTarget),
    key: (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && cur.current) {
        e.stopPropagation();
        setOpen(false);
      }
      // The card is portalled: Tab from the trigger steps into it when it has something to focus.
      if (e.key === "Tab" && !e.shiftKey && cur.current) {
        const first = focusables()[0];
        if (first) {
          e.preventDefault();
          hold();
          first.focus();
        }
      }
    },
  };
  const latest = useRef(handlers);
  useLayoutEffect(() => {
    latest.current = handlers;
  });
  useEffect(() => {
    if (!anchor) return;
    const on: [string, (e: never) => void][] = [
      ["pointerenter", (e: globalThis.PointerEvent) => latest.current.enter(e)],
      ["pointerleave", (e: globalThis.PointerEvent) => latest.current.leave(e)],
      ["focus", (e: globalThis.FocusEvent) => latest.current.focus(e)],
      ["blur", (e: globalThis.FocusEvent) => latest.current.blur(e)],
      ["keydown", (e: globalThis.KeyboardEvent) => latest.current.key(e)],
    ];
    for (const [t, f] of on) anchor.addEventListener(t, f as EventListener);
    return () => {
      for (const [t, f] of on) anchor.removeEventListener(t, f as EventListener);
    };
  }, [anchor]);

  // A stable ref callback: a new one each render would detach and re-attach the trigger every time.
  const triggerRef = isValidElement<{ ref?: Ref<HTMLElement> }>(trigger) ? trigger.props.ref : undefined;
  const setTriggerRef = useCallback(
    (el: HTMLElement | null) => {
      setAnchor(el);
      assignRef(triggerRef, el);
    },
    [triggerRef],
  );
  const triggerNode = isValidElement<{ ref?: Ref<HTMLElement> }>(trigger)
    ? cloneElement(trigger, {
        ref: setTriggerRef,
        "aria-describedby": isOpen ? id : undefined,
        "data-state": isOpen ? "open" : "closed",
      } as Record<string, unknown>)
    : trigger;

  const onCardKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      anchor?.focus({ preventScroll: true });
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusables();
    const at = document.activeElement;
    if (e.shiftKey && at === items[0]) {
      e.preventDefault();
      anchor?.focus({ preventScroll: true });
    } else if (!e.shiftKey && at === items[items.length - 1]) {
      // Hand focus back to the trigger and let the browser's own Tab carry on to whatever follows it.
      setOpen(false);
      anchor?.focus({ preventScroll: true });
    }
  };

  return (
    <>
      {triggerNode}
      {present &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={card}
            id={id}
            role="dialog"
            aria-modal="false"
            aria-label={label}
            data-state={isOpen ? "open" : "closed"}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") hold();
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") later(false);
            }}
            onFocus={hold}
            onBlur={(e) => onBlurOut(e.relatedTarget)}
            onKeyDown={onCardKey}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && !isOpen) setPresent(false);
            }}
            className={cx(
              "fixed left-0 top-0 z-50 w-[300px] max-w-[calc(100vw-16px)] rounded-xl bg-paper p-4 text-ink outline-none",
              "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_18px_44px_-16px_rgb(0_0_0/0.32),0_4px_10px_-6px_rgb(0_0_0/0.12)]",
              // An invisible bridge over the gap, so the pointer can cross from the link without the card closing.
              "before:absolute before:inset-x-0 before:h-[var(--asta-hc-gap,10px)] before:content-[''] data-[side=bottom]:before:bottom-full data-[side=top]:before:top-full",
              "animate-[asta-hovercard-in_.28s_cubic-bezier(.16,1,.3,1)_both] data-[state=closed]:animate-[asta-hovercard-out_.14s_ease-in_both]",
              "data-[state=closed]:pointer-events-none motion-reduce:![animation-duration:1ms]",
              className,
            )}
          >
            <style href="asta-hover-card" precedence="asta">
              {KEYFRAMES}
            </style>
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

export default HoverCard;
