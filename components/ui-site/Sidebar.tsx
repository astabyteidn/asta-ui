"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { UI_GROUPS, type UiItem } from "@/lib/ui-catalog";

export const GUIDES = [
  { href: "/introduction", title: "Introduction" },
  { href: "/installation", title: "Installation" },
  { href: "/skill", title: "AI agents" },
  { href: "/css", title: "HTML + CSS" },
  { href: "/prompts", title: "Prompts" },
  { href: "/changelog", title: "Changelog" },
];
/** The latest additions, tagged in the index. */
export const NEW = new Set([
  "countdown",
  "meter",
  "menubar",
  "phone-input",
  "sortable-list",
  "cookie-consent",
  "chart-card",
  "invoice",
  "inbox",
  "file-manager",
  "billing",
  "testimonials",
  "watchlist",
  "split-bill",
  "flash-sale",
  "price-alert",
]);

type Item = { href: string; title: string; id?: string; isNew?: boolean };
type Section = "kit" | "motion";

const KIT_GROUPS = ["Atoms", "Molecules", "Organisms"];

/** A tiny glyph per group: one dot for atoms, a bonded trio for molecules, a cluster for organisms. */
function Glyph({ group }: { group: string }) {
  const c = "currentColor";
  const d: Record<string, React.ReactNode> = {
    "Get started": <path d="M4 3.5h5.5L12 6v6.5H4z M9.5 3.5V6H12" fill="none" stroke={c} strokeWidth="1.3" strokeLinejoin="round" />,
    Atoms: <circle cx="8" cy="8" r="2.6" fill={c} />,
    Molecules: (
      <g fill={c} stroke={c} strokeWidth="1.2">
        <path d="M5 10.5 8 5l3 5.5z" fill="none" />
        <circle cx="8" cy="5" r="1.7" />
        <circle cx="5" cy="10.5" r="1.7" />
        <circle cx="11" cy="10.5" r="1.7" />
      </g>
    ),
    Organisms: (
      <g fill={c}>
        <rect x="3" y="3" width="4.4" height="4.4" rx="1.2" />
        <rect x="8.6" y="3" width="4.4" height="4.4" rx="1.2" opacity=".55" />
        <rect x="3" y="8.6" width="4.4" height="4.4" rx="1.2" opacity=".55" />
        <rect x="8.6" y="8.6" width="4.4" height="4.4" rx="1.2" />
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      {d[group] ?? <path d="M3 8c2-4 4-4 5 0s3 4 5 0" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" />}
    </svg>
  );
}

/**
 * Docs index. A Kit / Motion switch keeps the list short, groups fold, and one white slab follows the
 * pointer between rows and settles back on the current page when the pointer leaves.
 */
function Index({ items, onNavigate }: { items: UiItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const nav = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const slab = useRef<HTMLSpanElement>(null);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const current = items.find((b) => `/${b.slug}` === path);
  const [section, setSection] = useState<Section>(current?.source === "lab" ? "motion" : "kit");
  const [closed, setClosed] = useState<Set<string>>(new Set());

  // Follow the page: opening a motion component switches the index to Motion (adjusted during render).
  const [seen, setSeen] = useState(path);
  if (seen !== path) {
    setSeen(path);
    if (current) setSection(current.source === "lab" ? "motion" : "kit");
  }

  const term = q.trim().toLowerCase();
  const match = (t: string) => !term || t.toLowerCase().includes(term);
  const inSection = (g: string) => term || (section === "kit" ? KIT_GROUPS.includes(g) : !KIT_GROUPS.includes(g));
  const groups: { label: string; items: Item[] }[] = [
    { label: "Get started", items: GUIDES.filter((g) => match(g.title)) },
    ...UI_GROUPS.filter(inSection).map((g) => ({
      label: g,
      items: items.filter((b) => b.group === g && match(b.title)).map((b) => ({ href: `/${b.slug}`, title: b.title, id: b.id.slice(3), isNew: NEW.has(b.slug) })),
    })),
  ].filter((g) => g.items.length);

  const count = (s: Section) => items.filter((b) => (s === "kit") === (b.source === "kit")).length;
  const open = (g: string) => !!term || !closed.has(g);
  const toggle = (g: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  const target = hover ?? path;
  useLayoutEffect(() => {
    const s = slab.current;
    const el = nav.current?.querySelector<HTMLElement>(`[data-href="${CSS.escape(target)}"]`);
    if (!s) return;
    if (!el) {
      s.style.opacity = "0";
      return;
    }
    s.style.opacity = "1";
    s.style.transform = `translateY(${el.offsetTop}px)`;
    s.style.height = `${el.offsetHeight}px`;
  }, [target, term, section, closed]);

  // "/" focuses the filter (unless typing somewhere else).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA/.test(t.tagName) && !t.isContentEditable && input.current?.offsetParent) {
        e.preventDefault();
        input.current.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-1.5 bg-paper px-1.5 pb-3 pt-4 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-5 after:bg-gradient-to-b after:from-paper after:to-transparent">
        <label className="flex h-10 items-center gap-2 rounded-lg bg-paper px-3 text-[14px] text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_var(--color-accent),0_0_0_3px_color-mix(in_srgb,var(--color-accent)_15%,transparent)]">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Filter ${items.length} components`}
            aria-label="Filter components"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-mute"
          />
          {q ? (
            <button type="button" onClick={() => setQ("")} className="text-mute transition-colors hover:text-ink" aria-label="Clear filter">
              ✕
            </button>
          ) : (
            <span className="kbd">/</span>
          )}
        </label>

        <div className={`relative mt-3 grid grid-cols-2 rounded-lg bg-paper-2 p-1 transition-opacity ${term ? "pointer-events-none opacity-40" : ""}`} role="tablist" aria-label="Section">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[5px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_7%,transparent)] transition-transform duration-500 ease-expo"
            style={{ transform: section === "motion" ? "translateX(100%)" : "none" }}
          />
          {(["kit", "motion"] as const).map((sct) => (
            <button
              key={sct}
              type="button"
              role="tab"
              aria-selected={section === sct}
              onClick={() => setSection(sct)}
              className={`relative flex h-8 items-center justify-center gap-1.5 text-[14px] font-medium capitalize transition-colors duration-300 ${section === sct ? "text-ink" : "text-mute hover:text-ink"}`}
            >
              {sct}
              <span className="font-mono text-[11.5px] tabular-nums text-mute">{count(sct)}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={nav} className="relative mt-4" onPointerLeave={() => setHover(null)}>
        <span
          ref={slab}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-0 rounded-md bg-paper opacity-0 shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)] transition-[transform,height,opacity] duration-500 ease-expo"
        />
        <nav className="relative flex flex-col gap-4" aria-label="Docs">
          {groups.map((g) => {
            const isOpen = open(g.label);
            const name = g.label.replace("Motion · ", "");
            return (
              <div key={g.label}>
                <button
                  type="button"
                  onClick={() => toggle(g.label)}
                  aria-expanded={isOpen}
                  className="group/h flex h-7 w-full items-center gap-2 px-2.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:text-ink"
                >
                  <span className="text-mute transition-colors group-hover/h:text-accent">
                    <Glyph group={g.label} />
                  </span>
                  {name}
                  <span className="rounded-[5px] bg-paper-2 px-1.5 font-mono text-[11px] leading-4 tabular-nums text-mute">{g.items.length}</span>
                  <svg
                    viewBox="0 0 16 16"
                    className={`ml-auto h-3 w-3 text-mute transition-transform duration-300 ease-expo ${isOpen ? "" : "-rotate-90"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-500 ease-expo ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <ul className="mt-0.5 overflow-hidden">
                    {g.items.map((it) => {
                      const on = it.href === path;
                      return (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            data-href={isOpen ? it.href : undefined}
                            tabIndex={isOpen ? undefined : -1}
                            onPointerEnter={() => setHover(it.href)}
                            onFocus={() => setHover(it.href)}
                            onBlur={() => setHover(null)}
                            onClick={onNavigate}
                            aria-current={on ? "page" : undefined}
                            className={`group/i flex h-8 items-center gap-2 pl-[34px] pr-2.5 text-[14.5px] outline-none transition-colors duration-200 ${on ? "font-medium text-ink" : hover === it.href ? "text-ink" : "text-mute"}`}
                          >
                            <span className="truncate">{it.title}</span>
                            {it.isNew && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" title="New" />}
                            {it.id && (
                              <span
                                className={`ml-auto font-mono text-[11px] tabular-nums transition-opacity duration-200 ${on ? "text-accent opacity-100" : "text-mute opacity-0 group-hover/i:opacity-100"}`}
                              >
                                {it.id}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
          {groups.length === 0 && <p className="px-3 text-[14px] text-mute">Nothing called that.</p>}
        </nav>
      </div>
    </div>
  );
}

/** Desktop: a sticky column. Mobile: a bar that opens the same index as a sheet. */
export default function Sidebar({ items }: { items: UiItem[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const aside = useRef<HTMLElement>(null);
  const current = GUIDES.find((g) => g.href === path)?.title ?? items.find((b) => `/${b.slug}` === path)?.title ?? "Components";

  // Keep the current page in view inside the sticky column.
  useEffect(() => {
    const box = aside.current;
    const el = box?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!box || !el) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (top < 80 || top > box.clientHeight - 80) box.scrollTo({ top: box.scrollTop + top - box.clientHeight / 3, behavior: "smooth" });
  }, [path]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <aside ref={aside} className="sticky top-14 hidden h-[calc(100svh-3.5rem)] -ml-1.5 w-[15.75rem] shrink-0 overflow-y-auto px-1.5 pb-12 [scrollbar-width:none] lg:block" data-lenis-prevent>
        <Index items={items} />
        <a href="https://astabyte.com/contact?utm_source=ui&utm_campaign=sidebar" className="group mt-10 block rounded-[10px] bg-paper-2 p-4">
          <span className="label text-accent">Astabyte studio</span>
          <span className="mt-2 block text-[15px] leading-snug text-ink">Need a product that feels like this?</span>
          <span className="mt-3 flex items-center gap-2 text-[14px] text-mute transition-colors group-hover:text-ink">
            Work with us <span className="btn-arrow" />
          </span>
        </a>
      </aside>

      <div className="sticky top-14 z-30 -mx-[var(--gutter)] bg-paper/90 px-[var(--gutter)] py-2 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="btn btn-quiet btn-sm w-full !justify-start">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M2 4h12M2 8h12M2 12h7" />
          </svg>
          <span className="text-mute">Docs</span>
          <span className="text-mute/50">/</span>
          <span className="truncate">{current}</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Docs">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 animate-[ui-fade_.3s_ease_both] bg-black/60" />
          <div className="absolute inset-y-0 left-0 w-[min(84vw,320px)] animate-[ui-sheet_.5s_var(--ease-expo)_both] overflow-y-auto bg-paper px-4 pb-10 pt-5" data-lenis-prevent>
            <div className="mb-5 flex items-center justify-between">
              <span className="label text-mute">{items.length} components</span>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm btn-icon" aria-label="Close">
                ✕
              </button>
            </div>
            <Index items={items} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
