"use client";

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type DocsNavbarIcon = "rocket" | "download" | "palette" | "token" | "layers" | "access" | "form" | "overlay" | "compass" | "table" | "bell" | "layout";

export interface DocsNavbarTile {
  title: string;
  description?: string;
  href: string;
  icon?: DocsNavbarIcon;
  /** Small count or tag shown on grid tiles, e.g. "12". */
  meta?: string;
}
export type DocsNavbarMenu =
  /** A three-column grid of tiles. */
  | { type: "grid"; items: DocsNavbarTile[] }
  /** Columns of icon rows plus one dark card for the newest release. */
  | { type: "columns"; columns: { heading: string; items: DocsNavbarTile[] }[]; cta: { eyebrow: string; title: string; label: string; href: string } };

export interface DocsNavbarSection {
  label: string;
  href?: string;
  /** Opens a mega menu instead of linking. */
  menu?: DocsNavbarMenu;
  /** Small dot next to the label, e.g. for a fresh changelog. */
  fresh?: boolean;
}

export interface DocsNavbarProps {
  /** Listen for ⌘K / Ctrl K. Turn off when the page already has its own shortcut. Default true. */
  shortcut?: boolean;
  brand?: ReactNode;
  brandHref?: string;
  sections?: DocsNavbarSection[];
  /** Index of the current section. Uncontrolled: clicking a plain tab moves it. */
  defaultSection?: number;
  /** Called when a plain tab is clicked. Call `event.preventDefault()` to stay on the page. */
  onNavigate?: (index: number, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Newest first. The first one gets the "Latest" badge. */
  versions?: string[];
  /** Release date per version, shown in the version menu. */
  versionDates?: Record<string, string>;
  defaultVersion?: string;
  onVersionChange?: (version: string) => void;
  /** Opens your search dialog. Also runs on ⌘K / Ctrl K. */
  onSearch?: () => void;
  /** Link to the source repository. */
  repoHref?: string;
  /** Small label next to the repo icon, e.g. a star count. */
  repoLabel?: string;
  /** Label of a menu to open once, shortly after mount, to show it is there. */
  openOnMount?: string;
  className?: string;
}

const EASE = "cubic-bezier(.16,1,.3,1)";
const TW_EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-brand/50";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const ELEVATED = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_16px_36px_-12px_rgb(0_0_0/0.22)]";
const HATCH = "bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--color-ink)_4%,transparent)_0_1px,transparent_1px_7px)]";

const CSS = `
@keyframes aui-013-rise { from { opacity: 0; transform: translateY(6px); } }
@keyframes aui-013-pop { from { opacity: 0; transform: translateY(-6px) scale(.97); } }
@keyframes aui-013-up { from { opacity: 0; transform: translateY(100%); } }
@keyframes aui-013-down { from { opacity: 0; transform: translateY(-100%); } }
@keyframes aui-013-vp-in { from { opacity: 0; transform: translateY(-4px) scale(.96); } }
@keyframes aui-013-vp-out { to { opacity: 0; transform: translateY(-4px) scale(.96); } }
@keyframes aui-013-from-l { from { opacity: 0; transform: translateX(-28px); } }
@keyframes aui-013-from-r { from { opacity: 0; transform: translateX(28px); } }
@keyframes aui-013-to-l { to { opacity: 0; transform: translateX(-28px); } }
@keyframes aui-013-to-r { to { opacity: 0; transform: translateX(28px); } }
.aui-013-in { animation: aui-013-rise .55s ${EASE} both; animation-delay: calc(var(--i, 0) * 50ms); }
.aui-013-pop { animation: aui-013-pop .3s ${EASE} both; transform-origin: top right; }
.aui-013-up { animation: aui-013-up .5s ${EASE} both; }
.aui-013-down { animation: aui-013-down .5s ${EASE} both; }
.aui-013-vp { transform-origin: top center; }
.aui-013-vp[data-state=open] { animation: aui-013-vp-in .26s ${EASE}; }
.aui-013-vp[data-state=closed] { animation: aui-013-vp-out .16s cubic-bezier(.16,1,.3,1) forwards; }
.aui-013-c[data-motion=from-start] { animation: aui-013-from-l .3s ${EASE}; }
.aui-013-c[data-motion=from-end] { animation: aui-013-from-r .3s ${EASE}; }
.aui-013-c[data-motion=to-start] { animation: aui-013-to-l .3s ${EASE} forwards; }
.aui-013-c[data-motion=to-end] { animation: aui-013-to-r .3s ${EASE} forwards; }
.aui-013-t { animation: aui-013-rise .45s ${EASE} both; animation-delay: calc(40ms + var(--i, 0) * 40ms); }
@media (prefers-reduced-motion: reduce) { .aui-013-m, .aui-013-m * { animation: none !important; transition-duration: 0s !important; } .aui-013-vp[data-state=closed] { visibility: hidden; } }
`;

const isMac = () => typeof navigator === "undefined" || /Mac|iPhone|iPad/.test(navigator.platform);
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const at = (n: number) => ({ "--i": n }) as CSSProperties;

const PATHS: Record<DocsNavbarIcon, string> = {
  rocket: "M9.5 2.5c2.5 0 4 1.5 4 4L9 11 5 7ZM5 7 2.5 7.5 4.5 5.5M9 11l-.5 2.5 2-2M5.5 10.5 3 13",
  download: "M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10",
  palette: "M8 13.5a5.5 5.5 0 1 1 5.5-5.5c0 1.5-1.2 2-2.5 2H9.5a1 1 0 0 0-.7 1.7c.5.6.1 1.8-.8 1.8ZM5 7.5h.01M7.5 5h.01M10.5 6h.01",
  token: "M8 2.5 13.5 5.5v5L8 13.5 2.5 10.5v-5ZM8 8v5.5M8 8l5.5-2.5M8 8 2.5 5.5",
  layers: "M8 2.5 13.5 5.5 8 8.5 2.5 5.5ZM2.5 8.5 8 11.5l5.5-3M2.5 11 8 14l5.5-3",
  access: "M8 4.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM3 6l5 1 5-1M8 7v3l-2 4M8 10l2 4",
  form: "M2.5 4h11v3h-11ZM2.5 9.5h7v3h-7ZM11.5 11h2",
  overlay: "M2.5 3.5h8v7h-8ZM5.5 6.5h8v7h-8Z",
  compass: "M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM10.5 5.5 9 9l-3.5 1.5L7 7Z",
  table: "M2.5 3.5h11v9h-11ZM2.5 6.5h11M2.5 9.5h11M6.5 6.5v6",
  bell: "M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1.5H3l1-1.5ZM6.5 14a1.6 1.6 0 0 0 3 0",
  layout: "M2.5 3h11v10h-11ZM2.5 6h11M6 6v7",
};

const Glyph = ({ name }: { name: DocsNavbarIcon }) => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={PATHS[name]} />
  </svg>
);
const Badge = ({ icon, size = "h-7 w-7" }: { icon: DocsNavbarIcon; size?: string }) => (
  <span className={cx("grid shrink-0 place-items-center rounded-[7px] bg-paper text-brand shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_2px_7px_rgb(0_0_0/0.05)]", size)}>
    <Glyph name={icon} />
  </span>
);

const Logo = () => (
  <>
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path d="M10 2 17 6v8l-7 4-7-4V6Z" fill="currentColor" />
      <path d="M10 6.5 13.5 8.5v3L10 13.5 6.5 11.5v-3Z" fill="var(--color-brand)" />
    </svg>
    <span>Astabyte</span>
    <span className="font-normal text-mute">/</span>
    <span className="font-medium text-ink-2">Docs</span>
  </>
);

const SECTIONS: DocsNavbarSection[] = [
  {
    label: "Guides",
    menu: {
      type: "columns",
      columns: [
        {
          heading: "Getting started",
          items: [
            { title: "Introduction", description: "What Astabyte UI is for", href: "#", icon: "rocket" },
            { title: "Installation", description: "One package, no config", href: "#", icon: "download" },
            { title: "Theming", description: "Swap tokens per page", href: "#", icon: "palette" },
          ],
        },
        {
          heading: "Core concepts",
          items: [
            { title: "Tokens", description: "Colour, type and space", href: "#", icon: "token" },
            { title: "Composition", description: "Slots over props", href: "#", icon: "layers" },
            { title: "Accessibility", description: "What we test, and how", href: "#", icon: "access" },
          ],
        },
      ],
      cta: { eyebrow: "v3.2 · Nov 2026", title: "Tokens renamed, one command to migrate", label: "Read the release", href: "#" },
    },
  },
  {
    label: "Components",
    menu: {
      type: "grid",
      items: [
        { title: "Forms", description: "Input, select, combobox", href: "#", icon: "form", meta: "14" },
        { title: "Overlays", description: "Dialog, popover, sheet", href: "#", icon: "overlay", meta: "8" },
        { title: "Navigation", description: "Tabs, menu, breadcrumb", href: "#", icon: "compass", meta: "9" },
        { title: "Data display", description: "Table, list, stat", href: "#", icon: "table", meta: "11" },
        { title: "Feedback", description: "Toast, alert, progress", href: "#", icon: "bell", meta: "6" },
        { title: "Layout", description: "Stack, grid, container", href: "#", icon: "layout", meta: "5" },
      ],
    },
  },
  { label: "API", href: "#" },
  { label: "Changelog", href: "#", fresh: true },
];
const DATES: Record<string, string> = { "v3.2": "Nov 2026", "v3.1": "Aug 2026", "v2.9": "Mar 2026" };

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" />
  </svg>
);
/** Generic source-repository glyph (a branch), not a brand logo. */
const RepoIcon = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="4.5" cy="3.5" r="1.6" />
    <circle cx="4.5" cy="12.5" r="1.6" />
    <circle cx="11.5" cy="5.5" r="1.6" />
    <path d="M4.5 5.1v5.8M11.5 7.1c0 2.4-2 3-4.5 3.3-1.4.2-2.5.7-2.5 1.6" />
  </svg>
);
const Chevron = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 4 4 4-4 4" />
  </svg>
);

/** The version text rolls up (newer) or down (older) when it changes. */
function Rolling({ value, dir }: { value: string; dir: 1 | -1 }) {
  return (
    <span className="relative inline-flex h-[1.25em] overflow-hidden">
      <span key={value} className={cx("inline-block leading-[1.25em]", dir > 0 ? "aui-013-up" : "aui-013-down")}>
        {value}
      </span>
    </span>
  );
}

function VersionMenu({ versions, dates, value, onChange, align = "right" }: { versions: string[]; dates: Record<string, string>; value: string; onChange: (v: string) => void; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useCallback((focus: boolean) => {
    setOpen(false);
    if (focus) trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    const down = (e: PointerEvent) => !root.current?.contains(e.target as Node) && close(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open, close]);

  const choose = (v: string) => {
    if (v !== value) setDir(versions.indexOf(v) < versions.indexOf(value) ? 1 : -1);
    onChange(v);
    close(true);
  };
  const keys = (e: ReactKeyboardEvent<HTMLElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]'));
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") close(false);
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={`Version ${value}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cx("group/v flex h-8 items-center gap-1 rounded-lg pl-2.5 pr-1.5 font-mono text-[12px] text-ink transition-colors hover:bg-paper-2 aria-expanded:bg-paper-2", RING, FOCUS)}
      >
        <Rolling value={value} dir={dir} />
        <Chevron className={cx("rotate-90 text-mute transition-transform duration-300 group-aria-expanded/v:-rotate-90", TW_EASE)} />
      </button>
      {open && (
        <ul id={id} role="listbox" aria-label="Version" onKeyDown={keys} className={cx("aui-013-pop absolute top-[calc(100%+6px)] z-50 w-[200px] rounded-[8px] bg-paper p-1.5", ELEVATED, align === "right" ? "right-0" : "left-0")}>
          {versions.map((v, n) => (
            <li
              key={v}
              role="option"
              tabIndex={-1}
              aria-selected={v === value}
              onClick={() => choose(v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  choose(v);
                }
              }}
              className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-[13px] text-ink outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2"
            >
              <span className={cx("h-1.5 w-1.5 rounded-full", v === value ? "bg-brand" : "bg-transparent")} />
              <span className="font-mono text-[12.5px]">{v}</span>
              {n === 0 && <span className="rounded-[4px] bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] px-1.5 text-[10.5px] font-medium leading-[18px] text-brand">Latest</span>}
              <span className="ml-auto text-[11.5px] text-mute">{dates[v]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const tile = cx(
  "group/t relative flex flex-col overflow-hidden rounded-[6px] p-3.5 transition-[opacity,box-shadow] duration-300",
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_7%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_15%,transparent)]",
  "group-has-[a:hover]/m:opacity-65 hover:!opacity-100",
  FOCUS,
);

function Panel({ menu }: { menu: DocsNavbarMenu }) {
  if (menu.type === "grid")
    return (
      <div className="group/m grid w-[min(600px,calc(100cqw-24px))] grid-cols-3 gap-2 p-2">
        {menu.items.map((it, n) => (
          <Fragment key={it.title}>
            <a href={it.href} style={at(n)} className={cx(tile, HATCH, "aui-013-t h-[112px] justify-between")}>
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-40% to-[color-mix(in_srgb,var(--color-brand)_8%,transparent)] opacity-0 transition-opacity duration-500 group-hover/t:opacity-100" />
              <span className="relative flex items-start justify-between">
                {it.icon && <Badge icon={it.icon} />}
                {it.meta && <span className="font-mono text-[11px] tabular-nums text-mute">{it.meta}</span>}
              </span>
              <span className="relative">
                <span className="flex items-center gap-1 text-[14px] font-medium text-ink">
                  {it.title}
                  <Chevron className={cx("-translate-x-0.5 text-mute transition-[translate,color] duration-300 group-hover/t:translate-x-0 group-hover/t:text-ink", TW_EASE)} />
                </span>
                {it.description && <span className="mt-0.5 block text-[12px] text-mute">{it.description}</span>}
              </span>
            </a>
          </Fragment>
        ))}
      </div>
    );
  return (
    <div className="group/m grid w-[min(620px,calc(100cqw-24px))] grid-cols-[1fr_1fr_180px] gap-2 p-2">
      {menu.columns.map((c, ci) => (
        <div key={c.heading} className="flex min-w-0 flex-col gap-0.5 pt-1.5">
          <span className="mb-1 px-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">{c.heading}</span>
          {c.items.map((it, n) => (
            <Fragment key={it.title}>
              <a
                href={it.href}
                style={at(ci * 3 + n)}
                className={cx(
                  "aui-013-t flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 transition-[background-color,opacity] duration-200 hover:bg-paper-2 group-has-[a:hover]/m:opacity-65 hover:!opacity-100",
                  FOCUS,
                )}
              >
                {it.icon && <Badge icon={it.icon} />}
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13.5px] font-medium leading-tight text-ink">{it.title}</span>
                  {it.description && <span className="truncate text-[12px] leading-snug text-mute">{it.description}</span>}
                </span>
              </a>
            </Fragment>
          ))}
        </div>
      ))}
      <Fragment>
        <a
          href={menu.cta.href}
          style={at(6)}
          className={cx(
            "aui-013-t group/t relative flex min-h-[176px] flex-col justify-between overflow-hidden rounded-[6px] bg-ink p-4 text-paper transition-opacity duration-300 group-has-[a:hover]/m:opacity-75 hover:!opacity-100",
            FOCUS,
          )}
        >
          <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand">{menu.cta.eyebrow}</span>
          <pre aria-hidden className={cx("absolute right-3 top-9 font-mono text-[10px] leading-[1.6] text-paper/30 transition-transform duration-700 group-hover/t:-translate-y-1", TW_EASE)}>
            {"- color.fg\n+ ink\n- color.bg\n+ paper"}
          </pre>
          <span className="relative">
            <span className="block text-[14.5px] font-medium leading-tight tracking-[-0.02em]">{menu.cta.title}</span>
            <span className="mt-3 flex items-center gap-1 text-[13px] font-medium">
              {menu.cta.label}
              <Chevron className={cx("transition-transform duration-300 group-hover/t:translate-x-0.5", TW_EASE)} />
            </span>
          </span>
        </a>
      </Fragment>
    </div>
  );
}

const flat = (m: DocsNavbarMenu): DocsNavbarTile[] => (m.type === "grid" ? m.items : m.columns.flatMap((c) => c.items));

type MegaState = { value: string; last: string; dir: "from-start" | "from-end" | "" };

/**
 * Mega menu state: hover opens (with a short close delay), click/Enter/Space toggles, Escape closes and returns focus,
 * outside pointerdown or focus leaving closes. One shared panel morphs its size between menus.
 */
function useMega(
  labels: string[],
  root: RefObject<HTMLElement | null>,
  openOnMount?: string,
  delay = 700,
) {
  const [m, setM] = useState<MegaState>({ value: "", last: "", dir: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverAt = useRef(0);
  const current = useRef("");
  const wasOpen = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());

  const open = (v: string) => {
    clearTimeout(timer.current);
    setM((p) => (p.value === v ? p : { value: v, last: v, dir: p.value ? (labels.indexOf(v) > labels.indexOf(p.value) ? "from-end" : "from-start") : "" }));
  };
  const close = useCallback((focus = false) => {
    clearTimeout(timer.current);
    if (focus) triggers.current.get(current.current)?.focus();
    setM((p) => (p.value ? { ...p, value: "", dir: "" } : p));
  }, []);
  const later = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => close(), 150);
  };
  const cancel = () => clearTimeout(timer.current);

  useEffect(() => {
    current.current = m.value;
    if (!m.value) return;
    const down = (e: PointerEvent) => !root.current?.contains(e.target as Node) && close();
    const key = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    const focus = (e: FocusEvent) => !root.current?.contains(e.target as Node) && close();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    document.addEventListener("focusin", focus);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
      document.removeEventListener("focusin", focus);
    };
  }, [m.value, root, close]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!openOnMount) return;
    const t = setTimeout(() => setM({ value: openOnMount, last: openOnMount, dir: "" }), delay);
    return () => clearTimeout(t);
  }, [openOnMount, delay]);

  // Size the shared panel to the open menu; the CSS transition morphs between menus.
  useLayoutEffect(() => {
    const box = panelRef.current;
    const el = innerRef.current?.firstElementChild as HTMLElement | null | undefined;
    if (!box || !el || !m.value) {
      wasOpen.current = false;
      return;
    }
    const fit = (instant: boolean) => {
      if (instant) box.style.transition = "none";
      box.style.width = `${el.offsetWidth}px`;
      box.style.height = `${el.offsetHeight}px`;
      if (instant) {
        void box.offsetWidth;
        box.style.transition = "";
      }
    };
    fit(!wasOpen.current);
    wasOpen.current = true;
    const ro = new ResizeObserver(() => fit(true));
    ro.observe(el);
    return () => ro.disconnect();
  }, [m.value]);

  const register = (label: string) => (el: HTMLButtonElement | null) => {
    if (el) triggers.current.set(label, el);
    else triggers.current.delete(label);
  };
  const enter = (label: string, mouse: boolean) => {
    if (!mouse) return;
    if (current.current !== label) hoverAt.current = Date.now();
    open(label);
  };
  // A click right after hover-open keeps it open instead of toggling it shut.
  const click = (label: string) => (m.value === label && Date.now() - hoverAt.current > 400 ? close() : open(label));
  const focusFirst = () => requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a")?.focus());
  const triggerKeys = (label: string, e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey && m.value === label)) {
      e.preventDefault();
      open(label);
      focusFirst();
    }
  };
  const panelKeys = (e: { key: string; shiftKey: boolean; target: EventTarget; preventDefault: () => void }) => {
    const first = panelRef.current?.querySelector("a");
    if (e.key === "Tab" && e.shiftKey && e.target === first) {
      e.preventDefault();
      triggers.current.get(current.current)?.focus();
    }
  };
  const ended = (e: { target: EventTarget; currentTarget: EventTarget }) => {
    if (e.target === e.currentTarget) setM((p) => (p.value ? p : { ...p, last: "" }));
  };
  return { m, panelRef, innerRef, close, later, cancel, register, enter, click, triggerKeys, panelKeys, ended };
}

/**
 * aui-013 · Compact docs header whose signature is the version switch: pick a release and the label rolls up or down
 * to it. Section tabs share one brand underline that glides between them, and two of them open mega menus.
 */
export function DocsNavbar({
  shortcut = true,
  brand = <Logo />,
  brandHref = "/",
  sections = SECTIONS,
  defaultSection = 0,
  onNavigate,
  versions = ["v3.2", "v3.1", "v2.9"],
  versionDates = DATES,
  defaultVersion,
  onVersionChange,
  onSearch,
  repoHref = "#",
  repoLabel = "12.4k",
  openOnMount,
  className,
}: DocsNavbarProps) {
  const [active, setActive] = useState(defaultSection);
  const [hover, setHover] = useState<number | null>(null);
  const [version, setVersion] = useState(defaultVersion ?? versions[0] ?? "");
  const [sheet, setSheet] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const [mac] = useState(isMac);
  const root = useRef<HTMLElement>(null);
  const { panelRef: megaPanel, innerRef: megaInner, ...mega } = useMega(sections.map((x) => x.label), root, openOnMount, 700);
  const value = mega.m.value;
  const lastMenu = sections.find((x) => x.label === mega.m.last)?.menu;
  const row = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const anim = useRef<Animation | null>(null);
  const openIndex = sections.findIndex((s) => s.label === value);
  const target = hover ?? (openIndex >= 0 ? openIndex : active);
  const targetRef = useRef(target);
  const ids = useId();

  /** Glide from wherever the underline is right now, so interruptions never jump. */
  const place = useCallback((animate: boolean) => {
    const r = row.current;
    const el = mark.current;
    if (!r || !el) return;
    const a = r.querySelectorAll<HTMLElement>("[data-glide]")[targetRef.current];
    if (!a || a.offsetWidth === 0) {
      el.style.opacity = "0";
      return;
    }
    const rr = r.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    const to = { x: ar.left - rr.left + 10, w: ar.width - 20 };
    let from: typeof to | null = null;
    if (el.style.opacity === "1") {
      const m = el.getBoundingClientRect();
      from = { x: m.left - rr.left, w: m.width };
    }
    anim.current?.cancel();
    el.style.width = `${to.w}px`;
    el.style.transform = `translateX(${to.x}px)`;
    el.style.opacity = "1";
    if (!animate || !from || from.w === 0 || reduced()) return;
    anim.current = el.animate([{ transform: `translateX(${from.x}px) scaleX(${from.w / to.w})` }, { transform: `translateX(${to.x}px) scaleX(1)` }], { duration: 480, easing: EASE });
  }, []);

  useLayoutEffect(() => {
    targetRef.current = target;
    place(true);
  }, [target, place]);

  useEffect(() => {
    const r = row.current;
    if (!r) return;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(r);
    return () => ro.disconnect();
  }, [place]);

  useEffect(() => () => anim.current?.cancel(), []);


  // ⌘K / Ctrl K opens search.
  useEffect(() => {
    if (!onSearch || !shortcut) return;
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSearch();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onSearch, shortcut]);

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

  const go = (n: number, e: MouseEvent<HTMLAnchorElement>) => {
    setActive(n);
    onNavigate?.(n, e);
  };
  const pickVersion = (v: string) => {
    setVersion(v);
    onVersionChange?.(v);
  };
  const pill = (on: boolean) =>
    cx(
      "group/p flex h-8 items-center gap-1 rounded-lg px-2.5 text-[14px] font-medium transition-colors duration-200 hover:bg-paper-2 hover:text-ink aria-expanded:bg-paper-2 aria-expanded:text-ink",
      FOCUS,
      on ? "text-ink" : "text-ink/70",
    );

  return (
    <header ref={root} className={cx("aui-013-m @container sticky top-0 z-30 w-full bg-paper shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_9%,transparent)]", className)}>
      <style href="asta-navbar-aui-013" precedence="asta">
        {CSS}
      </style>
      <div ref={row} className="relative mx-auto flex h-14 max-w-[1120px] items-center gap-4 px-4">
        <a href={brandHref} style={at(0)} className={cx("aui-013-in flex shrink-0 items-center gap-1.5 rounded-md text-[15px] font-semibold tracking-[-0.02em] text-ink", FOCUS)}>
          {brand}
        </a>

        <nav aria-label="Sections" className="hidden @min-[640px]:block">
          <ul className="flex items-center gap-px" onPointerLeave={() => setHover(null)}>
            {sections.map((s, n) => (
              <li key={s.label} className="aui-013-in" style={at(n + 1)} onPointerEnter={() => setHover(n)}>
                {s.menu ? (
                  <>
                    <button
            ref={mega.register(s.label)}
            type="button"
            aria-expanded={value === s.label}
            aria-controls={`${ids}-m${n}`}
            onPointerEnter={(e) => mega.enter(s.label, e.pointerType === "mouse")}
            onPointerLeave={(e) => e.pointerType === "mouse" && mega.later()}
            onClick={() => mega.click(s.label)}
            onKeyDown={(e) => mega.triggerKeys(s.label, e)}
            data-glide className={cx(pill(n === active), "pr-2")}>
                      {s.label}
                      <Chevron className={cx("rotate-90 text-mute transition-transform duration-300 group-aria-expanded/p:-rotate-90", TW_EASE)} />
                    </button>
                  </>
                ) : (
                  <a href={s.href} data-glide aria-current={n === active ? "page" : undefined} onClick={(e) => go(n, e)} className={pill(n === active)}>
                      {s.label}
                      {s.fresh && <span aria-label="new" className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="pointer-events-none absolute inset-x-0 top-full z-40 hidden justify-center pt-1.5 @min-[640px]:flex">
          {mega.m.last && (
            <div
              ref={megaPanel}
              data-state={value ? "open" : "closed"}
              onPointerEnter={mega.cancel}
              onPointerLeave={(e) => e.pointerType === "mouse" && mega.later()}
              onClick={(e) => (e.target as HTMLElement).closest("a") && mega.close()}
              onKeyDown={mega.panelKeys}
              onAnimationEnd={mega.ended}
              className={cx("aui-013-vp pointer-events-auto relative overflow-hidden rounded-[8px] bg-paper",
              ELEVATED,
              "transition-[width,height] duration-300 data-[state=closed]:pointer-events-none",
              TW_EASE,)}
            >
              <div key={mega.m.last} ref={megaInner} id={`${ids}-m${sections.findIndex((x) => x.label === mega.m.last)}`} data-motion={mega.m.dir || undefined} className="aui-013-c absolute left-0 top-0">
                {lastMenu && <Panel menu={lastMenu} />}
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Search docs"
            style={at(sections.length + 1)}
            className={cx(
              "aui-013-in group/s flex h-8 items-center gap-2 rounded-lg text-mute transition-colors duration-200 hover:bg-paper-2 hover:text-ink",
              "w-8 justify-center @min-[920px]:w-44 @min-[920px]:justify-start @min-[920px]:bg-paper-2 @min-[920px]:px-2.5",
              FOCUS,
            )}
          >
            <span className={cx("transition-transform duration-300 group-hover/s:scale-110", TW_EASE)}>
              <SearchIcon />
            </span>
            <span className="hidden text-[13px] @min-[920px]:inline">Search…</span>
            <kbd className={cx("ml-auto hidden rounded-[5px] bg-paper px-1.5 py-0.5 font-sans text-[11px] text-mute @min-[920px]:inline", RING)}>{mac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <div className="aui-013-in hidden @min-[640px]:block" style={at(sections.length + 2)}>
            <VersionMenu versions={versions} dates={versionDates} value={version} onChange={pickVersion} />
          </div>
          <a
            href={repoHref}
            aria-label={repoLabel ? `Source repository, ${repoLabel} stars` : "Source repository"}
            style={at(sections.length + 3)}
            className={cx("aui-013-in hidden h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink/70 transition-colors hover:bg-paper-2 hover:text-ink @min-[780px]:flex", FOCUS)}
          >
            <RepoIcon />
            {repoLabel && <span className="tabular-nums">{repoLabel}</span>}
          </a>
          <button
            ref={burger}
            type="button"
            aria-label={sheet ? "Close menu" : "Open menu"}
            aria-expanded={sheet}
            aria-controls={`${ids}-sheet`}
            onClick={() => setSheet((v) => !v)}
            className={cx("relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-paper-2 @min-[640px]:hidden", FOCUS)}
          >
            <span className={cx("absolute h-[1.5px] w-4 rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "rotate-45" : "-translate-y-[3.5px]")} />
            <span className={cx("absolute h-[1.5px] w-4 rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "-rotate-45" : "translate-y-[3.5px]")} />
          </button>
        </div>

        <span ref={mark} aria-hidden style={{ opacity: 0 }} className="pointer-events-none absolute -bottom-px left-0 hidden h-[2px] origin-left rounded-full bg-brand transition-opacity duration-300 @min-[640px]:block" />
      </div>

      {sheet && (
        <nav id={`${ids}-sheet`} aria-label="Sections" className="aui-013-pop absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto bg-paper pb-4 shadow-[0_24px_40px_-24px_rgb(0_0_0/0.3)] @min-[640px]:hidden">
          {sections.map((s, n) =>
            s.menu ? (
              <div key={s.label} className="aui-013-in shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_7%,transparent)]" style={at(n)}>
                <button
                  type="button"
                  aria-expanded={section === s.label}
                  onClick={() => setSection((x) => (x === s.label ? null : s.label))}
                  className={cx("flex h-12 w-full items-center justify-between px-4 text-[16px] font-medium text-ink", FOCUS)}
                >
                  {s.label}
                  <Chevron className={cx("text-mute transition-transform duration-300", TW_EASE, section === s.label ? "-rotate-90" : "rotate-90")} />
                </button>
                <div className={cx("grid transition-[grid-template-rows] duration-500", TW_EASE, section === s.label ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <ul className="overflow-hidden px-2" inert={section !== s.label || undefined}>
                    {flat(s.menu).map((t) => (
                      <li key={t.title}>
                        <a href={t.href} onClick={() => close(false)} className={cx("flex items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-paper-2", FOCUS)}>
                          {t.icon && <Badge icon={t.icon} />}
                          <span className="flex flex-col">
                            <span className="text-[14px] font-medium text-ink">{t.title}</span>
                            {t.description && <span className="text-[12px] text-mute">{t.description}</span>}
                          </span>
                        </a>
                      </li>
                    ))}
                    <li aria-hidden className="h-2" />
                  </ul>
                </div>
              </div>
            ) : (
              <a
                key={s.label}
                href={s.href}
                aria-current={n === active ? "page" : undefined}
                onClick={(e) => {
                  go(n, e);
                  close(false);
                }}
                style={at(n)}
                className={cx("aui-013-in flex h-12 items-center gap-2 px-4 text-[16px] font-medium text-ink shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_7%,transparent)]", FOCUS)}
              >
                {s.label}
                {s.fresh && <span className="rounded-[4px] bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] px-1.5 text-[10.5px] font-medium leading-[18px] text-brand">New</span>}
              </a>
            ),
          )}
          <div className="aui-013-in mt-4 flex items-center gap-2 px-4" style={at(sections.length)}>
            <VersionMenu versions={versions} dates={versionDates} value={version} onChange={pickVersion} align="left" />
            <a href={repoHref} className={cx("ml-auto flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-ink", RING, FOCUS)}>
              <RepoIcon />
              Source {repoLabel && <span className="text-mute">{repoLabel}</span>}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

export default DocsNavbar;
