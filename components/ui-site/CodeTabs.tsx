"use client";

import { useLayoutEffect, useRef, useState } from "react";

type File = { name: string; path: string; code: string; html: string };

const PEEK = 320;

/**
 * File tabs with a copy button. `html` is highlighted at build time (lib/ui-highlight.ts).
 * Long files start folded to a 320px peek and open with an eased height; `fill` makes the block fill its parent and
 * scroll inside instead (the Code tab of a preview stage).
 */
export default function CodeTabs({
  files,
  fill = false,
  peek = PEEK,
  wrap: prose = false,
}: {
  files: File[];
  tall?: boolean;
  fill?: boolean;
  /** Folded height in px. */
  peek?: number;
  /** Wrap long lines and hide line numbers (prompts, prose). */
  wrap?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState<number | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);
  const file = files[active];
  const lines = file.code.split("\n").length;
  const long = !fill && (prose ? file.code.length > peek * 3 : lines > Math.floor(peek / 18));

  useLayoutEffect(() => {
    const el = tabs.current[active];
    if (el && files.length > 1) setBar({ x: el.offsetLeft, w: el.offsetWidth });
  }, [active, files.length]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopied(active);
      setTimeout(() => setCopied(null), 1600);
    } catch {}
  }

  // Height can't transition from "auto", so pin the current height in px first, then let React set the target.
  function toggle() {
    const el = body.current;
    const w = wrap.current;
    if (!el || !w) return;
    const h = el.scrollHeight;
    if (open) {
      w.style.height = `${h}px`;
      void w.offsetHeight;
    }
    setFull(h);
    setOpen(!open);
  }

  const done = copied === active;

  return (
    <div className={`ui-dark overflow-hidden rounded-[10px] bg-[#0e0e0f] ${fill ? "flex h-full flex-col rounded-none" : ""}`}>
      <div className="flex shrink-0 items-center justify-between gap-3 bg-paper-2 px-2 py-2">
        <div className="relative flex min-w-0 gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {bar && (
            <span
              aria-hidden
              className="absolute left-0 top-0 h-8 w-px origin-left bg-[#0e0f0d] transition-transform duration-500 ease-expo"
              style={{ transform: `translateX(${bar.x}px) scaleX(${bar.w})` }}
            />
          )}
          {files.map((f, i) => (
            <button
              key={f.path}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              title={f.path}
              onClick={() => {
                setActive(i);
                setOpen(false);
                setFull(null);
              }}
              className={`relative h-8 shrink-0 px-3 font-mono text-[13px] transition-colors duration-300 ${i === active ? `text-ink ${bar ? "" : "bg-[#0e0f0d]"}` : "text-mute hover:text-ink"}`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className={`btn btn-quiet btn-sm shrink-0 ${done ? "btn-on" : ""}`} aria-label={done ? "Copied" : "Copy code"}>
          <CopyIcon done={done} />
          <span className="ui-labels">
            <span data-on={!done}>Copy</span>
            <span data-on={done} aria-hidden={!done}>
              Copied
            </span>
          </span>
        </button>
      </div>
      <div
        ref={wrap}
        className={fill ? "min-h-0 flex-1 overflow-auto [scrollbar-width:thin]" : `relative ${long ? "ui-collapse" : ""}`}
        style={long ? { height: open ? (full ?? "auto") : peek } : undefined}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && open) setFull(null);
        }}
      >
        <div ref={body} key={active} className={`code-block ui-swap ${prose ? "code-wrap" : ""}`} dangerouslySetInnerHTML={{ __html: file.html }} />
        {long && (
          <div
            className={`absolute inset-x-0 bottom-0 flex items-end justify-center pb-4 transition-[opacity,transform] duration-500 ease-expo ${open ? "pointer-events-none h-16" : "h-32 bg-gradient-to-t from-[#0e0f0d] via-[#0e0f0d]/80 to-transparent"}`}
          >
            <button type="button" onClick={toggle} className={`btn btn-quiet btn-sm pointer-events-auto ${open ? "opacity-70 hover:opacity-100" : ""}`}>
              {open ? "Collapse" : prose ? "Expand" : `Expand · ${lines} lines`}
              <span className={`btn-arrow down inline-block transition-transform duration-500 ease-expo ${open ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CopyIcon({ done }: { done: boolean }) {
  return (
    <span className="ui-morph h-3.5 w-3.5" aria-hidden>
      <svg data-on={done} viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m3 8.5 3 3 7-7" />
      </svg>
      <svg data-on={!done} viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="5" width="8.5" height="8.5" />
        <path d="M11 5V2.5H2.5V11H5" />
      </svg>
    </span>
  );
}
