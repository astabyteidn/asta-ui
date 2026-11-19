"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface AutoHideNavbarLink {
  label: string;
  href: string;
}

export interface AutoHideNavbarProps {
  brand?: ReactNode;
  brandHref?: string;
  links?: AutoHideNavbarLink[];
  cta?: { label: string; href: string };
  /** Element (or ref to it) whose scroll drives hiding and progress. Defaults to the window. */
  scrollRoot?: RefObject<HTMLElement | null> | HTMLElement | null;
  /** Title of the page being read. Once you pass `titleAt`, the links give way to it and a live percentage. */
  title?: string;
  /** Scroll offset in px where the title takes over from the links. Default 280. */
  titleAt?: number;
  /** Show the reading-progress bar under the header. */
  progress?: boolean;
  /** The header never hides above this scroll offset, in px. */
  offset?: number;
  className?: string;
}

const EASE = "cubic-bezier(.16,1,.3,1)";
const TW_EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-brand/50";

const CSS = `
@keyframes aui-014-rise { from { opacity: 0; transform: translateY(6px); } }
@keyframes aui-014-drop { from { opacity: 0; transform: translateY(-8px); } }
.aui-014-in { animation: aui-014-rise .55s ${EASE} both; animation-delay: calc(var(--i, 0) * 50ms); }
.aui-014-sheet { animation: aui-014-drop .45s ${EASE} both; }
@media (prefers-reduced-motion: reduce) { .aui-014-m, .aui-014-m * { animation: none !important; transition-duration: 0s !important; } }
`;

const resolve = (r: AutoHideNavbarProps["scrollRoot"]): HTMLElement | null => (r && "current" in r ? r.current : (r ?? null));
const at = (n: number) => ({ "--i": n }) as CSSProperties;

const Logo = () => (
  <>
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path d="M4 3.5h8.5a3.5 3.5 0 0 1 0 7H4Z" fill="currentColor" />
      <path d="M4 10.5h6a3 3 0 0 1 0 6H4Z" fill="var(--color-brand)" />
    </svg>
    Astabyte
  </>
);

const LINKS: AutoHideNavbarLink[] = [
  { label: "Essays", href: "#" },
  { label: "Interviews", href: "#" },
  { label: "Archive", href: "#" },
  { label: "About", href: "#" },
];

const Arrow = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" />
  </svg>
);

/** One digit as a vertical strip of 0–9 that slides to the right place. */
function Digit({ d, show = true }: { d: number; show?: boolean }) {
  return (
    <span className={cx("relative inline-block h-[1.2em] overflow-hidden transition-[width,opacity] duration-500", TW_EASE, show ? "w-[0.62em] opacity-100" : "w-0 opacity-0")}>
      <span className={cx("absolute inset-x-0 top-0 flex flex-col transition-transform duration-500", TW_EASE)} style={{ transform: `translateY(${-d * 1.2}em)` }}>
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block h-[1.2em] leading-[1.2em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function Percent({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <span className="inline-flex items-center font-mono text-[12px] tabular-nums" aria-label={`${v}% read`}>
      <span aria-hidden className="inline-flex items-start leading-[1.2em]">
        <Digit d={1} show={v === 100} />
        <Digit d={Math.floor(v / 10) % 10} show={v >= 10} />
        <Digit d={v % 10} />
        <span>%</span>
      </span>
    </span>
  );
}

/**
 * aui-014 · Reading header whose signature is the handover: once you are into the page the links fade out and
 * the bar shows what you are reading with a rolling percentage. It slides away on scroll down and back on scroll up.
 */
export function AutoHideNavbar({
  brand = <Logo />,
  brandHref = "/",
  links = LINKS,
  cta = { label: "Subscribe", href: "#" },
  scrollRoot,
  title,
  titleAt = 280,
  progress = true,
  offset = 64,
  className,
}: AutoHideNavbarProps) {
  const [hidden, setHidden] = useState(false);
  const [reading, setReading] = useState(false);
  const [pct, setPct] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [focused, setFocused] = useState(false);
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    const el = resolve(scrollRoot);
    const target: HTMLElement | Window = el ?? window;
    const pos = () => (el ? el.scrollTop : window.scrollY);
    const max = () => (el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight);
    let prev = pos();
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = pos();
      const dy = y - prev;
      // A few px of slack so trackpad jitter doesn't flicker the header.
      if (Math.abs(dy) > 4) {
        setHidden(dy > 0 && y > offset);
        prev = y;
      }
      if (y <= offset) setHidden(false);
      setReading(y > titleAt);
      const m = max();
      const p = m > 0 ? Math.min(1, Math.max(0, y / m)) : 0;
      setPct(Math.round(p * 100));
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [scrollRoot, offset, titleAt]);

  const close = useCallback((focus: boolean) => {
    setSheet(false);
    if (focus) burger.current?.focus();
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const down = (e: PointerEvent) => !root.current?.contains(e.target as Node) && close(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [sheet, close]);

  // Keyboard users and an open sheet always see the header.
  const away = hidden && !sheet && !focused;
  const swap = Boolean(title) && reading;

  return (
    <header
      ref={root}
      onFocus={(e) => e.target.matches(":focus-visible") && setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
      className={cx(
        "aui-014-m @container sticky top-0 z-30 w-full bg-paper/88 backdrop-blur-xl transition-transform duration-500",
        TW_EASE,
        // Slide up but leave the 2px progress bar peeking at the top.
        away ? (progress ? "-translate-y-[calc(100%-2px)]" : "-translate-y-full") : "translate-y-0",
        className,
      )}
    >
      <style href="asta-navbar-aui-014" precedence="asta">
        {CSS}
      </style>
      <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-5 px-4">
        <a href={brandHref} style={at(0)} className={cx("aui-014-in flex shrink-0 items-center gap-2 rounded-md text-[15px] font-semibold tracking-[-0.02em] text-ink", FOCUS)}>
          {brand}
        </a>

        <div className="relative min-w-0 flex-1 self-stretch">
          {/* Links: fade and lift away when the title takes over. */}
          <nav aria-label="Main" aria-hidden={swap || undefined} inert={swap || undefined} className="absolute inset-0 hidden items-center @min-[640px]:flex">
            <ul className="flex items-center gap-px">
              {links.map((l, n) => (
                <li key={l.label} className="aui-014-in" style={at(n + 1)}>
                  <a
                    href={l.href}
                    style={{ transitionDelay: swap ? `${n * 30}ms` : `${120 + n * 40}ms` }}
                    className={cx(
                      "flex h-8 items-center rounded-lg px-2.5 text-[14px] font-medium text-ink/70 transition-[color,background-color,opacity,transform] duration-500 hover:bg-paper-2 hover:text-ink",
                      TW_EASE,
                      FOCUS,
                      swap ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100",
                    )}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {/* Now reading */}
          {title && (
            <div
              aria-hidden={!swap || undefined}
              className={cx(
                "absolute inset-0 flex items-center gap-3 transition-[opacity,transform] duration-500",
                TW_EASE,
                swap ? "translate-y-0 opacity-100 delay-150" : "pointer-events-none translate-y-2 opacity-0",
              )}
            >
              <span className="hidden shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute @min-[480px]:inline">Reading</span>
              <span className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink">{title}</span>
              <span className="ml-auto shrink-0 rounded-[6px] bg-paper-2 px-1.5 py-0.5 text-ink-2 @min-[640px]:ml-0">
                <Percent value={pct} />
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={cta.href}
            style={at(links.length + 1)}
            className={cx(
              "aui-014-in group/cta hidden h-8 items-center gap-1 rounded-lg bg-ink pl-3 pr-2.5 text-[13px] font-medium text-paper transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[.97] @min-[640px]:inline-flex",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              TW_EASE,
              FOCUS,
            )}
          >
            {cta.label}
            <Arrow className={cx("transition-transform duration-300 group-hover/cta:translate-x-0.5", TW_EASE)} />
          </a>
          <button
            ref={burger}
            type="button"
            aria-label={sheet ? "Close menu" : "Open menu"}
            aria-expanded={sheet}
            aria-controls={id}
            onClick={() => setSheet((v) => !v)}
            className={cx("relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-paper-2 @min-[640px]:hidden", FOCUS)}
          >
            <span className={cx("absolute h-[1.5px] w-[18px] rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "rotate-45" : "-translate-y-1")} />
            <span className={cx("absolute h-[1.5px] w-[18px] rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "-rotate-45" : "translate-y-1")} />
          </button>
        </div>
      </div>

      {progress && (
        <div aria-hidden className="h-[2px] w-full bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]">
          <span ref={bar} style={{ transform: "scaleX(0)" }} className="block h-full w-full origin-left rounded-r-full bg-brand shadow-[0_0_10px_color-mix(in_srgb,var(--color-brand)_60%,transparent)]" />
        </div>
      )}

      {sheet && (
        <div id={id} className="aui-014-sheet absolute inset-x-0 top-full bg-paper px-5 pb-6 pt-2 shadow-[0_24px_40px_-24px_rgb(0_0_0/0.3)] @min-[640px]:hidden">
          <ul className="flex flex-col">
            {links.map((l, n) => (
              <li key={l.label} className="aui-014-in" style={at(n)}>
                <a href={l.href} onClick={() => close(false)} className={cx("group/s flex h-12 items-center justify-between rounded-[10px] text-[20px] font-medium tracking-[-0.03em] text-ink", FOCUS)}>
                  {l.label}
                  <Arrow className="h-4 w-4 text-mute transition-transform duration-300 group-hover/s:translate-x-0.5" />
                </a>
              </li>
            ))}
          </ul>
          <a href={cta.href} style={at(links.length)} className={cx("aui-014-in mt-4 flex h-10 items-center justify-center gap-1.5 rounded-lg bg-ink text-[14px] font-medium text-paper", FOCUS)}>
            {cta.label}
            <Arrow />
          </a>
        </div>
      )}
    </header>
  );
}

export default AutoHideNavbar;
