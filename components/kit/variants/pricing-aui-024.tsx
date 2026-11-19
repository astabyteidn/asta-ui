"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface PricingTiersProps {
  /** Three or four tiers, shown as rows. */
  tiers?: { id: string; name: string; description: string; price: number; tag?: string }[];
  title?: string;
  /** Line under the title, e.g. the workspace and its size. */
  subtitle?: string;
  /** Initials in the avatar next to the title. Empty hides it. */
  initials?: string;
  currency?: string;
  /** Suffix after the price, e.g. "/ mo". */
  period?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Called with the chosen tier id when the button is pressed. */
  onContinue?: (id: string) => void;
  ctaLabel?: string;
  /** Glide the ring to the next row and back once after mount. */
  hint?: boolean;
  className?: string;
}

const TIERS: NonNullable<PricingTiersProps["tiers"]> = [
  { id: "hobby", name: "Hobby", description: "1 project, community support", price: 0 },
  { id: "pro", name: "Pro", description: "10 projects, analytics, custom domain", price: 19, tag: "Popular" },
  { id: "team", name: "Team", description: "Unlimited projects, roles, 10 seats", price: 49 },
  { id: "scale", name: "Scale", description: "SSO, audit log, 99.9% uptime SLA", price: 149 },
];

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

const CSS = `
@keyframes aui-tiers-rise { from { opacity: 0; transform: translateY(10px) } }
.aui-tiers-rise { animation: aui-tiers-rise .6s cubic-bezier(.16,1,.3,1) both }
@media (prefers-reduced-motion: reduce) { .aui-tiers-rise { animation: none } .aui-tiers-move { transition: none !important } }
`;

function RollChar({ c, delay }: { c: string; delay: number }) {
  if (!/\d/.test(c)) return <span className="inline-block">{c}</span>;
  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
      <span
        className={cx("aui-tiers-move absolute inset-x-0 top-0 flex flex-col transition-transform duration-700", EASE)}
        style={{ transform: `translateY(${-Number(c) * 10}%)`, transitionDelay: `${delay}ms` }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block h-[1em] text-center leading-[1em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function Roll({ text }: { text: string }) {
  const chars = text.split("");
  return (
    <span aria-hidden className="inline-flex tabular-nums">
      {chars.map((c, i) => (
        <RollChar key={chars.length - i} c={c} delay={(chars.length - 1 - i) * 60} />
      ))}
    </span>
  );
}

/** Four rising bars, filled up to the tier's level. */
function Level({ level, on }: { level: number; on: boolean }) {
  return (
    <span aria-hidden className="flex h-4 items-end gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cx("block w-[3px] rounded-[1px] transition-colors duration-500", i < level ? (on ? "bg-brand" : "bg-ink") : "bg-ink/15")}
          style={{ height: `${40 + i * 20}%`, transitionDelay: on ? `${i * 50}ms` : "0ms" }}
        />
      ))}
    </span>
  );
}

/** aui-024 · Tiers as rows in a radio group: a brand ring glides to the choice and the total rolls in a dark dock below. */
export function PricingTiers({
  tiers = TIERS,
  title = "Choose a plan",
  subtitle = "Astabyte · 12 members",
  initials = "NS",
  currency = "$",
  period = "/ mo",
  defaultValue,
  onChange,
  onContinue,
  ctaLabel = "Continue",
  hint = false,
  className,
}: PricingTiersProps) {
  const [value, setValue] = useState(defaultValue ?? tiers[1]?.id ?? tiers[0]?.id ?? "");
  const list = useRef<HTMLDivElement>(null);
  const rows = useRef<Record<string, HTMLButtonElement | null>>({});
  const touched = useRef(false);
  const [ring, setRing] = useState({ y: 0, h: 0, ready: false });
  const [armed, setArmed] = useState(false);

  const measure = useCallback(() => {
    const el = rows.current[value];
    if (el) setRing({ y: el.offsetTop, h: el.offsetHeight, ready: true });
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hint || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = tiers.findIndex((t) => t.id === (defaultValue ?? tiers[1]?.id));
    const next = tiers[(start + 1) % tiers.length]?.id;
    const back = tiers[start]?.id;
    if (!next || !back) return;
    const a = setTimeout(() => !touched.current && setValue(next), 1300);
    const b = setTimeout(() => !touched.current && setValue(back), 2300);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [hint, tiers, defaultValue]);

  function choose(id: string, focus = false) {
    touched.current = true;
    setValue(id);
    onChange?.(id);
    if (focus) rows.current[id]?.focus();
  }

  function onKey(e: KeyboardEvent, i: number) {
    const n = tiers.length;
    let j = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (i + 1) % n;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (i - 1 + n) % n;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    const t = tiers[j];
    if (t) choose(t.id, true);
  }

  const index = Math.max(0, tiers.findIndex((t) => t.id === value));
  const current = tiers[index];
  const rise = (n: number) => ({ animationDelay: `${80 + n * 55}ms` });

  return (
    <div
      className={cx(
        "w-full max-w-[460px] rounded-[16px] bg-paper p-2 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_24px_48px_-24px_rgb(0_0_0/0.35)]",
        className,
      )}
    >
      <div className="aui-tiers-rise flex items-center gap-3 px-4 pb-4 pt-4" style={rise(0)}>
        {initials && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold tracking-[0.02em] text-paper">{initials}</span>}
        <div className="min-w-0">
          <h3 className="text-[20px] font-medium leading-tight tracking-[-0.02em]">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-[13px] text-mute">{subtitle}</p>}
        </div>
      </div>

      <div ref={list} role="radiogroup" aria-label={title} className="relative flex flex-col gap-1">
        <span
          aria-hidden
          className={cx(
            "aui-tiers-move pointer-events-none absolute inset-x-0 top-0 rounded-[11px] shadow-[inset_0_0_0_1.5px_var(--color-brand),0_10px_24px_-14px_var(--color-brand)]",
            armed && "transition-transform duration-[600ms]",
            EASE,
            ring.ready ? "opacity-100" : "opacity-0",
          )}
          style={{ transform: `translateY(${ring.y}px)`, height: ring.h, background: "color-mix(in srgb, var(--color-brand) 5%, var(--color-paper))" }}
        />
        {tiers.map((t, i) => {
          const on = t.id === value;
          return (
            <button
              key={t.id}
              ref={(el) => {
                rows.current[t.id] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cx(
                "aui-tiers-rise group relative flex w-full items-center gap-3.5 rounded-[11px] px-4 py-3.5 text-left outline-none transition-[background-color,transform] duration-300 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                EASE,
                !on && "hover:bg-ink/[0.03]",
              )}
              style={rise(1 + i)}
            >
              <Level level={Math.min(4, i + 1)} on={on} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[14.5px] font-medium tracking-[-0.01em]">
                  {t.name}
                  {t.tag && <span className="rounded-[4px] bg-brand px-1.5 text-[10.5px] font-medium leading-[18px] text-white">{t.tag}</span>}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-mute">{t.description}</span>
              </span>
              <span className={cx("shrink-0 text-right transition-transform duration-500", EASE, on ? "-translate-x-0.5" : "translate-x-0")}>
                <span className="text-[16px] font-medium tracking-[-0.03em] tabular-nums">{t.price === 0 ? "Free" : `${currency}${t.price}`}</span>
                {t.price > 0 && <span className="ml-1 text-[12px] text-mute">{period}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="aui-tiers-rise mt-2 flex items-center justify-between gap-4 rounded-[12px] bg-ink px-4 py-3.5 text-paper" style={rise(2 + tiers.length)}>
        <div className="min-w-0" aria-live="polite">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-paper/50">Due today</p>
          <p className="mt-1 flex items-start font-medium leading-none tracking-[-0.04em]">
            <span className="mr-0.5 mt-0.5 text-[14px] text-paper/70">{currency}</span>
            <span className="text-[28px]">
              <Roll text={String(current?.price ?? 0)} />
            </span>
            <span className="sr-only">
              {current?.name}, {currency}
              {current?.price} {period}
            </span>
            <span aria-hidden className="ml-2 self-end pb-0.5 text-[12px] font-normal tracking-normal text-paper/50">
              <span key={current?.id} className="aui-tiers-rise inline-block">
                {current?.name} {period}
              </span>
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => current && onContinue?.(current.id)}
          className={cx(
            "group inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-brand px-4 text-[13.5px] font-medium text-white shadow-[0_10px_24px_-12px_var(--color-brand)] outline-none transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
            EASE,
          )}
        >
          {ctaLabel}
          <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5", EASE)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </button>
      </div>
      <style href="asta-pricing-aui-024" precedence="asta">{CSS}</style>
    </div>
  );
}

export default PricingTiers;
