"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { kitItems, LAYERS } from "@/lib/kit";
import { KINDS, labBlocks } from "@/lib/lab";
import { variants } from "@/lib/variants";

type Menu = "components" | "motion";
type Item = { key: string; label: string; href: string; menu?: Menu };

const ITEMS: Item[] = [
  { key: "docs", label: "Docs", href: "/introduction" },
  { key: "components", label: "Components", href: "/#kit", menu: "components" },
  { key: "motion", label: "Motion", href: "/#components", menu: "motion" },
  { key: "icons", label: "Icons", href: "/icons" },
  { key: "logos", label: "Logos", href: "/logos" },
];

const GUIDES = ["/introduction", "/installation", "/skill", "/go", "/css", "/prompts", "/changelog"];
const KIT = new Set(kitItems.map((k) => `/${k.slug}`));
const LAB = new Set(labBlocks.map((b) => `/${b.slug}`));

function activeKey(path: string) {
  if (GUIDES.includes(path)) return "docs";
  if (KIT.has(path)) return "components";
  if (LAB.has(path)) return "motion";
  if (path.startsWith("/icons")) return "icons";
  if (path.startsWith("/logos")) return "logos";
  return null;
}

const LAYER_NOTE: Record<string, string> = {
  Atoms: "Buttons, fields, the small parts",
  Molecules: "Pickers, menus, uploads",
  Organisms: "Tables, chat, checkout",
};
const KIND_NOTE: Record<string, string> = {
  Actions: "Press, hold, confirm",
  Inputs: "Drag, pick, type",
  Feedback: "Reply to every move",
  Surfaces: "Cards that come alive",
};

function Tile({ href, title, note, count, picks, onGo }: { href: string; title: string; note: string; count: number; picks: { href: string; title: string }[]; onGo: () => void }) {
  return (
    <div className="nav-tile rounded-[10px] p-3.5 transition-colors duration-300 hover:bg-paper-2">
      <Link href={href} onClick={onGo} className="group flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-medium text-ink">{title}</span>
        <span className="font-mono text-[11px] tabular-nums text-mute">{count}</span>
      </Link>
      <p className="mt-0.5 text-[12.5px] text-mute">{note}</p>
      <ul className="mt-3 flex flex-col gap-0.5">
        {picks.map((p) => (
          <li key={p.href}>
            <Link href={p.href} onClick={onGo} className="nav-pick block rounded-[6px] px-2 py-1 text-[13px] text-ink/80 hover:bg-paper-2 hover:text-ink">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({ menu, onGo }: { menu: Menu; onGo: () => void }) {
  if (menu === "components") {
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {LAYERS.map((l) => {
          const list = kitItems.filter((k) => k.layer === l);
          return <Tile key={l} href={`/${list[0].slug}`} title={l} note={LAYER_NOTE[l]} count={list.length} picks={list.slice(0, 4).map((k) => ({ href: `/${k.slug}`, title: k.title }))} onGo={onGo} />;
        })}
        <Link href="/#kit" onClick={onGo} className="nav-tile group relative flex flex-col justify-between overflow-hidden rounded-[10px] bg-ink p-3.5 text-paper">
          <span>
            <span className="text-[14px] font-medium">Variants</span>
            <span className="mt-0.5 block text-[12.5px] text-paper/60">Navbars, sign-in, pricing, footers and more, each with its own motion.</span>
          </span>
          <span className="flex items-end justify-between">
            <span className="display text-[40px] leading-none tabular-nums">{variants.length}</span>
            <span className="nav-arrow mb-1 text-[13px] text-paper/70">Browse →</span>
          </span>
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {KINDS.map((k) => {
        const list = labBlocks.filter((b) => b.kind[0] === k);
        return <Tile key={k} href={list[0] ? `/${list[0].slug}` : "/#components"} title={k} note={KIND_NOTE[k]} count={list.length} picks={list.slice(0, 4).map((b) => ({ href: `/${b.slug}`, title: b.title }))} onGo={onGo} />;
      })}
    </div>
  );
}

/**
 * Site header nav. One pill slides between links (clip-path, no layout), resting on the current
 * section. Components and Motion open a shared panel of tiles on hover, focus or click.
 */
export default function SiteNav() {
  const path = usePathname();
  const current = activeKey(path);
  const list = useRef<HTMLDivElement>(null);
  const links = useRef<Record<string, HTMLElement | null>>({});
  const [pill, setPill] = useState<{ l: number; r: number; on: boolean }>({ l: 0, r: 0, on: false });
  const [menu, setMenuState] = useState<Menu | null>(null);
  // The last opened menu stays rendered while the panel fades out.
  const [last, setLast] = useState<Menu>("components");
  const setMenu = useCallback((next: Menu | null | ((m: Menu | null) => Menu | null)) => {
    setMenuState((m) => {
      const v = typeof next === "function" ? next(m) : next;
      if (v) setLast(v);
      return v;
    });
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const place = useCallback((key: string | null) => {
    const box = list.current;
    const el = key ? links.current[key] : null;
    if (!box || !el) return setPill((p) => ({ ...p, on: false }));
    const w = box.offsetWidth;
    setPill({ l: el.offsetLeft, r: w - el.offsetLeft - el.offsetWidth, on: true });
  }, []);

  useLayoutEffect(() => place(current), [current, place]);
  useEffect(() => {
    const onResize = () => place(current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [current, place]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, setMenu]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const [seen, setSeen] = useState(path);
  if (seen !== path) {
    setSeen(path);
    setMenuState(null);
  }

  const openSoon = (m: Menu | null) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMenu(m), m ? 60 : 160);
  };

  const close = () => {
    setMenu(null);
    place(current);
  };

  return (
    <div
      className="relative hidden lg:block"
      onPointerLeave={() => {
        openSoon(null);
        place(current);
      }}
    >
      <div ref={list} className="relative flex items-center rounded-[10px] p-1">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-1 rounded-[7px] bg-paper-2 transition-[clip-path,opacity] duration-500 ease-expo"
          style={{ clipPath: `inset(0 ${Math.max(0, pill.r - 4)}px 0 ${Math.max(0, pill.l - 4)}px round 7px)`, opacity: pill.on ? 1 : 0 }}
        />
        {ITEMS.map((it) => {
          const on = current === it.key;
          const cls = `relative flex h-8 items-center gap-1 rounded-[7px] px-3 text-[14px] transition-colors duration-300 ${on || menu === it.menu ? "text-ink" : "text-mute hover:text-ink"}`;
          const enter = () => {
            place(it.key);
            openSoon(it.menu ?? null);
          };
          return it.menu ? (
            <button
              key={it.key}
              ref={(el) => void (links.current[it.key] = el)}
              type="button"
              className={cls}
              aria-expanded={menu === it.menu}
              aria-haspopup="true"
              onPointerEnter={enter}
              onFocus={() => place(it.key)}
              onClick={() => setMenu((m) => (m === it.menu ? null : it.menu!))}
            >
              {it.label}
              <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 text-mute transition-transform duration-300 ease-expo ${menu === it.menu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="m3 4.5 3 3 3-3" />
              </svg>
            </button>
          ) : (
            <Link key={it.key} ref={(el) => void (links.current[it.key] = el)} href={it.href} className={cls} aria-current={on ? "page" : undefined} onPointerEnter={enter} onFocus={() => place(it.key)}>
              {it.label}
            </Link>
          );
        })}
      </div>

      <div
        className="nav-panel absolute left-0 top-full w-[760px] pt-2"
        data-open={menu ? "true" : "false"}
        onPointerEnter={() => timer.current && clearTimeout(timer.current)}
      >
        <div className="rounded-[14px] bg-paper p-1.5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent),0_8px_24px_-12px_rgb(0_0_0/0.10)]">
          <div key={last} className="nav-swap">
            <Panel menu={last} onGo={close} />
          </div>
        </div>
      </div>
    </div>
  );
}
