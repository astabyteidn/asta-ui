"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Spot } from "@/components/ui-site/Live";
import { Fit } from "@/components/ui-site/KitGrid";

export type BlogCard = {
  slug: string;
  group: string;
  id: string;
  title: string;
  summary: string;
  meta: string;
  tone: "light" | "dark";
  thumb: ReactNode;
};

export type BlogTab = { id: string; label: string; lead: string };

/** The blog index: topic tabs and a grid of cards in the same style as the kit and motion lab on the home page. */
export default function BlogGrid({ cards, tabs }: { cards: BlogCard[]; tabs: BlogTab[] }) {
  const [tab, setTab] = useState("all");
  const shown = tab === "all" ? cards : cards.filter((c) => c.group === tab);
  const count = (id: string) => (id === "all" ? cards.length : cards.filter((c) => c.group === id).length);
  const lead = tabs.find((t) => t.id === tab)?.lead;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-full gap-1 self-start overflow-x-auto rounded-[10px] bg-paper-2 p-1 [scrollbar-width:none]" role="tablist" aria-label="Topic">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex h-8 shrink-0 items-center gap-2 rounded-[7px] px-3.5 text-[14px] font-medium transition-colors duration-300 ${tab === t.id ? "bg-ink text-paper" : "text-mute hover:text-ink"}`}
            >
              {t.label}
              <span className={`font-mono text-[11.5px] tabular-nums ${tab === t.id ? "text-paper/60" : "text-mute/60"}`}>{count(t.id)}</span>
            </button>
          ))}
        </div>
        {lead && <p className="text-[15px] text-mute sm:text-right">{lead}</p>}
      </div>

      <div key={tab} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((c, n) => (
          <Spot key={c.slug} className="ui-rise flex flex-col" style={{ animationDelay: `${Math.min(n, 5) * 50}ms` }}>
            <div
              className={`relative m-1.5 mb-0 aspect-[4/3] overflow-hidden rounded-lg ${c.tone === "dark" ? "ui-dark bg-paper-2" : "bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]"}`}
            >
              <Fit width={c.tone === "dark" ? 520 : 600}>{c.thumb}</Fit>
            </div>
            <Link href={`/blog/${c.slug}`} className="relative flex flex-1 items-end justify-between gap-4 px-4 pb-4 pt-4">
              <span className="min-w-0">
                <span className="label flex gap-3 text-mute">
                  <span className="shrink-0 tabular-nums">{c.id}</span>
                  <span className="truncate">{c.meta}</span>
                </span>
                <span className="mt-2 block text-[17px] font-medium leading-snug tracking-[-0.015em]">{c.title}</span>
                <span className="mt-1 line-clamp-2 text-[14px] leading-snug text-mute">{c.summary}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-paper">
                <span className="btn-arrow" />
              </span>
            </Link>
          </Spot>
        ))}
      </div>
    </div>
  );
}
