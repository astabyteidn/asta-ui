"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const ROWS = ["A", "B", "C", "D", "E", "F"];
const COLS = 8;
const AISLE = 4;
const PRICE = 14;
const SEATS = ROWS.flatMap((r) => Array.from({ length: COLS }, (_, c) => `${r}${c + 1}`));
const TAKEN = ["A3", "A4", "B6", "C1", "C2", "E7", "F4", "F5"];
/** Idle tour: pick two, swap one, then clear, so the loop ends where it began. */
const DEMO = ["D4", "D5", "D4", "E4", "D5", "E4"];
/** Seats "someone else" may grab. Never the ones the tour uses. */
const POOL = SEATS.filter((s) => !TAKEN.includes(s) && !DEMO.includes(s));

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Digits that roll to the new value instead of jumping. */
function Roll({ value }: { value: string }) {
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
              className="absolute left-0 top-0 flex flex-col transition-transform duration-700 motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(c) * 1.1}em)`, transitionTimingFunction: EASE }}
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

/** One focused moment: a picked seat pops blue and the total rolls. Now and then someone else books a seat and it fades in. */
export default function SeatPicker() {
  const [sel, setSel] = useState<string[]>([]);
  const [taken, setTaken] = useState<string[]>(TAKEN);
  const [focus, setFocus] = useState(SEATS.indexOf("D4"));
  const [paused, setPaused] = useState(false);
  const selRef = useRef<string[]>([]);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = (s: string) => {
    const next = selRef.current.includes(s) ? selRef.current.filter((x) => x !== s) : [...selRef.current, s];
    selRef.current = next;
    setSel(next);
  };

  const takeOver = () => {
    setPaused(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  // Demo loop: walk the tour, skipping steps that already match what you left behind.
  useEffect(() => {
    if (paused || still()) return;
    let n = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      for (let guard = 0; guard < DEMO.length; guard++) {
        const k = n % DEMO.length;
        const s = DEMO[k];
        const wantOn = DEMO.slice(0, k + 1).filter((x) => x === s).length % 2 === 1;
        n++;
        if (selRef.current.includes(s) !== wantOn) {
          toggle(s);
          break;
        }
      }
      id = setTimeout(tick, 1700);
    };
    id = setTimeout(tick, 1200);
    return () => clearTimeout(id);
  }, [paused]);

  // Someone else: grab a free seat, or let one go once a few are held, so the map never fills up.
  useEffect(() => {
    if (still()) return;
    const id = setInterval(() => {
      const r = Math.random();
      setTaken((t) => {
        const extra = t.filter((s) => !TAKEN.includes(s));
        if (extra.length >= 3 || (extra.length > 0 && r < 0.3)) return t.filter((s) => s !== extra[0]);
        const free = POOL.filter((s) => !t.includes(s) && !selRef.current.includes(s));
        return free.length ? [...t, free[Math.floor(r * free.length)]] : t;
      });
    }, 3400);
    return () => clearInterval(id);
  }, []);

  const pick = (s: string, i: number) => {
    setFocus(i);
    if (taken.includes(s)) return;
    takeOver();
    toggle(s);
  };

  const onKey = (e: KeyboardEvent) => {
    const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLS, ArrowUp: -COLS }[e.key];
    if (!d) return;
    e.preventDefault();
    const n = focus + d;
    if (n < 0 || n >= SEATS.length || (Math.abs(d) === 1 && Math.floor(n / COLS) !== Math.floor(focus / COLS))) return;
    setFocus(n);
    btns.current[n]?.focus();
  };

  const total = sel.length * PRICE;

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11" style={{ containerType: "size" }}>
      <style href="asta-seatpicker" precedence="asta">{`
        .lab-sp-map { width: min(100%, 340px, calc(48cqh * 1.55)) }
        .lab-sp-legend { display: none }
        @container (min-width: 420px) { .lab-sp-legend { display: flex } }
        @keyframes lab-sp-pop { 0% { transform: scale(.6) } 60% { transform: scale(1.06) } 100% { transform: none } }
        .lab-sp-pop { animation: lab-sp-pop .5s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-sp-pop { animation: none } }
      `}</style>

      <div className="flex w-full max-w-[420px] flex-col gap-[max(12px,4cqh)]">
        {/* Showing */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-[14px] font-medium tracking-[-0.01em] text-ink">Northbound</span>
            <span className="block truncate text-[11.5px] text-mute">Hall 3 · Fri 19:40</span>
          </div>
          <div className="lab-sp-legend items-center gap-3 text-[11px] text-mute" aria-hidden>
            <span className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-[3px] ${RING}`} />
              Free
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]" />
              Taken
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-brand" />
              Yours
            </span>
          </div>
        </div>

        {/* Map */}
        <div className="lab-sp-map mx-auto flex flex-col items-center">
          <svg viewBox="0 0 200 14" className="w-[86%] text-ink" fill="none" aria-hidden>
            <path d="M4 12 Q100 -2 196 12" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="mb-[max(8px,2.5cqh)] text-[10px] uppercase tracking-[0.14em] text-mute">Screen</span>
          <div
            role="group"
            aria-label="Seats"
            onKeyDown={onKey}
            className="grid w-full gap-[5px]"
            style={{ gridTemplateColumns: `12px repeat(${AISLE}, minmax(0,1fr)) 8px repeat(${COLS - AISLE}, minmax(0,1fr))` }}
          >
            {ROWS.map((r, ri) => (
              <div key={r} className="contents">
                <span className="flex items-center text-[10px] text-mute" style={{ gridColumn: 1, gridRow: ri + 1 }} aria-hidden>
                  {r}
                </span>
                {Array.from({ length: COLS }, (_, c) => {
                  const i = ri * COLS + c;
                  const s = SEATS[i];
                  const isTaken = taken.includes(s);
                  const mine = sel.includes(s);
                  return (
                    <button
                      key={s}
                      ref={(el) => {
                        btns.current[i] = el;
                      }}
                      type="button"
                      tabIndex={i === focus ? 0 : -1}
                      aria-pressed={mine}
                      aria-disabled={isTaken}
                      aria-label={`Seat ${s}, ${isTaken ? "taken" : mine ? "selected" : `$${PRICE}`}`}
                      onClick={() => pick(s, i)}
                      className={`relative aspect-square rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-1 focus-visible:ring-offset-paper ${isTaken ? "cursor-default" : "cursor-pointer"}`}
                      style={{ gridColumn: c < AISLE ? c + 2 : c + 3, gridRow: ri + 1 }}
                    >
                      <span
                        aria-hidden
                        className={`absolute inset-0 rounded-[5px] transition-opacity duration-500 ${RING}`}
                        style={{ opacity: isTaken || mine ? 0 : 1, transitionTimingFunction: EASE }}
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-[5px] bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)] transition-[opacity,transform] duration-700 motion-reduce:transition-none"
                        style={{ opacity: isTaken ? 1 : 0, transform: isTaken ? "none" : "scale(.7)", transitionTimingFunction: EASE }}
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none"
                        style={{ opacity: mine ? 1 : 0, transform: mine ? "none" : "scale(.8)", transitionTimingFunction: EASE }}
                      >
                        <span key={mine ? "on" : "off"} className={`block h-full w-full rounded-[5px] bg-brand ${mine ? "lab-sp-pop" : ""}`} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 leading-tight">
            <span className="block text-[11px] text-mute">{sel.length ? `${sel.length} seat${sel.length > 1 ? "s" : ""}` : "Pick your seats"}</span>
            <span className="block truncate text-[13px] text-ink" aria-live="polite">
              {sel.length ? [...sel].sort().join(", ") : "—"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-[17px] font-medium tracking-[-0.02em] text-ink" style={{ lineHeight: 1 }}>
              $<Roll value={String(total)} />
            </span>
            <button
              type="button"
              aria-disabled={!sel.length}
              className="h-9 rounded-[8px] bg-brand px-3.5 text-[12.5px] font-medium text-paper outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              style={{ opacity: sel.length ? 1 : 0.35, transitionTimingFunction: EASE }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
