"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

const CSS = `
@keyframes aui051-pop { from { opacity: 0; transform: translateY(var(--aui051-y, -6px)) scale(.97) } }
@keyframes aui051-char { from { opacity: 0; transform: translateY(80%) } }
@keyframes aui051-row { from { opacity: 0; transform: translateX(-6px) } }
@keyframes aui051-next { from { opacity: 0; transform: translateX(22px) } }
@keyframes aui051-prev { from { opacity: 0; transform: translateX(-22px) } }
@keyframes aui051-dot { 0% { opacity: 0; transform: scale(.5) } 60% { opacity: 1; transform: scale(1.1) } 100% { transform: none } }
@media (prefers-reduced-motion: reduce) { .aui051 *, .aui051 { animation: none !important; transition: none !important } }
`;

export interface DatePreset {
  label: string;
  /** Returns the date for this preset, or null for "no date". Gets today at midnight. */
  get: (today: Date) => Date | null;
}

export interface PresetDatePickerProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date | null) => void;
  presets?: DatePreset[];
  /** Small text before the date on the trigger. */
  label?: string;
  locale?: string;
  weekStartsOn?: 0 | 1;
  /** Start open (opens downward, does not take focus). */
  defaultOpen?: boolean;
  name?: string;
  disabled?: boolean;
  className?: string;
}

const day0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const month0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && day0(a).getTime() === day0(b).getTime();
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const PRESETS: DatePreset[] = [
  { label: "Today", get: (t) => t },
  { label: "Tomorrow", get: (t) => addDays(t, 1) },
  { label: "This weekend", get: (t) => addDays(t, (6 - t.getDay() + 7) % 7) },
  { label: "Next week", get: (t) => addDays(t, ((8 - t.getDay()) % 7) || 7) },
  { label: "In two weeks", get: (t) => addDays(t, 14) },
  { label: "End of month", get: (t) => new Date(t.getFullYear(), t.getMonth() + 1, 0) },
  { label: "No date", get: () => null },
];

/** The nearest box that clips its overflow, or the viewport. */
function clipBox(el: HTMLElement) {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const s = getComputedStyle(p);
    if (/hidden|auto|scroll|clip/.test(s.overflowY + s.overflowX)) return p.getBoundingClientRect();
  }
  return { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
}

/** Measured once on open: open down or up, and how far to shift so the panel stays inside the clip box. */
function place(el: HTMLElement, h: number) {
  const r = el.getBoundingClientRect();
  const c = clipBox(el);
  const below = c.bottom - r.bottom;
  const w = Math.min(440, c.right - c.left - 16);
  const dx = Math.max(c.left + 8 - r.left, Math.min(0, c.right - 8 - (r.left + w)));
  return { down: below >= h || below >= r.top - c.top, w, dx };
}

/** The label, one character at a time, so a new date rolls in like a split-flap board. */
function Roll({ text }: { text: string }) {
  return (
    <span key={text} className="inline-flex overflow-hidden whitespace-pre" aria-hidden>
      {[...text].map((ch, i) => (
        <span key={i} className="inline-block" style={{ animation: `aui051-char .5s ${EASE} ${i * 18}ms both` }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** aui-051 · Quick presets: a dark picker with presets beside a calendar, number keys pick a preset and the date label rolls in character by character. */
export function PresetDatePicker({ value, defaultValue, onChange, presets = PRESETS, label = "Due", locale = "en-US", weekStartsOn = 1, defaultOpen = false, name, disabled, className }: PresetDatePickerProps) {
  const [today] = useState(() => day0(new Date()));
  const [inner, setInner] = useState<Date | null>(() => (defaultValue === undefined ? addDays(today, ((8 - today.getDay()) % 7) || 7) : defaultValue));
  const current = value !== undefined ? value : inner;
  const sel = current ? day0(current) : null;
  const [open, setOpen] = useState(defaultOpen);
  const [down, setDown] = useState(true);
  const [view, setView] = useState(() => month0(sel ?? today));
  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const [focus, setFocus] = useState<Date>(() => sel ?? today);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const steer = useRef(false);
  const wantFocus = useRef(false);
  const closeT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const uid = useId();

  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" }), [locale]);
  const hintFmt = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" }), [locale]);
  const title = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale]);
  const full = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }), [locale]);
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    const l = new Intl.DateTimeFormat(locale, { weekday: "long" });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2026, 10, 1 + ((i + weekStartsOn) % 7));
      return { s: f.format(d), l: l.format(d) };
    });
  }, [locale, weekStartsOn]);
  const rel = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);

  useEffect(() => () => clearTimeout(closeT.current), []);
  // Width and horizontal shift are written straight to the panel once per open (no state, no animation).
  useLayoutEffect(() => {
    if (!open || !btn.current || !panel.current) return;
    const { w, dx } = place(btn.current, 270);
    panel.current.style.width = `${w}px`;
    panel.current.style.left = `${dx}px`;
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  useEffect(() => {
    if (!open || !wantFocus.current) return;
    wantFocus.current = false;
    const p = panel.current;
    (p?.querySelector<HTMLElement>("[data-preset][aria-pressed=true]") ?? p?.querySelector<HTMLElement>("[data-preset]"))?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (open && steer.current) grid.current?.querySelector<HTMLElement>(`[data-day="${key(focus)}"]`)?.focus({ preventScroll: true });
  }, [open, focus, view]);

  const show = () => {
    if (disabled || !btn.current) return;
    clearTimeout(closeT.current);
    setDown(place(btn.current, 270).down);
    setView(month0(sel ?? today));
    setFocus(sel ?? today);
    setDir(0);
    steer.current = false;
    wantFocus.current = true;
    setOpen(true);
  };
  const close = (refocus = true) => {
    clearTimeout(closeT.current);
    setOpen(false);
    if (refocus) btn.current?.focus({ preventScroll: true });
  };
  const commit = (d: Date | null, linger: boolean) => {
    if (value === undefined) setInner(d);
    onChange?.(d);
    if (d) {
      if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) {
        setDir(d > view ? 1 : -1);
        setView(month0(d));
      }
      setFocus(d);
    }
    clearTimeout(closeT.current);
    // Linger a beat after a preset so the calendar jump is seen, then close.
    closeT.current = setTimeout(() => close(), linger ? 420 : 160);
  };
  const flip = (n: number) => {
    setDir(n > 0 ? 1 : -1);
    setView((v) => addMonths(v, n));
  };
  const moveTo = (d: Date) => {
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) {
      setDir(d > view ? 1 : -1);
      setView(month0(d));
    }
    setFocus(d);
  };

  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= presets.length && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      commit(presets[n - 1].get(today), true);
    }
  };
  const onPresetKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const all = [...(panel.current?.querySelectorAll<HTMLElement>("[data-preset]") ?? [])];
    const i = all.indexOf(e.currentTarget);
    if (e.key === "ArrowDown") all[(i + 1) % all.length]?.focus();
    else if (e.key === "ArrowUp") all[(i - 1 + all.length) % all.length]?.focus();
    else if (e.key === "Home") all[0]?.focus();
    else if (e.key === "End") all[all.length - 1]?.focus();
    else return;
    e.preventDefault();
  };
  const onGridKey = (e: KeyboardEvent) => {
    steer.current = true;
    const dow = (focus.getDay() - weekStartsOn + 7) % 7;
    if (e.key === "ArrowRight") moveTo(addDays(focus, 1));
    else if (e.key === "ArrowLeft") moveTo(addDays(focus, -1));
    else if (e.key === "ArrowDown") moveTo(addDays(focus, 7));
    else if (e.key === "ArrowUp") moveTo(addDays(focus, -7));
    else if (e.key === "Home") moveTo(addDays(focus, -dow));
    else if (e.key === "End") moveTo(addDays(focus, 6 - dow));
    else if (e.key === "PageDown") moveTo(new Date(focus.getFullYear(), focus.getMonth() + 1, Math.min(focus.getDate(), 28)));
    else if (e.key === "PageUp") moveTo(new Date(focus.getFullYear(), focus.getMonth() - 1, Math.min(focus.getDate(), 28)));
    else if (e.key === "Enter" || e.key === " ") commit(focus, false);
    else return;
    e.preventDefault();
  };

  const days = sel ? Math.round((sel.getTime() - today.getTime()) / 864e5) : null;
  const relText = days === null ? "" : Math.abs(days) < 7 ? rel.format(days, "day") : rel.format(Math.round(days / 7), "week");
  const text = sel ? fmt.format(sel) : "No date";
  const lead = (view.getDay() - weekStartsOn + 7) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => addDays(view, i - lead));
  const activePreset = presets.findIndex((p) => {
    const d = p.get(today);
    return d === null ? sel === null : same(d, sel);
  });

  return (
    <div ref={root} className={cx("aui051 relative inline-block", open && "z-40", className)}>
      <style href="asta-aui051" precedence="asta">{CSS}</style>
      <button
        ref={btn}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${uid}-dlg` : undefined}
        aria-label={`${label}: ${sel ? full.format(sel) : "no date"}`}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => {
          if (!open && e.key === "ArrowDown") {
            e.preventDefault();
            show();
          }
        }}
        className={cx(
          "group flex h-10 items-center gap-2.5 rounded-[9px] bg-[color-mix(in_srgb,var(--color-paper)_8%,var(--color-ink))] pl-3 pr-2.5 text-left text-paper outline-none transition-[box-shadow,transform,background-color] duration-300 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_12%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-paper)_12%,var(--color-ink))]",
          "focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_30%,transparent)]",
          open && "!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_30%,transparent)]",
        )}
      >
        <svg viewBox="0 0 16 16" className={cx("h-4 w-4 shrink-0", sel ? "text-brand" : "text-[color-mix(in_srgb,var(--color-paper)_50%,transparent)]")} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
          <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
        </svg>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-paper)_50%,transparent)]">{label}</span>
        <span className="text-[13.5px] font-medium tabular-nums tracking-[-0.01em]">
          <Roll text={text} />
          <span className="sr-only">{text}</span>
        </span>
        {relText && <span className="hidden text-[12px] text-[color-mix(in_srgb,var(--color-paper)_50%,transparent)] sm:inline">{relText}</span>}
        <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5 shrink-0 text-[color-mix(in_srgb,var(--color-paper)_50%,transparent)] transition-transform duration-300", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {name && <input type="hidden" name={name} value={sel ? key(sel) : ""} />}

      {open && (
        <div
          ref={panel}
          id={`${uid}-dlg`}
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()} date`}
          onKeyDown={onPanelKey}
          onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}
          className={cx(
            "@container absolute left-0 z-50 w-[440px] rounded-[14px] bg-ink p-2 text-paper",
            "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_10%,transparent),0_24px_56px_-18px_rgb(0_0_0/0.55),0_4px_12px_-4px_rgb(0_0_0/0.3)]",
            down ? "top-full mt-2 origin-top-left" : "bottom-full mb-2 origin-bottom-left [--aui051-y:6px]",
          )}
          style={{ animation: `aui051-pop .32s ${EASE} both` }}
        >
          <div className="flex flex-col gap-2 @min-[400px]:flex-row">
            <ul className="flex shrink-0 gap-1 overflow-x-auto [scrollbar-width:none] @min-[400px]:w-[164px] @min-[400px]:flex-col @min-[400px]:gap-0.5" aria-label="Presets">
              {presets.map((p, i) => {
                const d = p.get(today);
                const on = i === activePreset;
                return (
                  <li key={p.label} className="shrink-0" style={{ animation: `aui051-row .4s ${EASE} ${i * 30}ms both` }}>
                    <button
                      type="button"
                      data-preset
                      aria-pressed={on}
                      onKeyDown={onPresetKey}
                      onClick={() => commit(d, true)}
                      className={cx(
                        "group/p flex h-[30px] w-full items-center gap-2.5 whitespace-nowrap rounded-[8px] px-2.5 text-left text-[13px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/70",
                        on ? "bg-brand text-white" : "text-[color-mix(in_srgb,var(--color-paper)_82%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-paper)_8%,transparent)] hover:text-paper focus-visible:bg-[color-mix(in_srgb,var(--color-paper)_8%,transparent)]",
                      )}
                    >
                      <span className="flex-1">{p.label}</span>
                      <span className={cx("hidden font-mono text-[10.5px] tabular-nums @min-[400px]:inline", on ? "text-white/75" : "text-[color-mix(in_srgb,var(--color-paper)_42%,transparent)]")}>{d ? hintFmt.format(d) : "—"}</span>
                      <kbd className={cx("hidden h-4 min-w-4 items-center justify-center rounded-[4px] px-1 font-mono text-[9.5px] @min-[400px]:flex", on ? "bg-white/20 text-white" : "bg-[color-mix(in_srgb,var(--color-paper)_8%,transparent)] text-[color-mix(in_srgb,var(--color-paper)_50%,transparent)]")}>{i + 1}</kbd>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="min-w-0 flex-1 rounded-[10px] bg-[color-mix(in_srgb,var(--color-paper)_5%,transparent)] p-2">
              <div className="mb-1 flex items-center justify-between pl-1.5">
                <p aria-live="polite" className="text-[13px] font-medium tracking-[-0.01em]">
                  {title.format(view)}
                </p>
                <div className="flex">
                  {([-1, 1] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-label={d === 1 ? "Next month" : "Previous month"}
                      onClick={() => {
                        steer.current = false;
                        flip(d);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[color-mix(in_srgb,var(--color-paper)_70%,transparent)] outline-none transition-[background-color,transform] duration-150 hover:bg-[color-mix(in_srgb,var(--color-paper)_10%,transparent)] hover:text-paper focus-visible:ring-2 focus-visible:ring-brand/70 active:scale-90"
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={d === 1 ? "m6 3.5 4.5 4.5L6 12.5" : "m10 3.5L5.5 8l4.5 4.5"} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-7" aria-hidden>
                {weekdays.map((w) => (
                  <span key={w.l} className="pb-1 text-center font-mono text-[10px] uppercase text-[color-mix(in_srgb,var(--color-paper)_40%,transparent)]">
                    {w.s}
                  </span>
                ))}
              </div>
              <div className="overflow-hidden">
                <div
                  key={key(view)}
                  ref={grid}
                  role="grid"
                  aria-label={title.format(view)}
                  onKeyDown={onGridKey}
                  className={cx("grid grid-cols-7", dir === 1 && "animate-[aui051-next_.36s_cubic-bezier(.16,1,.3,1)_both]", dir === -1 && "animate-[aui051-prev_.36s_cubic-bezier(.16,1,.3,1)_both]")}
                >
                  {cells.map((d) => {
                    const inMonth = d.getMonth() === view.getMonth();
                    const on = same(d, sel);
                    const isToday = same(d, today);
                    const isFocus = same(d, focus);
                    return (
                      <div key={key(d)} role="gridcell" aria-selected={on || undefined} className="flex justify-center">
                        <button
                          type="button"
                          data-day={key(d)}
                          tabIndex={isFocus ? 0 : -1}
                          aria-label={full.format(d)}
                          aria-current={isToday ? "date" : undefined}
                          onClick={() => commit(d, false)}
                          onFocus={() => !isFocus && setFocus(d)}
                          className={cx(
                            "relative flex h-7 w-8 items-center justify-center rounded-[7px] text-[12.5px] tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/70",
                            on ? "font-medium text-white" : inMonth ? "text-paper hover:bg-[color-mix(in_srgb,var(--color-paper)_10%,transparent)]" : "text-[color-mix(in_srgb,var(--color-paper)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-paper)_8%,transparent)]",
                          )}
                        >
                          {on && <span aria-hidden className="absolute inset-0 rounded-[7px] bg-brand shadow-[0_0_18px_-2px_color-mix(in_srgb,var(--color-brand)_75%,transparent)]" style={{ animation: `aui051-dot .42s ${EASE} both` }} />}
                          <span className="relative">{d.getDate()}</span>
                          {isToday && <span aria-hidden className={cx("absolute bottom-1 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full", on ? "bg-white" : "bg-brand")} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PresetDatePicker;
