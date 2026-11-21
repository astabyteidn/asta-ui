"use client";

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type MinimalNavbarIcon = "map" | "check" | "chart" | "bolt" | "plug" | "book" | "grid" | "play" | "users" | "spark" | "mail";

export interface MinimalNavbarTile {
  title: string;
  description?: string;
  href: string;
  icon?: MinimalNavbarIcon;
}
export type MinimalNavbarMenu =
  /** Two big product tiles with a small preview in the corner, then a row of feature tiles. */
  | { type: "products"; products: (MinimalNavbarTile & { preview: "roadmap" | "issues" })[]; features: MinimalNavbarTile[] }
  /** Columns of icon rows plus one dark call-to-action card. */
  | { type: "columns"; columns: { heading: string; items: MinimalNavbarTile[] }[]; cta: { title: string; description: string; label: string; href: string } };

export interface MinimalNavbarItem {
  label: string;
  /** Plain link. */
  href?: string;
  /** Opens a mega menu instead. */
  menu?: MinimalNavbarMenu;
}

export interface MinimalNavbarProps {
  brand?: ReactNode;
  brandHref?: string;
  items?: MinimalNavbarItem[];
  /** Index of the current page in `items`. The underline rests here. */
  active?: number;
  secondary?: { label: string; href: string };
  cta?: { label: string; href: string };
  /** Label of a menu to open once, shortly after mount, to show it is there. It closes like normal after. */
  openOnMount?: string;
  className?: string;
}

const EASE = "cubic-bezier(.16,1,.3,1)";
const TW_EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-brand/50";
const HAIR = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const HATCH = "bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--color-ink)_4%,transparent)_0_1px,transparent_1px_7px)]";

const CSS = `
@keyframes aui-009-rise { from { opacity: 0; transform: translateY(6px); } }
@keyframes aui-009-vp-in { from { opacity: 0; transform: translateY(-4px) scale(.96); } }
@keyframes aui-009-vp-out { to { opacity: 0; transform: translateY(-4px) scale(.96); } }
@keyframes aui-009-from-l { from { opacity: 0; transform: translateX(-28px); } }
@keyframes aui-009-from-r { from { opacity: 0; transform: translateX(28px); } }
@keyframes aui-009-to-l { to { opacity: 0; transform: translateX(-28px); } }
@keyframes aui-009-to-r { to { opacity: 0; transform: translateX(28px); } }
@keyframes aui-009-drop { from { opacity: 0; transform: translateY(-6px); } }
.aui-009-in { animation: aui-009-rise .55s ${EASE} both; animation-delay: calc(var(--i, 0) * 50ms); }
.aui-009-vp { transform-origin: top center; }
.aui-009-vp[data-state=open] { animation: aui-009-vp-in .26s ${EASE}; }
.aui-009-vp[data-state=closed] { animation: aui-009-vp-out .16s cubic-bezier(.16,1,.3,1) forwards; }
.aui-009-c[data-motion=from-start] { animation: aui-009-from-l .3s ${EASE}; }
.aui-009-c[data-motion=from-end] { animation: aui-009-from-r .3s ${EASE}; }
.aui-009-c[data-motion=to-start] { animation: aui-009-to-l .3s ${EASE} forwards; }
.aui-009-c[data-motion=to-end] { animation: aui-009-to-r .3s ${EASE} forwards; }
.aui-009-t { animation: aui-009-rise .45s ${EASE} both; animation-delay: calc(40ms + var(--i, 0) * 40ms); }
.aui-009-sheet { animation: aui-009-drop .4s ${EASE} both; }
@media (prefers-reduced-motion: reduce) { .aui-009-m, .aui-009-m * { animation: none !important; transition-duration: 0s !important; } .aui-009-vp[data-state=closed] { visibility: hidden; } }
`;

const at = (n: number) => ({ "--i": n }) as CSSProperties;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PATHS: Record<MinimalNavbarIcon, string> = {
  map: "M2.5 4.5 6 3l4 1.5L13.5 3v8.5L10 13l-4-1.5-3.5 1.5ZM6 3v8.5M10 4.5V13",
  check: "M3 8.5 6.5 12 13 4.5",
  chart: "M3 13V8M6.5 13V4M10 13V9.5M13.5 13V6",
  bolt: "M9 2 4 9h4l-1 5 5-7H8Z",
  plug: "M6 2.5v3M10 2.5v3M4.5 5.5h7v2a3.5 3.5 0 0 1-7 0ZM8 11v2.5",
  book: "M3 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 0 7 11.5H3ZM13 3.5H9.5A1.5 1.5 0 0 0 8 5v8a1.5 1.5 0 0 1 1.5-1.5H13Z",
  grid: "M3 3h4v4H3ZM9 3h4v4H9ZM3 9h4v4H3ZM9 9h4v4H9Z",
  play: "M5 3.5v9l7-4.5Z",
  users: "M6 7a2.25 2.25 0 1 0 0-4.5A2.25 2.25 0 0 0 6 7ZM2 13c.4-2.2 2-3.5 4-3.5s3.6 1.3 4 3.5M11 3a2 2 0 0 1 0 4M12 9.6c1.2.4 1.9 1.6 2 3.4",
  spark: "M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M6 10l-2 2",
  mail: "M2.5 4h11v8h-11ZM2.5 4.5 8 9l5.5-4.5",
};

function Glyph({ name }: { name: MinimalNavbarIcon }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

const Badge = ({ icon, size = "h-6 w-6" }: { icon: MinimalNavbarIcon; size?: string }) => (
  <span className={cx("grid shrink-0 place-items-center rounded-[7px] bg-paper text-brand shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_2px_7px_rgb(0_0_0/0.05)]", size)}>
    <Glyph name={icon} />
  </span>
);

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 4 4 4-4 4" />
  </svg>
);

const Logo = () => (
  <>
    <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-ink text-paper">
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 12.5 8 3.5l4 9M5.6 9.2h4.8" />
      </svg>
    </span>
    Astabyte
  </>
);

const ITEMS: MinimalNavbarItem[] = [
  {
    label: "Product",
    menu: {
      type: "products",
      products: [
        { title: "Roadmaps", description: "Plan the quarter in one view and share it with a link.", href: "#", icon: "map", preview: "roadmap" },
        { title: "Issues", description: "Triage, assign and close work from the keyboard.", href: "#", icon: "check", preview: "issues" },
      ],
      features: [
        { title: "Insights", description: "Cycle time and scope, live.", href: "#", icon: "chart" },
        { title: "Automations", description: "Rules that move work for you.", href: "#", icon: "bolt" },
        { title: "Integrations", description: "Git, Slack, Figma and 40 more.", href: "#", icon: "plug" },
      ],
    },
  },
  {
    label: "Resources",
    menu: {
      type: "columns",
      columns: [
        {
          heading: "Learn",
          items: [
            { title: "Guides", description: "From first project to scale", href: "#", icon: "book" },
            { title: "Templates", description: "40 ready-made roadmaps", href: "#", icon: "grid" },
            { title: "Webinars", description: "Live every second Tuesday", href: "#", icon: "play" },
          ],
        },
        {
          heading: "Company",
          items: [
            { title: "Customers", description: "How teams plan with us", href: "#", icon: "users" },
            { title: "Changelog", description: "Shipped this week", href: "#", icon: "spark" },
            { title: "Contact", description: "Talk to a person", href: "#", icon: "mail" },
          ],
        },
      ],
      cta: { title: "Your first roadmap in five minutes", description: "Free for teams up to ten.", label: "Start free", href: "#" },
    },
  },
  { label: "Customers", href: "#" },
  { label: "Pricing", href: "#" },
];

/** Tiny product shot in the corner of a big tile. Grey until the tile is hovered. */
function Peek({ kind }: { kind: "roadmap" | "issues" }) {
  const tone = "bg-[color-mix(in_srgb,var(--color-ink)_22%,transparent)] transition-colors duration-500 group-hover/t:bg-brand";
  return (
    <div
      aria-hidden
      className={cx(
        "absolute -bottom-px -right-px w-[58%] rounded-tl-[10px] bg-paper p-2.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_0_0_4px_var(--color-paper-2)] transition-transform duration-500 group-hover/t:-translate-x-1 group-hover/t:-translate-y-1",
        TW_EASE,
      )}
    >
      {kind === "roadmap" ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-mono text-[8.5px] uppercase tracking-[0.08em] text-mute">
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
          </div>
          {(
            [
              [0, 50, "Billing"],
              [26, 52, "Mobile"],
              [54, 44, "Search"],
            ] as const
          ).map(([l, w, t], i) => (
            <span key={t} className={cx("flex h-3.5 items-center rounded-[4px] px-1.5 text-[8.5px] font-medium text-paper", tone)} style={{ marginLeft: `${l}%`, width: `${w}%`, transitionDelay: `${i * 60}ms` }}>
              {t}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {["Fix invoice rounding", "Dark mode for charts", "SSO for Enterprise"].map((t, i) => (
            <div key={t} className="flex items-center gap-1.5 text-[9.5px] text-ink-2">
              <span className={cx("h-2 w-2 shrink-0 rounded-full", tone)} style={{ transitionDelay: `${i * 60}ms` }} />
              <span className="truncate">{t}</span>
              <span className="ml-auto font-mono text-[8.5px] text-mute">NW-{214 + i}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tile = cx(
  "group/t relative flex flex-col gap-1.5 overflow-hidden rounded-[6px] p-3.5 transition-[opacity,box-shadow] duration-300",
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_7%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_15%,transparent)]",
  "group-has-[a:hover]/m:opacity-65 hover:!opacity-100",
  FOCUS,
);
const Tint = ({ dir = "b" }: { dir?: "b" | "r" }) => (
  <span
    aria-hidden
    className={cx(
      "pointer-events-none absolute inset-0 from-transparent from-40% to-[color-mix(in_srgb,var(--color-brand)_8%,transparent)] opacity-0 transition-opacity duration-500 group-hover/t:opacity-100",
      dir === "b" ? "bg-linear-to-b" : "bg-linear-to-r",
    )}
  />
);
const Nudge = () => <Chevron className={cx("-translate-x-0.5 text-mute transition-[translate,color] duration-300 group-hover/t:translate-x-0 group-hover/t:text-ink", TW_EASE)} />;

function Panel({ menu }: { menu: MinimalNavbarMenu }) {
  if (menu.type === "products")
    return (
      <div className="group/m flex w-[min(660px,calc(100cqw-24px))] flex-col gap-2 p-2">
        <div className="grid grid-cols-2 gap-2">
          {menu.products.map((p, n) => (
            <Fragment key={p.title}>
              <a href={p.href} style={at(n)} className={cx(tile, HATCH, "aui-009-t h-[164px]")}>
                <Tint />
                <span className="relative flex items-center gap-2 text-[14px] font-medium tracking-[-0.01em] text-ink">
                  {p.icon && <Badge icon={p.icon} />}
                  {p.title}
                  <Nudge />
                </span>
                {p.description && <span className="relative max-w-[30ch] text-[12.5px] leading-snug text-mute">{p.description}</span>}
                <Peek kind={p.preview} />
              </a>
            </Fragment>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {menu.features.map((f, n) => (
            <Fragment key={f.title}>
              <a href={f.href} style={at(n + 2)} className={cx(tile, "aui-009-t")}>
                <Tint dir="r" />
                <span className="relative flex items-center gap-2 text-[13.5px] font-medium text-ink">
                  {f.icon && <Badge icon={f.icon} />}
                  {f.title}
                  <Nudge />
                </span>
                {f.description && <span className="relative text-[12px] leading-snug text-mute">{f.description}</span>}
              </a>
            </Fragment>
          ))}
        </div>
      </div>
    );
  return (
    <div className="group/m grid w-[min(640px,calc(100cqw-24px))] grid-cols-[1fr_1fr_190px] items-stretch gap-2 p-2">
      {menu.columns.map((c, ci) => (
        <div key={c.heading} className="flex min-w-0 flex-col gap-0.5 pt-1.5">
          <span className="mb-1 px-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">{c.heading}</span>
          {c.items.map((it, n) => (
            <Fragment key={it.title}>
              <a
                href={it.href}
                style={at(ci * 3 + n)}
                className={cx(
                  "aui-009-t group/t flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 transition-[background-color,opacity] duration-200 hover:bg-paper-2 group-has-[a:hover]/m:opacity-65 hover:!opacity-100",
                  FOCUS,
                )}
              >
                {it.icon && <Badge icon={it.icon} size="h-7 w-7" />}
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
            "aui-009-t group/t relative flex min-h-[188px] flex-col justify-between overflow-hidden rounded-[6px] bg-ink p-4 text-paper transition-opacity duration-300 group-has-[a:hover]/m:opacity-75 hover:!opacity-100",
            FOCUS,
          )}
        >
          <span aria-hidden className={cx("absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_75%,transparent),transparent)] transition-transform duration-700 group-hover/t:scale-125", TW_EASE)} />
          <span className="relative h-2 w-2 rounded-full bg-brand" />
          <span className="relative">
            <span className="block text-[15px] font-medium leading-tight tracking-[-0.02em]">{menu.cta.title}</span>
            <span className="mt-1 block text-[12.5px] text-paper/60">{menu.cta.description}</span>
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

const flat = (m: MinimalNavbarMenu): MinimalNavbarTile[] => (m.type === "products" ? [...m.products, ...m.features] : m.columns.flatMap((c) => c.items));

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
 * aui-009 · Compact header whose signature is an elastic underline riding the bar's bottom edge: it stretches to
 * whatever you point at or open, then snaps to size. Menus open in one shared mega-menu panel of tiles.
 */
export function MinimalNavbar({
  brand = <Logo />,
  brandHref = "/",
  items = ITEMS,
  active = 2,
  secondary = { label: "Sign in", href: "#" },
  cta = { label: "Start free", href: "#" },
  openOnMount,
  className,
}: MinimalNavbarProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [sheet, setSheet] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const { panelRef: megaPanel, innerRef: megaInner, ...mega } = useMega(items.map((x) => x.label), root, openOnMount, 700);
  const value = mega.m.value;
  const lastMenu = items.find((x) => x.label === mega.m.last)?.menu;
  const row = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const anim = useRef<Animation | null>(null);
  const openIndex = items.findIndex((it) => it.label === value);
  const target = hover ?? (openIndex >= 0 ? openIndex : active);
  const targetRef = useRef(target);
  const id = useId();

  /** Move the underline. It reads where it is right now, so an interrupted move never jumps. */
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
    if (!animate || !from || from.w === 0 || reduced() || Math.abs(from.x - to.x) < 1) return;
    const t = (b: typeof to) => `translateX(${b.x}px) scaleX(${b.w / to.w})`;
    const left = Math.min(from.x, to.x);
    const span = Math.max(from.x + from.w, to.x + to.w) - left;
    anim.current = el.animate([{ transform: t(from) }, { transform: t({ x: left, w: span }), offset: 0.42 }, { transform: t(to) }], { duration: 600, easing: EASE });
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

  const pill = cx(
    "group/p flex h-8 items-center gap-1 rounded-lg px-2.5 text-[14px] font-medium text-ink/70 transition-colors duration-200 hover:bg-paper-2 hover:text-ink aria-expanded:bg-paper-2 aria-expanded:text-ink",
    FOCUS,
  );

  return (
    <header ref={root} className={cx("aui-009-m @container sticky top-0 z-30 w-full bg-paper shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_9%,transparent)]", className)}>
      <style href="asta-navbar-aui-009" precedence="asta">
        {CSS}
      </style>
      <div ref={row} className="relative mx-auto flex h-14 max-w-[1120px] items-center px-4">
        <div className="flex flex-1 items-center">
          <a href={brandHref} style={at(0)} className={cx("aui-009-in flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-[-0.02em] text-ink", FOCUS)}>
            {brand}
          </a>
        </div>

        <nav aria-label="Main" className="hidden @min-[640px]:block">
          <ul className="flex items-center gap-px" onPointerLeave={() => setHover(null)}>
            {items.map((it, n) => (
              <li key={it.label} className="aui-009-in" style={at(n + 1)} onPointerEnter={() => setHover(n)}>
                {it.menu ? (
                  <>
                    <button
            ref={mega.register(it.label)}
            type="button"
            aria-expanded={value === it.label}
            aria-controls={`${id}-m${n}`}
            onPointerEnter={(e) => mega.enter(it.label, e.pointerType === "mouse")}
            onPointerLeave={(e) => e.pointerType === "mouse" && mega.later()}
            onClick={() => mega.click(it.label)}
            onKeyDown={(e) => mega.triggerKeys(it.label, e)}
            data-glide className={cx(pill, "pr-2")}>
                      {it.label}
                      <Chevron className={cx("rotate-90 text-mute transition-transform duration-300 group-aria-expanded/p:-rotate-90", TW_EASE)} />
                    </button>
                  </>
                ) : (
                  <a href={it.href} data-glide aria-current={n === active ? "page" : undefined} className={cx(pill, n === active && "text-ink")}>
                      {it.label}
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
              className={cx("aui-009-vp pointer-events-auto relative overflow-hidden rounded-[8px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_16px_36px_-12px_rgb(0_0_0/0.22)]",
              "transition-[width,height] duration-300 data-[state=closed]:pointer-events-none",
              TW_EASE,)}
            >
              <div key={mega.m.last} ref={megaInner} id={`${id}-m${items.findIndex((x) => x.label === mega.m.last)}`} data-motion={mega.m.dir || undefined} className="aui-009-c absolute left-0 top-0">
                {lastMenu && <Panel menu={lastMenu} />}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          <a
            href={secondary.href}
            style={at(items.length + 1)}
            className={cx("aui-009-in hidden h-8 items-center rounded-lg px-3 text-[13px] font-medium text-ink/70 transition-colors hover:bg-paper-2 hover:text-ink @min-[760px]:inline-flex", FOCUS)}
          >
            {secondary.label}
          </a>
          <a
            href={cta.href}
            style={at(items.length + 2)}
            className={cx(
              "aui-009-in group/cta inline-flex h-8 items-center gap-1 rounded-lg bg-ink pl-3 pr-2.5 text-[13px] font-medium text-paper transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[.97] focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              TW_EASE,
              FOCUS,
            )}
          >
            {cta.label}
            <Chevron className={cx("transition-transform duration-300 group-hover/cta:translate-x-0.5", TW_EASE)} />
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
            <span className={cx("absolute h-[1.5px] w-4 rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "rotate-45" : "-translate-y-[3.5px]")} />
            <span className={cx("absolute h-[1.5px] w-4 rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "-rotate-45" : "translate-y-[3.5px]")} />
          </button>
        </div>

        <span ref={mark} aria-hidden style={{ opacity: 0 }} className="pointer-events-none absolute -bottom-px left-0 hidden h-[2px] origin-left rounded-full bg-ink transition-opacity duration-300 @min-[640px]:block" />
      </div>

      {sheet && (
        <nav id={id} aria-label="Main" className="aui-009-sheet absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto bg-paper pb-4 shadow-[0_24px_40px_-24px_rgb(0_0_0/0.3)] @min-[640px]:hidden">
          {items.map((it, n) =>
            it.menu ? (
              <div key={it.label} className="aui-009-in shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_7%,transparent)]" style={at(n)}>
                <button
                  type="button"
                  aria-expanded={section === it.label}
                  onClick={() => setSection((s) => (s === it.label ? null : it.label))}
                  className={cx("flex h-12 w-full items-center justify-between px-4 text-[16px] font-medium text-ink", FOCUS)}
                >
                  {it.label}
                  <Chevron className={cx("text-mute transition-transform duration-300", TW_EASE, section === it.label ? "-rotate-90" : "rotate-90")} />
                </button>
                <div className={cx("grid transition-[grid-template-rows] duration-500", TW_EASE, section === it.label ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <ul className="overflow-hidden px-2" inert={section !== it.label || undefined}>
                    {flat(it.menu).map((t) => (
                      <li key={t.title}>
                        <a href={t.href} onClick={() => close(false)} className={cx("flex items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-paper-2", FOCUS)}>
                          {t.icon && <Badge icon={t.icon} size="h-7 w-7" />}
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
                key={it.label}
                href={it.href}
                onClick={() => close(false)}
                style={at(n)}
                className={cx("aui-009-in flex h-12 items-center justify-between px-4 text-[16px] font-medium text-ink shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_7%,transparent)]", FOCUS)}
              >
                {it.label}
                {n === active && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
              </a>
            ),
          )}
          <div className="aui-009-in mt-4 grid grid-cols-2 gap-2 px-4" style={at(items.length)}>
            <a href={secondary.href} className={cx("flex h-10 items-center justify-center rounded-lg text-[14px] font-medium text-ink", HAIR, FOCUS)}>
              {secondary.label}
            </a>
            <a href={cta.href} className={cx("flex h-10 items-center justify-center rounded-lg bg-ink text-[14px] font-medium text-paper", FOCUS)}>
              {cta.label}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

export default MinimalNavbar;
