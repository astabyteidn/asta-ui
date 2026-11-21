"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { LiveSlot } from "@/components/ui-site/Live";
import { MotionToggle, useMotionPaused } from "@/components/ui-site/MotionPause";

type Ctx = { n: number; paused: boolean; claim: () => void };
const DemoCtx = createContext<Ctx>({ n: 0, paused: false, claim: () => {} });

/**
 * For demos with controls: returns a counter that goes up on every Replay. Calling it tells the frame the demo replays
 * itself, so the frame stops remounting it and the controls keep their values. Key the animated part with it.
 */
export function useReplay() {
  const { n, claim } = useContext(DemoCtx);
  useEffect(claim, [claim]);
  return n;
}

/** True while the stage is offscreen, the tab is hidden or motion is paused. JS loops stop on it. CSS animations pause by themselves. */
export const usePaused = () => useContext(DemoCtx).paused;

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const m = matchMedia(query);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false,
  );

/** True while the element is offscreen or the tab is hidden. */
function useOffscreen(ref: RefObject<HTMLElement | null>) {
  const [offscreen, setOffscreen] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOffscreen(!e.isIntersecting));
    io.observe(el);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref]);
  return offscreen || hidden;
}

/**
 * A demo as a still-ish thumbnail, e.g. on a blog card: no header, no controls to tab into, and the same pause rules
 * as the full frame.
 */
export function DemoStill({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const motionPaused = useMotionPaused();
  const paused = useOffscreen(stage) || motionPaused;
  const [claim] = useState(() => () => {});
  return (
    <div ref={stage} data-paused={paused} className="blog-stage pointer-events-none h-full w-full" inert aria-hidden>
      <DemoCtx.Provider value={{ n: 0, paused, claim }}>{children}</DemoCtx.Provider>
    </div>
  );
}

/**
 * The stage for a blog demo: a header with a title and Replay, the live demo (mounted near the viewport), then the
 * code and a caption. Replay remounts the demo unless it uses `useReplay`. Animations pause offscreen, on a hidden tab
 * and when the visitor pauses motion (the header button, shared with every frame on the page).
 */
export default function DemoFrame({
  title,
  height = 320,
  tone = "light",
  slot = true,
  aside,
  code,
  caption,
  children,
}: {
  title: string;
  height?: number;
  tone?: "light" | "dark";
  /** Mount near the viewport. Off for `Live`, which does it itself. */
  slot?: boolean;
  /** Extra header content, e.g. a link to the component page. */
  aside?: ReactNode;
  code?: ReactNode;
  caption?: ReactNode;
  children: ReactNode;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const [out, setOut] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const motionPaused = useMotionPaused();
  const paused = useOffscreen(stage) || motionPaused;
  const reduce = useReducedMotion();
  const [claim] = useState(() => () => setClaimed(true));


  function replay() {
    if (out) return;
    setOut(true);
    setTimeout(() => {
      setN((k) => k + 1);
      setOut(false);
    }, 140);
  }

  const demo = slot ? <LiveSlot>{children}</LiveSlot> : children;

  return (
    <figure className="blog-demo my-10 xl:-mx-16">
      <div
        className={`relative overflow-hidden rounded-xl ${tone === "dark" ? "ui-dark bg-paper-2" : "bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent)]"}`}
      >
        <div className="flex items-center justify-between gap-3 px-3 pt-3">
          <span className="label min-w-0 truncate pl-1 text-mute">{title}</span>
          <div className="flex shrink-0 items-center gap-1">
            {reduce && <span className="label hidden pr-2 text-mute sm:inline">Reduced motion on</span>}
            {aside}
            <MotionToggle />
            <button type="button" onClick={replay} className="btn btn-quiet btn-sm btn-icon group" aria-label="Replay" title="Replay">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-500 ease-expo group-hover:-rotate-180" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M13 8a5 5 0 1 1-1.6-3.7" />
                <path d="M13 2.5V5h-2.5" />
              </svg>
            </button>
          </div>
        </div>
        <div ref={stage} data-out={out} data-paused={paused} className="blog-stage ui-replay relative w-full" style={{ minHeight: height }}>
          <DemoCtx.Provider value={{ n, paused, claim }}>
            <div key={claimed ? 0 : n} className="h-full w-full" style={{ minHeight: height }}>
              {demo}
            </div>
          </DemoCtx.Provider>
        </div>
      </div>
      {code && <div className="mt-3">{code}</div>}
      {caption && <figcaption className="mt-3 px-1 text-[14px] leading-relaxed text-mute">{caption}</figcaption>}
    </figure>
  );
}
