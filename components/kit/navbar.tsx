"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/kit/button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface NavTile {
  title: string;
  description?: string;
  href: string;
  icon?: ReactNode;
  /** Big tiles get a small mock preview in the corner. */
  preview?: "chart" | "list" | "code";
}
export interface NavMenu {
  /** Panel width in px (clamped to the space available). */
  width?: number;
  tiles?: NavTile[];
  columns?: { heading: string; links: NavTile[] }[];
  feature?: { title: string; description: string; href: string; cta: string };
}
export interface NavItem {
  label: string;
  href?: string;
  menu?: NavMenu;
}
export interface NavbarProps {
  brand: ReactNode;
  brandHref?: string;
  items: NavItem[];
  /** Quiet link that folds away once the page scrolls. */
  docs?: { label: string; href: string };
  cta: { label: string; href: string };
  /** Element whose scroll drives the folded state (defaults to the window). */
  scrollRoot?: RefObject<HTMLElement | null>;
  className?: string;
}

const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]";
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 4 4 4-4 4" />
  </svg>
);

/** Abstract UI shapes so big tiles hint at what's behind them. Grey until hovered. */
function Preview({ kind }: { kind: NonNullable<NavTile["preview"]> }) {
  const bar = "rounded-full bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)] transition-colors duration-500";
  return (
    <div
      aria-hidden
      className={cx(
        "absolute -bottom-px -right-px h-[46%] w-[72%] rounded-tl-xl bg-paper p-3 transition-transform duration-500 group-hover/tile:-translate-x-1 group-hover/tile:-translate-y-1",
        RING,
        EASE,
      )}
    >
      {kind === "chart" && (
        <div className="flex h-full items-end gap-1.5">
          {[40, 64, 52, 80, 70, 96].map((h, i) => (
            <span key={i} className={cx(bar, "w-full rounded-[3px] group-hover/tile:bg-brand")} style={{ height: `${h}%`, transitionDelay: `${i * 40}ms` }} />
          ))}
        </div>
      )}
      {kind === "list" && (
        <div className="flex flex-col gap-2">
          {[80, 56, 68].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={cx(bar, "h-3 w-3 shrink-0 group-hover/tile:bg-brand")} style={{ transitionDelay: `${i * 60}ms` }} />
              <span className={cx(bar, "h-1.5")} style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      )}
      {kind === "code" && (
        <div className="flex flex-col gap-1.5 font-mono">
          {[
            [20, 50],
            [36, 30],
            [28, 44],
            [20, 24],
          ].map(([a, b], i) => (
            <div key={i} className="flex gap-1.5">
              <span className={cx(bar, "h-1.5 group-hover/tile:bg-brand")} style={{ width: `${a}%`, transitionDelay: `${i * 50}ms` }} />
              <span className={cx(bar, "h-1.5")} style={{ width: `${b}%` }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({ tile, big }: { tile: NavTile; big: boolean }) {
  return (
    <a
      href={tile.href}
      data-kit-nav-link
      className={cx(
        "group/tile relative flex flex-col gap-1.5 overflow-hidden rounded-[10px] bg-paper-2 p-4 outline-none transition-[opacity,background-color] duration-300",
        "group-has-[a:hover]/menu:opacity-55 hover:!opacity-100 focus-visible:ring-2 focus-visible:ring-brand/50",
        big ? "min-h-[184px]" : "min-h-[92px]",
      )}
    >
      <span className="flex items-center gap-2 text-[14px] font-medium tracking-[-0.01em] text-ink">
        {tile.icon && (
          <span className={cx("flex h-6 w-6 items-center justify-center rounded-md bg-paper text-ink [&_svg]:h-3.5 [&_svg]:w-3.5", RING)}>{tile.icon}</span>
        )}
        {tile.title}
        <Chevron className={cx("-translate-x-0.5 text-mute transition-[translate,color] duration-300 group-hover/tile:translate-x-0 group-hover/tile:text-ink", EASE)} />
      </span>
      {tile.description && <span className={cx("text-[12.5px] leading-snug text-mute", big && "max-w-[22ch]")}>{tile.description}</span>}
      {big && tile.preview && <Preview kind={tile.preview} />}
    </a>
  );
}

function Panel({ menu }: { menu: NavMenu }) {
  const tiles = menu.tiles ?? [];
  const big = tiles.some((t) => t.preview);
  return (
    <div className="group/menu flex flex-col gap-2 p-2">
      {tiles.length > 0 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tiles.length === 4 ? 2 : tiles.length}, minmax(0, 1fr))` }}>
          {tiles.map((t) => (
            <Tile key={t.title} tile={t} big={big} />
          ))}
        </div>
      )}
      {(menu.columns || menu.feature) && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(menu.columns?.length ?? 0) + (menu.feature ? 1 : 0)}, minmax(0, 1fr))` }}>
          {menu.columns?.map((col) => (
            <div key={col.heading} className="flex flex-col gap-0.5 p-2">
              <span className="mb-1.5 px-2 text-[11.5px] text-mute">{col.heading}</span>
              {col.links.map((l) => (
                <a
                  key={l.title}
                  href={l.href}
                  data-kit-nav-link
                  className="group/link flex flex-col rounded-lg px-2 py-1.5 outline-none transition-[background-color,opacity] duration-200 hover:bg-paper-2 focus-visible:bg-paper-2 group-has-[a:hover]/menu:opacity-60 hover:!opacity-100"
                >
                  <span className="flex items-center gap-1 text-[13.5px] font-medium text-ink">
                    {l.title}
                    <Chevron className={cx("h-3 w-3 -translate-x-1 text-mute opacity-0 transition-[translate,opacity] duration-300 group-hover/link:translate-x-0 group-hover/link:opacity-100", EASE)} />
                  </span>
                  {l.description && <span className="text-[12px] leading-snug text-mute">{l.description}</span>}
                </a>
              ))}
            </div>
          ))}
          {menu.feature && (
            <a
              href={menu.feature.href}
              data-kit-nav-link
              className="group/feat relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-[10px] bg-brand p-4 text-white outline-none transition-opacity duration-300 group-has-[a:hover]/menu:opacity-70 hover:!opacity-100 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <span aria-hidden className={cx("absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 transition-transform duration-700 group-hover/feat:scale-125", EASE)} />
              <span aria-hidden className={cx("absolute -right-2 top-12 h-20 w-20 rounded-full bg-white/10 transition-transform duration-700 group-hover/feat:-translate-x-3", EASE)} />
              <span className="relative text-[15px] font-medium tracking-[-0.01em]">{menu.feature.title}</span>
              <span className="relative mt-1 text-[12.5px] leading-snug text-white/80">{menu.feature.description}</span>
              <span className="relative mt-3 flex items-center gap-1 text-[13px] font-medium">
                {menu.feature.cta}
                <Chevron className={cx("transition-transform duration-300 group-hover/feat:translate-x-0.5", EASE)} />
              </span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** Every link in a menu, flattened, for the mobile sheet. */
const flat = (m: NavMenu): NavTile[] => [...(m.tiles ?? []), ...(m.columns?.flatMap((c) => c.links) ?? [])];

/**
 * Site header with a mega menu. One shared panel sits under the bar and morphs its size between
 * sections while the new content slides in from the side you moved toward. Hovering a tile dims the
 * rest. Below 560px of container width it collapses to a burger and a sheet of accordion sections.
 * Wrap it in an element with `@container` (the demo does) or it falls back to the viewport width.
 */
export function Navbar({ brand, brandHref = "/", items, docs, cta, scrollRoot, className }: NavbarProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  // The last menu stays rendered while the panel fades out; `slide` is true only when moving between menus.
  const [last, setLast] = useState<number | null>(null);
  const [slide, setSlide] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [section, setSection] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focusPanel = useRef(false);
  const openRef = useRef<number | null>(null);
  const shown = open ?? last;
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const show = useCallback((i: number | null) => {
    clearTimeout(timer.current);
    const cur = openRef.current;
    const moving = i !== null && cur !== null && i !== cur;
    if (moving) setDir(i > cur ? 1 : -1);
    setSlide(moving);
    if (i !== null) setLast(i);
    setOpen(i);
  }, []);

  // Hover intent: a short delay before the first open, instant while moving between triggers.
  const enter = (i: number) => {
    clearTimeout(timer.current);
    if (openRef.current === null) timer.current = setTimeout(() => show(i), 110);
    else show(i);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => show(null), 180);
  };
  const stay = () => clearTimeout(timer.current);

  // Measure the active menu so the panel can animate to its size.
  useLayoutEffect(() => {
    const el = content.current;
    if (shown === null || !el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (focusPanel.current) {
      focusPanel.current = false;
      el.querySelector<HTMLElement>("[data-kit-nav-link]")?.focus();
    }
    return () => ro.disconnect();
  }, [shown, open]);

  // Folded state once the page scrolls.
  useEffect(() => {
    const el = scrollRoot?.current ?? null;
    const read = () => setScrolled((el ? el.scrollTop : window.scrollY) > 40);
    read();
    const target: HTMLElement | Window = el ?? window;
    target.addEventListener("scroll", read, { passive: true });
    return () => target.removeEventListener("scroll", read);
  }, [scrollRoot]);

  // Outside click and Escape close everything.
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        show(null);
        setSheet(false);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const i = openRef.current;
      if (i !== null) {
        show(null);
        triggers.current[i]?.focus();
      }
      setSheet(false);
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [show]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const menu = shown !== null ? items[shown]?.menu : undefined;
  const trigger =
    "flex h-8 items-center gap-1 rounded-md px-2.5 text-[13.5px] font-medium text-ink-2 outline-none transition-colors duration-200 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 aria-expanded:bg-paper-2 aria-expanded:text-ink";

  return (
    <header
      ref={root}
      className={cx(
        "sticky top-0 z-30 w-full bg-paper/85 backdrop-blur-md transition-shadow duration-300",
        scrolled || sheet ? "shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_10%,transparent)]" : "",
        className,
      )}
    >
      <style href="asta-navbar" precedence="asta">{`
        @keyframes kit-nav-in { from { opacity: 0; transform: translateX(calc(var(--kit-dir) * 36px)); } to { opacity: 1; transform: none; } }
        @keyframes kit-nav-pop { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .kit-nav-motion, .kit-nav-motion * { animation: none !important; transition-duration: 0s !important; } }
      `}</style>
      <div className="kit-nav-motion relative flex h-14 items-center gap-3 px-4">
        <a href={brandHref} className="flex flex-1 items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-md">
          {brand}
        </a>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden @min-[560px]:block" onPointerLeave={leave} onPointerEnter={stay}>
          <ul className="flex items-center gap-0.5">
            {items.map((it, i) => (
              <li key={it.label}>
                {it.menu ? (
                  <button
                    ref={(el) => {
                      triggers.current[i] = el;
                    }}
                    type="button"
                    aria-expanded={open === i}
                    aria-controls="kit-nav-panel"
                    onPointerEnter={(e) => e.pointerType === "mouse" && enter(i)}
                    onClick={() => show(open === i ? null : i)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" || ((e.key === "Enter" || e.key === " ") && open !== i)) {
                        e.preventDefault();
                        focusPanel.current = true;
                        show(i);
                      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                        e.preventDefault();
                        const step = e.key === "ArrowRight" ? 1 : -1;
                        const next = (i + step + items.length) % items.length;
                        root.current?.querySelectorAll<HTMLElement>("nav[aria-label=Main] li > *")[next]?.focus();
                        if (open !== null && items[next].menu) show(next);
                      }
                    }}
                    className={cx(trigger, "pr-2")}
                  >
                    {it.label}
                    <Chevron className={cx("text-mute transition-transform duration-300", EASE, open === i ? "-rotate-90" : "rotate-90")} />
                  </button>
                ) : (
                  <a href={it.href} className={trigger} onPointerEnter={() => openRef.current !== null && show(null)}>
                    {it.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          {docs && (
            <div
              className={cx(
                "hidden overflow-hidden transition-[max-width,opacity] duration-500 @min-[680px]:block",
                EASE,
                scrolled ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100",
              )}
              aria-hidden={scrolled || undefined}
            >
              <Button href={docs.href} variant="ghost" size="sm" shape="pill" tabIndex={scrolled ? -1 : undefined}>
                {docs.label}
              </Button>
            </div>
          )}
          <Button href={cta.href} size="sm" shape="pill" iconRight={<Chevron />} nudge>
            {cta.label}
          </Button>
          <button
            type="button"
            aria-label={sheet ? "Close menu" : "Open menu"}
            aria-expanded={sheet}
            aria-controls="kit-nav-sheet"
            onClick={() => setSheet((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md outline-none transition-colors hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50 @min-[560px]:hidden"
          >
            <span className={cx("absolute h-[1.5px] w-4 rounded-full bg-ink transition-transform duration-500", EASE, sheet ? "rotate-45" : "-translate-y-[3.5px]")} />
            <span className={cx("absolute h-[1.5px] w-4 rounded-full bg-ink transition-transform duration-500", EASE, sheet ? "-rotate-45" : "translate-y-[3.5px]")} />
          </button>
        </div>

        {/* Shared panel: one surface that morphs between menus. */}
        <div
          id="kit-nav-panel"
          onPointerEnter={stay}
          onPointerLeave={leave}
          className={cx(
            "absolute left-1/2 top-[calc(100%-2px)] hidden -translate-x-1/2 @min-[560px]:block",
            open === null && "pointer-events-none",
          )}
        >
          <div
            className={cx(
              "overflow-hidden rounded-xl bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_16px_40px_-12px_rgb(0_0_0/0.22)] transition-[width,height,opacity,transform] duration-300",
              EASE,
              open === null ? "-translate-y-1 scale-[.98] opacity-0" : "opacity-100",
            )}
            style={{ width: size.w || undefined, height: size.h || undefined }}
          >
            {menu && (
              <div
                key={shown}
                ref={content}
                className="w-max"
                style={
                  {
                    "--kit-dir": dir,
                    width: `min(${menu.width ?? 560}px, calc(100cqw - 24px))`,
                    animation: slide ? "kit-nav-in .38s cubic-bezier(.16,1,.3,1) both" : undefined,
                  } as React.CSSProperties
                }
              >
                <Panel menu={menu} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        id="kit-nav-sheet"
        hidden={!sheet}
        className="kit-nav-motion absolute inset-x-0 top-full max-h-[calc(100svh-3.5rem)] overflow-y-auto overscroll-contain bg-paper px-3 pb-6 pt-2 @min-[560px]:hidden"
        style={{ animation: sheet ? "kit-nav-pop .4s cubic-bezier(.16,1,.3,1) both" : undefined }}
      >
        <ul className="flex flex-col">
          {items.map((it, i) => (
            <li key={it.label}>
              {it.menu ? (
                <>
                  <button
                    type="button"
                    aria-expanded={section === i}
                    onClick={() => setSection(section === i ? null : i)}
                    className="flex h-12 w-full items-center justify-between rounded-[10px] px-3 text-[15px] font-medium text-ink outline-none focus-visible:bg-paper-2"
                  >
                    {it.label}
                    <Chevron className={cx("text-mute transition-transform duration-300", EASE, section === i ? "-rotate-90" : "rotate-90")} />
                  </button>
                  <div className={cx("grid transition-[grid-template-rows] duration-500", EASE, section === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-0.5 pb-2 pl-2">
                        {flat(it.menu).map((l) => (
                          <a key={l.title} href={l.href} tabIndex={section === i ? undefined : -1} className="flex items-center gap-3 rounded-lg px-3 py-2 outline-none hover:bg-paper-2 focus-visible:bg-paper-2">
                            {l.icon && <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink [&_svg]:h-3.5 [&_svg]:w-3.5")}>{l.icon}</span>}
                            <span className="flex flex-col">
                              <span className="text-[14px] text-ink">{l.title}</span>
                              {l.description && <span className="text-[12px] leading-snug text-mute">{l.description}</span>}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <a href={it.href} className="flex h-12 items-center rounded-[10px] px-3 text-[15px] font-medium text-ink outline-none focus-visible:bg-paper-2">
                  {it.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2 px-1">
          {docs && (
            <Button href={docs.href} variant="outline" shape="pill" className="w-full">
              {docs.label}
            </Button>
          )}
          <Button href={cta.href} shape="pill" className="w-full">
            {cta.label}
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
