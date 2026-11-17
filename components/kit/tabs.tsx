"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface Tab {
  value: string;
  label: ReactNode;
  content: ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** `underline` (default): a bar that stretches between tabs. `pill`: a soft slab behind the active tab. */
  variant?: "underline" | "pill";
  label?: string;
  className?: string;
}

/**
 * Tabs whose indicator stretches across the gap before snapping to the new tab (the leading edge moves
 * first, the trailing edge follows), and whose panels cross-fade. Arrows, Home and End move between tabs.
 */
export function Tabs({ tabs, value, defaultValue, onChange, variant = "underline", label, className }: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.value);
  const current = value ?? inner;
  const index = Math.max(0, tabs.findIndex((t) => t.value === current));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const prev = useRef(index);
  const [bar, setBar] = useState<{ l: number; r: number; dir: 1 | -1 } | null>(null);
  const uid = useId();

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[index];
      const box = list.current;
      if (!el || !box) return;
      const dir = index >= prev.current ? 1 : -1;
      prev.current = index;
      setBar({ l: el.offsetLeft, r: box.scrollWidth - el.offsetLeft - el.offsetWidth, dir });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (list.current) ro.observe(list.current);
    return () => ro.disconnect();
  }, [index]);

  const pick = (i: number) => {
    if (value === undefined) setInner(tabs[i].value);
    onChange?.(tabs[i].value);
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    else return;
    e.preventDefault();
    pick(n);
    refs.current[n]?.focus();
  };

  // The edge in the direction of travel moves fast, the other one lags: the bar stretches, then catches up.
  const fast = "cubic-bezier(.16,1,.3,1) 0.32s";
  const slow = "cubic-bezier(.16,1,.3,1) 0.62s";
  const pill = variant === "pill";

  return (
    <div className={className}>
      <div
        ref={list}
        role="tablist"
        aria-label={label}
        className={cx("relative flex overflow-x-auto [scrollbar-width:none]", pill ? "gap-1 rounded-[10px] bg-paper-2 p-1" : "gap-5 sm:gap-6")}
      >
        {!pill && <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]" />}
        {bar && (
          <span
            aria-hidden
            className={cx("absolute motion-reduce:!transition-none", pill ? "top-1 bottom-1 rounded-[7px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]" : "bottom-0 h-0.5 rounded-full bg-ink")}
            style={{
              left: bar.l,
              right: bar.r,
              transition: `left ${bar.dir === 1 ? slow : fast}, right ${bar.dir === 1 ? fast : slow}`,
            }}
          />
        )}
        {tabs.map((t, i) => {
          const on = i === index;
          return (
            <button
              key={t.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${uid}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${uid}-panel-${i}`}
              tabIndex={on ? 0 : -1}
              onClick={() => pick(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={cx(
                "relative z-10 inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[14px] font-medium tracking-[-0.01em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent/50",
                pill ? "h-8 rounded-[7px] px-3.5" : "h-11 rounded-md",
                on ? "text-ink" : "text-mute hover:text-ink",
              )}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cx(
                    "rounded-[5px] px-1.5 text-[11px] leading-[18px] tabular-nums transition-colors duration-300",
                    on ? "bg-accent text-white" : "bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] text-mute",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <style>{`@keyframes kit-tab-in { from { opacity: 0; transform: translateY(6px); filter: blur(2px) } to { opacity: 1; transform: none; filter: none } }
@media (prefers-reduced-motion: reduce) { .kit-tab-panel { animation: none !important } }`}</style>
      {tabs.map((t, i) =>
        i === index ? (
          <div
            key={t.value}
            id={`${uid}-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${i}`}
            tabIndex={0}
            className="kit-tab-panel pt-5 outline-none animate-[kit-tab-in_.45s_cubic-bezier(.16,1,.3,1)_both]"
          >
            {t.content}
          </div>
        ) : null,
      )}
    </div>
  );
}

export default Tabs;
