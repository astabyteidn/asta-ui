"use client";

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

export interface EventCalendarItem {
  id: string;
  title: string;
  /** The day it happens. Only the date part is used. */
  date: Date;
  /** Already formatted, e.g. "09:30" or "All day". */
  time?: string;
  /** Highlight it in the accent colour. */
  accent?: boolean;
  /** Optional detail shown in the day list. */
  note?: string;
}

export interface EventCalendarProps {
  events: EventCalendarItem[];
  /** The selected day. Pass with `onSelect` to control it. */
  selected?: Date;
  defaultSelected?: Date;
  onSelect?: (day: Date) => void;
  /** Override "today", handy for demos and tests. */
  today?: Date;
  /** BCP 47 locale for month and weekday names. */
  locale?: string;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  onEventClick?: (event: EventCalendarItem) => void;
  className?: string;
}

const KEYFRAMES = `@keyframes kit-ec-next { from { opacity: 0; transform: translateX(32px) } }
@keyframes kit-ec-prev { from { opacity: 0; transform: translateX(-32px) } }
@keyframes kit-ec-up { from { opacity: 0; transform: translateY(6px) } }
@media (prefers-reduced-motion: reduce) { .kit-ec, .kit-ec * { animation: none !important; transition-duration: 0s !important; } }`;

const day0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const month0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
/** Minutes after midnight for a sort. "All day" and untimed events give -1 so they come first. */
const minutesOf = (e: EventCalendarItem) => {
  const m = /(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*m?\b/i.exec(e.time ?? "");
  if (!m) return -1;
  let h = Number(m[1]) % 24;
  const ap = m[3]?.toLowerCase();
  if (ap === "p" && h < 12) h += 12;
  if (ap === "a" && h === 12) h = 0;
  return h * 60 + Number(m[2] ?? 0);
};

function Arrow({ dir }: { dir: 1 | -1 }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 1 ? "m6 3.5 4.5 4.5L6 12.5" : "m10 3.5L5.5 8l4.5 4.5"} />
    </svg>
  );
}

const navBtn =
  "grid h-8 w-8 place-items-center rounded-md text-ink-2 outline-none transition-colors duration-200 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50";

/**
 * A month calendar with event pills and a list for the selected day. Months slide in from the side you
 * moved to. Arrow keys move by day and week, Home and End jump to the week's ends, Page Up and Page
 * Down change the month, and Enter selects.
 */
export function EventCalendar({ events, selected, defaultSelected, onSelect, today: todayProp, locale, weekStartsOn = 1, onEventClick, className }: EventCalendarProps) {
  const [now] = useState(() => day0(new Date()));
  const today = todayProp ? day0(todayProp) : now;
  const [inner, setInner] = useState(() => day0(defaultSelected ?? todayProp ?? new Date()));
  const sel = selected ? day0(selected) : inner;
  const [view, setView] = useState(() => month0(sel));
  const [focusDay, setFocusDay] = useState(sel);
  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const grid = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(false);

  // A controlled `selected` that lands in another month brings that month into view.
  const [seen, setSeen] = useState(keyOf(sel));
  if (seen !== keyOf(sel)) {
    setSeen(keyOf(sel));
    setFocusDay(sel);
    if (!sameMonth(sel, view)) {
      setDir(sel > view ? 1 : -1);
      setView(month0(sel));
    }
  }

  const byDay = useMemo(() => {
    const m = new Map<string, EventCalendarItem[]>();
    for (const e of events) {
      const k = keyOf(e.date);
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    // Timed events in order; "All day" and untimed ones first.
    m.forEach((list) => list.sort((a, b) => minutesOf(a) - minutesOf(b)));
    return m;
  }, [events]);

  const fmt = useMemo(
    () => ({
      month: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      long: new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      head: new Intl.DateTimeFormat(locale, { weekday: "long", month: "short", day: "numeric" }),
    }),
    [locale],
  );

  // Always six weeks, so the height never jumps between months.
  const start = addDays(view, -((view.getDay() - weekStartsOn + 7) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weekdays = days.slice(0, 7).map((d) => fmt.weekday.format(d));
  // The focusable cell: the focused day if it's on screen, else the 1st of the month.
  const tabDay = days.some((d) => keyOf(d) === keyOf(focusDay)) ? focusDay : view;

  useLayoutEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-day="${keyOf(focusDay)}"]`)?.focus();
  }, [focusDay, view]);

  const goMonth = (n: number) => {
    setDir(n > 0 ? 1 : -1);
    setView((v) => addMonths(v, n));
  };

  const pick = (d: Date, focus = true) => {
    if (selected === undefined) setInner(d);
    onSelect?.(d);
    setFocusDay(d);
    if (!sameMonth(d, view)) {
      // The grid re-mounts for the new month, so put focus back on the picked day.
      wantFocus.current = focus;
      setDir(d > view ? 1 : -1);
      setView(month0(d));
    }
  };

  const moveFocus = (d: Date) => {
    wantFocus.current = true;
    setFocusDay(d);
    if (!sameMonth(d, view)) {
      setDir(d > view ? 1 : -1);
      setView(month0(d));
    }
  };

  const onKey = (e: KeyboardEvent, d: Date) => {
    const offset = (d.getDay() - weekStartsOn + 7) % 7;
    const to: Record<string, () => Date> = {
      ArrowLeft: () => addDays(d, -1),
      ArrowRight: () => addDays(d, 1),
      ArrowUp: () => addDays(d, -7),
      ArrowDown: () => addDays(d, 7),
      Home: () => addDays(d, -offset),
      End: () => addDays(d, 6 - offset),
      PageUp: () => addMonths(d, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(d, e.shiftKey ? 12 : 1),
    };
    if (to[e.key]) {
      e.preventDefault();
      moveFocus(to[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(d);
    }
  };

  const dayEvents = byDay.get(keyOf(sel)) ?? [];
  const rows = Array.from({ length: 6 }, (_, r) => days.slice(r * 7, r * 7 + 7));

  return (
    <div className={cx("kit-ec grid w-full gap-6 md:grid-cols-[minmax(0,1fr)_240px]", className)}>
      <style href="asta-event-calendar" precedence="asta">{KEYFRAMES}</style>

      <div className="min-w-0">
        <header className="mb-4 flex items-center gap-2">
          <h3 className="mr-auto text-[17px] font-medium tracking-[-0.02em] text-ink" aria-live="polite">
            {fmt.month.format(view)}
          </h3>
          <button
            type="button"
            onClick={() => pick(today, false)}
            className="h-8 rounded-md px-3 text-[13px] text-ink-2 outline-none transition-colors duration-200 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            Today
          </button>
          <button type="button" aria-label="Previous month" onClick={() => goMonth(-1)} className={navBtn}>
            <Arrow dir={-1} />
          </button>
          <button type="button" aria-label="Next month" onClick={() => goMonth(1)} className={navBtn}>
            <Arrow dir={1} />
          </button>
        </header>

        <div className="overflow-hidden">
          <div
            ref={grid}
            key={keyOf(view)}
            role="grid"
            aria-label={fmt.month.format(view)}
            style={dir ? { animation: `${dir > 0 ? "kit-ec-next" : "kit-ec-prev"} .45s ${CURVE}` } : undefined}
          >
            <div role="row" className="grid grid-cols-7 pb-2">
              {weekdays.map((w) => (
                <span key={w} role="columnheader" className="px-2 text-[11.5px] font-medium text-mute">
                  {w}
                </span>
              ))}
            </div>
            {rows.map((week, r) => (
              <div key={r} role="row" className="grid grid-cols-7 gap-1 pb-1">
                {week.map((d) => {
                  const k = keyOf(d);
                  const list = byDay.get(k) ?? [];
                  const out = !sameMonth(d, view);
                  const isToday = k === keyOf(today);
                  const isSel = k === keyOf(sel);
                  const label = `${fmt.long.format(d)}${isToday ? ", today" : ""}, ${list.length ? `${list.length} event${list.length > 1 ? "s" : ""}` : "no events"}`;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="gridcell"
                      data-day={k}
                      aria-label={label}
                      aria-selected={isSel}
                      aria-current={isToday ? "date" : undefined}
                      tabIndex={k === keyOf(tabDay) ? 0 : -1}
                      onClick={() => pick(d)}
                      onKeyDown={(e) => onKey(e, d)}
                      onFocus={() => {
                        if (k !== keyOf(focusDay)) setFocusDay(d);
                      }}
                      className={cx(
                        "group relative flex h-[76px] flex-col items-stretch gap-1 rounded-[10px] p-1.5 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 sm:h-[88px]",
                        isSel ? "bg-paper-2" : "hover:bg-[color-mix(in_srgb,var(--color-paper-2)_60%,transparent)]",
                      )}
                    >
                      <span
                        className={cx(
                          "grid h-6 w-6 place-items-center rounded-full text-[12.5px] tabular-nums transition-colors duration-200",
                          isToday ? "bg-brand font-medium text-white" : out ? "text-mute/60" : "text-ink",
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {/* Pills on wider screens, dots on narrow ones. */}
                      <span className="hidden min-w-0 flex-col gap-0.5 sm:flex" aria-hidden>
                        {list.slice(0, 2).map((ev) => (
                          <span
                            key={ev.id}
                            className={cx(
                              "truncate rounded-[5px] px-1.5 text-[11px] leading-[18px]",
                              ev.accent ? "bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-brand" : "bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] text-ink-2",
                              out && "opacity-50",
                            )}
                          >
                            {ev.title}
                          </span>
                        ))}
                        {list.length > 2 && <span className="px-1.5 text-[11px] leading-4 text-mute">+{list.length - 2} more</span>}
                      </span>
                      {list.length > 0 && (
                        <span className="flex gap-0.5 px-1 sm:hidden" aria-hidden>
                          {list.slice(0, 3).map((ev) => (
                            <span key={ev.id} className={cx("h-1.5 w-1.5 rounded-full", ev.accent ? "bg-brand" : "bg-mute")} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside aria-label="Selected day" className="min-w-0 md:pt-12">
        <div key={keyOf(sel)} style={{ animation: `kit-ec-up .4s ${CURVE}` }}>
          <p className="text-[12px] font-medium text-mute">{keyOf(sel) === keyOf(today) ? "Today" : "Selected"}</p>
          <h4 className="mt-1 text-[15px] font-medium tracking-[-0.01em] text-ink">{fmt.head.format(sel)}</h4>
          {dayEvents.length ? (
            <ul className="mt-4 flex flex-col gap-1">
              {dayEvents.map((ev, i) => {
                const body = (
                  <>
                    <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", ev.accent ? "bg-brand" : "bg-[color-mix(in_srgb,var(--color-ink)_22%,transparent)]")} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] text-ink">{ev.title}</span>
                      <span className="block text-[12px] tabular-nums text-mute">
                        {ev.time ?? "All day"}
                        {ev.note && ` · ${ev.note}`}
                      </span>
                    </span>
                  </>
                );
                const cls = "flex w-full gap-3 rounded-lg px-2 py-2 text-left";
                return (
                  <li key={ev.id} style={{ animation: `kit-ec-up .4s ${CURVE} ${i * 45}ms both` }}>
                    {onEventClick ? (
                      <button
                        type="button"
                        onClick={() => onEventClick(ev)}
                        className={cx(cls, "outline-none transition-colors duration-200 hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50")}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-[10px] bg-paper-2 px-3 py-4 text-[13px] text-mute">Nothing planned.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

export default EventCalendar;
