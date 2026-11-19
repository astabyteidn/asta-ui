"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui063-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui063-art { from { opacity: 0; transform: scale(.9) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui063 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui063-rise .6s ${EASE} ${80 + i * 55}ms both` });

const HALF = 8;

export interface VolumeSliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (v: number) => void;
  title?: string;
  artist?: string;
  art?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}

/** Speaker with three waves that appear by level, and a cross when muted. */
function Speaker({ level }: { level: number }) {
  const muted = level === 0;
  const wave = (i: number): CSSProperties => {
    const on = !muted && level > i * 33;
    return { opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(.6)", transformOrigin: "6px 10px", transition: `transform 360ms ${SPRING} ${i * 40}ms, opacity 240ms ${EASE} ${i * 40}ms` };
  };
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7.5h2.5L9.5 4v12l-4-3.5H3z" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 8a2.8 2.8 0 010 4" style={wave(0)} />
      <path d="M13.8 6.2a5.4 5.4 0 010 7.6" style={wave(1)} />
      <path d="M15.6 4.4a8 8 0 010 11.2" style={wave(2)} />
      <g style={{ opacity: muted ? 1 : 0, transform: muted ? "scale(1)" : "scale(.4)", transformOrigin: "15px 10px", transition: `transform 360ms ${SPRING}, opacity 200ms ${EASE}` }}>
        <path d="M13 8l4 4M17 8l-4 4" />
      </g>
    </svg>
  );
}

/**
 * aui-063 · A volume slider in a mini player. Signature: the speaker gains and loses waves as you slide, a brand
 * glow under the thumb grows with the level and tapping the speaker mutes and restores.
 */
export function VolumeSlider({ value, defaultValue = 64, onValueChange, title = "Slow Tide", artist = "Mira Sol", art = "/lab/art/hoarfrost.webp", disabled, name, className }: VolumeSliderProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const v = value ?? inner;
  const k = v / 100;
  const [drag, setDrag] = useState(false);
  const [playing, setPlaying] = useState(true);
  const before = useRef(defaultValue || 64);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const box = useRef<{ left: number; width: number } | null>(null);

  const set = (n: number) => {
    const s = Math.round(Math.min(100, Math.max(0, n)));
    if (s === v) return;
    if (value === undefined) setInner(s);
    onValueChange?.(s);
  };
  const fromX = (x: number) => {
    const b = box.current;
    return b ? ((x - b.left) / b.width) * 100 : v;
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || !track.current) return;
    const r = track.current.getBoundingClientRect();
    box.current = { left: r.left + HALF, width: r.width - HALF * 2 };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(true);
    set(fromX(e.clientX));
    thumb.current?.focus({ preventScroll: true });
  };
  const move = (e: PointerEvent<HTMLDivElement>) => drag && set(fromX(e.clientX));
  const up = () => setDrag(false);
  const key = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: v + 2, ArrowUp: v + 2, ArrowLeft: v - 2, ArrowDown: v - 2, PageUp: v + 10, PageDown: v - 10, Home: 0, End: 100 };
    if (!(e.key in map)) return;
    e.preventDefault();
    set(map[e.key]);
  };
  const mute = () => {
    if (v > 0) {
      before.current = v;
      set(0);
    } else set(before.current || 50);
  };
  const glide = drag ? "none" : `transform 320ms ${EASE}`;

  return (
    <div
      className={cx(
        "aui063 w-full max-w-[400px] rounded-[14px] bg-paper p-4 sm:p-5",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        disabled && "opacity-60",
        className,
      )}
    >
      <style href="asta-aui063" precedence="asta">
        {CSS}
      </style>
      <div className="flex items-center gap-3.5">
        <img src={art} alt="" width={56} height={56} loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-[10px] object-cover shadow-[0_1px_2px_rgb(0_0_0/0.1),0_8px_18px_-10px_rgb(0_0_0/0.5)]" style={{ animation: `aui063-art .7s ${EASE} 60ms both` }} />
        <div className="min-w-0 flex-1" style={rise(1)}>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Astabyte Radio</p>
          <p className="mt-1 truncate text-[16px] font-medium tracking-[-0.02em] text-ink">{title}</p>
          <p className="truncate text-[13px] text-mute">{artist}</p>
        </div>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((p) => !p)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-paper outline-none transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          style={rise(2)}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            {playing ? <path d="M4 3h2.6v10H4zM9.4 3H12v10H9.4z" /> : <path d="M5 3l8 5-8 5z" />}
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-[11px] bg-paper-2 py-2 pl-2 pr-3.5" style={rise(3)}>
        <button
          type="button"
          onClick={mute}
          aria-label={v === 0 ? "Unmute" : "Mute"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-ink outline-none transition-transform duration-200 hover:bg-paper active:scale-90 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Speaker level={v} />
        </button>
        <div ref={track} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className={cx("group/vol relative flex h-8 flex-1 touch-none select-none items-center", disabled ? "pointer-events-none" : "cursor-pointer")}>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] transition-transform duration-300 group-hover/vol:scale-y-[1.35]">
            <div className="absolute inset-y-0" style={{ left: HALF, right: HALF, transform: `translateX(${k * 100}%)`, transition: glide }}>
              <div className="absolute inset-y-0 right-full w-[4000px] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-brand)_45%,var(--color-paper))_0,var(--color-brand)_3600px)]" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0" style={{ left: HALF, right: HALF, transform: `translateX(${k * 100}%)`, transition: glide }}>
            {/* Glow: grows and brightens with the level. Static blur, only transform and opacity change. */}
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-10 w-16 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_70%,transparent),transparent)] transition-[transform,opacity] duration-300"
              style={{ opacity: v === 0 ? 0 : 0.2 + k * 0.7, transform: `translate(-80%, -50%) scale(${0.6 + k * 0.7})` }}
            />
            <div
              ref={thumb}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={v}
              aria-valuetext={v === 0 ? "Muted" : `${v} percent`}
              aria-disabled={disabled || undefined}
              aria-describedby={`${uid}-n`}
              onKeyDown={key}
              className="group/th pointer-events-auto absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none"
            >
              <span
                className="absolute inset-0 rounded-full bg-white shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_1px_3px_rgb(0_0_0/0.25)] transition-transform duration-300 group-focus-visible/th:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_30%,transparent)]"
                style={{ transform: drag ? "scale(1.25)" : "scale(1)", transitionTimingFunction: SPRING }}
              />
            </div>
          </div>
        </div>
        <span id={`${uid}-n`} className="w-7 shrink-0 text-right font-mono text-[12px] tabular-nums text-ink">
          {v}
        </span>
        {name && <input type="hidden" name={name} value={v} />}
      </div>
    </div>
  );
}

export default VolumeSlider;
