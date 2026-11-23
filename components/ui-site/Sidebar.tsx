"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UI_GROUPS, type UiItem } from "@/lib/ui-catalog";

export const GUIDES = [
  { href: "/introduction", title: "Introduction" },
  { href: "/installation", title: "Installation" },
  { href: "/skill", title: "AI agents" },
  { href: "/css", title: "HTML + CSS" },
  { href: "/prompts", title: "Prompts" },
  { href: "/changelog", title: "Changelog" },
];

type Item = { href: string; title: string };

/** Height of the sticky filter bar, so group headings stick just under it. */
const BAR = "top-16";

/**
 * Docs index: one plain list, guides first, then kit layers, then motion. Group headings stick while you scroll so
 * you always know where you are. No folding, no tabs, no animation: rows react at once. In the filter, ↑ ↓ pick a
 * result, Enter opens it and Esc clears.
 */
export function Index({ items, onNavigate }: { items: UiItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const nav = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);

  const term = q.trim().toLowerCase();
  const match = (t: string) => !term || t.toLowerCase().includes(term);
  const groups: { label: string; items: Item[] }[] = [
    { label: "Get started", items: GUIDES },
    ...UI_GROUPS.map((g) => ({ label: g, items: items.filter((b) => b.group === g).map((b) => ({ href: `/${b.slug}`, title: b.title })) })),
  ]
    .map((g) => ({ ...g, items: g.items.filter((it) => match(it.title)) }))
    .filter((g) => g.items.length);

  const flat = groups.flatMap((g) => g.items);
  const picked = term && flat.length ? flat[Math.min(cursor, flat.length - 1)].href : null;

  const filter = (v: string) => {
    setQ(v);
    setCursor(0);
    nav.current?.closest<HTMLElement>("[data-scroll]")?.scrollTo({ top: 0 });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (q) filter("");
      else input.current?.blur();
    } else if (term && flat.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const next = (Math.min(cursor, flat.length - 1) + (e.key === "ArrowDown" ? 1 : -1) + flat.length) % flat.length;
      setCursor(next);
      nav.current?.querySelector(`[href="${CSS.escape(flat[next].href)}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && picked) {
      e.preventDefault();
      router.push(picked);
      filter("");
      input.current?.blur();
      onNavigate?.();
    }
  };

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
      <div className="sticky top-0 z-20 -mx-1.5 bg-paper px-1.5 pb-3 pt-4">
        <label className="flex h-9 items-center gap-2 rounded-lg bg-paper px-3 text-[14px] text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] focus-within:shadow-[inset_0_0_0_1px_var(--color-accent),0_0_0_3px_color-mix(in_srgb,var(--color-accent)_15%,transparent)]">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => filter(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={!!term}
            aria-controls="docs-index"
            aria-activedescendant={picked ? `docs-${picked.slice(1)}` : undefined}
            placeholder="Filter"
            aria-label="Filter components"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-mute"
          />
          {q ? (
            <button type="button" onClick={() => filter("")} className="text-mute hover:text-ink" aria-label="Clear filter">
              ✕
            </button>
          ) : (
            <span className="kbd max-lg:hidden">/</span>
          )}
        </label>
      </div>

      <nav ref={nav} id="docs-index" aria-label="Docs">
        {groups.map((g) => (
          <section key={g.label} className="pb-4">
            <h2 className={`sticky ${BAR} z-10 bg-paper px-2.5 pb-1.5 pt-1 text-[12.5px] font-medium text-mute after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-gradient-to-b after:from-paper after:to-transparent`}>{g.label}</h2>
            <ul>
              {g.items.map((it) => {
                const on = it.href === path;
                const hit = it.href === picked;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      id={`docs-${it.href.slice(1)}`}
                      onClick={() => {
                        if (term) filter("");
                        onNavigate?.();
                      }}
                      aria-current={on ? "page" : undefined}
                      className={`flex h-[30px] items-center truncate rounded-md px-2.5 text-[14px] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)] ${
                        on ? "bg-paper-2 font-medium text-ink" : hit ? "bg-paper-2 text-ink" : "text-ink-2 hover:text-ink"
                      }`}
                    >
                      {it.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {groups.length === 0 && <p className="px-2.5 text-[14px] text-mute">Nothing called that.</p>}
      </nav>
    </div>
  );
}

/** Desktop only: a sticky column. On phones the same index lives in the header menu (MobileMenu). */
export default function Sidebar({ items }: { items: UiItem[] }) {
  const path = usePathname();
  const aside = useRef<HTMLElement>(null);

  // Keep the current page in view inside the sticky column: placed at once on first load, eased after that.
  const placed = useRef(false);
  useEffect(() => {
    const box = aside.current;
    const el = box?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!box || !el) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (top < 110 || top > box.clientHeight - 60) box.scrollTo({ top: box.scrollTop + top - box.clientHeight / 3, behavior: placed.current ? "smooth" : "instant" });
    placed.current = true;
  }, [path]);

  return (
    <aside ref={aside} className="sticky top-14 hidden h-[calc(100svh-3.5rem)] -ml-1.5 w-[15.75rem] shrink-0 overflow-y-auto overscroll-contain px-1.5 pb-12 [scrollbar-color:transparent_transparent] [scrollbar-width:thin] hover:[scrollbar-color:color-mix(in_srgb,var(--color-ink)_18%,transparent)_transparent] lg:block" data-lenis-prevent data-scroll>
      <Index items={items} />
      <a href="https://astabyte.com/contact?utm_source=ui&utm_campaign=sidebar" className="group mt-10 block rounded-[10px] bg-paper-2 p-4">
        <span className="label text-accent">Astabyte studio</span>
        <span className="mt-2 block text-[15px] leading-snug text-ink">Need a product that feels like this?</span>
        <span className="mt-3 flex items-center gap-2 text-[14px] text-mute transition-colors group-hover:text-ink">
          Work with us <span className="btn-arrow" />
        </span>
      </a>
    </aside>
  );
}
