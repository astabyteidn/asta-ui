"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface FloatingNavbarLink {
  label: string;
  href: string;
}

export interface FloatingNavbarProps {
  brand?: ReactNode;
  brandHref?: string;
  links?: FloatingNavbarLink[];
  /** Quiet link before the button, e.g. "Sign in". */
  secondary?: { label: string; href: string };
  cta?: { label: string; href: string };
  /** Element (or ref to it) whose scroll shrinks the bar. Defaults to the window. */
  scrollRoot?: RefObject<HTMLElement | null> | HTMLElement | null;
  /** Scroll distance in px before the bar shrinks. */
  threshold?: number;
  className?: string;
}

type Box = { x: number; w: number };
const EASE = "cubic-bezier(.16,1,.3,1)";
const TW_EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-brand/50";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";

const CSS = `
@keyframes aui-010-bar { from { opacity: 0; transform: translateY(-14px) scale(.96); } }
@keyframes aui-010-rise { from { opacity: 0; transform: translateY(6px); } }
@keyframes aui-010-drop { from { opacity: 0; transform: translateY(-8px) scale(.97); } }
.aui-010-bar { animation: aui-010-bar .7s ${EASE} both; }
.aui-010-in { animation: aui-010-rise .6s ${EASE} both; animation-delay: calc(180ms + var(--i, 0) * 50ms); }
.aui-010-sheet { animation: aui-010-drop .4s ${EASE} both; transform-origin: top; }
@media (prefers-reduced-motion: reduce) { .aui-010-m, .aui-010-m * { animation: none !important; transition-duration: 0s !important; } .aui-010-glow { display: none; } }
`;

const resolve = (r: FloatingNavbarProps["scrollRoot"]): HTMLElement | null => (r && "current" in r ? r.current : (r ?? null));
const at = (n: number) => ({ "--i": n }) as CSSProperties;

const Logo = () => (
  <>
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <circle cx="10" cy="10" r="8" fill="currentColor" />
      <path d="M5.5 12.5c1.6-3.4 3.2-5 4.5-5s2.9 1.6 4.5 5" fill="none" stroke="var(--color-paper)" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
    Astabyte
  </>
);

const LINKS: FloatingNavbarLink[] = [
  { label: "Collections", href: "#" },
  { label: "Journal", href: "#" },
  { label: "Studio", href: "#" },
  { label: "Visit", href: "#" },
];

const Arrow = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" />
  </svg>
);

function move(el: HTMLElement, to: Box, from: Box | null) {
  el.style.width = `${to.w}px`;
  el.style.transition = "none";
  el.style.transform = from && from.w > 0 ? `translateX(${from.x}px) scaleX(${from.w / to.w})` : `translateX(${to.x}px) scale(.92)`;
  void el.getBoundingClientRect();
  el.style.transition = "";
  el.style.transform = `translateX(${to.x}px)`;
}

/**
 * aui-010 · Floating glass bar whose signature is a soft brand glow that follows the pointer across it,
 * with a pill that glides behind links. On scroll it tucks in (scales down) and gains a shadow.
 */
export function FloatingNavbar({
  brand = <Logo />,
  brandHref = "/",
  links = LINKS,
  secondary = { label: "Sign in", href: "#" },
  cta = { label: "Book a visit", href: "#" },
  scrollRoot,
  threshold = 24,
  className,
}: FloatingNavbarProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const glow = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const last = useRef<Box | null>(null);
  const id = useId();

  useLayoutEffect(() => {
    const ul = list.current;
    const el = pill.current;
    if (!ul || !el) return;
    const a = hover === null ? undefined : ul.querySelectorAll<HTMLElement>("[data-glide]")[hover];
    if (!a) {
      el.style.opacity = "0";
      last.current = null;
      return;
    }
    const box = { x: a.offsetLeft, w: a.offsetWidth };
    move(el, box, last.current);
    el.style.opacity = "1";
    last.current = box;
  }, [hover]);

  useEffect(() => {
    const el = resolve(scrollRoot);
    const read = () => setScrolled((el ? el.scrollTop : window.scrollY) > threshold);
    read();
    const target: HTMLElement | Window = el ?? window;
    target.addEventListener("scroll", read, { passive: true });
    return () => target.removeEventListener("scroll", read);
  }, [scrollRoot, threshold]);

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

  // The glow trails the pointer: a fixed-size blob moved with transform only.
  const track = (x: number | null) => {
    const b = bar.current;
    const g = glow.current;
    if (!b || !g) return;
    if (x === null) {
      g.style.opacity = "0";
      return;
    }
    g.style.opacity = "1";
    g.style.transform = `translateX(${x - b.getBoundingClientRect().left - 110}px)`;
  };

  const shrunk = scrolled && !sheet;

  return (
    <div ref={root} className={cx("aui-010-m @container pointer-events-none sticky top-0 z-30 flex w-full justify-center px-3 pt-3 @min-[640px]:pt-4", className)}>
      <style href="asta-navbar-aui-010" precedence="asta">
        {CSS}
      </style>
      <div className={cx("w-full max-w-[640px] origin-top transition-transform duration-700", TW_EASE, shrunk ? "scale-[.95]" : "scale-100")}>
        <header
          ref={bar}
          onPointerMove={(e) => e.pointerType === "mouse" && track(e.clientX)}
          onPointerLeave={() => track(null)}
          className={cx("aui-010-bar pointer-events-auto relative rounded-[12px] bg-paper/72 backdrop-blur-xl backdrop-saturate-150", RING)}
        >
          {/* Shadow and glow layers: opacity and transform only. */}
          <span
            aria-hidden
            className={cx(
              "pointer-events-none absolute inset-0 rounded-[12px] shadow-[0_1px_2px_rgb(0_0_0/0.06),0_20px_44px_-18px_rgb(0_0_0/0.35)] transition-opacity duration-700",
              TW_EASE,
              shrunk ? "opacity-100" : "opacity-40",
            )}
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]">
            <span
              ref={glow}
              className="aui-010-glow absolute -top-10 left-0 h-[136px] w-[220px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_28%,transparent),transparent)] opacity-0 transition-[opacity,transform] duration-500 ease-out"
            />
          </span>

          <div className="relative flex h-12 items-center gap-3 pl-3.5 pr-2">
            <a href={brandHref} style={at(0)} className={cx("aui-010-in flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-[-0.02em] text-ink", FOCUS)}>
              {brand}
            </a>

            <nav aria-label="Main" className="mx-auto hidden @min-[640px]:block">
              <ul ref={list} className="relative flex items-center gap-px" onPointerLeave={() => setHover(null)}>
                <span
                  ref={pill}
                  aria-hidden
                  style={{ opacity: 0 }}
                  className={cx("pointer-events-none absolute inset-y-0 left-0 origin-left rounded-lg bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)] transition-[transform,opacity] duration-500", TW_EASE)}
                />
                {links.map((l, n) => (
                  <li key={l.label} className="aui-010-in" style={at(n + 1)}>
                    <a
                      href={l.href}
                      data-glide
                      onPointerEnter={() => setHover(n)}
                      onFocus={() => setHover(n)}
                      onBlur={() => setHover(null)}
                      className={cx(
                        "relative flex h-8 items-center rounded-lg px-2.5 text-[14px] font-medium transition-colors duration-300",
                        FOCUS,
                        hover === n ? "text-ink" : "text-ink/70",
                      )}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="ml-auto flex items-center gap-1 @min-[640px]:ml-0">
              {secondary && (
                <a
                  href={secondary.href}
                  style={at(links.length + 1)}
                  className={cx("aui-010-in hidden h-8 items-center rounded-lg px-2.5 text-[13px] font-medium text-ink/70 transition-colors hover:text-ink @min-[720px]:inline-flex", FOCUS)}
                >
                  {secondary.label}
                </a>
              )}
              <a
                href={cta.href}
                style={at(links.length + 2)}
                className={cx(
                  "aui-010-in group/cta hidden h-8 items-center gap-1 rounded-lg bg-brand pl-3 pr-2.5 text-[13px] font-medium text-white transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[.97] @min-[640px]:inline-flex",
                  "shadow-[0_1px_2px_rgb(0_0_0/0.15),0_10px_24px_-10px_color-mix(in_srgb,var(--color-brand)_90%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
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
                className={cx("relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-paper/70 @min-[640px]:hidden", FOCUS)}
              >
                <span className={cx("absolute h-[1.5px] w-[18px] rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "rotate-45" : "-translate-y-1")} />
                <span className={cx("absolute h-[1.5px] w-[18px] rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "-rotate-45" : "translate-y-1")} />
              </button>
            </div>
          </div>

          {sheet && (
            <div
              id={id}
              className={cx(
                "aui-010-sheet absolute inset-x-0 top-[calc(100%+8px)] rounded-[14px] bg-paper/90 p-2 backdrop-blur-xl shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_24px_48px_-20px_rgb(0_0_0/0.4)] @min-[640px]:hidden",
              )}
            >
              <ul className="flex flex-col">
                {links.map((l, n) => (
                  <li key={l.label} className="aui-010-in" style={at(n)}>
                    <a
                      href={l.href}
                      onClick={() => close(false)}
                      className={cx("group/s flex h-12 items-center justify-between rounded-[10px] px-3 text-[17px] font-medium tracking-[-0.02em] text-ink hover:bg-paper-2", FOCUS)}
                    >
                      {l.label}
                      <Arrow className="text-mute transition-transform duration-300 group-hover/s:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="aui-010-in mt-2 grid grid-cols-2 gap-2" style={at(links.length)}>
                {secondary && (
                  <a href={secondary.href} className={cx("flex h-11 items-center justify-center rounded-[9px] bg-paper-2 text-[14px] font-medium text-ink", FOCUS)}>
                    {secondary.label}
                  </a>
                )}
                <a href={cta.href} className={cx("flex h-11 items-center justify-center rounded-[9px] bg-brand text-[14px] font-medium text-white", FOCUS, !secondary && "col-span-2")}>
                  {cta.label}
                </a>
              </div>
            </div>
          )}
        </header>
      </div>
    </div>
  );
}

export default FloatingNavbar;
