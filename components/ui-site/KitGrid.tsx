"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Live, Spot } from "@/components/ui-site/Live";
import { kitId, kitItems, LAYERS, type Layer } from "@/lib/kit";

/** Renders a demo at a fixed design width and scales it down to the card, so big demos still read as thumbnails. */
export function Fit({ width, children }: { width: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setS(Math.min(1, e.contentRect.width / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={box} className="absolute inset-0 overflow-hidden">
      {s > 0 && (
        <div className="absolute left-0 top-0 flex items-center justify-center" style={{ width, height: `${100 / s}%`, transform: `scale(${s})`, transformOrigin: "0 0" }}>
          {children}
        </div>
      )}
    </div>
  );
}

const BLURB: Record<Layer, string> = {
  Atoms: "The smallest pieces: buttons, inputs, toggles, badges.",
  Molecules: "Atoms working together: radio groups, selects, menus, toasts.",
  Organisms: "Whole sections you can drop into a page: a navbar, a sign-in, pricing.",
};

/** The kit on the UI home: tabs per layer and a grid of live, scaled-down demos. */
export default function KitGrid() {
  const [layer, setLayer] = useState<Layer>("Atoms");
  const items = kitItems.filter((k) => k.layer === layer);
  const wide = layer === "Organisms";
  // Live demos for the first few, then the rest of the layer as a plain directory: the page stays short.
  const live = items.slice(0, wide ? 4 : 6);
  const rest = items.slice(live.length);

  return (
    <div className="px-shell">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-full gap-1 self-start overflow-x-auto rounded-[10px] bg-paper-2 p-1 [scrollbar-width:none]" role="tablist" aria-label="Layer">
          {LAYERS.map((l, i) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={layer === l}
              onClick={() => setLayer(l)}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-[7px] px-4 text-[15px] font-medium transition-colors duration-300 ${layer === l ? "bg-ink text-paper" : "text-mute hover:text-ink"}`}
            >
              <span className={`font-mono text-[11.5px] ${layer === l ? "text-paper/55" : "text-mute"}`}>0{i + 1}</span>
              {l}
              <span className={`font-mono text-[11.5px] tabular-nums ${layer === l ? "text-paper/55" : "text-mute"}`}>{kitItems.filter((k) => k.layer === l).length}</span>
            </button>
          ))}
        </div>
        <p className="text-[15px] text-mute">{BLURB[layer]}</p>
      </div>

      <div key={layer} className={`grid gap-3 sm:grid-cols-2 ${wide ? "" : "xl:grid-cols-3"}`}>
        {live.map((k, n) => (
          <Spot key={k.slug} className="ui-rise flex flex-col" style={{ animationDelay: `${n * 50}ms` }}>
            <div className={`relative m-1.5 mb-0 overflow-hidden rounded-lg bg-paper ${wide ? "aspect-[16/10]" : "aspect-[4/3]"} shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]`}>
              <Fit width={wide ? 820 : 680}>
                <Live slug={k.slug} />
              </Fit>
            </div>
            <Link href={`/${k.slug}`} className="relative flex items-end justify-between gap-4 px-4 pb-4 pt-4">
              <span className="min-w-0">
                <span className="label flex gap-3 text-mute">
                  <span className="shrink-0 tabular-nums">{kitId(k.slug)}</span>
                  <span className="truncate">{k.parts.slice(0, 3).join(" · ")}</span>
                </span>
                <span className="mt-2 block truncate text-[17px] font-medium tracking-[-0.015em]">{k.title}</span>
                <span className="mt-1 line-clamp-2 block text-[14px] leading-snug text-mute">{k.description}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-paper">
                <span className="btn-arrow" />
              </span>
            </Link>
          </Spot>
        ))}
      </div>

      {rest.length > 0 && (
        <div key={`${layer}-rest`} className="ui-rise mt-3 rounded-xl bg-paper-2 p-5 sm:p-6">
          <p className="label mb-4 flex justify-between text-mute">
            Also in {layer.toLowerCase()} <span className="tabular-nums">{rest.length}</span>
          </p>
          <ul className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.map((k) => (
              <li key={k.slug}>
                <Link href={`/${k.slug}`} className="group/dir flex items-baseline gap-3 rounded-[7px] py-1.5 text-[15px] text-ink-2 transition-colors hover:text-ink">
                  <span className="w-[52px] shrink-0 font-mono text-[11px] tabular-nums text-mute transition-colors group-hover/dir:text-accent">{kitId(k.slug)}</span>
                  <span className="truncate">{k.title}</span>
                  <span className="btn-arrow ml-auto opacity-0 transition-opacity group-hover/dir:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
