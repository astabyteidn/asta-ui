"use client";

import { memo, useCallback, useDeferredValue, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type Ref } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS, svgString, type IconName } from "@/components/icons/icons";
import { ICON_GROUPS } from "@/components/icons/groups";
import { WORLD_GROUPS } from "@/components/icons/icons-world";

type Group = { name: string; slug: string; icons: IconName[] };
type ToastHandle = { show: (name: string) => void };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Every icon lands in exactly one group, in display order. Unlisted ones fall into "More". */
const GROUPS: Group[] = (() => {
  const seen = new Set<string>();
  const out: Group[] = [];
  for (const [name, list] of Object.entries({ ...ICON_GROUPS, ...WORLD_GROUPS })) {
    const icons: IconName[] = [];
    for (const n of list) {
      if (n in ICONS && !seen.has(n)) {
        seen.add(n);
        icons.push(n as IconName);
      }
    }
    if (icons.length) out.push({ name, slug: slugify(name), icons });
  }
  const rest = (Object.keys(ICONS) as IconName[]).filter((n) => !seen.has(n));
  if (rest.length) out.push({ name: "More", slug: "more", icons: rest });
  return out;
})();

const TOTAL = Object.keys(ICONS).length;
const SIZE = { min: 16, max: 32, step: 2, initial: 24 };
const STROKE = { min: 1.25, max: 2.25, step: 0.25, initial: 1.75 };

/**
 * The icon browser: search, sticky category chips, size and stroke sliders, click to copy.
 * Performance: the sliders only set CSS variables on the grid (no React render per input),
 * search is deferred, off-screen sections skip layout with content-visibility, and
 * everything past the first two sections mounts after the first paint.
 */
export default function IconGrid() {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim().toLowerCase());
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<ToastHandle>(null);
  const style = useRef({ size: SIZE.initial, stroke: STROKE.initial });

  // Mount the rest of the sections once the first screen has painted.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const id = requestAnimationFrame(() => {
      t = setTimeout(() => setFull(true), 0);
    });
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, []);

  // "/" jumps to search.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t?.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = useMemo(() => {
    if (!query) return GROUPS;
    return GROUPS.map((g) => (g.name.toLowerCase().includes(query) ? g : { ...g, icons: g.icons.filter((n) => n.includes(query)) })).filter(
      (g) => g.icons.length,
    );
  }, [query]);
  const total = shown.reduce((s, g) => s + g.icons.length, 0);
  const visible = full || query ? shown : shown.slice(0, 2);

  const setVar = (key: "size" | "stroke", v: number) => {
    style.current[key] = v;
    const el = rootRef.current;
    if (!el) return;
    el.style.setProperty(key === "size" ? "--ic-size" : "--ic-stroke", key === "size" ? `${v}px` : String(v));
    const out = el.querySelector<HTMLOutputElement>(`output[data-for="${key}"]`);
    if (out) out.textContent = key === "size" ? `${v}px` : v.toFixed(2);
  };

  const copy = useCallback(async (btn: HTMLButtonElement) => {
    const name = btn.dataset.name as IconName;
    const { size, stroke } = style.current;
    try {
      await navigator.clipboard.writeText(svgString(name, size).replace('stroke-width="1.75"', `stroke-width="${stroke}"`));
    } catch {
      return;
    }
    btn.dataset.copied = "";
    setTimeout(() => delete btn.dataset.copied, 1400);
    toastRef.current?.show(name);
  }, []);

  // One click handler for every tile.
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-name]");
    if (btn) copy(btn);
  };

  // Arrow keys move between tiles in a section. Layout is read only on key press.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-name]");
    const list = btn?.closest("ul");
    if (!btn || !list) return;
    const tiles = Array.from(list.querySelectorAll<HTMLButtonElement>("button[data-name]"));
    const i = tiles.indexOf(btn);
    const cols = getComputedStyle(list).gridTemplateColumns.split(" ").length;
    const moves: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, ArrowUp: i - cols, ArrowDown: i + cols, Home: 0, End: tiles.length - 1 };
    const target = e.key in moves ? tiles[moves[e.key]] : undefined;
    if (target) {
      e.preventDefault();
      target.focus();
    }
  };

  return (
    <div ref={rootRef} className="mt-10" style={{ "--ic-size": `${SIZE.initial}px`, "--ic-stroke": String(STROKE.initial) } as CSSProperties}>
      <div className="sticky top-14 z-20 -mx-[var(--gutter)] bg-paper px-[var(--gutter)] pb-3 pt-3.5 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-6 after:bg-gradient-to-b after:from-paper after:to-transparent before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-6 before:bg-paper">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg bg-paper-2 px-4 text-mute focus-within:outline-2 focus-within:outline-brand">
            <Icon name="search" className="h-4 w-4" />
            <input
              ref={searchRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${TOTAL} icons`}
              aria-label="Search icons"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
            />
            {q ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="grid h-6 w-6 place-items-center rounded-md hover:text-ink"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="kbd rounded-[5px]">/</kbd>
            )}
          </label>
          <div className="hidden gap-2 sm:flex lg:gap-3">
            <Slider id="size" label="Size" {...SIZE} format={(v) => `${v}px`} onInput={(v) => setVar("size", v)} />
            <Slider id="stroke" label="Stroke" {...STROKE} format={(v) => v.toFixed(2)} onInput={(v) => setVar("stroke", v)} />
          </div>
        </div>
        <Chips groups={shown} />
      </div>

      <div onClick={onClick} onKeyDown={onKeyDown}>
        {visible.map((g, i) => (
          <Section key={g.slug} group={g} index={i} />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {query ? `${total} icons match` : ""}
      </p>
      {total === 0 && <p className="py-16 text-center text-[15px] text-mute">No icon called “{q}” yet.</p>}
      <Toast ref={toastRef} />
    </div>
  );
}

/** A range input. It restyles the grid through a CSS variable and updates its own readout, without a React render. */
function Slider({
  id,
  label,
  min,
  max,
  step,
  initial,
  format,
  onInput,
}: {
  id: "size" | "stroke";
  label: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  format: (v: number) => string;
  onInput: (v: number) => void;
}) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg bg-paper-2 px-3.5 lg:w-56 lg:flex-none">
      <span className="text-[13px] text-mute">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        defaultValue={initial}
        onInput={(e) => onInput(Number(e.currentTarget.value))}
        className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--color-brand)]"
        aria-label={`Icon ${label.toLowerCase()}`}
      />
      <output data-for={id} className="w-9 text-right font-mono text-[12px] tabular-nums text-ink-2">
        {format(initial)}
      </output>
    </label>
  );
}

/** Category chips. The chip for the section in view lights up through an IntersectionObserver, no scroll handler. */
function Chips({ groups }: { groups: Group[] }) {
  const [active, setActive] = useState<string | undefined>(groups[0]?.slug);
  const key = groups.map((g) => g.slug).join();

  useEffect(() => {
    const order = key.split(",");
    const inView = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) inView.set((e.target as HTMLElement).dataset.slug ?? "", e.isIntersecting);
        // The last section in the band is the one whose heading the reader just passed.
        const current = order.findLast((s) => inView.get(s));
        if (current) setActive(current);
      },
      { rootMargin: "-200px 0px -60% 0px" },
    );
    // Sections past the first two mount a frame later, so observe them after that.
    const t = setTimeout(() => document.querySelectorAll("section[data-slug]").forEach((s) => io.observe(s)), 60);
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, [key]);

  return (
    <nav aria-label="Icon categories" className="-mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 py-0.5 [mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)] [scrollbar-width:none]">
      {groups.map((g) => (
        <a
          key={g.slug}
          href={`#icons-${g.slug}`}
          onClick={(e) => {
            e.preventDefault();
            setActive(g.slug);
            const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
            document.getElementById(`icons-${g.slug}`)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
          }}
          aria-current={active === g.slug ? "true" : undefined}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-paper-2 px-3 text-[13px] text-ink-2 transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand aria-[current]:bg-ink aria-[current]:text-paper"
        >
          {g.name}
          <span className="font-mono text-[11px] tabular-nums opacity-60">{g.icons.length}</span>
        </a>
      ))}
    </nav>
  );
}

/** One category. content-visibility lets the browser skip its layout and paint while it is off screen. */
const Section = memo(function Section({ group, index }: { group: Group; index: number }) {
  return (
    <section
      id={`icons-${group.slug}`}
      data-slug={group.slug}
      aria-labelledby={`icons-${group.slug}-h`}
      className="scroll-mt-56 pt-10 [contain-intrinsic-size:auto_520px] [content-visibility:auto] lg:scroll-mt-44"
    >
      <div className="flex items-baseline gap-3">
        <span className="label tabular-nums text-accent">§ {String(index + 1).padStart(2, "0")}</span>
        <h2 id={`icons-${group.slug}-h`} className="text-[20px] font-medium tracking-[-0.01em]">
          {group.name}
        </h2>
        <span className="font-mono text-[12px] tabular-nums text-mute">{group.icons.length}</span>
      </div>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
        {group.icons.map((n) => (
          <Tile key={n} name={n} />
        ))}
      </ul>
    </section>
  );
});

const Tile = memo(function Tile({ name }: { name: IconName }) {
  return (
    <li>
      <button
        type="button"
        data-name={name}
        aria-label={`Copy ${name} SVG`}
        title={name}
        className="icon-hover group flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl bg-paper-2 text-ink-2 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,var(--color-paper))] hover:text-ink focus-visible:outline-2 focus-visible:outline-brand data-[copied]:text-brand"
      >
        <span className="grid h-8 w-8 place-items-center transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-active:scale-[.82] group-active:duration-100 motion-reduce:transition-none">
          <Icon name={name} className="h-[var(--ic-size)] w-[var(--ic-size)] [stroke-width:var(--ic-stroke)]" />
        </span>
        <span className="max-w-full truncate px-2 font-mono text-[11px] text-mute group-data-[copied]:hidden">{name}</span>
        <span className="hidden font-mono text-[11px] text-brand group-data-[copied]:block">Copied</span>
      </button>
    </li>
  );
});

/** "Copied" toast. It owns its state, so a copy never re-renders the grid. */
function Toast({ ref }: { ref: Ref<ToastHandle> }) {
  const [msg, setMsg] = useState<{ name: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useImperativeHandle(ref, () => ({
    show(name) {
      clearTimeout(timer.current);
      setMsg({ name, id: Date.now() });
      timer.current = setTimeout(() => setMsg(null), 1800);
    },
  }));
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {msg && (
        <p
          key={msg.id}
          className="flex items-center gap-2.5 rounded-lg bg-ink px-4 py-2.5 text-[14px] text-paper shadow-[0_8px_30px_rgb(0_0_0/0.18)] motion-safe:animate-[ui-pop_.35s_cubic-bezier(.16,1,.3,1)_both]"
        >
          <Icon name="check" className="h-4 w-4" />
          Copied <span className="font-mono text-[13px]">{msg.name}.svg</span>
        </p>
      )}
    </div>
  );
}
