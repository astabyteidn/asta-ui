"use client";

import { useState } from "react";
import Icon from "@/components/icons/Icon";
import { ICONS, svgString, type IconName } from "@/components/icons/icons";

const NAMES = Object.keys(ICONS) as IconName[];

/** Searchable grid of the icon set. Click one to copy its SVG. */
export default function IconGrid() {
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<IconName | null>(null);
  const shown = NAMES.filter((n) => n.includes(q.trim().toLowerCase()));

  const copy = async (n: IconName) => {
    try {
      await navigator.clipboard.writeText(svgString(n));
      setCopied(n);
      setTimeout(() => setCopied((c) => (c === n ? null : c)), 1400);
    } catch {}
  };

  return (
    <div className="mt-10">
      <label className="flex h-11 items-center gap-3 rounded-lg bg-paper-2 px-4 text-mute">
        <Icon name="search" className="h-4 w-4" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${NAMES.length} icons`}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute"
        />
      </label>
      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8 2xl:grid-cols-10">
        {shown.map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => copy(n)}
              aria-label={`Copy ${n} SVG`}
              className="icon-hover group flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl bg-paper-2 text-ink-2 transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,var(--color-paper))] hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span className="grid h-7 w-7 place-items-center transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-active:scale-[.82] group-active:duration-100 motion-reduce:transition-none">
                <Icon key={copied === n ? "c" : "i"} name={copied === n ? "check" : n} className={`h-6 w-6 ${copied === n ? "ic-copied text-brand" : ""}`} />
              </span>
              <span className="max-w-full truncate px-2 font-mono text-[11.5px] text-mute">{copied === n ? "Copied" : n}</span>
            </button>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="py-10 text-center text-[15px] text-mute">No icon called “{q}” yet.</p>}
    </div>
  );
}
