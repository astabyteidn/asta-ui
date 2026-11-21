"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const STOCK = 500;
const START = 352;
const START_SECS = 4 * 60 + 12;
// How many units go in each beat. Adds up to the remaining 148.
const BURSTS = [6, 11, 4, 15, 8, 19, 12, 23, 9, 17, 24];

/** Digits that roll to the new value instead of jumping. */
function Roll({ value, instant }: { value: string; instant: boolean }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-start leading-[1.1em] tabular-nums" aria-label={value}>
      {chars.map((c, i) => {
        const key = chars.length - i;
        if (!/\d/.test(c))
          return (
            <span key={`s${key}`} aria-hidden className="inline-block h-[1.1em]">
              {c}
            </span>
          );
        return (
          <span key={`d${key}`} aria-hidden className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1em]">
            <span className="invisible">0</span>
            <span
              className="absolute left-0 top-0 flex flex-col motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(c) * 1.1}em)`, transition: instant ? "none" : `transform .7s ${EASE} ${(chars.length - i) * 22}ms` }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.1em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** A flash sale running out: the stock bar drains, the claimed count rolls and the clock ticks until it sells out. Hover to pause. */
export default function FlashSale() {
  const [beat, setBeat] = useState(0);
  const [secs, setSecs] = useState(START_SECS);
  const [fade, setFade] = useState(false);
  const [instant, setInstant] = useState(false);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const k = useRef(0);
  const paused = hover || !visible;

  // Rest while off screen or in a hidden tab.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = true;
    const sync = () => setVisible(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const t: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const later = (ms: number, f: () => void) => t.push(setTimeout(() => alive && f(), ms));
    const cycle = () => {
      if (k.current > BURSTS.length) {
        setFade(true);
        later(450, () => {
          k.current = 0;
          setInstant(true);
          setBeat(0);
          setSecs(START_SECS);
        });
        later(560, () => setInstant(false));
        later(620, () => setFade(false));
        later(1500, cycle);
        return;
      }
      setBeat(++k.current);
      if (k.current <= BURSTS.length) setSecs((s) => s - 1);
      // Hold on Sold out a little longer before starting over.
      later(k.current === BURSTS.length ? 2800 : 1000, cycle);
    };
    later(900, cycle);
    return () => {
      alive = false;
      t.forEach(clearTimeout);
      setFade(false);
    };
  }, [paused]);

  const claimed = START + BURSTS.slice(0, beat).reduce((a, b) => a + b, 0);
  const left = STOCK - claimed;
  const soldOut = left <= 0;
  const toggle = () => setHover((h) => !h);

  return (
    <div
      ref={root}
      role="group"
      tabIndex={0}
      aria-label={`Flash sale. ${soldOut ? "Sold out" : `${left} left, ends in ${clock(secs)}`}. ${hover ? "Paused" : "Live"}. Press space to ${hover ? "resume" : "pause"}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      onPointerUp={(e) => e.pointerType !== "mouse" && toggle()}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      style={{ containerType: "size" }}
    >
      <style href="asta-flashsale" precedence="asta">{`
        @keyframes lab-fs-pop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.08) } 100% { transform: none; opacity: 1 } }
        @keyframes lab-fs-tick { from { opacity: .35 } to { opacity: 1 } }
        .lab-fs-pop { animation: lab-fs-pop .5s ${EASE} both }
        .lab-fs-tick { animation: lab-fs-tick .5s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-fs-pop, .lab-fs-tick { animation: none } }
      `}</style>

      <div
        className={`flex w-full max-w-[500px] items-stretch gap-[clamp(10px,4cqw,18px)] rounded-[14px] bg-paper p-[clamp(10px,3.4cqmin,14px)] ${RING} shadow-[0_18px_40px_-28px_rgb(0_0_0/0.35)]`}
        style={{ opacity: fade ? 0 : 1, transition: `opacity .45s ${EASE}` }}
      >
        <div className="relative w-[40%] shrink-0 overflow-hidden rounded-[10px] bg-paper-2">
          <img src="/lab/headphones.jpg" alt="Studio headphones" width={600} height={600} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute left-2 top-2 rounded-md bg-ink px-1.5 py-0.5 text-[10.5px] font-medium text-paper">−35%</span>
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center bg-paper/70"
            style={{ opacity: soldOut ? 1 : 0, transition: `opacity .5s ${EASE}` }}
          >
            {soldOut && <span className="lab-fs-pop rounded-md bg-ink px-2.5 py-1 text-[12px] font-medium text-paper">Sold out</span>}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[max(6px,2.2cqh)] py-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-brand">Flash sale</span>
            <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${soldOut ? "bg-paper-2 text-mute" : "bg-ink text-paper"}`}>
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                <circle cx="8" cy="8.5" r="5.5" />
                <path d="M8 5.5v3l2 1.2M6.5 1.5h3" />
              </svg>
              <span key={secs} className={instant ? "" : "lab-fs-tick"}>
                {soldOut ? "Ended" : clock(secs)}
              </span>
            </span>
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-[14px] font-medium leading-tight tracking-[-0.01em] text-ink">Astabyte Studio Headphones</p>
            <p className="truncate text-[11.5px] text-mute">Wireless · 40 h battery · Graphite</p>
          </div>
          <p className="flex items-baseline gap-2">
            <span className="font-medium tracking-[-0.03em] text-ink" style={{ fontSize: "clamp(20px, 7cqmin, 28px)", lineHeight: 1 }}>
              $129
            </span>
            <span className="text-[12.5px] text-mute line-through">$199</span>
          </p>

          <div className="mt-auto flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
              <span className="text-ink">
                <Roll value={String(claimed)} instant={instant} /> <span className="text-mute">claimed</span>
              </span>
              <span className={soldOut ? "text-mute" : left <= 60 ? "font-medium text-ink" : "text-mute"}>{soldOut ? "None left" : `Only ${left} left`}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-paper-2" role="meter" aria-label="Stock left" aria-valuemin={0} aria-valuemax={STOCK} aria-valuenow={left}>
              <div
                className="h-full origin-left rounded-full bg-brand"
                style={{ transform: `scaleX(${Math.max(0, left / STOCK)})`, transition: instant ? "none" : `transform .8s ${EASE}` }}
              />
            </div>
            <div
              className={`mt-1 flex h-[clamp(30px,10cqh,36px)] items-center justify-center rounded-[9px] text-[12.5px] font-medium ${soldOut ? `bg-paper text-ink ${RING}` : "bg-ink text-paper"}`}
              style={{ transition: `background-color .4s ${EASE}, color .4s ${EASE}` }}
            >
              <span key={soldOut ? "w" : "b"} className={instant ? "" : "lab-fs-pop"}>
                {soldOut ? "Join the waitlist" : "Buy now"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
