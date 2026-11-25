"use client";

import Link from "next/link";
import { useState } from "react";
import { Fit } from "@/components/ui-site/KitGrid";
import { Live, Spot } from "@/components/ui-site/Live";
import { kitId, kitItems, LAYERS, type Layer } from "@/lib/kit";

/** The organisms on the home timeline, in the order a product meets them. Each gets a one-word stage. */
const STEPS: { slug: string; stage: string; line: string; tall?: boolean }[] = [
  { slug: "ai-chat", stage: "Ask", line: "It starts with a question. The reply streams in word by word, and you can stop it or ask again." },
  { slug: "trace-waterfall", stage: "Watch", line: "The agent runs. Every step lands on one time axis, with tokens, cost and latency beside it." },
  { slug: "kanban", stage: "Plan", line: "Drag the work between columns. The gap opens where the card will land." },
  { slug: "data-table", stage: "Sort", line: "Sort, search and select. Rows slide into place on every change." },
  { slug: "chart-card", stage: "Read", line: "Scrub the numbers with a pointer, a finger or the arrow keys." },
  { slug: "checkout", stage: "Pay", line: "One page from contact to receipt. Totals roll as soon as anything changes.", tall: true },
  { slug: "inbox", stage: "Hear back", line: "Replies land in a list and a reading pane. Star, archive with undo, walk it with j and k." },
];

/**
 * Home §02: the best organisms as a vertical timeline. A rail on the left fills as you scroll (CSS scroll timeline,
 * transform only) and each step lights its node when it reaches the middle of the screen. Text sticks beside a live,
 * scaled-down demo on wide screens and stacks above it on phones.
 */
export default function Timeline() {
  const bySlug = new Map(kitItems.map((k) => [k.slug, k]));
  const steps = STEPS.flatMap((s) => {
    const k = bySlug.get(s.slug);
    return k ? [{ ...s, k }] : [];
  });

  return (
    <div className="px-shell">
      <ol className="ui-tl relative">
        <span aria-hidden className="ui-tl-rail" />
        <span aria-hidden className="ui-tl-fill" />
        {steps.map(({ slug, stage, line, tall, k }, i) => (
          <li key={slug} className="relative grid gap-5 pb-16 pl-12 last:pb-0 sm:pl-16 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-12 lg:pb-24 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <span aria-hidden className="ui-tl-node">
              <span className="font-mono text-[11px] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="ui-tl-on font-mono text-[11px] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            </span>
            <div className="lg:sticky lg:top-24 lg:self-start lg:pt-1">
              <p className="label flex gap-3 text-accent">
                <span>{stage}</span>
                <span className="tabular-nums text-mute">{kitId(slug)}</span>
              </p>
              <h3 className="display mt-3 text-[clamp(1.6rem,2.6vw,2.3rem)] leading-[1.05]">{k.title}</h3>
              <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-2">{line}</p>
              <ul className="mt-5 hidden flex-wrap gap-1.5 sm:flex" aria-label="What's inside">
                {k.parts.slice(0, 5).map((p) => (
                  <li key={p} className="rounded-[6px] bg-paper-2 px-2 py-0.5 font-mono text-[11.5px] text-mute">
                    {p}
                  </li>
                ))}
              </ul>
              <Link href={`/${slug}`} className="btn btn-quiet btn-sm mt-6">
                Open {k.title} <span className="btn-arrow" />
              </Link>
            </div>
            <Spot className="ui-rise">
              <div className={`relative m-1.5 aspect-[4/3] overflow-hidden rounded-lg bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_6%,transparent)] ${tall ? "sm:aspect-[5/4]" : "sm:aspect-[16/10]"}`}>
                <Fit width={880}>
                  <Live slug={slug} />
                </Fit>
              </div>
            </Spot>
          </li>
        ))}
      </ol>
      <KitIndex />
    </div>
  );
}

/** Everything else in the kit, as a plain directory per layer, so the home stays short. */
function KitIndex() {
  const [layer, setLayer] = useState<Layer>("Organisms");
  const items = kitItems.filter((k) => k.layer === layer);
  return (
    <div className="mt-20 rounded-xl bg-paper-2 p-5 sm:p-7">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[17px] font-medium tracking-[-0.015em]">The whole kit, {kitItems.length} components</p>
        <div className="flex max-w-full gap-1 self-start overflow-x-auto rounded-[9px] bg-paper p-1 [scrollbar-width:none] sm:self-auto" role="tablist" aria-label="Layer">
          {LAYERS.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={layer === l}
              onClick={() => setLayer(l)}
              className={`flex h-8 shrink-0 items-center gap-2 rounded-[6px] px-3 text-[14px] font-medium transition-colors duration-200 ${layer === l ? "bg-ink text-paper" : "text-mute hover:text-ink"}`}
            >
              {l}
              <span className={`font-mono text-[11px] tabular-nums ${layer === l ? "text-paper/60" : "text-mute"}`}>{kitItems.filter((k) => k.layer === l).length}</span>
            </button>
          ))}
        </div>
      </div>
      <ul key={layer} className="ui-rise grid gap-x-6 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((k) => (
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
  );
}
