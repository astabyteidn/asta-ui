"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

const CSS = `
@keyframes aui050-rise { from { opacity: 0; transform: translateY(8px) } }
@keyframes aui050-next { from { opacity: 0; transform: translateX(24px) } }
@keyframes aui050-prev { from { opacity: 0; transform: translateX(-24px) } }
@keyframes aui050-pop { 0% { opacity: 0; transform: scale(.55) } 60% { opacity: 1; transform: scale(1.08) } 100% { transform: none } }
@keyframes aui050-tip { from { opacity: 0; transform: translate(-50%, 4px) scale(.9) } }
@keyframes aui050-roll { from { opacity: 0; transform: translateY(60%) } }
@media (prefers-reduced-motion: reduce) { .aui050 *, .aui050 { animation: none !important; transition: none !important } }
`;

export interface RangeValue {
  start: Date | null;
  end: Date | null;
}

export interface TwoMonthRangeProps {
  value?: RangeValue;
  defaultValue?: RangeValue;
  onChange?: (value: RangeValue) => void;
  /** Days before this can't be picked. Defaults to today. Pass `null` to allow any day. */
  min?: Date | null;
  max?: Date;
  locale?: string;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  startLabel?: string;
  endLabel?: string;
  /** Singular unit for the count, e.g. "night" or "day". */
  unit?: string;
  /** Count the end day too (days), or not (nights). */
  inclusive?: boolean;
  name?: string;
  className?: string;
}

const day0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const month0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && a.getTime() === b.getTime();
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const diff = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 864e5);

function Arrow({ dir }: { dir: 1 | -1 }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 1 ? "m6 3.5 4.5 4.5L6 12.5" : "m10 3.5L5.5 8l4.5 4.5"} />
    </svg>
  );
}

/** aui-050 · Two-month range: a band previews the stay as you hover, a tip counts the nights and the active field slides between start and end. */
export function RangeDatePicker({
  value,
  defaultValue,
  onChange,
  min,
  max,
  locale = "en-US",
  weekStartsOn = 1,
  startLabel = "Check-in",
  endLabel = "Check-out",
  unit = "night",
  inclusive = false,
  name,
  className,
}: TwoMonthRangeProps) {
  const [today] = useState(() => day0(new Date()));
  const floor = min === null ? undefined : day0(min ?? today);
  const [inner, setInner] = useState<RangeValue>(() => defaultValue ?? { start: addDays(today, 9), end: addDays(today, 14) });
  const raw = value ?? inner;
  const span = { start: raw.start ? day0(raw.start) : null, end: raw.end ? day0(raw.end) : null };
  const [mode, setMode] = useState<"start" | "end">(span.start && !span.end ? "end" : "start");
  const [view, setView] = useState(() => month0(span.start ?? today));
  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const [focus, setFocus] = useState<Date>(() => span.start ?? today);
  const [hover, setHover] = useState<Date | null>(null);
  const steer = useRef(false);
  const grid = useRef<HTMLDivElement>(null);

  const title = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale]);
  const short = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" }), [locale]);
  const full = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }), [locale]);
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    const l = new Intl.DateTimeFormat(locale, { weekday: "long" });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 10, 1 + ((i + weekStartsOn) % 7));
      return { s: f.format(d), l: l.format(d) };
    });
  }, [locale, weekStartsOn]);

  const off = (d: Date) => (floor && d < floor) || (max && d > day0(max)) || false;

  useEffect(() => {
    if (steer.current) grid.current?.querySelector<HTMLElement>(`[data-day="${key(focus)}"]`)?.focus({ preventScroll: true });
  }, [focus, view]);

  const set = (next: RangeValue) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const flip = (n: number) => {
    setDir(n > 0 ? 1 : -1);
    setView((v) => addMonths(v, n));
  };
  const moveTo = (d: Date) => {
    if (off(d)) return;
    // Keep the focused day inside the two visible months.
    if (d < view) flip(-1);
    else if (d >= addMonths(view, 2)) flip(1);
    setFocus(d);
  };
  const pick = (d: Date) => {
    if (off(d)) return;
    setFocus(d);
    if (mode === "start" || !span.start || d < span.start) {
      set({ start: d, end: span.end && span.end > d && mode === "start" ? span.end : null });
      setMode("end");
    } else {
      set({ start: span.start, end: d });
      setMode("start");
      setHover(null);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    steer.current = true;
    const dow = (focus.getDay() - weekStartsOn + 7) % 7;
    if (e.key === "ArrowRight") moveTo(addDays(focus, 1));
    else if (e.key === "ArrowLeft") moveTo(addDays(focus, -1));
    else if (e.key === "ArrowDown") moveTo(addDays(focus, 7));
    else if (e.key === "ArrowUp") moveTo(addDays(focus, -7));
    else if (e.key === "Home") moveTo(addDays(focus, -dow));
    else if (e.key === "End") moveTo(addDays(focus, 6 - dow));
    else if (e.key === "PageDown") {
      flip(1);
      setFocus(addDays(focus, 28));
    } else if (e.key === "PageUp") {
      const to = addDays(focus, -28);
      if (off(to)) return;
      flip(-1);
      setFocus(to);
    } else if (e.key === "Enter" || e.key === " ") pick(focus);
    else if (e.key === "Escape" && span.start && !span.end) {
      set({ start: null, end: null });
      setMode("start");
    } else return;
    e.preventDefault();
  };

  // The end used for the band: the real end, or a preview while choosing one.
  const previewEnd = mode === "end" && span.start && !span.end ? hover : null;
  const bandEnd = span.end ?? (previewEnd && span.start && previewEnd > span.start ? previewEnd : null);
  const count = span.start && bandEnd ? diff(span.start, bandEnd) + (inclusive ? 1 : 0) : 0;
  const countText = count ? `${count} ${unit}${count === 1 ? "" : "s"}` : "";
  const canBack = !floor || addMonths(view, -1) >= month0(floor);

  const month = (m: Date, idx: number) => {
    const lead = (m.getDay() - weekStartsOn + 7) % 7;
    const first = addDays(m, -lead);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i));
    return (
      <div key={key(m)} className={cx(idx === 1 && "hidden @min-[540px]:block")}>
        <p aria-live={idx === 0 ? "polite" : undefined} className="mb-2 text-center text-[13.5px] font-medium tracking-[-0.01em] text-ink">
          {title.format(m)}
        </p>
        <div className="grid grid-cols-7" aria-hidden>
          {weekdays.map((w) => (
            <span key={w.l} className="pb-1 text-center font-mono text-[10.5px] uppercase text-mute">
              {w.s}
            </span>
          ))}
        </div>
        <div role="grid" aria-label={title.format(m)} className="grid grid-cols-7 gap-y-0.5">
          {cells.map((d) => {
            if (d.getMonth() !== m.getMonth()) return <span key={key(d)} className="h-8" aria-hidden />;
            const dis = off(d);
            const isStart = same(d, span.start);
            const isEnd = same(d, span.end);
            const inBand = !!(span.start && bandEnd && d >= span.start && d <= bandEnd && !same(span.start, bandEnd));
            const edgeL = inBand && (isStart || (d.getDay() - weekStartsOn + 7) % 7 === 0 || d.getDate() === 1);
            const lastDay = addDays(d, 1).getMonth() !== d.getMonth();
            const edgeR = inBand && (same(d, bandEnd) || (d.getDay() - weekStartsOn + 7) % 7 === 6 || lastDay);
            const ghostEnd = !!previewEnd && same(d, bandEnd);
            const isToday = same(d, today);
            const isFocus = same(d, focus);
            return (
              <div key={key(d)} role="gridcell" aria-selected={isStart || isEnd || inBand || undefined} className="relative h-8">
                {inBand && (
                  <span
                    aria-hidden
                    className={cx(
                      "absolute inset-y-0 transition-opacity duration-300",
                      previewEnd ? "bg-[color-mix(in_srgb,var(--color-brand)_7%,transparent)]" : "bg-[color-mix(in_srgb,var(--color-brand)_11%,transparent)]",
                      isStart ? "left-1/2 right-0" : same(d, bandEnd) ? "left-0 right-1/2" : "inset-x-0",
                      edgeL && !isStart && "rounded-l-[8px]",
                      edgeR && !same(d, bandEnd) && "rounded-r-[8px]",
                    )}
                  />
                )}
                <button
                  type="button"
                  data-day={key(d)}
                  tabIndex={isFocus ? 0 : -1}
                  disabled={dis}
                  aria-label={full.format(d)}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => {
                    steer.current = false;
                    pick(d);
                  }}
                  onPointerEnter={() => setHover(d)}
                  onFocus={() => !isFocus && setFocus(d)}
                  className={cx(
                    "relative mx-auto flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] tabular-nums outline-none transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:text-mute disabled:opacity-40",
                    isStart || isEnd ? "font-medium text-white" : inBand ? "text-ink" : "text-ink hover:bg-paper-2",
                    ghostEnd && "shadow-[inset_0_0_0_1.5px_var(--color-brand)]",
                  )}
                >
                  {(isStart || isEnd) && (
                    <span aria-hidden className="absolute inset-0 rounded-[8px] bg-brand shadow-[0_6px_14px_-6px_color-mix(in_srgb,var(--color-brand)_80%,transparent)]" style={{ animation: `aui050-pop .4s ${EASE} both` }} />
                  )}
                  <span className="relative">{d.getDate()}</span>
                  {isToday && <span aria-hidden className={cx("absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full", isStart || isEnd ? "bg-white" : "bg-brand")} />}
                </button>
                {ghostEnd && countText && (
                  <span
                    key={key(d)}
                    aria-hidden
                    className="pointer-events-none absolute -top-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-ink px-2 py-1 text-[11px] font-medium text-paper shadow-[0_8px_18px_-8px_rgb(0_0_0/0.5)]"
                    style={{ animation: `aui050-tip .25s ${EASE} both` }}
                  >
                    {countText}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const fields = [
    { k: "start" as const, label: startLabel, d: span.start },
    { k: "end" as const, label: endLabel, d: span.end },
  ];

  return (
    <div
      className={cx(
        "aui050 @container w-full rounded-[14px] bg-paper p-4 sm:p-5",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-aui050" precedence="asta">{CSS}</style>
      <div className="flex items-center gap-3" style={{ animation: `aui050-rise .6s ${EASE} both` }}>
        <div className="relative grid flex-1 grid-cols-2 rounded-[11px] bg-paper-2 p-1">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[8px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_12px_-6px_rgb(0_0_0/0.18)]"
            style={{ transform: `translateX(${mode === "end" ? "100%" : "0"})`, transition: `transform .45s ${EASE}` }}
          />
          {fields.map((f) => (
            <button
              key={f.k}
              type="button"
              aria-pressed={mode === f.k}
              onClick={() => {
                setMode(f.k);
                if (f.d) {
                  setFocus(f.d);
                  if (f.d < view || f.d >= addMonths(view, 2)) {
                    setDir(f.d > view ? 1 : -1);
                    setView(month0(f.d));
                  }
                }
              }}
              className="relative rounded-[8px] px-3 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <span className={cx("block font-mono text-[10px] uppercase tracking-[0.08em] transition-colors", mode === f.k ? "text-brand" : "text-mute")}>{f.label}</span>
              <span key={f.d ? key(f.d) : "none"} className={cx("block truncate text-[13.5px] font-medium tracking-[-0.01em]", f.d ? "text-ink" : "text-mute")} style={{ animation: `aui050-roll .4s ${EASE} both` }}>
                {f.d ? short.format(f.d) : "Add date"}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-0.5">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d === 1 ? "Next month" : "Previous month"}
              disabled={d === -1 && !canBack}
              onClick={() => flip(d)}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-2 outline-none transition-[background-color,transform] duration-150 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
            >
              <Arrow dir={d} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden px-0.5 pt-1" style={{ animation: `aui050-rise .6s ${EASE} 80ms both` }}>
        <div
          key={key(view)}
          ref={grid}
          onKeyDown={onKey}
          onPointerLeave={() => setHover(null)}
          className={cx("grid grid-cols-1 gap-7 @min-[540px]:grid-cols-2", dir === 1 && "animate-[aui050-next_.4s_cubic-bezier(.16,1,.3,1)_both]", dir === -1 && "animate-[aui050-prev_.4s_cubic-bezier(.16,1,.3,1)_both]")}
        >
          {month(view, 0)}
          {month(addMonths(view, 1), 1)}
        </div>
      </div>

      <div className="mt-3 flex h-8 items-center justify-between gap-3" style={{ animation: `aui050-rise .6s ${EASE} 160ms both` }}>
        <p className="min-w-0 truncate text-[12.5px] text-mute" aria-live="polite">
          {span.start && span.end ? (
            <>
              <span key={countText} className="inline-block font-medium text-ink" style={{ animation: `aui050-roll .4s ${EASE} both` }}>
                {countText}
              </span>{" "}
              · {short.formatRange ? short.formatRange(span.start, span.end) : `${short.format(span.start)} – ${short.format(span.end)}`}
            </>
          ) : span.start ? (
            `Pick your ${endLabel.toLowerCase()} date`
          ) : (
            `Pick your ${startLabel.toLowerCase()} date`
          )}
        </p>
        <button
          type="button"
          disabled={!span.start}
          onClick={() => {
            set({ start: null, end: null });
            setMode("start");
          }}
          className="h-7 shrink-0 rounded-[7px] px-2.5 text-[12px] font-medium text-ink-2 outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-35"
        >
          Clear
        </button>
      </div>
      {name && <input type="hidden" name={name} value={span.start && span.end ? `${key(span.start)}/${key(span.end)}` : ""} />}
    </div>
  );
}

export default RangeDatePicker;
