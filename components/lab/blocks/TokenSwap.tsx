"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const ROW = 78;
const GAP = 6;
const REFRESH = 10;
const TICKS = 10;

const TOKENS = [
  { sym: "ASTA", bal: "1,240.00" },
  { sym: "USDX", bal: "860.50" },
];
/** Rate moves are a fixed tour, so server and client agree and the loop stays calm. */
const DRIFT = [0.0021, -0.0012, 0.0034, -0.0018, 0.0009, -0.0026];
const BASE = 2.4318;

type Status = "idle" | "pending" | "done";

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Digits that roll to the new value instead of jumping. */
function Roll({ value }: { value: string }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-start leading-[1.15em] tabular-nums" aria-label={value}>
      {chars.map((c, i) => {
        const key = chars.length - i;
        if (!/\d/.test(c))
          return (
            <span key={`s${key}`} aria-hidden className="inline-block h-[1.15em]">
              {c}
            </span>
          );
        return (
          <span key={`d${key}`} aria-hidden className="relative inline-block h-[1.15em] overflow-hidden leading-[1.15em]">
            <span className="invisible">0</span>
            <span
              className="absolute left-0 top-0 flex flex-col motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(c) * 1.15}em)`, transition: `transform .7s ${EASE} ${key * 18}ms` }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.15em]">
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

const Mark = ({ sym }: { sym: string }) => (
  <span className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] bg-paper pl-1.5 pr-2.5 text-[13px] font-medium text-ink ${RING}`}>
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[9.5px] font-semibold text-paper">{sym[0]}</span>
    {sym}
  </span>
);

/** One focused moment: type and the quote rolls, flip and the rows trade places, swap and it settles into a check. The rate refreshes on a ring. */
export default function TokenSwap() {
  const [amt, setAmt] = useState("");
  const [from, setFrom] = useState(0);
  const [flips, setFlips] = useState(0);
  const [rate, setRate] = useState(BASE);
  const [delta, setDelta] = useState(0);
  const [secs, setSecs] = useState(REFRESH);
  const [status, setStatus] = useState<Status>("idle");
  const [paused, setPaused] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Only timers still pending: each one removes itself when it fires.
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const view = useRef({ amt, from, rate });

  useEffect(() => {
    view.current = { amt, from, rate };
  }, [amt, from, rate]);

  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const takeOver = () => {
    setPaused(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(
    () => () => {
      if (idle.current) clearTimeout(idle.current);
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const quoteOf = (a: string, f: number, r: number) => {
    const n = Number(a) || 0;
    return f === 0 ? n * r : n / r;
  };

  const flip = () => {
    const v = view.current;
    const out = quoteOf(v.amt, v.from, v.rate);
    setFlips((x) => x + 1);
    setFrom((x) => 1 - x);
    setAmt(v.amt ? String(Math.round(out * 100) / 100) : "");
  };

  const swap = () => {
    setStatus("pending");
    const fast = still();
    const later = (ms: number, f: () => void) => {
      const id = setTimeout(() => {
        timers.current.delete(id);
        f();
      }, ms);
      timers.current.add(id);
    };
    later(fast ? 0 : 1200, () => setStatus("done"));
    later(fast ? 1600 : 2900, () => setStatus("idle"));
  };

  // Rate refresh: the ring empties over ten seconds, then the quote re-rolls.
  useEffect(() => {
    if (still()) return;
    let n = 0;
    let left = REFRESH;
    const id = setInterval(() => {
      left = left > 1 ? left - 1 : REFRESH;
      setSecs(left);
      if (left !== REFRESH) return;
      const d = DRIFT[n++ % DRIFT.length];
      setDelta(d);
      setRate((r) => Math.round(r * (1 + d) * 10000) / 10000);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Demo loop: type, swap, flip, flip back, clear. It ends where it started.
  useEffect(() => {
    if (paused || still()) return;
    // Live timers only: each one drops out of the set when it fires, so the loop doesn't pile up ids.
    const t = new Set<ReturnType<typeof setTimeout>>();
    let at = 0;
    const later = (ms: number, f: () => void) => {
      const id = setTimeout(() => {
        t.delete(id);
        f();
      }, (at += ms));
      t.add(id);
    };
    const run = () => {
      at = 0;
      ["1", "12", "125"].forEach((v, i) => later(i ? 220 : 700, () => setAmt(v)));
      later(1300, swap);
      later(3300, flip);
      later(1900, flip);
      later(1600, () => setAmt("12"));
      later(200, () => setAmt("1"));
      later(200, () => setAmt(""));
      later(900, run);
    };
    run();
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const out = quoteOf(amt, from, rate);
  const has = Number(amt) > 0;
  const busy = status !== "idle";
  const pay = TOKENS[from];
  const get = TOKENS[1 - from];

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11" style={{ containerType: "size" }}>
      <style href="asta-tokenswap" precedence="asta">{`
        @container (max-height: 330px) { .lab-sw-rate { display: none } }
        @keyframes lab-sw-spin { to { transform: rotate(360deg) } }
        @keyframes lab-sw-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes lab-sw-in { from { transform: translateY(5px); opacity: 0 } to { transform: none; opacity: 1 } }
        .lab-sw-spin { animation: lab-sw-spin .8s linear infinite }
        .lab-sw-draw { stroke-dasharray: 1; animation: lab-sw-draw .45s ${EASE} .05s both }
        .lab-sw-in { animation: lab-sw-in .4s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-sw-spin, .lab-sw-draw, .lab-sw-in { animation: none } }
      `}</style>

      <div className="flex w-full max-w-[380px] flex-col gap-[max(10px,3.5cqh)]">
        <div className="flex items-center justify-between">
          <span className="text-[clamp(15px,4.6cqmin,18px)] font-medium tracking-[-0.02em] text-ink">Swap</span>
          {/* Countdown ring: one tick fades per second. */}
          <span className="flex items-center gap-2 text-[11.5px] tabular-nums text-mute" role="timer" aria-label={`Quote refreshes in ${secs} seconds`}>
            <span aria-hidden>{secs}s</span>
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] text-ink-2" aria-hidden>
              {Array.from({ length: TICKS }, (_, i) => (
                <rect
                  key={i}
                  x="9.25"
                  y="1.5"
                  width="1.5"
                  height="4"
                  rx=".75"
                  fill="currentColor"
                  transform={`rotate(${i * (360 / TICKS)} 10 10)`}
                  style={{ opacity: i < (secs / REFRESH) * TICKS ? 1 : 0.18, transition: `opacity .5s ${EASE}` }}
                />
              ))}
            </svg>
          </span>
        </div>

        <div className="relative" style={{ height: ROW * 2 + GAP }}>
          {TOKENS.map((tk, t) => {
            const isPay = t === from;
            return (
              <div
                key={tk.sym}
                className="absolute inset-x-0 top-0 flex flex-col justify-center gap-1.5 rounded-[12px] bg-paper-2 px-3.5 motion-reduce:transition-none"
                style={{ height: ROW, transform: `translateY(${isPay ? 0 : ROW + GAP}px)`, transition: `transform .6s ${EASE}` }}
              >
                <span className="flex items-center justify-between text-[11.5px] text-mute">
                  <span>{isPay ? "You pay" : "You receive"}</span>
                  <span className="tabular-nums">Balance {tk.bal}</span>
                </span>
                <span className="flex items-center justify-between gap-3">
                  {isPay ? (
                    <input
                      name="amount"
                      inputMode="decimal"
                      autoComplete="off"
                      aria-label={`Amount of ${tk.sym} to pay`}
                      placeholder="0"
                      value={amt}
                      onChange={(e) => {
                        const v = e.target.value.replace(/,/g, "");
                        if (!/^\d{0,7}(\.\d{0,2})?$/.test(v)) return;
                        takeOver();
                        setAmt(v);
                      }}
                      className="w-full min-w-0 bg-transparent text-[24px] font-medium tracking-[-0.03em] text-ink outline-none placeholder:text-mute"
                    />
                  ) : (
                    <span className={`min-w-0 truncate text-[24px] font-medium tracking-[-0.03em] ${has ? "text-ink" : "text-mute"}`} aria-live="polite">
                      <Roll value={fmt(out)} />
                    </span>
                  )}
                  <Mark sym={tk.sym} />
                </span>
              </div>
            );
          })}
          <button
            type="button"
            aria-label={`Flip, pay with ${get.sym}`}
            onClick={() => {
              takeOver();
              flip();
            }}
            className={`absolute left-1/2 z-10 -ml-4 flex h-8 w-8 items-center justify-center rounded-[9px] bg-paper text-ink-2 outline-none transition-transform duration-200 active:scale-90 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60 ${RING}`}
            style={{ top: ROW + GAP / 2 - 16 }}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 motion-reduce:transition-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              style={{ transform: `rotate(${flips * 180}deg)`, transition: `transform .6s ${EASE}` }}
            >
              <path d="M8 2.5v11M4 9.5l4 4 4-4" />
            </svg>
          </button>
        </div>

        <div className="lab-sw-rate flex items-center justify-between text-[12px] text-mute">
          <span className="tabular-nums">
            1 ASTA = <Roll value={rate.toFixed(4)} /> USDX
          </span>
          {delta !== 0 && (
            <span key={rate} className={`lab-sw-in tabular-nums ${delta > 0 ? "text-brand" : "text-mute"}`}>
              <span aria-hidden>{delta > 0 ? "▲" : "▼"}</span>
              <span className="sr-only">Rate {delta > 0 ? "up" : "down"}</span> {Math.abs(delta * 100).toFixed(2)}%
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!has || busy}
          onClick={() => {
            takeOver();
            swap();
          }}
          aria-live="polite"
          className="relative h-10 overflow-hidden rounded-[8px] bg-ink text-[13px] font-medium text-paper outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-default"
          style={{ opacity: has || busy ? 1 : 0.35 }}
        >
          {/* Success washes the button blue, then fades back. */}
          <span aria-hidden className="absolute inset-0 bg-brand transition-opacity duration-500" style={{ opacity: status === "done" ? 1 : 0, transitionTimingFunction: EASE }} />
          <span key={status} className="lab-sw-in relative flex items-center justify-center gap-2">
            {status === "pending" && (
              <>
                <svg viewBox="0 0 16 16" className="lab-sw-spin h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M8 2a6 6 0 0 1 6 6" />
                </svg>
                Confirming
              </>
            )}
            {status === "done" && (
              <>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path className="lab-sw-draw" pathLength={1} d="M3.5 8.5l3 3 6-7" />
                </svg>
                Swapped
              </>
            )}
            {status === "idle" && (has ? `Swap ${pay.sym} for ${get.sym}` : "Enter an amount")}
          </span>
        </button>
      </div>
    </div>
  );
}
