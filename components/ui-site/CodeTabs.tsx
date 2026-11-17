"use client";

import { useState } from "react";

type File = { name: string; path: string; code: string; html: string };

/** File tabs with a copy button. `html` is highlighted at build time (lib/ui-highlight.ts). */
export default function CodeTabs({ files, tall = false }: { files: File[]; tall?: boolean }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const file = files[active];
  const lines = file.code.split("\n").length;
  const long = lines > (tall ? 60 : 28);

  async function copy() {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopied(active);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  }

  return (
    <div className="ui-dark overflow-hidden rounded-[10px] bg-[#0e0e0f]">
      <div className="flex items-center justify-between gap-3 bg-paper-2 px-2 py-2">
        <div className="flex min-w-0 gap-0.5 overflow-x-auto">
          {files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              title={f.path}
              onClick={() => {
                setActive(i);
                setOpen(false);
              }}
              className={`h-8 shrink-0 px-3 font-mono text-[12px] transition-colors ${i === active ? "bg-[#0e0f0d] text-ink" : "text-mute hover:text-ink"}`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          className={`btn btn-quiet btn-sm shrink-0 ${copied === active ? "btn-on" : ""}`}
        >
          <CopyIcon done={copied === active} />
          {copied === active ? "Copied" : "Copy"}
        </button>
      </div>
      <div className={`relative ${long && !open ? (tall ? "max-h-[44rem]" : "max-h-[26rem]") + " overflow-hidden" : ""}`}>
        <div className="code-block" dangerouslySetInnerHTML={{ __html: file.html }} />
        {long && !open && (
          <div className="absolute inset-x-0 bottom-0 flex h-32 items-end justify-center bg-gradient-to-t from-[#0e0f0d] via-[#0e0f0d]/80 to-transparent pb-5">
            <button type="button" onClick={() => setOpen(true)} className="btn btn-quiet btn-sm">
              Show all {lines} lines <span className="btn-arrow down" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CopyIcon({ done }: { done: boolean }) {
  return done ? (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="m3 8.5 3 3 7-7" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="5" y="5" width="8.5" height="8.5" />
      <path d="M11 5V2.5H2.5V11H5" />
    </svg>
  );
}
