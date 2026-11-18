"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface ImageCompareProps {
  /** Shown left of the handle. An image URL, or any node that fills the frame. */
  before: string | ReactNode;
  /** Shown right of the handle. */
  after: string | ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  /** Alt text when `before` / `after` are URLs. */
  beforeAlt?: string;
  afterAlt?: string;
  /** Handle position from the left, 0–100. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Arrow-key step, in percent. PageUp/PageDown move ten steps. */
  step?: number;
  /** Accessible name for the handle. */
  label?: string;
  /** Classes for the frame (aspect ratio, radius, width). */
  className?: string;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));
const EASE = "cubic-bezier(.16,1,.3,1)";

function Fill({ src, alt }: { src: string | ReactNode; alt?: string }) {
  if (typeof src !== "string") return <>{src}</>;
  return <img src={src} alt={alt ?? ""} draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />;
}

/**
 * A before/after slider. Drag anywhere on the frame, or focus the handle and use the arrows, Home and End.
 * Nothing is clipped with clip-path: the before layer sits in a window that slides with the handle while
 * the picture inside slides the other way, so only transforms move. Vertical swipes still scroll the page.
 */
export function ImageCompare({ before, after, beforeLabel = "Before", afterLabel = "After", beforeAlt, afterAlt, value, defaultValue = 50, onValueChange, step = 2, label = "Comparison position", className }: ImageCompareProps) {
  const [inner, setInner] = useState(defaultValue);
  const pos = clamp(value ?? inner);
  const [dragging, setDragging] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);

  const set = (n: number) => {
    const v = Math.round(clamp(n) * 10) / 10;
    if (v === pos) return;
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  const fromPointer = (x: number) => {
    const r = frame.current!.getBoundingClientRect();
    return r.width ? ((x - r.left) / r.width) * 100 : pos;
  };

  // The press in progress. Drag mode (no glide) only starts on the first real move, so a click glides.
  // Touch waits for a horizontal move (or a tap) so a vertical swipe scrolls without moving the handle.
  const press = useRef<{ id: number; x: number; y: number; touch: boolean; moved: boolean } | null>(null);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const touch = e.pointerType === "touch";
    press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, touch, moved: false };
    if (touch) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    set(fromPointer(e.clientX));
    handle.current?.focus({ preventScroll: true });
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moved) {
      const dx = Math.abs(e.clientX - p.x);
      const dy = Math.abs(e.clientY - p.y);
      if (p.touch ? dx < 6 || dx <= dy : dx < 2) return;
      p.moved = true;
      if (p.touch) {
        e.currentTarget.setPointerCapture(e.pointerId);
        handle.current?.focus({ preventScroll: true });
      }
      setDragging(true);
    }
    set(fromPointer(e.clientX));
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    press.current = null;
    // A touch tap glides the handle to the tap.
    if (p.touch && !p.moved && e.type === "pointerup") {
      set(fromPointer(e.clientX));
      handle.current?.focus({ preventScroll: true });
    }
    setDragging(false);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowLeft: pos - step, ArrowDown: pos - step, ArrowRight: pos + step, ArrowUp: pos + step, PageDown: pos - step * 10, PageUp: pos + step * 10, Home: 0, End: 100 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    set(keys[e.key]);
  };

  // While dragging, follow the pointer exactly. Otherwise glide (clicks and arrow keys).
  const glide = dragging ? undefined : `transform .45s ${EASE}`;

  return (
    <div
      ref={frame}
      onPointerDown={onDown}
      // Keeps focus on the handle we just focused (a press on a non-focusable frame would blur it).
      onMouseDown={(e) => e.preventDefault()}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      className={cx("group/compare relative aspect-[4/3] w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-xl bg-paper-2", className)}
    >
      <div className="absolute inset-0">
        <Fill src={after} alt={afterAlt} />
      </div>

      {/* The window: its right edge sits on the handle. The picture inside is pushed back by the same amount. */}
      <div className="absolute inset-0 overflow-hidden motion-reduce:!transition-none" style={{ transform: `translateX(${pos - 100}%)`, transition: glide }}>
        <div className="absolute inset-0 motion-reduce:!transition-none" style={{ transform: `translateX(${100 - pos}%)`, transition: glide }}>
          <Fill src={before} alt={beforeAlt} />
        </div>
      </div>

      <span className={cx("pointer-events-none absolute left-3 top-3 rounded-md bg-paper/80 px-2 py-1 text-[11.5px] font-medium text-ink backdrop-blur transition-opacity duration-300", pos < 18 && "opacity-0")}>{beforeLabel}</span>
      <span className={cx("pointer-events-none absolute right-3 top-3 rounded-md bg-paper/80 px-2 py-1 text-[11.5px] font-medium text-ink backdrop-blur transition-opacity duration-300", pos > 82 && "opacity-0")}>{afterLabel}</span>

      {/* Full-width track that slides; the line and knob sit on its left edge. */}
      <div className="pointer-events-none absolute inset-0 motion-reduce:!transition-none" style={{ transform: `translateX(${pos}%)`, transition: glide }}>
        <div className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-paper shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)]" />
        <div
          ref={handle}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% ${beforeLabel}, ${Math.round(100 - pos)}% ${afterLabel}`}
          aria-orientation="horizontal"
          onKeyDown={onKey}
          className={cx(
            "pointer-events-auto absolute left-0 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink outline-none",
            "shadow-[0_6px_18px_-6px_rgb(0_0_0/0.4),0_0_0_1px_rgb(0_0_0/0.06)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          )}
        >
          <svg
            viewBox="0 0 20 20"
            className={cx("h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", dragging ? "scale-90" : "group-hover/compare:scale-110")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M7.5 6 3.5 10l4 4M12.5 6l4 4-4 4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default ImageCompare;
