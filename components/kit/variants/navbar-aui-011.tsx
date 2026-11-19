"use client";

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type CenteredNavbarIcon = "vase" | "bowl" | "jug" | "plate" | "cup" | "gift" | "pin" | "brush" | "leaf" | "box" | "undo" | "mail";

export interface CenteredNavbarTile {
  title: string;
  description?: string;
  href: string;
  icon?: CenteredNavbarIcon;
}
export type CenteredNavbarMenu =
  /** A three-column grid of tiles. */
  | { type: "grid"; items: CenteredNavbarTile[] }
  /** Columns of icon rows plus one brand call-to-action card. */
  | { type: "columns"; columns: { heading: string; items: CenteredNavbarTile[] }[]; cta: { title: string; description: string; label: string; href: string } };

export interface CenteredNavbarItem {
  label: string;
  href?: string;
  /** Opens a mega menu instead of linking. Only items left of the wordmark take menus. */
  menu?: CenteredNavbarMenu;
}

export interface CenteredNavbarProps {
  /** Text of the centred wordmark. Each letter animates on its own. */
  wordmark?: string;
  brandHref?: string;
  /** Items left of the wordmark. These can open mega menus. */
  left?: CenteredNavbarItem[];
  /** Plain links right of the wordmark, before the actions. */
  right?: { label: string; href: string }[];
  /** Quiet link on the right edge, e.g. "Sign in". */
  secondary?: { label: string; href: string };
  cta?: { label: string; href: string };
  /** Index into `[...left, ...right]` of the current page. */
  active?: number;
  /** Label of a menu to open once, shortly after mount, to show it is there. */
  openOnMount?: string;
  className?: string;
}

const EASE = "cubic-bezier(.16,1,.3,1)";
const TW_EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-brand/60";
const HATCH = "bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--color-paper)_5%,transparent)_0_1px,transparent_1px_7px)]";

const CSS = `
@keyframes aui-011-letter { from { opacity: 0; transform: translateY(70%) rotate(6deg); } }
@keyframes aui-011-rise { from { opacity: 0; transform: translateY(6px); } }
@keyframes aui-011-drop { from { opacity: 0; transform: translateY(-8px); } }
@keyframes aui-011-vp-in { from { opacity: 0; transform: translateY(-4px) scale(.96); } }
@keyframes aui-011-vp-out { to { opacity: 0; transform: translateY(-4px) scale(.96); } }
@keyframes aui-011-from-l { from { opacity: 0; transform: translateX(-28px); } }
@keyframes aui-011-from-r { from { opacity: 0; transform: translateX(28px); } }
@keyframes aui-011-to-l { to { opacity: 0; transform: translateX(-28px); } }
@keyframes aui-011-to-r { to { opacity: 0; transform: translateX(28px); } }
.aui-011-l { display: inline-block; animation: aui-011-letter .8s ${EASE} both; animation-delay: calc(120ms + var(--i, 0) * 45ms); }
.aui-011-in { animation: aui-011-rise .55s ${EASE} both; animation-delay: calc(var(--i, 0) * 50ms); }
.aui-011-sheet { animation: aui-011-drop .4s ${EASE} both; }
.aui-011-vp { transform-origin: top center; }
.aui-011-vp[data-state=open] { animation: aui-011-vp-in .26s ${EASE}; }
.aui-011-vp[data-state=closed] { animation: aui-011-vp-out .16s ease-in forwards; }
.aui-011-c[data-motion=from-start] { animation: aui-011-from-l .3s ${EASE}; }
.aui-011-c[data-motion=from-end] { animation: aui-011-from-r .3s ${EASE}; }
.aui-011-c[data-motion=to-start] { animation: aui-011-to-l .3s ${EASE} forwards; }
.aui-011-c[data-motion=to-end] { animation: aui-011-to-r .3s ${EASE} forwards; }
.aui-011-t { animation: aui-011-rise .45s ${EASE} both; animation-delay: calc(40ms + var(--i, 0) * 40ms); }
@media (prefers-reduced-motion: reduce) { .aui-011-m, .aui-011-m * { animation: none !important; transition-duration: 0s !important; } .aui-011-vp[data-state=closed] { visibility: hidden; } }
`;

const at = (n: number) => ({ "--i": n }) as CSSProperties;

const PATHS: Record<CenteredNavbarIcon, string> = {
  vase: "M6.5 2.5h3M7 2.5v2C4.5 6 4 8.5 4.5 11c.4 1.7 1.8 2.5 3.5 2.5s3.1-.8 3.5-2.5c.5-2.5 0-5-2.5-6.5v-2",
  bowl: "M2.5 7h11c-.4 3.3-2.6 5.5-5.5 5.5S2.9 10.3 2.5 7ZM6 13.5h4",
  jug: "M5 3h5l-.5 2c1.8 1.4 2 4.5 1.2 6.5-.4 1.2-1.5 2-2.7 2s-2.3-.8-2.7-2C4.5 9.5 4.7 6.4 6.5 5L5 3ZM11 6.5c1.8 0 2.4 2.6.4 3.4",
  plate: "M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  cup: "M3.5 5h7v4.5a3.5 3.5 0 0 1-7 0ZM10.5 6.5h1a1.75 1.75 0 0 1 0 3.5h-1.2",
  gift: "M2.5 6h11v2.5h-11ZM3.5 8.5h9v5h-9ZM8 6v7.5M8 6C6.5 3 4.5 3.5 5 5.2M8 6c1.5-3 3.5-2.5 3 -.8",
  pin: "M8 14s4.5-4 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 10 8 14 8 14ZM8 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  brush: "M13 3 7.5 8.5M7.5 8.5c-1-1-3-.5-3.2 1.6-.2 1.6-.8 2.4-1.8 2.9 2.5.6 5.3-.3 5.6-2.3",
  leaf: "M3 13c0-6 3.5-9.5 10-10 0 6.5-3.5 10-10 10ZM3 13l5-5",
  box: "M2.5 5 8 2.5 13.5 5v6L8 13.5 2.5 11ZM2.5 5 8 7.5 13.5 5M8 7.5v6",
  undo: "M5.5 4 2.5 7l3 3M2.5 7h7a4 4 0 0 1 0 8H7",
  mail: "M2.5 4h11v8h-11ZM2.5 4.5 8 9l5.5-4.5",
};

const Glyph = ({ name, className = "h-3.5 w-3.5" }: { name: CenteredNavbarIcon; className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={PATHS[name]} />
  </svg>
);

const Badge = ({ icon, size = "h-7 w-7" }: { icon: CenteredNavbarIcon; size?: string }) => (
  <span className={cx("grid shrink-0 place-items-center rounded-[7px] bg-paper/[.06] text-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_12%,transparent)]", size)}>
    <Glyph name={icon} />
  </span>
);

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 4 4 4-4 4" />
  </svg>
);

const LEFT: CenteredNavbarItem[] = [
  {
    label: "Shop",
    menu: {
      type: "grid",
      items: [
        { title: "Vases", description: "Tall forms, matte glazes", href: "#", icon: "vase" },
        { title: "Bowls", description: "Breakfast to serving", href: "#", icon: "bowl" },
        { title: "Jugs", description: "Pour without a drip", href: "#", icon: "jug" },
        { title: "Plates", description: "Sets of two and four", href: "#", icon: "plate" },
        { title: "Cups", description: "Espresso to mug", href: "#", icon: "cup" },
        { title: "Gift cards", description: "Sent by email, never expire", href: "#", icon: "gift" },
      ],
    },
  },
  {
    label: "Studio",
    menu: {
      type: "columns",
      columns: [
        {
          heading: "Visit",
          items: [
            { title: "The studio", description: "Two people, one kiln, Porto", href: "#", icon: "pin" },
            { title: "Workshops", description: "Saturdays, six seats", href: "#", icon: "brush" },
            { title: "Care guide", description: "Keep the glaze bright", href: "#", icon: "leaf" },
          ],
        },
        {
          heading: "Help",
          items: [
            { title: "Shipping", description: "Packed by hand in a week", href: "#", icon: "box" },
            { title: "Returns", description: "30 days, no questions", href: "#", icon: "undo" },
            { title: "Contact", description: "We reply the same day", href: "#", icon: "mail" },
          ],
        },
      ],
      cta: { title: "Autumn collection", description: "14 pieces, fired twice.", label: "Shop the drop", href: "#" },
    },
  },
];
const RIGHT = [
  { label: "Journal", href: "#" },
  { label: "Stores", href: "#" },
];

const tile = cx(
  "group/t relative flex flex-col overflow-hidden rounded-[6px] p-3.5 transition-[opacity,box-shadow] duration-300",
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_9%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_20%,transparent)]",
  "group-has-[a:hover]/m:opacity-65 hover:!opacity-100",
  FOCUS,
);

function Panel({ menu }: { menu: CenteredNavbarMenu }) {
  if (menu.type === "grid")
    return (
      <div className="group/m grid w-[min(600px,calc(100cqw-24px))] grid-cols-3 gap-2 p-2">
        {menu.items.map((it, n) => (
          <Fragment key={it.title}>
            <a href={it.href} style={at(n)} className={cx(tile, HATCH, "aui-011-t h-[118px] justify-between")}>
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-40% to-[color-mix(in_srgb,var(--color-brand)_22%,transparent)] opacity-0 transition-opacity duration-500 group-hover/t:opacity-100" />
              {it.icon && (
                <span className={cx("relative transition-transform duration-500 group-hover/t:-translate-y-0.5 group-hover/t:text-brand", TW_EASE)}>
                  <Badge icon={it.icon} size="h-8 w-8" />
                </span>
              )}
              <span className="relative">
                <span className="flex items-center gap-1 text-[14px] font-medium text-paper">
                  {it.title}
                  <Chevron className={cx("-translate-x-0.5 text-paper/40 transition-[translate,color] duration-300 group-hover/t:translate-x-0 group-hover/t:text-paper", TW_EASE)} />
                </span>
                {it.description && <span className="mt-0.5 block text-[12px] text-paper/55">{it.description}</span>}
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
          <span className="mb-1 px-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-paper/45">{c.heading}</span>
          {c.items.map((it, n) => (
            <Fragment key={it.title}>
              <a
                href={it.href}
                style={at(ci * 3 + n)}
                className={cx(
                  "aui-011-t flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 transition-[background-color,opacity] duration-200 hover:bg-paper/[.07] group-has-[a:hover]/m:opacity-65 hover:!opacity-100",
                  FOCUS,
                )}
              >
                {it.icon && <Badge icon={it.icon} />}
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13.5px] font-medium leading-tight text-paper">{it.title}</span>
                  {it.description && <span className="truncate text-[12px] leading-snug text-paper/55">{it.description}</span>}
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
            "aui-011-t group/t relative flex min-h-[176px] flex-col justify-end overflow-hidden rounded-[6px] bg-brand p-4 text-white transition-opacity duration-300 group-has-[a:hover]/m:opacity-75 hover:!opacity-100",
            FOCUS,
          )}
        >
          <span aria-hidden className={cx("absolute -right-6 -top-4 text-white/25 transition-transform duration-700 group-hover/t:-translate-y-1 group-hover/t:rotate-6", TW_EASE)}>
            <Glyph name="vase" className="h-28 w-28" />
          </span>
          <span className="relative block text-[15px] font-medium leading-tight tracking-[-0.02em]">{menu.cta.title}</span>
          <span className="relative mt-1 block text-[12.5px] text-white/75">{menu.cta.description}</span>
          <span className="relative mt-3 flex items-center gap-1 text-[13px] font-medium">
            {menu.cta.label}
            <Chevron className={cx("transition-transform duration-300 group-hover/t:translate-x-0.5", TW_EASE)} />
          </span>
        </a>
      </Fragment>
    </div>
  );
}

const flat = (m: CenteredNavbarMenu): CenteredNavbarTile[] => (m.type === "grid" ? m.items : m.columns.flatMap((c) => c.items));

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
 * aui-011 · Dark symmetric header whose signature is the centred wordmark: its letters rise in one by one and ripple
 * upward around the pointer. Items on the left open dark mega menus, plain links and actions sit on the right.
 */
export function CenteredNavbar({
  wordmark = "Astabyte",
  brandHref = "/",
  left = LEFT,
  right = RIGHT,
  secondary = { label: "Sign in", href: "#" },
  cta = { label: "Bag · 2", href: "#" },
  active,
  openOnMount,
  className,
}: CenteredNavbarProps) {
  const [sheet, setSheet] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const { panelRef: megaPanel, innerRef: megaInner, ...mega } = useMega(left.map((x) => x.label), root, openOnMount, 900);
  const value = mega.m.value;
  const lastMenu = left.find((x) => x.label === mega.m.last)?.menu;
  const mark = useRef<HTMLAnchorElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const id = useId();


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

  // Letters near the pointer lift; the rest settle back.
  const ripple = (x: number | null) => {
    const el = mark.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const s of el.querySelectorAll<HTMLSpanElement>("[data-l]")) {
      if (x === null) {
        s.style.transform = "";
        continue;
      }
      const r = s.getBoundingClientRect();
      const k = Math.max(0, 1 - Math.abs(x - (r.left + r.width / 2)) / (r.width * 2.4));
      s.style.transform = `translateY(${-k * 24}%)`;
    }
  };

  const pill = (on: boolean) =>
    cx(
      "group/p flex h-8 items-center gap-1 rounded-lg px-2.5 text-[14px] font-medium transition-colors duration-200 hover:bg-paper/[.08] hover:text-paper aria-expanded:bg-paper/[.08] aria-expanded:text-paper",
      FOCUS,
      on ? "text-paper" : "text-paper/65",
    );
  const dot = <span aria-hidden className="ml-0.5 h-1 w-1 rounded-full bg-brand" />;

  return (
    <header ref={root} className={cx("aui-011-m @container sticky top-0 z-30 w-full bg-ink text-paper shadow-[0_1px_0_color-mix(in_srgb,var(--color-paper)_10%,transparent)]", className)}>
      <style href="asta-navbar-aui-011" precedence="asta">
        {CSS}
      </style>
      <div className="relative mx-auto grid h-14 max-w-[1120px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
        <div className="flex items-center">
          <button
            ref={burger}
            type="button"
            aria-label={sheet ? "Close menu" : "Open menu"}
            aria-expanded={sheet}
            aria-controls={id}
            onClick={() => setSheet((v) => !v)}
            className={cx("relative -ml-1 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-paper/10 @min-[640px]:hidden", FOCUS)}
          >
            <span className={cx("absolute h-[1.5px] w-4 rounded-full bg-paper transition-transform duration-500", TW_EASE, sheet ? "rotate-45" : "-translate-y-[3.5px]")} />
            <span className={cx("absolute h-[1.5px] w-4 rounded-full bg-paper transition-transform duration-500", TW_EASE, sheet ? "-rotate-45" : "translate-y-[3.5px]")} />
          </button>
          <nav aria-label="Shop" className="hidden @min-[640px]:block">
            <ul className="-ml-2.5 flex items-center gap-px">
              {left.map((it, n) => (
                <li key={it.label} className="aui-011-in" style={at(n)}>
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
              className={cx(pill(active === n), "pr-2")}>
                        {it.label}
                        <Chevron className={cx("rotate-90 text-paper/40 transition-transform duration-300 group-aria-expanded/p:-rotate-90", TW_EASE)} />
                      </button>
                    </>
                  ) : (
                    <a href={it.href} aria-current={active === n ? "page" : undefined} className={pill(active === n)}>
                        {it.label}
                        {active === n && dot}
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
                className={cx("aui-011-vp pointer-events-auto relative overflow-hidden rounded-[8px] bg-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_12%,transparent),0_20px_44px_-14px_rgb(0_0_0/0.55)]",
                "transition-[width,height] duration-300 data-[state=closed]:pointer-events-none",
                TW_EASE,)}
              >
                <div key={mega.m.last} ref={megaInner} id={`${id}-m${left.findIndex((x) => x.label === mega.m.last)}`} data-motion={mega.m.dir || undefined} className="aui-011-c absolute left-0 top-0">
                  {lastMenu && <Panel menu={lastMenu} />}
                </div>
              </div>
            )}
          </div>
        </div>

        <a
          ref={mark}
          href={brandHref}
          aria-label={wordmark}
          onPointerMove={(e) => e.pointerType === "mouse" && ripple(e.clientX)}
          onPointerLeave={() => ripple(null)}
          className={cx("flex select-none items-end overflow-hidden rounded-md px-1 pb-0.5 pt-1 text-[20px] font-semibold leading-none tracking-[-0.06em]", FOCUS)}
        >
          {wordmark.split("").map((c, n) => (
            <span key={n} aria-hidden className="aui-011-l" style={at(n)}>
              <span data-l className={cx("inline-block transition-transform duration-500", TW_EASE)}>
                {c === " " ? " " : c}
              </span>
            </span>
          ))}
          <span aria-hidden className="aui-011-l mb-[2px] ml-0.5 h-[5px] w-[5px] rounded-full bg-brand" style={at(wordmark.length)} />
        </a>

        <div className="flex items-center justify-end gap-1.5">
          <nav aria-label="More" className="mr-auto hidden @min-[640px]:block">
            <ul className="flex items-center gap-px">
              {right.map((l, n) => (
                <li key={l.label} className="aui-011-in" style={at(left.length + n + 2)}>
                  <a href={l.href} aria-current={active === left.length + n ? "page" : undefined} className={pill(active === left.length + n)}>
                    {l.label}
                    {active === left.length + n && dot}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {secondary && (
            <a
              href={secondary.href}
              style={at(left.length + right.length + 2)}
              className={cx("aui-011-in hidden h-8 items-center rounded-lg px-3 text-[13px] font-medium text-paper/65 transition-colors hover:bg-paper/[.08] hover:text-paper @min-[860px]:inline-flex", FOCUS)}
            >
              {secondary.label}
            </a>
          )}
          <a
            href={cta.href}
            style={at(left.length + right.length + 3)}
            className={cx(
              "aui-011-in group/cta inline-flex h-8 items-center gap-1 rounded-lg bg-paper pl-3 pr-2.5 text-[13px] font-medium text-ink transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[.97]",
              TW_EASE,
              FOCUS,
            )}
          >
            {cta.label}
            <Chevron className={cx("transition-transform duration-300 group-hover/cta:translate-x-0.5", TW_EASE)} />
          </a>
        </div>
      </div>

      {sheet && (
        <nav id={id} aria-label="Main" className="aui-011-sheet absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto bg-ink pb-4 shadow-[0_24px_40px_-24px_rgb(0_0_0/0.6)] @min-[640px]:hidden">
          {left.map((it, n) =>
            it.menu ? (
              <div key={it.label} className="aui-011-in shadow-[0_1px_0_color-mix(in_srgb,var(--color-paper)_9%,transparent)]" style={at(n)}>
                <button
                  type="button"
                  aria-expanded={section === it.label}
                  onClick={() => setSection((s) => (s === it.label ? null : it.label))}
                  className={cx("flex h-12 w-full items-center justify-between px-4 text-[16px] font-medium", FOCUS)}
                >
                  {it.label}
                  <Chevron className={cx("text-paper/45 transition-transform duration-300", TW_EASE, section === it.label ? "-rotate-90" : "rotate-90")} />
                </button>
                <div className={cx("grid transition-[grid-template-rows] duration-500", TW_EASE, section === it.label ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <ul className="overflow-hidden px-2" inert={section !== it.label || undefined}>
                    {flat(it.menu).map((t) => (
                      <li key={t.title}>
                        <a href={t.href} onClick={() => close(false)} className={cx("flex items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-paper/[.07]", FOCUS)}>
                          {t.icon && <Badge icon={t.icon} />}
                          <span className="flex flex-col">
                            <span className="text-[14px] font-medium">{t.title}</span>
                            {t.description && <span className="text-[12px] text-paper/55">{t.description}</span>}
                          </span>
                        </a>
                      </li>
                    ))}
                    <li aria-hidden className="h-2" />
                  </ul>
                </div>
              </div>
            ) : (
              <a key={it.label} href={it.href} onClick={() => close(false)} style={at(n)} className={cx("aui-011-in flex h-12 items-center px-4 text-[16px] font-medium shadow-[0_1px_0_color-mix(in_srgb,var(--color-paper)_9%,transparent)]", FOCUS)}>
                {it.label}
              </a>
            ),
          )}
          {right.map((l, n) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => close(false)}
              style={at(left.length + n)}
              className={cx("aui-011-in flex h-12 items-center justify-between px-4 text-[16px] font-medium shadow-[0_1px_0_color-mix(in_srgb,var(--color-paper)_9%,transparent)]", FOCUS)}
            >
              {l.label}
              {active === left.length + n && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
            </a>
          ))}
          {secondary && (
            <div className="aui-011-in mt-4 px-4" style={at(left.length + right.length)}>
              <a href={secondary.href} className={cx("flex h-10 items-center justify-center rounded-lg bg-paper/[.08] text-[14px] font-medium", FOCUS)}>
                {secondary.label}
              </a>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

export default CenteredNavbar;
