"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Preview / Code switch. Both panels share one stage, so switching never changes the page height: the code panel
 * lies over the stage and scrolls inside it, and the two crossfade while the underline glides.
 */
export default function PreviewTabs({
  id,
  hint,
  preview,
  code,
  tone = "dark",
}: {
  id: string;
  hint: string;
  preview: ReactNode;
  code: ReactNode;
  tone?: "light" | "dark";
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [key, setKey] = useState(0);
  const [out, setOut] = useState(false);
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const el = tabs.current[tab];
    if (el) setBar({ x: el.offsetLeft, w: el.offsetWidth });
  }, [tab]);

  // Replay: a quick fade out, remount, and the live crossfade brings it back.
  function replay() {
    if (out) return;
    setOut(true);
    setTimeout(() => {
      setKey((k) => k + 1);
      setOut(false);
    }, 140);
  }

  return (
    <div>
      <div className="relative mb-4 flex gap-6" role="tablist">
        {(["preview", "code"] as const).map((t) => (
          <button
            key={t}
            ref={(el) => {
              tabs.current[t] = el;
            }}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`relative h-9 text-[15px] font-medium capitalize tracking-[-0.01em] transition-colors duration-300 ${tab === t ? "text-ink" : "text-mute hover:text-ink"} ${!bar && tab === t ? "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent" : ""}`}
          >
            {t}
          </button>
        ))}
        {bar && (
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-0.5 w-px origin-left bg-accent transition-transform duration-500 ease-expo"
            style={{ transform: `translateX(${bar.x}px) scaleX(${bar.w})` }}
          />
        )}
      </div>
      <div
        className={`relative overflow-hidden rounded-xl ${tone === "dark" ? "ui-dark bg-paper-2" : "bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent)]"}`}
      >
        <div className="ui-fade-panel" data-on={tab === "preview"} inert={tab !== "preview"}>
          <div className="flex items-center justify-between px-3 pt-3">
            <span className="label pl-1 tabular-nums text-mute">{id}</span>
            <div className="flex items-center gap-1">
              <span className="label hidden pr-2 text-mute/70 sm:inline">{hint}</span>
              <button type="button" onClick={replay} className="btn btn-quiet btn-sm btn-icon group" aria-label="Replay" title="Replay">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-500 ease-expo group-hover:-rotate-180" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M13 8a5 5 0 1 1-1.6-3.7" />
                  <path d="M13 2.5V5h-2.5" />
                </svg>
              </button>
            </div>
          </div>
          <div
            key={key}
            data-out={out}
            className={`ui-replay relative w-full overflow-hidden ${tone === "dark" ? "h-[min(64svh,540px)] min-h-[380px]" : "min-h-[420px]"}`}
          >
            {preview}
          </div>
        </div>
        <div className="ui-fade-panel absolute inset-0" data-on={tab === "code"} inert={tab !== "code"}>
          {code}
        </div>
      </div>
    </div>
  );
}
