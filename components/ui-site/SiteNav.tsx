"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { kitItems } from "@/lib/kit";
import { labBlocks } from "@/lib/lab";
import { DESIGN_URL } from "@/lib/design";

type Item = { key: string; label: string; href: string; external?: boolean };

export const ITEMS: Item[] = [
  { key: "docs", label: "Docs", href: "/introduction" },
  { key: "components", label: "Components", href: "/#kit" },
  { key: "motion", label: "Motion", href: "/#components" },
  { key: "icons", label: "Icons", href: "/icons" },
  { key: "logos", label: "Logos", href: "/logos" },
  { key: "blog", label: "Blog", href: "/blog" },
  { key: "design", label: "Design", href: DESIGN_URL, external: true },
];

const GUIDES = ["/introduction", "/installation", "/skill", "/css", "/prompts", "/changelog"];
const KIT = new Set(kitItems.map((k) => `/${k.slug}`));
const LAB = new Set(labBlocks.map((b) => `/${b.slug}`));

export function activeKey(path: string) {
  if (GUIDES.includes(path)) return "docs";
  if (KIT.has(path)) return "components";
  if (LAB.has(path)) return "motion";
  if (path.startsWith("/icons")) return "icons";
  if (path.startsWith("/logos")) return "logos";
  if (path.startsWith("/blog")) return "blog";
  return null;
}

type Link_ = { title: string; description?: string; href: string; icon?: string };
type Menu = { width: number; tiles?: Link_[]; columns?: { heading: string; links: Link_[] }[]; feature?: Link_ & { cta: string; stat: string } };

const pick = (slugs: string[]) =>
  slugs.flatMap((s) => {
    const k = kitItems.find((x) => x.slug === s) ?? labBlocks.find((x) => x.slug === s);
    return k ? [{ title: k.title, href: `/${k.slug}` }] : [];
  });

/** The header menus. Links only: every one is also in the docs sidebar and ⌘K. */
const MENUS: Record<string, Menu> = {
  docs: {
    width: 600,
    tiles: [
      { title: "Introduction", description: "What's in the kit and how it's built.", href: "/introduction", icon: "M3 2.5h7l3 3v8H3zM10 2.5v3h3M5.5 8.5h5M5.5 11h3" },
      { title: "Installation", description: "One command, then the file is yours.", href: "/installation", icon: "M8 2.5v7M5 6.5l3 3 3-3M3 11.5v2h10v-2" },
      { title: "HTML + CSS", description: "The whole kit for any stack.", href: "/css", icon: "m5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5 14 8l-3.5 3.5" },
      { title: "Agent skill", description: "Teach your coding agent the kit.", href: "/skill", icon: "M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14M8 5.5 9 7l1.5 1-1.5 1L8 10.5 7 9 5.5 8 7 7z" },
      { title: "Prompts", description: "Ready prompts that use the kit.", href: "/prompts", icon: "M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" },
      { title: "Changelog", description: "What shipped in each release.", href: "/changelog", icon: "M8 4.5V8l2.5 1.5M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" },
    ],
  },
  components: {
    width: 720,
    columns: [
      { heading: "Atoms", links: pick(["button", "motion-button", "input", "switch", "scrub-input"]) },
      { heading: "Molecules", links: pick(["select", "date-picker", "toast", "dialog", "tabs"]) },
      { heading: "Organisms", links: pick(["ai-chat", "data-table", "kanban", "checkout", "command-palette"]) },
    ],
    feature: { stat: String(kitItems.length), title: "components", description: "From the smallest atom to whole sections. Every demo is live.", href: "/#kit", cta: "Browse the kit" },
  },
  motion: {
    width: 600,
    columns: [
      { heading: "Commerce", links: pick(["add-to-cart", "cart-drawer", "card-checkout", "seat-picker"]) },
      { heading: "Feedback", links: pick(["payment-status", "hold-to-confirm", "now-playing", "shipment-tracker"]) },
    ],
    feature: { stat: String(labBlocks.length), title: "motion experiments", description: "Physics, springs and real resistance, in finished product UI.", href: "/#components", cta: "Open the lab" },
  },
};

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function Panel({ menu, close }: { menu: Menu; close: () => void }) {
  const link = "rounded-lg outline-none transition-colors duration-150 hover:bg-paper-2 focus-visible:bg-paper-2";
  return (
    <div className="p-2">
      {menu.tiles && (
        <div className="grid grid-cols-2 gap-0.5">
          {menu.tiles.map((t) => (
            <Link key={t.href} href={t.href} onClick={close} data-nav-link className={`group/tile flex items-start gap-3 px-3 py-2.5 ${link}`}>
              {t.icon && (
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] transition-colors duration-150 group-hover/tile:text-ink`}>
                  <Glyph d={t.icon} />
                </span>
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[14px] font-medium text-ink">{t.title}</span>
                {t.description && <span className="text-[12.5px] leading-snug text-mute">{t.description}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
      {menu.columns && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${menu.columns.length + (menu.feature ? 1 : 0)}, minmax(0, 1fr))` }}>
          {menu.columns.map((c) => (
            <div key={c.heading} className="flex flex-col p-1.5">
              <span className="label mb-1.5 px-2 text-mute">{c.heading}</span>
              {c.links.map((l) => (
                <Link key={l.href} href={l.href} onClick={close} data-nav-link className={`px-2 py-1.5 text-[14px] text-ink-2 hover:text-ink ${link}`}>
                  {l.title}
                </Link>
              ))}
            </div>
          ))}
          {menu.feature && (
            <Link
              href={menu.feature.href}
              onClick={close}
              data-nav-link
              className="group/feat flex min-h-[196px] flex-col rounded-[10px] bg-paper-2 p-4 outline-none transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,var(--color-paper))] focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <span className="display text-[40px] text-ink">{menu.feature.stat}</span>
              <span className="mt-1 text-[14px] font-medium text-ink">{menu.feature.title}</span>
              <span className="mt-1 text-[12.5px] leading-snug text-mute">{menu.feature.description}</span>
              <span className="mt-auto flex items-center gap-1.5 pt-3 text-[13px] font-medium text-accent">
                {menu.feature.cta} <span className="btn-arrow" />
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Site header nav: plain links, the current section in ink and the rest muted. Docs, Components and Motion open a
 * mega menu (the kit's Navbar pattern): one shared panel that morphs its size between menus while the new content
 * slides in from the side you moved toward. Hover with intent, click, or Enter / ArrowDown from the keyboard.
 */
export default function SiteNav() {
  const path = usePathname();
  const current = activeKey(path);
  const [open, setOpen] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [dir, setDir] = useState(1);
  const [slide, setSlide] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const root = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openRef = useRef<string | null>(null);
  const focusPanel = useRef(false);
  const pill = useRef<HTMLSpanElement>(null);
  const shown = open ?? last;
  const order = ITEMS.map((i) => i.key);

  const show = useCallback(
    (k: string | null) => {
      clearTimeout(timer.current);
      const cur = openRef.current;
      const moving = k !== null && cur !== null && k !== cur;
      if (moving) setDir(order.indexOf(k) > order.indexOf(cur) ? 1 : -1);
      setSlide(moving);
      if (k !== null) setLast(k);
      openRef.current = k;
      setOpen(k);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // A soft pill follows the pointer across the triggers and rests on the open one. Measured on enter, never per frame.
  const pillTo = (el: Element | null | undefined) => {
    const p = pill.current;
    if (!p) return;
    if (!(el instanceof HTMLElement)) {
      p.style.opacity = "0";
      return;
    }
    const fresh = p.style.opacity !== "1";
    if (fresh) p.style.transition = "opacity .15s";
    p.style.width = `${el.offsetWidth}px`;
    p.style.transform = `translateX(${el.offsetLeft}px)`;
    p.style.opacity = "1";
    if (fresh) {
      void p.offsetWidth;
      p.style.transition = "";
    }
  };
  const keyEl = (k: string | null) => (k ? root.current?.querySelector(`[data-nav-key="${k}"]`) : null);
  const enter = (k: string) => {
    clearTimeout(timer.current);
    if (openRef.current === null) timer.current = setTimeout(() => show(k), 70);
    else show(k);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => show(null), 150);
  };
  const stay = () => clearTimeout(timer.current);

  // Close on route change, adjusted during render.
  const [at, setAt] = useState(path);
  if (at !== path) {
    setAt(path);
    setOpen(null);
  }
  useEffect(() => {
    openRef.current = open;
    if (!root.current?.matches(":hover")) pillTo(keyEl(open));
  }, [open]);

  useLayoutEffect(() => {
    const el = content.current;
    if (shown === null || !el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (focusPanel.current) {
      focusPanel.current = false;
      el.querySelector<HTMLElement>("[data-nav-link]")?.focus();
    }
    return () => ro.disconnect();
  }, [shown, open]);

  useEffect(() => {
    const down = (e: PointerEvent) => !root.current?.contains(e.target as Node) && show(null);
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || openRef.current === null) return;
      const k = openRef.current;
      show(null);
      root.current?.querySelector<HTMLElement>(`[data-nav-key="${k}"]`)?.focus();
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
      clearTimeout(timer.current);
    };
  }, [show]);

  const menu = shown ? MENUS[shown] : undefined;
  return (
    <nav
      ref={root}
      aria-label="Main"
      className="relative hidden items-center lg:flex"
      onPointerLeave={() => {
        leave();
        pillTo(keyEl(openRef.current));
      }}
      onPointerEnter={stay}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const items = [...(root.current?.querySelectorAll<HTMLElement>("[data-nav-item]") ?? [])];
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (i < 0) return;
        e.preventDefault();
        const next = items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length];
        next.focus();
        if (openRef.current !== null) show(next.dataset.navKey ?? null);
      }}
    >
      <style href="asta-site-nav" precedence="asta">{`
        @keyframes ui-nav-in { from { opacity: 0; transform: translateX(calc(var(--nav-dir) * 12px)); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .ui-nav-panel, .ui-nav-panel * { animation: none !important; transition-duration: 0s !important; } }
      `}</style>
      {/* perf-ok: the pill's width snaps to each trigger; only its transform and opacity are animated */}
      <span ref={pill} aria-hidden className={`pointer-events-none absolute left-0 top-0 h-8 rounded-md bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] opacity-0 transition-[transform,opacity,width] duration-250 ${EASE}`} />
      {ITEMS.map((it) => {
        const on = current === it.key;
        const cls = `relative flex h-8 items-center gap-1 rounded-md px-3 text-[14px] outline-none transition-colors duration-150 hover:text-ink focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)] ${on || open === it.key ? "text-ink" : "text-mute"}`;
        const pillHere = (e: React.PointerEvent<HTMLElement>) => pillTo(e.currentTarget);
        if (it.external)
          return (
            <a key={it.key} href={it.href} data-nav-item className={cls} onPointerEnter={(e) => { pillHere(e); if (openRef.current !== null) show(null); }}>
              {it.label}
              <span aria-hidden className="text-[12px]">
                ↗
              </span>
            </a>
          );
        if (MENUS[it.key])
          return (
            <button
              key={it.key}
              type="button"
              data-nav-key={it.key}
              data-nav-item
              aria-expanded={open === it.key}
              aria-controls="ui-nav-panel"
              aria-current={on ? "page" : undefined}
              onPointerEnter={(e) => {
                pillHere(e);
                if (e.pointerType === "mouse") enter(it.key);
              }}
              onClick={() => show(open === it.key ? null : it.key)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || ((e.key === "Enter" || e.key === " ") && open !== it.key)) {
                  e.preventDefault();
                  focusPanel.current = true;
                  show(it.key);
                }
              }}
              className={`${cls} pr-2`}
            >
              {it.label}
              <svg viewBox="0 0 16 16" className={`h-3 w-3 text-mute transition-transform duration-300 ${EASE} ${open === it.key ? "-rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
          );
        return (
          <Link key={it.key} href={it.href} data-nav-item className={cls} aria-current={on ? "page" : undefined} onPointerEnter={(e) => { pillHere(e); if (openRef.current !== null) show(null); }}>
            {it.label}
          </Link>
        );
      })}

      {/* One shared panel that morphs between menus. */}
      <div id="ui-nav-panel" onPointerEnter={stay} onPointerLeave={leave} className={`ui-nav-panel absolute left-0 top-[calc(100%+10px)] ${open === null ? "pointer-events-none" : ""}`}>
        {/* perf-ok: the panel morphs its width/height between menus, like the kit Navbar */}
        <div
          className={`overflow-hidden rounded-xl bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_16px_40px_-12px_rgb(0_0_0/0.22)] transition-[width,height,opacity,transform] duration-250 ${EASE} ${
            open === null ? "-translate-y-1 scale-[.98] opacity-0" : "opacity-100"
          }`}
          style={{ width: size.w || undefined, height: size.h || undefined }}
        >
          {menu && (
            <div
              key={shown}
              ref={content}
              style={{ "--nav-dir": dir, width: `min(${menu.width}px, calc(100vw - 48px))`, animation: slide ? "ui-nav-in .26s cubic-bezier(.16,1,.3,1) both" : undefined } as React.CSSProperties}
            >
              <Panel menu={menu} close={() => show(null)} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
