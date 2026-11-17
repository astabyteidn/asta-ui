"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export interface FrameworkTab {
  id: string;
  label: string;
  content: ReactNode;
}

/** Framework switch for the installation guide: a sliding underline and a short fade between panels. */
export default function FrameworkTabs({ tabs }: { tabs: FrameworkTab[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const el = refs.current[active];
    if (el) setBar({ x: el.offsetLeft, w: el.offsetWidth });
  }, [active]);

  return (
    <div className="not-prose my-6">
      <div role="tablist" aria-label="Framework" className="relative flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none]">
        {bar && (
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] w-px origin-left bg-accent transition-transform duration-500 ease-expo"
            style={{ transform: `translateX(${bar.x}px) scaleX(${bar.w})` }}
          />
        )}
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`fw-${t.id}`}
            onClick={() => setActive(i)}
            className={`h-9 shrink-0 rounded-[6px] px-3 text-[15px] transition-colors duration-300 ${i === active ? "text-ink" : "text-mute hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.id} id={`fw-${t.id}`} role="tabpanel" hidden={i !== active} className={i === active ? "ui-swap pt-6" : undefined}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
