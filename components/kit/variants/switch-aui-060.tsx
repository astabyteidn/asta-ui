"use client";

import { useId, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui060-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui060-bar { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@media (prefers-reduced-motion: reduce) { .aui060 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui060-rise .6s ${EASE} ${80 + i * 55}ms both` });

export type ThemeMode = "light" | "dark";

export interface ThemeSwitchProps {
  theme?: ThemeMode;
  defaultTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  /** First name for the greeting. */
  person?: string;
  className?: string;
}

const BARS = [0.42, 0.6, 0.5, 0.78, 0.66, 0.92, 0.7];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// Switch centre, measured from the card's top-right corner. The ink circle grows from here.
const CX = 48;
const CY = 35;
const R = 640;

/** The card body, drawn once per theme. Only opacity and the circle animate between them. */
function Face({ tone, person }: { tone: ThemeMode; person: string }) {
  const dark = tone === "dark";
  const mute = dark ? "text-paper/50" : "text-mute";
  const fg = dark ? "text-paper" : "text-ink";
  const surface = dark ? "bg-paper/[0.07]" : "bg-paper-2";
  return (
    <div className={cx("p-5 sm:p-6", fg)}>
      <div className="pr-20" style={rise(0)}>
        <p className={cx("font-mono text-[11px] uppercase tracking-[0.08em]", mute)}>Astabyte · {dark ? "Dark" : "Light"}</p>
        <p className="mt-1.5 text-[20px] font-medium leading-tight tracking-[-0.02em]">
          Good {dark ? "evening" : "morning"}, {person}
        </p>
      </div>
      <div className={cx("mt-5 rounded-[11px] p-4", surface)} style={rise(1)}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={cx("text-[12px]", mute)}>Paid this week</p>
            <p className="mt-1 text-[28px] font-medium leading-none tracking-[-0.04em]">
              <span className={cx("mr-0.5 align-top text-[13px] tracking-normal", mute)}>$</span>9,640
            </p>
          </div>
          <div className="flex h-12 items-end gap-1.5" aria-hidden>
            {BARS.map((b, i) => (
              <span key={i} className="flex flex-col items-center gap-1">
                <span className="flex h-9 w-2 items-end">
                  <span className={cx("block w-full origin-bottom rounded-[3px]", i === 5 ? "bg-brand" : dark ? "bg-paper/25" : "bg-[color-mix(in_srgb,var(--color-ink)_16%,transparent)]")} style={{ height: `${b * 100}%`, animation: `aui060-bar .7s ${EASE} ${200 + i * 40}ms both` }} />
                </span>
                <span className={cx("text-[9px] leading-none", mute)}>{DAYS[i]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <ul className="mt-3 space-y-1" style={rise(2)}>
        {[
          ["Invoice 1042", "Design studio", "Paid"],
          ["Invoice 1043", "Coffee roaster", "Due Fri"],
        ].map(([a, b, c], i) => (
          <li key={a} className="flex items-center gap-3 py-1.5">
            <span className={cx("grid h-7 w-7 place-items-center rounded-[7px] text-[10.5px] font-medium", surface)}>{b[0]}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px]">{a}</span>
              <span className={cx("block text-[12px]", mute)}>{b}</span>
            </span>
            <span className={cx("text-[12px] font-medium", i === 0 ? (dark ? "text-[color-mix(in_srgb,var(--color-brand)_55%,var(--color-paper))]" : "text-brand") : mute)}>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * aui-060 · A light and dark toggle that re-themes its card. Signature: the sun thumb rolls into a moon, stars
 * come out in the track and an ink circle grows from the switch to cover the card.
 */
export function ThemeSwitch({ theme, defaultTheme = "light", onThemeChange, person = "Maya", className }: ThemeSwitchProps) {
  const uid = useId();
  const [inner, setInner] = useState<ThemeMode>(defaultTheme);
  const current = theme ?? inner;
  const dark = current === "dark";
  const flip = () => {
    const next: ThemeMode = dark ? "light" : "dark";
    if (theme === undefined) setInner(next);
    onThemeChange?.(next);
  };

  return (
    <div
      className={cx(
        "aui060 relative isolate w-full max-w-[400px] overflow-hidden rounded-[14px] bg-paper",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.3)]",
        className,
      )}
    >
      <style href="asta-aui060" precedence="asta">
        {CSS}
      </style>
      <div aria-hidden={dark}>
        <Face tone="light" person={person} />
      </div>
      <div aria-hidden={!dark} className="pointer-events-none absolute inset-0">
        <span
          className="absolute rounded-full bg-ink transition-transform duration-700"
          style={{ width: R * 2, height: R * 2, right: CX - R, top: CY - R, transform: `scale(${dark ? 1 : 0})`, transitionTimingFunction: EASE }}
        />
        <div className="relative transition-opacity" style={{ opacity: dark ? 1 : 0, transitionDuration: dark ? "500ms" : "200ms", transitionDelay: dark ? "160ms" : "0ms" }}>
          <Face tone="dark" person={person} />
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Dark mode"
        aria-describedby={`${uid}-s`}
        onClick={flip}
        className={cx(
          "group/sw absolute right-5 top-5 z-10 h-[30px] w-[56px] rounded-full outline-none transition-transform duration-200 active:scale-[0.96] sm:right-6 sm:top-6",
          "focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2",
          dark ? "focus-visible:ring-offset-ink" : "focus-visible:ring-offset-paper",
        )}
        style={{ animation: `aui060-rise .6s ${EASE} 120ms both` }}
      >
        <span id={`${uid}-s`} className="sr-only">
          {dark ? "Dark theme on" : "Light theme on"}
        </span>
        <span aria-hidden className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_8%,var(--color-paper))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),inset_0_1px_2px_rgb(0_0_0/0.06)]" />
        <span aria-hidden className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-paper)_14%,var(--color-ink))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_14%,transparent)] transition-opacity duration-500" style={{ opacity: dark ? 1 : 0 }} />
        {/* Stars come out on the left of the track. */}
        {[
          [9, 9, 0],
          [16, 17, 80],
          [8, 20, 140],
        ].map(([x, y, d], i) => (
          <span
            key={i}
            aria-hidden
            className="absolute h-[3px] w-[3px] rounded-full bg-paper transition-[transform,opacity] duration-500"
            style={{ left: x, top: y, opacity: dark ? 0.9 : 0, transform: dark ? "scale(1)" : "scale(0)" /* perf-ok: 3px star dots */, transitionDelay: dark ? `${200 + d}ms` : "0ms", transitionTimingFunction: SPRING }}
          />
        ))}
        <span
          aria-hidden
          className="absolute left-[3px] top-[3px] grid h-6 w-6 place-items-center rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.25),0_3px_8px_-2px_rgb(0_0_0/0.3)] transition-transform duration-500"
          style={{ transform: `translateX(${dark ? 26 : 0}px) rotate(${dark ? 360 : 0}deg)`, transitionTimingFunction: SPRING }}
        >
          <span className="absolute inset-0 rounded-full bg-white" />
          <span className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-brand)_14%,white)] transition-opacity duration-500" style={{ opacity: dark ? 1 : 0 }} />
          <svg viewBox="0 0 16 16" className="absolute h-3.5 w-3.5 text-ink transition-[transform,opacity] duration-500" style={{ opacity: dark ? 0 : 1, transform: dark ? "scale(.4) rotate(-90deg)" : "none", transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="8" cy="8" r="2.8" />
            <path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
          </svg>
          <svg viewBox="0 0 16 16" className="absolute h-3.5 w-3.5 text-brand transition-[transform,opacity] duration-500" style={{ opacity: dark ? 1 : 0, transform: dark ? "none" : "scale(.4) rotate(90deg)", transitionTimingFunction: EASE }} fill="currentColor">
            <path d="M13.3 10.1A5.6 5.6 0 015.9 2.7a5.6 5.6 0 107.4 7.4z" />
          </svg>
        </span>
      </button>
    </div>
  );
}

export default ThemeSwitch;
