"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const BRAND = "var(--color-brand)";
const INK = "var(--color-ink)";

type Track = { title: string; artist: string; len: number; start: number; bg: string; shape: CSSProperties };

// Neutral placeholder covers: one gradient and one shape each, brand blue and black or white only.
const TRACKS: Track[] = [
  {
    title: "Slow Orbit",
    artist: "Halden",
    len: 204,
    start: 38,
    bg: `linear-gradient(150deg, color-mix(in srgb, ${BRAND} 70%, white), ${BRAND})`,
    shape: { inset: "34% -12% -12% 34%", borderRadius: "50%", background: "rgb(255 255 255 / .9)" },
  },
  {
    title: "Northern Static",
    artist: "Ivy Arden",
    len: 187,
    start: 64,
    bg: `linear-gradient(200deg, color-mix(in srgb, ${INK} 88%, ${BRAND}), ${INK})`,
    shape: { inset: "22%", borderRadius: "50%", boxShadow: `inset 0 0 0 7px ${BRAND}` },
  },
  {
    title: "Glass Hours",
    artist: "The Quiet Rooms",
    len: 232,
    start: 91,
    bg: `linear-gradient(180deg, color-mix(in srgb, ${BRAND} 12%, white), color-mix(in srgb, ${BRAND} 30%, white))`,
    shape: { inset: "50% 0 0 0", background: BRAND, borderRadius: "50% 50% 0 0 / 100% 100% 0 0" },
  },
  {
    title: "Soft Meridian",
    artist: "Lumen Coast",
    len: 199,
    start: 47,
    bg: `radial-gradient(circle at 70% 25%, color-mix(in srgb, ${BRAND} 60%, white), ${BRAND} 55%, color-mix(in srgb, ${BRAND} 60%, black))`,
    shape: { inset: "62% 18% 30% 18%", background: "rgb(255 255 255 / .85)", borderRadius: "2px" },
  },
];
const BARS = [0.9, 1.15, 0.8, 1.05];
/** How long the idle tour stays on a track before it skips. */
const DWELL = 9000;

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const Skip = ({ back }: { back?: boolean }) => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" style={back ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
    <path d="M3 3.2v9.6c0 .5.5.8.9.5L10.5 8.4a.6.6 0 0 0 0-.8L3.9 2.7c-.4-.3-.9 0-.9.5Z" />
    <rect x="11.6" y="2.8" width="1.8" height="10.4" rx=".6" />
  </svg>
);

/** One focused moment: the equalizer bounces while it plays, and skipping slides the title and cover across. */
export default function NowPlaying() {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<{ i: number; dir: number; n: number } | null>(null);
  const [dir, setDir] = useState(1);
  const [at, setAt] = useState(TRACKS[0].start);
  const [playing, setPlaying] = useState(true);
  const [demo, setDemo] = useState(true);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const n = useRef(0);
  const curRef = useRef(0);

  const track = TRACKS[cur];

  const go = (d: number) => {
    const c = curRef.current;
    const next = (c + d + TRACKS.length) % TRACKS.length;
    curRef.current = next;
    setPrev({ i: c, dir: d, n: ++n.current });
    setCur(next);
    setAt(TRACKS[next].start);
    setDir(d);
  };

  const takeOver = () => {
    setDemo(false);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setDemo(true), 10000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  // Start paused for reduced motion: nothing moves until you press play.
  useEffect(() => {
    if (!still()) return;
    const id = setTimeout(() => setPlaying(false), 0);
    return () => clearTimeout(id);
  }, []);

  // Playback clock.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setAt((a) => a + 0.25), 250);
    return () => clearInterval(id);
  }, [playing]);

  // Track end, and the idle tour's skip.
  useEffect(() => {
    if (at < track.len) return;
    const id = setTimeout(() => go(1), 0);
    return () => clearTimeout(id);
  }, [at, track.len]);
  useEffect(() => {
    if (!demo || !playing || still()) return;
    const id = setTimeout(() => go(1), DWELL);
    return () => clearTimeout(id);
  }, [demo, playing, cur]);

  // Drop the leaving title once it has slid out.
  useEffect(() => {
    if (!prev) return;
    const id = setTimeout(() => setPrev((p) => (p && p.n === prev.n ? null : p)), 600);
    return () => clearTimeout(id);
  }, [prev]);

  const toggle = () => {
    takeOver();
    setPlaying((p) => !p);
  };
  const skip = (d: number) => {
    takeOver();
    go(d);
  };
  const seekTo = (x: number) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r) return;
    setAt(Math.max(0, Math.min(track.len - 1, ((x - r.left) / r.width) * track.len)));
  };
  const onBar = (e: PointerEvent<HTMLDivElement>) => {
    takeOver();
    e.currentTarget.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  };

  const onKey = (e: KeyboardEvent) => {
    const onButton = e.target !== e.currentTarget && (e.target as HTMLElement).tagName === "BUTTON";
    if (e.key === " " && !onButton) {
      e.preventDefault();
      toggle();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      takeOver();
      const d = e.key === "ArrowRight" ? 5 : -5;
      setAt((a) => Math.max(0, Math.min(track.len - 1, a + d)));
    }
  };

  const p = Math.min(1, at / track.len);
  const slide = (i: number, out: boolean, d: number) => (
    <span key={`${i}-${out ? prev?.n : "in"}-${cur}`} className={`${out ? "absolute inset-0" : "block"} ${out ? (d > 0 ? "lab-np-out" : "lab-np-out-b") : d > 0 ? "lab-np-in" : d < 0 ? "lab-np-in-b" : ""}`}>
      <span className="block truncate text-[15px] font-medium tracking-[-0.015em] text-ink">{TRACKS[i].title}</span>
      <span className="block truncate text-[12.5px] text-mute">{TRACKS[i].artist}</span>
    </span>
  );

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`Music player. ${track.title} by ${track.artist}. ${playing ? "Playing" : "Paused"}. Space to ${playing ? "pause" : "play"}, arrows to seek`}
      onKeyDown={onKey}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      style={{ containerType: "size" }}
    >
      <style href="asta-nowplaying" precedence="asta">{`
        .lab-np-body { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: min(6cqw, 28px); align-items: center }
        .lab-np-cover { width: min(62cqh, 40cqw, 200px) }
        @container (aspect-ratio < 1.15) { .lab-np-body { grid-template-columns: minmax(0, 1fr); gap: 16px } .lab-np-cover { width: min(38cqh, 100%) } }
        @keyframes lab-np-in { from { transform: translateX(18px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-np-in-b { from { transform: translateX(-18px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-np-out { to { transform: translateX(-18px); opacity: 0 } }
        @keyframes lab-np-out-b { to { transform: translateX(18px); opacity: 0 } }
        @keyframes lab-np-eq { 0% { transform: scaleY(.3) } 35% { transform: scaleY(1) } 65% { transform: scaleY(.55) } 100% { transform: scaleY(.85) } }
        .lab-np-in { animation: lab-np-in .55s ${EASE} both }
        .lab-np-in-b { animation: lab-np-in-b .55s ${EASE} both }
        .lab-np-out { animation: lab-np-out .45s ${EASE} both }
        .lab-np-out-b { animation: lab-np-out-b .45s ${EASE} both }
        .lab-np-eq { transform-origin: bottom; animation: lab-np-eq var(--d) ${EASE} infinite alternate }
        @media (prefers-reduced-motion: reduce) {
          .lab-np-in, .lab-np-in-b, .lab-np-out, .lab-np-out-b, .lab-np-eq { animation: none }
          .lab-np-out, .lab-np-out-b { opacity: 0 }
          .lab-np-eq { transform: scaleY(.5) }
        }
      `}</style>

      <div className="lab-np-body w-full max-w-[460px]">
        {/* Cover */}
        <div className={`lab-np-cover relative mx-auto aspect-square overflow-hidden rounded-[12px] bg-paper-2 ${RING}`}>
          {TRACKS.map((t, i) => (
            <div
              key={t.title}
              aria-hidden
              className="absolute inset-0 transition-[opacity,transform] duration-700 motion-reduce:transition-none"
              style={{
                background: t.bg,
                opacity: i === cur ? 1 : 0,
                transform: i === cur ? "none" : prev?.i === i ? `translateX(${-dir * 8}%) scale(.98)` : `translateX(${dir * 8}%) scale(.98)`,
                transitionTimingFunction: EASE,
              }}
            >
              <span className="absolute" style={t.shape} />
            </div>
          ))}
        </div>

        <div className="flex min-w-0 flex-col">
          {/* Now playing + equalizer */}
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] text-mute">
            <span
              className="flex h-3 items-end gap-[2px] transition-[opacity,transform] duration-500"
              style={{ opacity: playing ? 1 : 0.45, transform: playing ? "none" : "scaleY(.35)", transformOrigin: "bottom", transitionTimingFunction: EASE }}
              aria-hidden
            >
              {BARS.map((d, i) => (
                <span
                  key={i}
                  className="lab-np-eq block h-full w-[2.5px] rounded-[1px] bg-brand"
                  style={{ ["--d" as string]: `${d * 0.5}s`, animationDelay: `${-i * 0.17}s`, animationPlayState: playing ? "running" : "paused" }}
                />
              ))}
            </span>
            {playing ? "Now playing" : "Paused"}
          </div>

          {/* Title: the old one slides out as the new one slides in. */}
          <div className="relative mt-2 overflow-hidden" aria-live="polite">
            {prev && slide(prev.i, true, prev.dir)}
            {slide(cur, false, prev ? prev.dir : 0)}
          </div>

          {/* Progress */}
          <div
            ref={bar}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={track.len}
            aria-valuenow={Math.floor(at)}
            aria-valuetext={`${clock(at)} of ${clock(track.len)}`}
            onPointerDown={onBar}
            onPointerMove={(e) => e.buttons && seekTo(e.clientX)}
            className="group relative mt-[max(12px,4cqh)] flex h-4 cursor-pointer touch-none items-center"
          >
            <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
              <span
                key={cur}
                className="absolute inset-0 origin-left rounded-full bg-brand"
                style={{ transform: `scaleX(${p})`, transition: `transform .25s linear` }}
              />
            </span>
            <span key={`k${cur}`} aria-hidden className="pointer-events-none absolute inset-0" style={{ transform: `translateX(${p * 100}%)`, transition: `transform .25s linear` }}>
              <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </span>
          </div>
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-mute">
            <span>{clock(at)}</span>
            <span>-{clock(Math.max(0, track.len - at))}</span>
          </div>

          {/* Controls */}
          <div className="mt-[max(8px,2.5cqh)] flex items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Previous track"
              onClick={() => skip(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-ink-2 outline-none transition-transform duration-200 active:scale-90 focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Skip back />
            </button>
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              onClick={toggle}
              className="relative flex h-10 w-10 items-center justify-center rounded-[9px] bg-ink text-paper outline-none transition-transform duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              {/* Play and pause trade places with a turn and a scale. */}
              <svg
                viewBox="0 0 16 16"
                className="absolute h-4 w-4 transition-[opacity,transform] duration-500 motion-reduce:transition-none"
                style={{ opacity: playing ? 0 : 1, transform: playing ? "rotate(-90deg) scale(.5)" : "none", transitionTimingFunction: EASE }}
                fill="currentColor"
                aria-hidden
              >
                <path d="M4.5 2.9v10.2c0 .5.5.8.9.5l7.6-5.1a.6.6 0 0 0 0-1L5.4 2.4c-.4-.3-.9 0-.9.5Z" />
              </svg>
              <svg
                viewBox="0 0 16 16"
                className="absolute h-4 w-4 transition-[opacity,transform] duration-500 motion-reduce:transition-none"
                style={{ opacity: playing ? 1 : 0, transform: playing ? "none" : "rotate(90deg) scale(.5)", transitionTimingFunction: EASE }}
                fill="currentColor"
                aria-hidden
              >
                <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
                <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next track"
              onClick={() => skip(1)}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-ink-2 outline-none transition-transform duration-200 active:scale-90 focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Skip />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
