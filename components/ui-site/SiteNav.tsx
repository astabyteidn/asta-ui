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

type Link_ = { title: string; description?: string; href: string };
type Menu = { width: number; tiles?: Link_[]; columns?: { heading: string; links: Link_[] }[]; feature?: Link_ & { cta: string } };

const pick = (slugs: string[]) =>
  slugs.flatMap((s) => {
    const k = kitItems.find((x) => x.slug === s) ?? labBlocks.find((x) => x.slug === s);
    return k ? [{ title: k.title, href: `/${k.slug}` }] : [];
  });

/** The header menus. Links only: every one is also in the docs sidebar and ⌘K. */
const MENUS: Record<string, Menu> = {
  docs: {
    width: 520,
    tiles: [
      { title: "Introduction", description: "What's in the kit and how it's built.", href: "/introduction" },
      { title: "Installation", description: "One command, then the file is yours.", href: "/installation" },
      { title: "HTML + CSS", description: "The whole kit for any stack.", href: "/css" },
      { title: "Agent skill", description: "Teach your coding agent the kit.", href: "/skill" },
      { title: "Prompts", description: "Ready prompts that use the kit.", href: "/prompts" },
      { title: "Changelog", description: "What shipped in each release.", href: "/changelog" },
    ],
  },
  components: {
    width: 720,
    columns: [
      { heading: "Atoms", links: pick(["button", "motion-button", "input", "switch", "scrub-input"]) },
      { heading: "Molecules", links: pick(["select", "date-picker", "toast", "dialog", "tabs"]) },
      { heading: "Organisms", links: pick(["ai-chat", "data-table", "kanban", "checkout", "command-palette"]) },
    ],
    feature: { title: `All ${kitItems.length} components`, description: "From the smallest atom to whole sections. Every demo is live.", href: "/#kit", cta: "Browse the kit" },
  },
  motion: {
    width: 600,
    columns: [
      { heading: "Commerce", links: pick(["add-to-cart", "cart-drawer", "card-checkout", "seat-picker"]) },
      { heading: "Feedback", links: pick(["payment-status", "hold-to-confirm", "now-playing", "shipment-tracker"]) },
    ],
    feature: { title: `${labBlocks.length} motion experiments`, description: "Physics, springs and real resistance, in finished product UI.", href: "/#components", cta: "Open the lab" },
  },
};

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

function Panel({ menu, close }: { menu: Menu; close: () => void }) {
  const link = "rounded-lg outline-none transition-[background-color,opacity] duration-200 hover:bg-paper-2 focus-visible:bg-paper-2 group-has-[a:hover]/menu:opacity-60 hover:!opacity-100";
  return (
    <div className="group/menu p-2">
      {menu.tiles && (
        <div className="grid grid-cols-2 gap-1">
          {menu.tiles.map((t) => (
            <Link key={t.href} href={t.href} onClick={close} data-nav-link className={`flex flex-col gap-0.5 px-3 py-2.5 ${link}`}>
              <span className="text-[14px] font-medium text-ink">{t.title}</span>
              {t.description && <span className="text-[12.5px] leading-snug text-mute">{t.description}</span>}
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
              className="group/feat relative flex min-h-[196px] flex-col justify-end overflow-hidden rounded-[10px] bg-brand p-4 text-white outline-none transition-opacity duration-300 group-has-[a:hover]/menu:opacity-75 hover:!opacity-100 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <span aria-hidden className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 transition-transform duration-700 group-hover/feat:scale-125 ${EASE}`} />
              <span className="relative text-[15px] font-medium tracking-[-0.01em]">{menu.feature.title}</span>
              <span className="relative mt-1 text-[12.5px] leading-snug text-white/80">{menu.feature.description}</span>
              <span className="relative mt-3 flex items-center gap-1.5 text-[13px] font-medium">
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
  const enter = (k: string) => {
    clearTimeout(timer.current);
    if (openRef.current === null) timer.current = setTimeout(() => show(k), 110);
    else show(k);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => show(null), 180);
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
    <nav ref={root} aria-label="Main" className="relative hidden items-center lg:flex" onPointerLeave={leave} onPointerEnter={stay}>
      <style href="asta-site-nav" precedence="asta">{`
        @keyframes ui-nav-in { from { opacity: 0; transform: translateX(calc(var(--nav-dir) * 32px)); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .ui-nav-panel, .ui-nav-panel * { animation: none !important; transition-duration: 0s !important; } }
      `}</style>
      {ITEMS.map((it) => {
        const on = current === it.key;
        const cls = `flex h-8 items-center gap-1 rounded-md px-3 text-[14px] transition-colors duration-150 hover:text-ink ${on || open === it.key ? "text-ink" : "text-mute"}`;
        if (it.external)
          return (
            <a key={it.key} href={it.href} className={cls} onPointerEnter={() => openRef.current !== null && show(null)}>
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
              aria-expanded={open === it.key}
              aria-controls="ui-nav-panel"
              aria-current={on ? "page" : undefined}
              onPointerEnter={(e) => e.pointerType === "mouse" && enter(it.key)}
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
          <Link key={it.key} href={it.href} className={cls} aria-current={on ? "page" : undefined} onPointerEnter={() => openRef.current !== null && show(null)}>
            {it.label}
          </Link>
        );
      })}

      {/* One shared panel that morphs between menus. */}
      <div id="ui-nav-panel" onPointerEnter={stay} onPointerLeave={leave} className={`ui-nav-panel absolute left-0 top-[calc(100%+10px)] ${open === null ? "pointer-events-none" : ""}`}>
        {/* perf-ok: the panel morphs its width/height between menus, like the kit Navbar */}
        <div
          className={`overflow-hidden rounded-xl bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_16px_40px_-12px_rgb(0_0_0/0.22)] transition-[width,height,opacity,transform] duration-300 ${EASE} ${
            open === null ? "-translate-y-1 scale-[.98] opacity-0" : "opacity-100"
          }`}
          style={{ width: size.w || undefined, height: size.h || undefined }}
        >
          {menu && (
            <div
              key={shown}
              ref={content}
              style={{ "--nav-dir": dir, width: `min(${menu.width}px, calc(100vw - 48px))`, animation: slide ? "ui-nav-in .38s cubic-bezier(.16,1,.3,1) both" : undefined } as React.CSSProperties}
            >
              <Panel menu={menu} close={() => show(null)} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
