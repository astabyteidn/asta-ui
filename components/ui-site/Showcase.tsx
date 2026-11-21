"use client";

import Link from "next/link";
import { useState } from "react";
import { Live } from "@/components/ui-site/Live";
import type { LabMeta } from "@/lib/lab";

/**
 * One dark stage with a list of picks beside it. Picking one crossfades the stage to that demo, so the home shows a
 * single focused piece at a time instead of a wall of animated cards.
 */
export default function Showcase({ picks }: { picks: LabMeta[] }) {
  const [i, setI] = useState(0);
  const cur = picks[i];
  if (!cur) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible" role="tablist" aria-label="Featured components">
        {picks.map((p, n) => (
          <button
            key={p.slug}
            type="button"
            role="tab"
            aria-selected={n === i}
            onClick={() => setI(n)}
            className={`group/pick relative shrink-0 rounded-[10px] px-4 py-3 text-left transition-colors duration-300 lg:py-3.5 ${n === i ? "bg-paper-2" : "hover:bg-paper-2/60"}`}
          >
            <span className="flex items-baseline gap-3">
              <span className={`font-mono text-[11.5px] tabular-nums transition-colors ${n === i ? "text-accent" : "text-mute"}`}>{String(n + 1).padStart(2, "0")}</span>
              <span className={`whitespace-nowrap text-[16px] font-medium tracking-[-0.01em] transition-colors ${n === i ? "text-ink" : "text-mute group-hover/pick:text-ink"}`}>{p.title}</span>
            </span>
            <span className={`mt-1.5 hidden pl-[34px] text-[13.5px] leading-snug text-mute lg:line-clamp-2 ${n === i ? "" : "lg:hidden"}`}>{p.description}</span>
          </button>
        ))}
      </div>

      <div className="ui-dark relative h-[420px] overflow-hidden rounded-xl bg-paper-2 sm:h-[480px] lg:h-[540px]">
        <div key={cur.slug} className="absolute inset-0">
          <Live slug={cur.slug} eager />
        </div>
        <Link href={`/${cur.slug}`} className="btn btn-sm absolute right-3 top-3 z-10 bg-paper text-ink before:bg-signal hover:text-on-signal">
          Open {cur.title.toLowerCase()}
          <span className="btn-arrow" />
        </Link>
      </div>
    </div>
  );
}
