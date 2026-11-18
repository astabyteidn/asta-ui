"use client";

import { Children, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const GAP = 12;
// Dot slot and active bar widths, in px.
const DOT = 14;
const BAR = 30;

const KEYFRAMES = `@keyframes asta-carousel-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }`;

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );

export interface CarouselProps {
  /** One child per slide. */
  children: ReactNode;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Wrap from the last slide to the first and back. */
  loop?: boolean;
  /** Milliseconds per slide. Pauses on hover, focus and drag, and stays off for reduced motion. */
  autoplay?: number;
  /** Accessible name, e.g. "Featured products". */
  label?: string;
  className?: string;
}

function Arrow({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 1 ? "Next slide" : "Previous slide"}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink outline-none transition-[background-color,opacity,transform] duration-200 hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === 1 ? "m6 3.5 4.5 4.5L6 12.5" : "M10 3.5 5.5 8l4.5 4.5"} />
      </svg>
    </button>
  );
}

/**
 * Slides you swipe or drag, step with the arrows, or jump to with the dots. The active dot stretches into a
 * bar (with autoplay, the bar fills as the slide's time runs out). Arrow keys work once the carousel has focus.
 */
export function Carousel({ children, index, defaultIndex = 0, onIndexChange, loop = false, autoplay, label = "Carousel", className }: CarouselProps) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const uid = useId();
  const [inner, setInner] = useState(defaultIndex);
  const current = Math.max(0, Math.min(count - 1, index ?? inner));
  const [hold, setHold] = useState({ hover: false, focus: false, drag: false });
  // Bumps every time the autoplay bar finishes, so it restarts even if the index doesn't change.
  const [tick, setTick] = useState(0);
  const reduced = useReducedMotion();

  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; t: number; dx: number; v: number; on: boolean; id: number } | null>(null);
  const moved = useRef(false);

  const goTo = (n: number) => {
    const next = loop ? (n + count) % count : Math.max(0, Math.min(count - 1, n));
    if (next === current) return;
    if (index === undefined) setInner(next);
    onIndexChange?.(next);
  };

  const playing = !!autoplay && !reduced && count > 1 && !hold.hover && !hold.focus && !hold.drag;
  const canPrev = loop || current > 0;
  const canNext = loop || current < count - 1;

  const onKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowRight") goTo(current + 1);
    else if (e.key === "ArrowLeft") goTo(current - 1);
    else if (e.key === "Home") goTo(0);
    else if (e.key === "End") goTo(count - 1);
    else return;
    e.preventDefault();
  };

  // Drag: the track follows the pointer through a CSS variable, so React never re-renders mid-gesture.
  const setDx = (px: number) => track.current?.style.setProperty("--dx", `${px}px`);
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || count < 2) return;
    drag.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0, v: 0, on: false, id: e.pointerId };
    moved.current = false;
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const raw = e.clientX - d.x;
    if (!d.on) {
      if (Math.abs(raw) < 6) return;
      // A mostly vertical move is a page scroll, not a swipe.
      if (Math.abs(e.clientY - d.y) > Math.abs(raw)) {
        drag.current = null;
        return;
      }
      d.on = true;
      moved.current = true;
      e.currentTarget.setPointerCapture(d.id);
      if (track.current) track.current.dataset.dragging = "";
      setHold((h) => ({ ...h, drag: true }));
    }
    // Rubber band past the ends.
    const edge = (!canPrev && raw > 0) || (!canNext && raw < 0);
    const dx = edge ? raw / 3 : raw;
    d.v = (dx - d.dx) / Math.max(1, e.timeStamp - d.t);
    d.t = e.timeStamp;
    d.dx = dx;
    setDx(dx);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.on) return;
    delete track.current?.dataset.dragging;
    setDx(0);
    setHold((h) => ({ ...h, drag: false }));
    const w = viewport.current?.offsetWidth ?? 1;
    if (d.dx < -w * 0.2 || d.v < -0.4) goTo(current + 1);
    else if (d.dx > w * 0.2 || d.v > 0.4) goTo(current - 1);
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerEnter={() => setHold((h) => ({ ...h, hover: true }))}
      onPointerLeave={() => setHold((h) => ({ ...h, hover: false }))}
      onFocus={(e) => {
        // Only keyboard focus pauses autoplay. Clicking an arrow or a dot shouldn't stop it.
        let visible = true;
        try {
          visible = e.target.matches(":focus-visible");
        } catch {
          // No :focus-visible support: treat it as keyboard focus.
        }
        if (visible) setHold((h) => ({ ...h, focus: true }));
      }}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHold((h) => ({ ...h, focus: false }))}
      className={cx("flex w-full flex-col gap-4 rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-4 focus-visible:ring-offset-paper", className)}
    >
      <style href="asta-carousel" precedence="asta">{KEYFRAMES}</style>
      <div
        ref={viewport}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={(e) => {
          // A drag that ends over a link or button shouldn't click it.
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
        className="overflow-hidden rounded-[14px] [touch-action:pan-y]"
      >
        <div
          ref={track}
          aria-live={playing ? "off" : "polite"}
          className="flex select-none transition-transform duration-[560ms] ease-[cubic-bezier(.16,1,.3,1)] will-change-transform data-[dragging]:transition-none motion-reduce:transition-none"
          style={{ gap: GAP, transform: `translateX(calc(${-current} * (100% + ${GAP}px) + var(--dx, 0px)))` }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              id={`${uid}-slide-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== current}
              inert={i !== current}
              className="w-full shrink-0 [&_img]:pointer-events-none"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className="flex items-center justify-between gap-4">
          {/* Dots sit on fixed slots and slide aside (transform only) to make room for the active bar. */}
          <div className="relative h-6" style={{ width: (count - 1) * DOT + BAR }}>
            {slides.map((_, i) => {
              const on = i === current;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-controls={`${uid}-slide-${i}`}
                  aria-current={on || undefined}
                  onClick={() => goTo(i)}
                  className="group absolute left-0 top-0 h-6 rounded-md outline-none transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:ring-2 focus-visible:ring-brand/50 motion-reduce:transition-none"
                  style={{ width: on ? BAR : DOT, transform: `translateX(${i * DOT + (i > current ? BAR - DOT : 0)}px)` }}
                >
                  {/* Resting dot, fades out as the bar grows out of it. */}
                  <span
                    className={cx(
                      "absolute left-1 top-[9px] h-1.5 w-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_22%,transparent)] transition-[opacity,background-color] duration-300 group-hover:bg-[color-mix(in_srgb,var(--color-ink)_40%,transparent)]",
                      on && "opacity-0",
                    )}
                  />
                  <span
                    className="absolute left-1 top-[9px] h-1.5 origin-left overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
                    style={{ width: BAR - 8, opacity: on ? 1 : 0, transform: on ? "scaleX(1)" : `scaleX(${6 / (BAR - 8)})` }}
                  >
                    {on && (
                      <span
                        key={`${current}-${tick}`}
                        className={cx("absolute inset-0 origin-left rounded-full bg-brand", !!autoplay && !reduced && "animate-[asta-carousel-fill_linear_both]")}
                        style={autoplay && !reduced ? { animationDuration: `${autoplay}ms`, animationPlayState: playing ? "running" : "paused" } : undefined}
                        onAnimationEnd={() => {
                          setTick((t) => t + 1);
                          goTo(current + 1 < count ? current + 1 : 0);
                        }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <Arrow dir={-1} disabled={!canPrev} onClick={() => goTo(current - 1)} />
            <Arrow dir={1} disabled={!canNext} onClick={() => goTo(current + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Carousel;
