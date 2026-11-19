"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Live, Spot } from "@/components/ui-site/Live";
import { KINDS, specimenId, type Kind, type LabMeta } from "@/lib/lab";

/** Filterable catalogue of live components for the UI home. */
export default function UiGrid({ blocks, limit }: { blocks: LabMeta[]; limit?: number }) {
  const [kind, setKind] = useState<Kind | "All">("All");
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return blocks
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => (kind === "All" || b.kind.includes(kind)) && (!term || `${b.title} ${b.description}`.toLowerCase().includes(term)));
  }, [blocks, kind, q]);

  // Filtering or searching always shows every match; the cap only trims the default view.
  const capped = !all && limit !== undefined && kind === "All" && !q.trim() && shown.length > limit;
  const visible = capped ? shown.slice(0, limit) : shown;

  const count = (k: Kind | "All") => (k === "All" ? blocks.length : blocks.filter((b) => b.kind.includes(k)).length);

  return (
    <div className="px-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-[10px] bg-paper-2 p-1">
          {(["All", ...KINDS] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`flex h-8 shrink-0 items-center gap-2 rounded-[7px] px-3.5 text-[14px] font-medium transition-colors duration-300 ${kind === k ? "bg-ink text-paper" : "text-mute hover:text-ink"}`}
            >
              {k}
              <span className={`font-mono text-[11.5px] tabular-nums ${kind === k ? "text-paper/60" : "text-mute/60"}`}>{count(k)}</span>
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search components"
          aria-label="Search components"
          className="h-10 w-full border-b border-line bg-transparent text-[16px] outline-none transition-colors placeholder:text-mute focus:border-accent sm:ml-auto sm:w-64"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map(({ b, i }) => (
          <Spot key={b.slug} className="flex flex-col">
            <div className="ui-dark relative m-1.5 mb-0 aspect-[4/3] overflow-hidden rounded-lg bg-paper-2">
              <Live slug={b.slug} />
            </div>
            <Link href={`/${b.slug}`} className="relative flex items-end justify-between gap-4 px-4 pb-4 pt-4">
              <span className="min-w-0">
                <span className="label flex gap-3 text-mute">
                  <span className="tabular-nums">{specimenId(i)}</span>
                  <span>{b.input.join(" · ")}</span>
                </span>
                <span className="mt-2 block truncate text-[17px] font-medium tracking-[-0.015em]">{b.title}</span>
                <span className="mt-1 line-clamp-2 block text-[14px] leading-snug text-mute">{b.description}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-paper">
                <span className="btn-arrow" />
              </span>
            </Link>
          </Spot>
        ))}
        {shown.length === 0 && <p className="py-10 text-mute">Nothing matches that.</p>}
      </div>
      {capped && (
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={() => setAll(true)} className="btn btn-quiet btn-lg">
            Show all {shown.length} experiments <span className="btn-arrow down" />
          </button>
        </div>
      )}
    </div>
  );
}
