"use client";

import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export interface StatusFooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface StatusFooterProps {
  brand?: ReactNode;
  tagline?: string;
  columns?: StatusFooterColumn[];
  /** Status pill text and link. `live: false` stops the pulse and shows the dot in ink. */
  status?: { label: string; href?: string; live?: boolean };
  /** One value per day, oldest first: 1 is a clean day, anything lower had an incident. */
  uptime?: number[];
  languages?: { value: string; label: string }[];
  language?: string;
  onLanguageChange?: (value: string) => void;
  /** Overrides the default, which scrolls the nearest scrolling ancestor (or the window) to the top. */
  onBackToTop?: () => void;
  legal?: ReactNode;
  className?: string;
}

const DEFAULT_COLUMNS: StatusFooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Dashboard", href: "#" },
      { label: "Edge functions", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Enterprise", href: "#" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Docs", href: "#" },
      { label: "API reference", href: "#" },
      { label: "SDKs", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Security", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

const DEFAULT_UPTIME = Array.from({ length: 45 }, (_, i) => (i === 11 ? 0.991 : i === 29 ? 0.997 : 1));

const DEFAULT_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "ja", label: "日本語" },
  { value: "id", label: "Bahasa Indonesia" },
];

const CSS = `
@keyframes aui-f28-rise { from { opacity: 0; transform: translateY(12px) } }
@keyframes aui-f28-bar { from { opacity: 0; transform: scaleY(.15) } }
@keyframes aui-f28-ping { 0% { opacity: .55; transform: scale(1) } 80%, 100% { opacity: 0; transform: scale(2.8) } }
@keyframes aui-f28-beat { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: .7; transform: scale(.8) } }
@keyframes aui-f28-fly { 0% { transform: none } 45% { opacity: 0; transform: translateY(-130%) } 46% { opacity: 0; transform: translateY(130%) } 100% { opacity: 1; transform: none } }
.aui-f28-in { animation: aui-f28-rise .65s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--i, 0) * 55ms) }
.aui-f28-bar { transform-origin: bottom; animation: aui-f28-bar .6s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(300ms + var(--i, 0) * 14ms) }
.aui-f28-ping { animation: aui-f28-ping 2s cubic-bezier(.16,1,.3,1) infinite }
.aui-f28-beat { animation: aui-f28-beat 2s cubic-bezier(.16,1,.3,1) infinite }
.aui-f28-fly { animation: aui-f28-fly .7s cubic-bezier(.16,1,.3,1) }
@media (prefers-reduced-motion: reduce) {
  .aui-f28-in, .aui-f28-bar, .aui-f28-beat, .aui-f28-fly { animation: none }
  .aui-f28-ping { animation: none; opacity: 0 }
}
`;

function Mark() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.03em] text-ink">
      <span aria-hidden className="grid h-7 w-7 place-items-center rounded-[8px] bg-ink text-paper">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 10.5 6 7l2.5 2.5L13.5 4.5" />
        </svg>
      </span>
      Astabyte
    </span>
  );
}

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight) return n;
  }
  return null;
}

const dayLabel = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
};

/** aui-028 · A product footer whose live status card shows a pulsing dot and a daily uptime strip you can hover, with link columns, a language picker and a back-to-top button. */
export function StatusFooter({
  brand = <Mark />,
  tagline = "Deploy, observe and scale from one quiet dashboard.",
  columns = DEFAULT_COLUMNS,
  status = { label: "All systems normal", href: "#", live: true },
  uptime = DEFAULT_UPTIME,
  languages = DEFAULT_LANGUAGES,
  language,
  onLanguageChange,
  onBackToTop,
  legal,
  className,
}: StatusFooterProps) {
  const root = useRef<HTMLElement>(null);
  const [own, setOwn] = useState(languages[0]?.value ?? "");
  const [hover, setHover] = useState<number | null>(null);
  const [fly, setFly] = useState(0);
  const langId = useId();
  const lang = language ?? own;
  const live = status.live ?? true;
  const avg = uptime.length ? (uptime.reduce((a, b) => a + b, 0) / uptime.length) * 100 : 100;

  const toTop = () => {
    setFly((n) => n + 1);
    if (onBackToTop) return onBackToTop();
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const box = scrollParent(root.current);
    if (box) box.scrollTo({ top: 0, behavior });
    else window.scrollTo({ top: 0, behavior });
  };

  const pill = (
    <>
      <span aria-hidden className="relative flex h-2 w-2">
        {live && <span className="aui-f28-ping absolute inset-0 rounded-full bg-brand" />}
        <span className={cx("relative h-2 w-2 rounded-full", live ? "aui-f28-beat bg-brand" : "bg-ink")} />
      </span>
      {status.label}
      {status.href && (
        <svg viewBox="0 0 16 16" aria-hidden className={cx("h-3 w-3 text-mute transition-transform duration-300 group-hover/st:translate-x-0.5", EASE)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 4 4 4-4 4" />
        </svg>
      )}
    </>
  );
  const pillClass = cx("group/st inline-flex items-center gap-2 rounded-[6px] text-[13px] font-medium text-ink", ring);
  const shown = hover ?? null;

  return (
    <footer ref={root} className={cx("@container w-full bg-paper px-6 pb-6 pt-12 @min-[720px]:px-10", className)}>
      <div className="grid gap-10 @min-[640px]:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] @min-[640px]:gap-10">
        <div className="flex min-w-0 flex-col items-start">
          <div className="aui-f28-in" style={step(0)}>
            {brand}
          </div>
          <p className="aui-f28-in mt-4 max-w-[30ch] text-[14px] leading-relaxed text-mute" style={step(1)}>
            {tagline}
          </p>

          <div
            className="aui-f28-in mt-6 w-full max-w-[340px] rounded-[12px] bg-paper p-4 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_14px_32px_-20px_rgb(0_0_0/0.25)]"
            style={step(2)}
          >
            <div className="flex items-center justify-between gap-3">
              {status.href ? (
                <a href={status.href} className={pillClass}>
                  {pill}
                </a>
              ) : (
                <span role="status" className={pillClass}>
                  {pill}
                </span>
              )}
              <span className="font-mono text-[11px] tabular-nums text-mute">{avg.toFixed(2)}%</span>
            </div>
            <div className="relative mt-4" onPointerLeave={() => setHover(null)}>
              <div aria-hidden className="flex h-7 items-end gap-[2px]">
                {uptime.map((v, i) => (
                  <span
                    key={i}
                    onPointerEnter={() => setHover(i)}
                    className={cx(
                      "aui-f28-bar flex-1 rounded-[2px] transition-opacity duration-200",
                      // A day with an incident is shorter as well as grey, so it reads without the colour.
                      v >= 1 ? "h-full bg-brand" : "h-[60%] bg-ink/35",
                      shown !== null && shown !== i && "opacity-40",
                    )}
                    style={step(i)}
                  />
                ))}
              </div>
              <p className="sr-only">
                {avg.toFixed(2)}% uptime over the last {uptime.length} days
                {uptime.some((v) => v < 1) && `, ${uptime.filter((v) => v < 1).length} with incidents`}
              </p>
              <div aria-hidden className="mt-2 flex justify-between font-mono text-[10.5px] text-mute">
                <span className={cx("transition-opacity duration-200", shown !== null && "opacity-0")}>{uptime.length} days ago</span>
                <span
                  className={cx(
                    "absolute left-1/2 -translate-x-1/2 text-ink transition-[opacity,transform] duration-300",
                    EASE,
                    shown !== null ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                  )}
                >
                  {shown !== null && `${dayLabel(uptime.length - 1 - shown)} · ${uptime[shown] >= 1 ? "No incidents" : `${(uptime[shown] * 100).toFixed(1)}% up`}`}
                </span>
                <span className={cx("transition-opacity duration-200", shown !== null && "opacity-0")}>Today</span>
              </div>
            </div>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 @min-[460px]:grid-cols-3">
          {columns.map((c, ci) => (
            <div key={c.heading} className="aui-f28-in" style={step(2 + ci)}>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">{c.heading}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={cx("inline-block rounded-[4px] text-[13.5px] text-ink-2 transition-[color,transform] duration-300 hover:translate-x-0.5 hover:text-ink motion-reduce:hover:translate-x-0", EASE, ring)}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="aui-f28-in mt-12 flex flex-col-reverse gap-4 @min-[600px]:flex-row @min-[600px]:items-center @min-[600px]:justify-between" style={step(6)}>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-mute">
          {legal ?? (
            <>
              <span>© {new Date().getFullYear()} Astabyte</span>
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-ink", ring)}>
                Privacy
              </a>
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-ink", ring)}>
                Terms
              </a>
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-ink", ring)}>
                DPA
              </a>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 @min-[600px]:flex-none">
            <label htmlFor={langId} className="sr-only">
              Language
            </label>
            <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="8" r="5.8" />
              <path d="M2.2 8h11.6M8 2.2c1.7 1.6 2.5 3.5 2.5 5.8S9.7 12.2 8 13.8M8 2.2C6.3 3.8 5.5 5.7 5.5 8s.8 4.2 2.5 5.8" />
            </svg>
            <select
              id={langId}
              name="language"
              value={lang}
              onChange={(e) => {
                setOwn(e.target.value);
                onLanguageChange?.(e.target.value);
              }}
              className={cx("h-9 w-full cursor-pointer appearance-none rounded-[8px] bg-paper-2 pl-8 pr-8 text-[16px] sm:text-[12.5px] text-ink transition-shadow duration-300 hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]", ring)}
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </div>
          <button
            type="button"
            onClick={toTop}
            className={cx(
              "group/top inline-flex h-9 shrink-0 items-center whitespace-nowrap gap-2 rounded-[8px] bg-ink pl-3 pr-3.5 text-[12.5px] font-medium text-paper transition-transform duration-300 hover:-translate-y-px active:scale-[.96] motion-reduce:transition-none",
              EASE,
              ring,
            )}
          >
            <span className="relative grid h-3.5 w-3.5 place-items-center overflow-hidden">
              <svg key={fly} viewBox="0 0 16 16" aria-hidden className={cx("h-3.5 w-3.5", fly > 0 && "aui-f28-fly")} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 13V3M4 7l4-4 4 4" />
              </svg>
            </span>
            Back to top
          </button>
        </div>
      </div>
      <style href="asta-footer-aui-028" precedence="asta">
        {CSS}
      </style>
    </footer>
  );
}

export default StatusFooter;
