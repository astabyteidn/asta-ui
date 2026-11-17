"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { uiItems } from "@/lib/ui-catalog";
import { GUIDES } from "./Sidebar";

type Row = { href: string; title: string; meta: string; group: string };

const ROWS: Row[] = [
  ...GUIDES.map((g) => ({ href: g.href, title: g.title, meta: "Guide", group: "Get started" })),
  ...uiItems.map((b) => ({ href: `/${b.slug}`, title: b.title, meta: b.id, group: b.group })),
];

/** Header search button + ⌘K palette over guides and components. */
export default function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return ROWS;
    return ROWS.filter((r) => `${r.title} ${r.group}`.toLowerCase().includes(t)).sort(
      (a, b) => Number(!a.title.toLowerCase().startsWith(t)) - Number(!b.title.toLowerCase().startsWith(t)),
    );
  }, [q]);

  const show = (v: boolean) => {
    setOpen(v);
    setQ("");
    setAt(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQ("");
        setAt(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${at}"]`)?.scrollIntoView({ block: "nearest" });
  }, [at]);

  const go = (r?: Row) => {
    if (!r) return;
    show(false);
    router.push(r.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => show(true)}
        className="btn btn-quiet btn-sm hidden w-56 !justify-start text-mute md:inline-flex"
        aria-label="Search components"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <span className="font-normal text-mute">Search components</span>
        <span className="kbd ml-auto">⌘K</span>
      </button>
      <button type="button" onClick={() => show(true)} className="btn btn-ghost btn-sm btn-icon md:hidden" aria-label="Search components">
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12svh]" role="dialog" aria-modal="true" aria-label="Search">
          <button type="button" aria-label="Close" className="absolute inset-0 animate-[ui-fade_.25s_ease_both] bg-black/40 backdrop-blur-sm" onClick={() => show(false)} />
          <div className="relative w-full max-w-xl animate-[ui-pop_.45s_var(--ease-expo)_both] overflow-hidden rounded-[10px] bg-paper shadow-[0_30px_80px_-20px_rgb(0_0_0/0.35),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
            <div className="flex items-center gap-3 px-4">
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3" />
              </svg>
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setAt(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setAt((a) => Math.min(rows.length - 1, a + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setAt((a) => Math.max(0, a - 1));
                  } else if (e.key === "Enter") go(rows[at]);
                  else if (e.key === "Escape") show(false);
                }}
                placeholder="Search components…"
                aria-label="Search"
                className="h-14 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-mute"
              />
              <span className="kbd">Esc</span>
            </div>
            <ul ref={list} className="max-h-[52svh] overflow-y-auto p-2" data-lenis-prevent>
              {rows.map((r, i) => (
                <li key={r.href}>
                  {(i === 0 || rows[i - 1].group !== r.group) && !q && <p className="label px-3 pb-1.5 pt-3 text-mute">{r.group}</p>}
                  <button
                    type="button"
                    data-i={i}
                    onPointerMove={() => setAt(i)}
                    onClick={() => go(r)}
                    className={`relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] transition-colors ${i === at ? "bg-paper-2 text-ink" : "text-ink-2"}`}
                  >
                    <span className={`absolute inset-y-2 left-0 w-0.5 bg-accent transition-opacity ${i === at ? "opacity-100" : "opacity-0"}`} />
                    <span className="w-12 font-mono text-[10.5px] tabular-nums text-mute">{r.meta === "Guide" ? "—" : r.meta}</span>
                    {r.title}
                    {i === at && <span className="ml-auto text-mute">↵</span>}
                  </button>
                </li>
              ))}
              {rows.length === 0 && <li className="px-3 py-8 text-center text-[14px] text-mute">No components match “{q}”.</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
