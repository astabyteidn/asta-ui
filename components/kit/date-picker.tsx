"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface CommonProps {
  /** BCP 47 locale for month and weekday names, e.g. "en-GB" or "id-ID". */
  locale?: string;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /** Days before `min` or after `max` can't be picked. */
  min?: Date;
  max?: Date;
  placeholder?: string;
  label?: string;
  /** Form field name. Submits `yyyy-mm-dd` (or `start/end` in range mode). */
  name?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export interface SingleDatePickerProps extends CommonProps {
  mode?: "single";
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date | null) => void;
}

export interface RangeDatePickerProps extends CommonProps {
  mode: "range";
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (value: DateRange) => void;
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

const KEYFRAMES = `@keyframes kit-dp-in { from { opacity: 0; transform: translateY(-4px) scale(.97) } }
@keyframes kit-dp-next { from { opacity: 0; transform: translateX(28px) } }
@keyframes kit-dp-prev { from { opacity: 0; transform: translateX(-28px) } }
@keyframes kit-dp-pop { 0% { opacity: 0; transform: scale(.55) } 60% { opacity: 1; transform: scale(1.06) } 100% { transform: scale(1) } }`;

// Date helpers. All dates are local and normalised to midnight.
const day0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const month0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const sameDay = (a: Date | null | undefined, b: Date | null | undefined) => !!a && !!b && day0(a).getTime() === day0(b).getTime();
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const clamp = (d: Date, min?: Date, max?: Date) => (min && d < day0(min) ? day0(min) : max && d > day0(max) ? day0(max) : d);

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

function Arrow({ dir }: { dir: 1 | -1 }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 1 ? "m6 3.5 4.5 4.5L6 12.5" : "m10 3.5L5.5 8l4.5 4.5"} />
    </svg>
  );
}

/**
 * A date field that opens a month calendar. Arrow keys move by day and week, Page Up/Down by month
 * (Shift for a year), Home/End to the week's edges, Enter picks and Escape closes. `mode="range"` picks a
 * start and an end with a soft band between them.
 */
export function DatePicker(props: DatePickerProps) {
  const { locale = "en-US", weekStartsOn = 0, min, max, placeholder, label, name, disabled, size = "md", className } = props;
  const range = props.mode === "range";

  const [innerSingle, setInnerSingle] = useState<Date | null>(!range ? ((props as SingleDatePickerProps).defaultValue ?? null) : null);
  const [innerRange, setInnerRange] = useState<DateRange>(range ? ((props as RangeDatePickerProps).defaultValue ?? { start: null, end: null }) : { start: null, end: null });
  const single = !range ? ((props as SingleDatePickerProps).value !== undefined ? (props as SingleDatePickerProps).value! : innerSingle) : null;
  const rawSpan = range ? ((props as RangeDatePickerProps).value ?? innerRange) : { start: null, end: null };
  // Controlled values may carry a time of day. Compare whole days only.
  const span: DateRange = { start: rawSpan.start ? day0(rawSpan.start) : null, end: rawSpan.end ? day0(rawSpan.end) : null };

  const [open, setOpen] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState<Date | null>(null);
  const [focus, setFocus] = useState<Date | null>(null);
  // 0 on open (no slide), then the direction of the last month change.
  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const [hover, setHover] = useState<Date | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // Only pull DOM focus into the grid when the keyboard is driving (not after clicking the month arrows).
  const steer = useRef(true);
  const uid = useId();

  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }), [locale]);
  const title = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale]);
  const full = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }), [locale]);
  const weekdays = useMemo(() => {
    const w = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const long = new Intl.DateTimeFormat(locale, { weekday: "long" });
    // 2026-11-01 is a Sunday.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 10, 1 + ((i + weekStartsOn) % 7));
      return { short: w.format(d), long: long.format(d) };
    });
  }, [locale, weekStartsOn]);

  const isOff = (d: Date) => (min && d < day0(min)) || (max && d > day0(max)) || false;

  const show = () => {
    if (disabled) return;
    const now = day0(new Date());
    const anchor = clamp(day0((range ? span.start : single) ?? now), min, max);
    setToday(now);
    setView(month0(anchor));
    setFocus(anchor);
    setHover(null);
    setDir(0);
    steer.current = true;
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  // Close on a click outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep DOM focus on the focused day (also after the grid re-mounts for a new month).
  useEffect(() => {
    if (open && focus && steer.current) gridRef.current?.querySelector<HTMLElement>(`[data-day="${key(focus)}"]`)?.focus({ preventScroll: true });
  }, [open, focus, view]);

  const moveTo = (d: Date) => {
    const next = clamp(d, min, max);
    if (view && (next.getFullYear() !== view.getFullYear() || next.getMonth() !== view.getMonth())) {
      setDir(next > view ? 1 : -1);
      setView(month0(next));
    }
    setFocus(next);
  };

  // Don't page to a month that is wholly outside min / max.
  const canFlip = (n: number) => {
    if (!view) return false;
    const to = addMonths(view, n);
    return !(min && to < month0(min)) && !(max && to > month0(max));
  };

  const flip = (n: number) => {
    if (!view || !canFlip(n)) return;
    setDir(n > 0 ? 1 : -1);
    setView(addMonths(view, n));
    if (focus) setFocus(clamp(addMonths(focus, n), min, max));
  };

  const pick = (d: Date) => {
    if (isOff(d)) return;
    if (!range) {
      const p = props as SingleDatePickerProps;
      if (p.value === undefined) setInnerSingle(d);
      p.onChange?.(d);
      close();
      return;
    }
    const p = props as RangeDatePickerProps;
    let next: DateRange;
    if (!span.start || span.end) next = { start: d, end: null };
    else if (d < span.start) next = { start: d, end: null };
    else next = { start: span.start, end: d };
    if (p.value === undefined) setInnerRange(next);
    p.onChange?.(next);
    if (next.end) close();
    else moveTo(d);
  };

  const clear = () => {
    if (!range) {
      const p = props as SingleDatePickerProps;
      if (p.value === undefined) setInnerSingle(null);
      p.onChange?.(null);
    } else {
      const p = props as RangeDatePickerProps;
      const next = { start: null, end: null };
      if (p.value === undefined) setInnerRange(next);
      p.onChange?.(next);
    }
    close();
  };

  const onGridKey = (e: KeyboardEvent) => {
    if (!focus) return;
    steer.current = true;
    const dow = (focus.getDay() - weekStartsOn + 7) % 7;
    if (e.key === "ArrowRight") moveTo(addDays(focus, 1));
    else if (e.key === "ArrowLeft") moveTo(addDays(focus, -1));
    else if (e.key === "ArrowDown") moveTo(addDays(focus, 7));
    else if (e.key === "ArrowUp") moveTo(addDays(focus, -7));
    else if (e.key === "Home") moveTo(addDays(focus, -dow));
    else if (e.key === "End") moveTo(addDays(focus, 6 - dow));
    else if (e.key === "PageDown") flip(e.shiftKey ? 12 : 1);
    else if (e.key === "PageUp") flip(e.shiftKey ? -12 : -1);
    else if (e.key === "Enter" || e.key === " ") pick(focus);
    else return;
    e.preventDefault();
  };

  // 6 weeks, always, so the popover never changes height between months.
  const cells = useMemo(() => {
    if (!view) return [];
    const lead = (view.getDay() - weekStartsOn + 7) % 7;
    const first = addDays(view, -lead);
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
  }, [view, weekStartsOn]);

  // While only a start is set, preview the band up to the hovered (or focused) day.
  const previewEnd = range && span.start && !span.end ? (hover ?? focus) : null;
  const bandFrom = span.start;
  const bandTo = span.end ?? (previewEnd && span.start && previewEnd > span.start ? previewEnd : null);

  const shown = range
    ? span.start && span.end
      ? fmt.formatRange(span.start, span.end)
      : span.start
        ? `${fmt.format(span.start)} – …`
        : null
    : single
      ? fmt.format(single)
      : null;

  const hidden = range ? (span.start && span.end ? `${key(span.start)}/${key(span.end)}` : "") : single ? key(single) : "";

  return (
    <div ref={root} className={cx("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${uid}-cal` : undefined}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            show();
          }
        }}
        className={cx(
          "flex w-full items-center gap-2 bg-paper text-left outline-none transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-45",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)]",
          open && "!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]",
          size === "sm" ? "h-8 rounded-md px-2.5 text-[13px]" : "h-10 rounded-lg px-3 text-[14px]",
        )}
      >
        <CalendarIcon />
        <span className={cx("min-w-0 flex-1 truncate tabular-nums", shown ? "text-ink" : "text-mute")}>{shown ?? placeholder ?? (range ? "Pick dates" : "Pick a date")}</span>
      </button>
      {name && <input type="hidden" name={name} value={hidden} />}

      {open && view && (
        <div
          id={`${uid}-cal`}
          role="dialog"
          aria-label={label ?? "Choose a date"}
          className={cx(
            "absolute left-0 top-full z-50 mt-2 w-[296px] origin-top-left rounded-xl bg-paper p-3 outline-none",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-8px_rgb(0_0_0/0.22),0_4px_8px_-4px_rgb(0_0_0/0.08)]",
            "animate-[kit-dp-in_.24s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:!animate-none",
          )}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
        >
          <style href="asta-date-picker" precedence="asta">{KEYFRAMES}</style>

          <div className="mb-2 flex items-center justify-between gap-2 pl-2">
            <p aria-live="polite" className="text-[14px] font-medium tracking-[-0.01em] text-ink">
              {title.format(view)}
            </p>
            <div className="flex gap-0.5">
              {([-1, 1] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-label={d === 1 ? "Next month" : "Previous month"}
                  disabled={!canFlip(d)}
                  onClick={() => {
                    steer.current = false;
                    flip(d);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-2 outline-none transition-[background-color,transform] duration-150 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-90 disabled:pointer-events-none disabled:opacity-35"
                >
                  <Arrow dir={d} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 pb-1" aria-hidden>
            {weekdays.map((w) => (
              <span key={w.long} className="py-1 text-center text-[11px] font-medium text-mute">
                {w.short}
              </span>
            ))}
          </div>

          <div className="overflow-hidden">
            <div
              key={key(view)}
              ref={gridRef}
              role="grid"
              aria-label={title.format(view)}
              onKeyDown={onGridKey}
              onPointerLeave={() => setHover(null)}
              className={cx(
                "grid grid-cols-7 gap-y-0.5 motion-reduce:!animate-none",
                dir === 1 && "animate-[kit-dp-next_.34s_cubic-bezier(.16,1,.3,1)_both]",
                dir === -1 && "animate-[kit-dp-prev_.34s_cubic-bezier(.16,1,.3,1)_both]",
              )}
            >
              {cells.map((d) => {
                const inMonth = d.getMonth() === view.getMonth();
                const off = isOff(d);
                const isStart = range ? sameDay(d, span.start) : sameDay(d, single);
                const isEnd = range && sameDay(d, span.end);
                const picked = isStart || isEnd;
                const inBand = !!(bandFrom && bandTo && d >= day0(bandFrom) && d <= day0(bandTo) && !sameDay(bandFrom, bandTo));
                const bandStart = inBand && sameDay(d, bandFrom);
                const bandEnd = inBand && sameDay(d, bandTo);
                const isToday = sameDay(d, today);
                const isFocus = sameDay(d, focus);
                return (
                  <div key={key(d)} role="gridcell" aria-selected={picked || inBand || undefined} className="relative">
                    {inBand && (
                      <span
                        aria-hidden
                        className={cx(
                          "absolute inset-y-0 bg-[color-mix(in_srgb,var(--color-brand)_11%,transparent)]",
                          bandStart ? "left-1/2 right-0" : bandEnd ? "left-0 right-1/2" : "inset-x-0",
                          !span.end && "opacity-70",
                        )}
                      />
                    )}
                    <button
                      type="button"
                      data-day={key(d)}
                      tabIndex={isFocus ? 0 : -1}
                      disabled={off}
                      aria-label={full.format(d)}
                      aria-current={isToday ? "date" : undefined}
                      onClick={() => pick(d)}
                      onPointerEnter={() => range && setHover(d)}
                      onFocus={() => !isFocus && setFocus(d)}
                      className={cx(
                        "relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-[13px] tabular-nums outline-none transition-colors duration-150",
                        "focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-30",
                        picked ? "font-medium text-white" : inMonth ? "text-ink hover:bg-paper-2" : "text-mute hover:bg-paper-2",
                      )}
                    >
                      {picked && (
                        <span
                          key={key(d)}
                          aria-hidden
                          className="absolute inset-0 rounded-lg bg-brand shadow-[0_4px_10px_-4px_color-mix(in_srgb,var(--color-brand)_70%,transparent)] animate-[kit-dp-pop_.36s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:!animate-none"
                        />
                      )}
                      <span className="relative">{d.getDate()}</span>
                      {isToday && <span aria-hidden className={cx("absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full", picked ? "bg-white" : "bg-brand")} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 pl-2">
            <p className="text-[12px] tabular-nums text-mute">
              {range && span.start && !span.end ? "Pick an end date" : range && span.start && span.end ? `${Math.round((day0(span.end).getTime() - day0(span.start).getTime()) / 864e5) + 1} days` : ""}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={clear}
                className="h-7 rounded-md px-2.5 text-[12px] font-medium text-ink-2 outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                Clear
              </button>
              {today && !isOff(today) && (
                <button
                  type="button"
                  onClick={() => moveTo(today)}
                  className="h-7 rounded-md bg-paper-2 px-2.5 text-[12px] font-medium text-ink outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,var(--color-paper-2))] focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  Today
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
