"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

const CSS = `
@keyframes aui045-pop { from { opacity: 0; transform: translateY(var(--aui045-y, -6px)) scale(.97) } }
@keyframes aui045-row { from { opacity: 0; transform: translateY(5px) } }
@keyframes aui045-tick { from { opacity: 0; transform: translateY(45%) } }
@media (prefers-reduced-motion: reduce) { .aui045 *, .aui045 { animation: none !important; transition: none !important } }
`;

export interface GroupedOption {
  value: string;
  label: string;
  /** Muted text after the label, e.g. a country. */
  description?: string;
  /** IANA zone. Shows a live local time and the UTC offset on the right. */
  timeZone?: string;
  /** Muted text on the right when there is no time zone. */
  hint?: string;
  disabled?: boolean;
}

export interface OptionGroup {
  label: string;
  options: GroupedOption[];
}

export interface GroupedSelectProps {
  groups?: OptionGroup[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  searchPlaceholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

const ZONES: OptionGroup[] = [
  {
    label: "Asia and Pacific",
    options: [
      { value: "jakarta", label: "Jakarta", description: "Indonesia", timeZone: "Asia/Jakarta" },
      { value: "singapore", label: "Singapore", description: "Singapore", timeZone: "Asia/Singapore" },
      { value: "tokyo", label: "Tokyo", description: "Japan", timeZone: "Asia/Tokyo" },
      { value: "sydney", label: "Sydney", description: "Australia", timeZone: "Australia/Sydney" },
    ],
  },
  {
    label: "Europe",
    options: [
      { value: "london", label: "London", description: "United Kingdom", timeZone: "Europe/London" },
      { value: "berlin", label: "Berlin", description: "Germany", timeZone: "Europe/Berlin" },
      { value: "lisbon", label: "Lisbon", description: "Portugal", timeZone: "Europe/Lisbon" },
    ],
  },
  {
    label: "Americas",
    options: [
      { value: "new-york", label: "New York", description: "United States", timeZone: "America/New_York" },
      { value: "sao-paulo", label: "São Paulo", description: "Brazil", timeZone: "America/Sao_Paulo" },
      { value: "san-francisco", label: "San Francisco", description: "United States", timeZone: "America/Los_Angeles" },
    ],
  },
];

const fmtCache = new Map<string, { time: Intl.DateTimeFormat; off: Intl.DateTimeFormat; hour: Intl.DateTimeFormat }>();
function zoneInfo(tz: string, now: number) {
  let f = fmtCache.get(tz);
  if (!f) {
    try {
      f = {
        time: new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }),
        off: new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }),
        hour: new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", hourCycle: "h23" }),
      };
    } catch {
      return null;
    }
    fmtCache.set(tz, f);
  }
  const d = new Date(now);
  const off = f.off.formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "";
  const h = Number(f.hour.format(d));
  return { time: f.time.format(d), offset: off === "GMT" ? "GMT+0" : off, day: h >= 7 && h < 19 };
}

/** Measured once on open: does the panel fit below inside the nearest clipping box? */
function roomBelow(el: HTMLElement, need: number) {
  const r = el.getBoundingClientRect();
  let top = 0;
  let bottom = window.innerHeight;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (/hidden|auto|scroll|clip/.test(getComputedStyle(p).overflowY)) {
      const c = p.getBoundingClientRect();
      top = c.top;
      bottom = c.bottom;
      break;
    }
  }
  const below = bottom - r.bottom;
  return below >= need || below >= r.top - top;
}

/** A live clock that only ticks while the component is on screen and the tab is visible. */
function useNow(el: RefObject<HTMLElement | null>, enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    let seen = true;
    const io = new IntersectionObserver(([e]) => (seen = e.isIntersecting));
    if (el.current) io.observe(el.current);
    const tick = () => !document.hidden && seen && setNow(Date.now());
    const id = setInterval(tick, 15000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      io.disconnect();
      document.removeEventListener("visibilitychange", tick);
    };
  }, [el, enabled]);
  return now;
}

function Match({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function DayDot({ day }: { day: boolean }) {
  return (
    <span
      aria-hidden
      className={cx("h-2 w-2 shrink-0 rounded-full", day ? "bg-brand shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]" : "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_40%,transparent)]")}
    />
  );
}

/** aui-045 · Grouped: search across groups with sticky headers, live local times and a day or night dot per row. */
export function GroupedSelect({ groups = ZONES, value, defaultValue, onChange, label = "Time zone", searchPlaceholder = "Search city or country", name, disabled, className }: GroupedSelectProps) {
  const all = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const [inner, setInner] = useState(defaultValue ?? all[0]?.value);
  const current = value ?? inner;
  const sel = all.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [down, setDown] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const uid = useId();
  const now = useNow(root, all.some((o) => o.timeZone));

  const t = q.trim().toLowerCase();
  const shown = useMemo(
    () =>
      groups
        .map((g) => ({ label: g.label, options: t ? g.options.filter((o) => `${o.label} ${o.description ?? ""}`.toLowerCase().includes(t)) : g.options }))
        .filter((g) => g.options.length),
    [groups, t],
  );
  const flat = useMemo(() => shown.flatMap((g) => g.options), [shown]);

  useEffect(() => {
    if (open) search.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const show = () => {
    if (disabled || !btn.current) return;
    setDown(roomBelow(btn.current, 250));
    setQ("");
    setActive(Math.max(0, all.findIndex((o) => o.value === current)));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    btn.current?.focus({ preventScroll: true });
  };
  const pick = (o?: GroupedOption) => {
    if (!o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    onChange?.(o.value);
    close();
  };
  const step = (from: number, d: 1 | -1) => {
    let n = from;
    for (let k = 0; k < flat.length; k++) {
      n = Math.min(flat.length - 1, Math.max(0, n + d));
      if (!flat[n]?.disabled) return n;
    }
    return from;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => step(a, 1));
    else if (e.key === "ArrowUp") setActive((a) => step(a, -1));
    else if (e.key === "PageDown") setActive((a) => Math.min(flat.length - 1, a + 5));
    else if (e.key === "PageUp") setActive((a) => Math.max(0, a - 5));
    else if (e.key === "Enter") pick(flat[active]);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return setOpen(false);
    else return;
    e.preventDefault();
  };

  const selInfo = sel?.timeZone ? zoneInfo(sel.timeZone, now) : null;
  let i = -1;

  return (
    <div ref={root} className={cx("aui045 relative w-full", open && "z-40", className)}>
      <style href="asta-aui045" precedence="asta">{CSS}</style>
      <button
        ref={btn}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-label={`${label}: ${sel?.label ?? ""}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            show();
          }
        }}
        className={cx(
          "group flex h-11 w-full items-center gap-2.5 rounded-[10px] bg-paper px-3.5 text-left outline-none transition-[box-shadow,transform] duration-300 active:scale-[.995] disabled:cursor-not-allowed disabled:opacity-45",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]",
          "focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
          open && "!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        )}
      >
        {selInfo && <DayDot day={selInfo.day} />}
        <span key={current} className="min-w-0 flex-1 truncate text-[14px] text-ink" style={{ animation: `aui045-row .4s ${EASE} both` }}>
          <span className="font-medium tracking-[-0.01em]">{sel?.label}</span>
          {selInfo && <span className="text-mute"> · {selInfo.offset}</span>}
        </span>
        {selInfo && (
          <span className="overflow-hidden font-mono text-[12.5px] tabular-nums text-ink-2" suppressHydrationWarning>
            <span key={selInfo.time} className="inline-block" style={{ animation: `aui045-tick .5s ${EASE} both` }}>
              {selInfo.time}
            </span>
          </span>
        )}
        <svg viewBox="0 0 16 16" className={cx("h-4 w-4 shrink-0 text-mute transition-transform duration-300", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {name && <input type="hidden" name={name} value={current ?? ""} />}

      {open && (
        <div
          className={cx(
            "absolute inset-x-0 z-50 overflow-hidden rounded-[13px] bg-paper",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_22px_48px_-16px_rgb(0_0_0/0.3),0_4px_10px_-4px_rgb(0_0_0/0.08)]",
            down ? "top-full mt-2 origin-top" : "bottom-full mb-2 origin-bottom [--aui045-y:6px]",
          )}
          style={{ animation: `aui045-pop .3s ${EASE} both` }}
          onKeyDown={onKey}
        >
          <div className="flex items-center gap-2 px-3.5 py-1 shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_7%,transparent)]">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              ref={search}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}
              placeholder={searchPlaceholder}
              role="combobox"
              aria-expanded
              aria-autocomplete="list"
              aria-controls={`${uid}-list`}
              aria-activedescendant={flat[active] ? `${uid}-o-${active}` : undefined}
              aria-label={`Search ${label.toLowerCase()}`}
              className="h-10 min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-mute"
            />
            <kbd className="rounded-[5px] bg-paper-2 px-1.5 py-0.5 font-mono text-[10px] text-mute">esc</kbd>
          </div>
          <div ref={list} id={`${uid}-list`} role="listbox" aria-label={label} className="max-h-[184px] overflow-y-auto overscroll-contain pb-1 [scrollbar-width:thin]">
            {shown.map((g, gi) => (
              <div key={g.label} role="group" aria-labelledby={`${uid}-g-${gi}`}>
                <div id={`${uid}-g-${gi}`} className="sticky top-0 z-10 flex items-center justify-between bg-paper px-3.5 pb-1 pt-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">
                  <span>{g.label}</span>
                  <span className="tabular-nums">{g.options.length}</span>
                </div>
                {g.options.map((o) => {
                  i++;
                  const n = i;
                  const info = o.timeZone ? zoneInfo(o.timeZone, now) : null;
                  const on = o.value === current;
                  return (
                      <div
                        key={o.value}
                        id={`${uid}-o-${n}`}
                        data-i={n}
                        role="option"
                        aria-selected={on}
                        aria-disabled={o.disabled || undefined}
                        onPointerMove={() => !o.disabled && active !== n && setActive(n)}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => pick(o)}
                        className={cx(
                          "mx-1 flex h-10 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 transition-colors duration-150",
                          n === active && !o.disabled && "bg-paper-2",
                          o.disabled && "cursor-not-allowed opacity-40",
                        )}
                        style={{ animation: `aui045-row .4s ${EASE} ${Math.min(n, 8) * 25}ms both` }}
                      >
                        {info && <DayDot day={info.day} />}
                        <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
                          <span className={cx(on && "font-medium")}>
                            <Match text={o.label} q={t} />
                          </span>
                          {o.description && (
                            <span className="text-mute">
                              {" "}
                              <Match text={o.description} q={t} />
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-mute" suppressHydrationWarning>
                          {info ? (
                            <>
                              <span className="text-ink-2">{info.time}</span> {info.offset.replace("GMT", "")}
                            </>
                          ) : (
                            o.hint
                          )}
                        </span>
                        <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5 shrink-0 text-brand transition-[opacity,transform] duration-300", on ? "scale-100 opacity-100" : "scale-50 opacity-0")} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="m3.5 8.5 3 3 6-7" />
                        </svg>
                      </div>
                  );
                })}
              </div>
            ))}
            {!flat.length && (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-ink">No match for “{q.trim()}”</p>
                <p className="mt-0.5 text-[12px] text-mute">Try a city or a country name</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupedSelect;
