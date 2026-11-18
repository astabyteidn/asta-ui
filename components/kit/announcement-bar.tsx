"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-announce-in { from { opacity: 0; transform: translateY(100%) } }
@keyframes asta-announce-out { to { opacity: 0; transform: translateY(-100%) } }`;

export interface AnnouncementMessage {
  text: ReactNode;
  href?: string;
  /** Link text after the message. Defaults to "Learn more" when there's an `href`. */
  linkLabel?: string;
  /** A short tag before the message, e.g. "New". */
  badge?: string;
}

export type AnnouncementBarVariant = "ink" | "brand" | "subtle";

export interface AnnouncementBarProps {
  /** One message stays put. Two or more take turns, sliding up. */
  messages: AnnouncementMessage[];
  variant?: AnnouncementBarVariant;
  /** Time each message stays, in ms. Hover or focus pauses it. */
  interval?: number;
  dismissible?: boolean;
  /** Controlled visibility. Set it to false to play the exit. */
  open?: boolean;
  /** Called when the close button is pressed. */
  onDismiss?: () => void;
  /** Called once the bar has slid away. */
  onExited?: () => void;
  /** Remember the dismissal in localStorage under this key, so it stays closed on the next visit. */
  storageKey?: string;
  /** Accessible name for the region. */
  label?: string;
  className?: string;
}

const noop = () => () => {};
const readFlag = (key?: string) => {
  if (!key) return false;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const SURFACE: Record<AnnouncementBarVariant, { bar: string; badge: string; link: string; close: string }> = {
  ink: { bar: "bg-ink text-paper", badge: "bg-brand text-white", link: "text-paper", close: "text-paper/60 hover:text-paper hover:bg-paper/10" },
  brand: { bar: "bg-brand text-white", badge: "bg-white/15 text-white", link: "text-white", close: "text-white/70 hover:text-white hover:bg-white/10" },
  subtle: { bar: "bg-paper-2 text-ink", badge: "bg-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] text-brand", link: "text-brand", close: "text-mute hover:text-ink hover:bg-paper" },
};

function Message({ m, tone, tabbable }: { m: AnnouncementMessage; tone: (typeof SURFACE)[AnnouncementBarVariant]; tabbable: boolean }) {
  return (
    <p className="flex min-w-0 items-center justify-center gap-2.5 text-[13px] leading-snug">
      {m.badge && <span className={cx("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium", tone.badge)}>{m.badge}</span>}
      <span className="min-w-0 truncate">{m.text}</span>
      {m.href && (
        <a
          href={m.href}
          tabIndex={tabbable ? undefined : -1}
          className={cx("group/link inline-flex shrink-0 items-center gap-1 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/60", tone.link)}
        >
          {m.linkLabel ?? "Learn more"}
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" />
          </svg>
        </a>
      )}
    </p>
  );
}

/**
 * A slim banner for the top of a page: a message and a link, with an optional close button. Pass several
 * messages and they take turns, the old one sliding up as the next rises in. Hovering or focusing pauses it,
 * and reduced motion stops the rotation. Closing slides it up and fades it out, then it unmounts.
 */
export function AnnouncementBar({ messages, variant = "ink", interval = 5000, dismissible = true, open, onDismiss, onExited, storageKey, label = "Announcement", className }: AnnouncementBarProps) {
  // A remembered dismissal. The server renders the bar, the client hides it on hydration if it was closed before.
  const remembered = useSyncExternalStore(noop, () => readFlag(storageKey), () => false);
  const [inner, setInner] = useState(true);
  const visible = open ?? inner;
  const [present, setPresent] = useState(visible);
  if (visible && !present) setPresent(true);

  // `prev` is the message that just left (it plays its exit), or null before the first turn.
  const [{ cur, prev }, setTurn] = useState<{ cur: number; prev: number | null }>({ cur: 0, prev: null });
  const [paused, setPaused] = useState(false);
  const [calm, setCalm] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tone = SURFACE[variant];
  const count = messages.length;
  const index = count ? cur % count : 0;
  const rotating = count > 1 && !paused && !calm;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCalm(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Next message every `interval`, only while the tab is visible.
  useEffect(() => {
    if (!rotating || !present) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setTurn((t) => ({ cur: (t.cur + 1) % count, prev: t.cur % count }));
    }, interval);
    return () => clearInterval(id);
  }, [rotating, present, interval, count]);

  const dismiss = () => {
    // Focus would be lost with the bar: hand it to the page.
    if (root.current?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    if (open === undefined) setInner(false);
    onDismiss?.();
  };

  if (!present || !count || (open === undefined && remembered)) return null;

  return (
    <div
      ref={root}
      role="region"
      aria-label={label}
      data-state={visible ? "open" : "closed"}
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget || visible) return;
        // Remember it once the exit has played (writing it earlier would hide the bar mid-animation).
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, "1");
          } catch {}
        }
        setPresent(false);
        onExited?.();
      }}
      className={cx(
        "relative flex min-h-10 w-full items-center gap-2 px-3 sm:px-4",
        "data-[state=closed]:pointer-events-none data-[state=closed]:animate-[asta-announce-out_.32s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:![animation-duration:1ms]",
        tone.bar,
        className,
      )}
    >
      <style href="asta-announcement-bar" precedence="asta">
        {KEYFRAMES}
      </style>
      {/* Balances the close button so the message stays centred. */}
      {dismissible && <span aria-hidden className="w-7 shrink-0" />}

      {count === 1 ? (
        <div className="min-w-0 flex-1 py-2.5">
          <Message m={messages[0]} tone={tone} tabbable />
        </div>
      ) : (
        // Live only while still, so a rotating bar doesn't talk over the page.
        <div className="relative h-10 min-w-0 flex-1 overflow-hidden" aria-live={rotating ? "off" : "polite"}>
          {messages.map((m, i) => {
            const isCur = i === index;
            const isPrev = i === prev && !isCur;
            return (
              <div
                key={i}
                aria-hidden={!isCur}
                className={cx(
                  "absolute inset-0 flex items-center justify-center",
                  isCur && prev !== null && !calm && "animate-[asta-announce-in_.6s_cubic-bezier(.16,1,.3,1)_both]",
                  isPrev && !calm && "animate-[asta-announce-out_.6s_cubic-bezier(.16,1,.3,1)_both]",
                  !isCur && (isPrev && !calm ? "pointer-events-none" : "invisible opacity-0"),
                )}
              >
                <Message m={m} tone={tone} tabbable={isCur} />
              </div>
            );
          })}
        </div>
      )}

      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={dismiss}
          className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-md outline-none transition-[background-color,color,transform] duration-200 active:scale-90 focus-visible:ring-2 focus-visible:ring-brand/60", tone.close)}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="m4.5 4.5 7 7m0-7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default AnnouncementBar;
