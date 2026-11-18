"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const COLS = 3;

const DAYS = [
  { dow: "Mon", date: 17, slots: ["9:00", "9:30", "11:00", "13:30", "15:00", "16:30"] },
  { dow: "Tue", date: 18, slots: ["10:00", "10:30", "12:00", "14:00", "15:30"] },
  { dow: "Wed", date: 19, slots: ["9:30", "11:30", "13:00", "14:30", "16:00", "17:00"] },
  { dow: "Thu", date: 20, slots: ["10:00", "12:30", "15:00"] },
  { dow: "Fri", date: 21, slots: ["9:00", "10:30", "11:00", "13:00"] },
];

/** Idle tour: [day, slot]. Each run books a different time, then the summary fades back to the picker. */
const DEMO: [number, number][] = [
  [1, 1],
  [2, 3],
  [4, 2],
  [0, 4],
];

type Stage = "pick" | "confirming" | "booked";

const end = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const n = h * 60 + m + 30;
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};

/** One focused moment: pick a day and its times stagger in, pick a time and Confirm slides up, confirm and it turns into a booking. */
export default function BookingSlots() {
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [paused, setPaused] = useState(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slotBtns = useRef<(HTMLButtonElement | null)[]>([]);
  const dayBtns = useRef<(HTMLButtonElement | null)[]>([]);
  // Only timers still pending: each one removes itself when it fires.
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

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

  const confirm = () => {
    setStage("confirming");
    const id = setTimeout(() => {
      timers.current.delete(id);
      setStage("booked");
    }, still() ? 0 : 650);
    timers.current.add(id);
  };

  // Demo loop: day → time → confirm → booked → back to the picker.
  useEffect(() => {
    if (paused || still()) return;
    // Live timers only: each one drops out of the set when it fires, so the loop doesn't pile up ids.
    const t = new Set<ReturnType<typeof setTimeout>>();
    const later = (ms: number, f: () => void) => {
      const id = setTimeout(() => {
        t.delete(id);
        f();
      }, ms);
      t.add(id);
    };
    let n = 0;
    const run = () => {
      const [d, s] = DEMO[n++ % DEMO.length];
      setStage("pick");
      setSlot(null);
      later(700, () => setDay(d));
      later(1900, () => setSlot(s));
      later(3100, () => setStage("confirming"));
      later(3750, () => setStage("booked"));
      later(6400, run);
    };
    later(600, run);
    return () => t.forEach(clearTimeout);
  }, [paused]);

  const pickDay = (d: number) => {
    takeOver();
    if (stage !== "pick") setStage("pick");
    if (d !== day) setSlot(null);
    setDay(d);
  };
  const pickSlot = (s: number) => {
    takeOver();
    setStage("pick");
    setSlot(s);
  };

  const slots = DAYS[day].slots;

  const onSlotKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLS, ArrowUp: -COLS };
    const d = map[e.key];
    if (d === undefined) return;
    e.preventDefault();
    const cur = slot ?? -1;
    const n = Math.min(slots.length - 1, Math.max(0, cur < 0 ? 0 : cur + d));
    pickSlot(n);
    slotBtns.current[n]?.focus();
  };
  const onDayKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (day + d + DAYS.length) % DAYS.length;
    pickDay(n);
    dayBtns.current[n]?.focus();
  };

  const booked = stage === "booked";
  const ready = slot !== null && stage !== "booked";
  const when = slot !== null ? `${DAYS[day].dow}, Nov ${DAYS[day].date}` : "";
  const time = slot !== null ? `${slots[slot]} – ${end(slots[slot])}` : "";

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11" style={{ containerType: "size" }}>
      <style href="asta-bookingslots" precedence="asta">{`
        @container (max-height: 330px) { .lab-bk-head { display: none } }
        @keyframes lab-bk-in { from { transform: translateY(6px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-bk-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes lab-bk-pop { from { transform: scale(.6); opacity: 0 } to { transform: none; opacity: 1 } }
        .lab-bk-in { animation: lab-bk-in .5s ${EASE} both }
        .lab-bk-draw { stroke-dasharray: 1; animation: lab-bk-draw .45s ${EASE} .12s both }
        .lab-bk-pop { animation: lab-bk-pop .45s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-bk-in, .lab-bk-draw, .lab-bk-pop { animation: none } }
      `}</style>

      <div className="flex w-full max-w-[400px] flex-col gap-[max(12px,4.5cqh)]">
        <div className="lab-bk-head min-w-0">
          <span className="text-[11.5px] text-mute">Intro call · 30 min</span>
          <span className="mt-0.5 block truncate text-[clamp(15px,4.6cqmin,18px)] font-medium tracking-[-0.02em] text-ink">Pick a time</span>
        </div>

        {/* Week strip: a soft pill glides to the picked day. */}
        <div role="radiogroup" aria-label="Day" onKeyDown={onDayKey} className="relative grid grid-cols-5">
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 left-0 w-1/5 rounded-[10px] bg-paper-2 ${RING} transition-transform duration-500 motion-reduce:transition-none`}
            style={{ transform: `translateX(${day * 100}%)`, transitionTimingFunction: EASE }}
          />
          {DAYS.map((d, i) => (
            <button
              key={d.dow}
              ref={(el) => {
                dayBtns.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={day === i}
              aria-label={`${d.dow} ${d.date}, ${d.slots.length} times`}
              tabIndex={day === i ? 0 : -1}
              onClick={() => pickDay(i)}
              className="relative flex flex-col items-center gap-0.5 rounded-[10px] py-2 outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <span className={`text-[11px] transition-opacity duration-300 ${day === i ? "text-ink-2" : "text-mute"}`}>{d.dow}</span>
              <span className={`text-[15px] font-medium tabular-nums transition-opacity duration-300 ${day === i ? "text-ink" : "text-ink-2"}`}>{d.date}</span>
            </button>
          ))}
        </div>

        {/* Slots and the booked summary share one box and crossfade. */}
        <div className="relative" style={{ height: "calc(3 * 36px + 2 * 8px)" }}>
          <div
            role="radiogroup"
            aria-label={`Times on ${DAYS[day].dow}`}
            aria-hidden={booked}
            onKeyDown={onSlotKey}
            className="absolute inset-0 grid content-start gap-2 transition-[opacity,transform] duration-500 motion-reduce:transition-none"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, opacity: booked ? 0 : 1, transform: booked ? "translateY(-6px)" : "none", transitionTimingFunction: EASE }}
          >
            {slots.map((t, i) => {
              const on = slot === i;
              return (
                <button
                  key={`${day}-${t}`}
                  ref={(el) => {
                    slotBtns.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on || (slot === null && i === 0) ? 0 : -1}
                  disabled={booked}
                  onClick={() => pickSlot(i)}
                  className={`lab-bk-in relative h-9 overflow-hidden rounded-[8px] text-[13px] font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${RING}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-brand transition-[opacity,transform] duration-300 motion-reduce:transition-none"
                    style={{ opacity: on ? 1 : 0, transform: on ? "none" : "scale(.92)", transitionTimingFunction: EASE }}
                  />
                  <span className={`relative transition-colors duration-300 ${on ? "text-paper" : "text-ink"}`}>{t}</span>
                </button>
              );
            })}
          </div>

          <div
            aria-hidden={!booked}
            aria-live="polite"
            className="absolute inset-0 flex items-center gap-3.5 transition-[opacity,transform] duration-500 motion-reduce:transition-none"
            style={{ opacity: booked ? 1 : 0, transform: booked ? "none" : "translateY(6px)", transitionTimingFunction: EASE, pointerEvents: booked ? "auto" : "none" }}
          >
            {booked && (
              <>
                <span className="lab-bk-pop flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-paper">
                  <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path className="lab-bk-draw" pathLength={1} d="M3.5 8.5l3 3 6-7" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium tracking-[-0.01em] text-ink">Booked</span>
                  <span className="block truncate text-[13px] tabular-nums text-ink-2">
                    {when} · {time}
                  </span>
                  <span className="block truncate text-[11.5px] text-mute">Invite sent to you@studio.dev</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Confirm slides up once a time is picked, then hands over to the check. */}
        <div className="relative h-10 overflow-hidden">
          <button
            type="button"
            tabIndex={ready ? 0 : -1}
            aria-hidden={!ready}
            disabled={!ready || stage === "confirming"}
            onClick={() => {
              takeOver();
              confirm();
            }}
            className="absolute inset-0 flex items-center justify-center rounded-[8px] bg-ink text-[13px] font-medium text-paper outline-none transition-[opacity,transform] duration-500 focus-visible:ring-2 focus-visible:ring-brand/60 motion-reduce:transition-none"
            style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(110%)", transitionTimingFunction: EASE }}
          >
            <span className="transition-[opacity,transform] duration-300" style={{ opacity: stage === "confirming" ? 0 : 1, transform: stage === "confirming" ? "translateY(-6px)" : "none", transitionTimingFunction: EASE }}>
              Confirm {slot !== null ? `${DAYS[day].dow} ${slots[slot]}` : ""}
            </span>
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300"
              style={{ opacity: stage === "confirming" ? 1 : 0, transform: stage === "confirming" ? "none" : "scale(.6)", transitionTimingFunction: EASE }}
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {stage === "confirming" && <path className="lab-bk-draw" pathLength={1} d="M3.5 8.5l3 3 6-7" />}
              </svg>
            </span>
          </button>
          <button
            type="button"
            tabIndex={booked ? 0 : -1}
            aria-hidden={!booked}
            onClick={() => {
              takeOver();
              setStage("pick");
              setSlot(null);
            }}
            className="absolute inset-0 flex items-center justify-center rounded-[8px] text-[13px] font-medium text-ink-2 outline-none transition-opacity duration-500 focus-visible:ring-2 focus-visible:ring-brand/60"
            style={{ opacity: booked ? 1 : 0, pointerEvents: booked ? "auto" : "none", transitionTimingFunction: EASE }}
          >
            <span className={`absolute inset-0 rounded-[8px] ${RING}`} aria-hidden />
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}
