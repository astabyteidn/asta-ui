"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface SinglePlanProps {
  /** Plan name, set in a serif display face. */
  name?: string;
  /** Small line above the name. */
  eyebrow?: string;
  description?: string;
  /** Price per month for each billing period. */
  price?: { monthly: number; yearly: number };
  currency?: string;
  /** Badge on the yearly option, e.g. "−20%". */
  saving?: string;
  defaultYearly?: boolean;
  included?: string[];
  cta?: { label: string; href: string };
  /** Small print under the button. */
  note?: string;
  /** The painting on the side of the card. */
  image?: string;
  imageAlt?: string;
  /** Credit shown on the painting. Empty hides it. */
  imageCaption?: string;
  /** Flip to yearly once after mount, to show the price roll. */
  hint?: boolean;
  className?: string;
}

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

const CSS = `
@keyframes aui-splan-rise { from { opacity: 0; transform: translateY(10px) } }
@keyframes aui-splan-art { from { opacity: 0; transform: scale(1.06) } }
.aui-splan-rise { animation: aui-splan-rise .7s cubic-bezier(.16,1,.3,1) both }
.aui-splan-art { animation: aui-splan-art 1.4s cubic-bezier(.16,1,.3,1) both }
@media (prefers-reduced-motion: reduce) {
  .aui-splan-rise, .aui-splan-art { animation: none }
  .aui-splan-parallax, .aui-splan-digit { transition: none !important; transform: none }
}
`;

function RollDigit({ d, delay }: { d: number; delay: number }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
      <span
        className={cx("aui-splan-digit absolute inset-x-0 top-0 flex flex-col transition-transform duration-700", EASE)}
        style={{ transform: `translateY(${-d * 10}%)`, transitionDelay: `${delay}ms` }}
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

function Roll({ value }: { value: number }) {
  const digits = String(Math.max(0, Math.round(value))).split("").map(Number);
  return (
    <span className="inline-flex tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex">
        {digits.map((d, i) => (
          <RollDigit key={digits.length - i} d={d} delay={(digits.length - 1 - i) * 80} />
        ))}
      </span>
    </span>
  );
}

/** aui-022 · A single plan on a painted card: a serif name beside a slow-settling painting with pointer parallax, and a price that rolls when billing flips. */
export function SinglePlan({
  name = "Astabyte",
  eyebrow = "One plan, everything in it",
  description = "Boards, docs and client portals for small studios. One price, every feature.",
  price = { monthly: 29, yearly: 23 },
  currency = "$",
  saving = "−20%",
  defaultYearly = false,
  included = ["Unlimited projects and client portals", "Up to 25 members", "A year of version history", "Custom domain and branding"],
  cta = { label: "Start a 14-day trial", href: "#" },
  note = "No card needed. Cancel any time.",
  image = "/lab/art/parasol.webp",
  imageAlt = "Claude Monet, Woman with a Parasol: a woman on a grassy hill under a bright, windy sky.",
  imageCaption = "Monet, Woman with a Parasol, 1875",
  hint = false,
  className,
}: SinglePlanProps) {
  const [yearly, setYearly] = useState(defaultYearly);
  const touched = useRef(false);
  const art = useRef<HTMLDivElement>(null);
  const opts = useRef<(HTMLButtonElement | null)[]>([]);
  const amount = yearly ? price.yearly : price.monthly;

  useEffect(() => {
    if (!hint || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      if (!touched.current) setYearly(true);
    }, 1800);
    return () => clearTimeout(t);
  }, [hint]);

  function choose(y: boolean, focus = false) {
    touched.current = true;
    setYearly(y);
    if (focus) opts.current[y ? 1 : 0]?.focus();
  }

  function onKey(e: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      choose(!yearly, true);
    }
  }

  function parallax(e: PointerEvent<HTMLDivElement>) {
    const el = art.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translate3d(${x * -14}px, ${y * -10}px, 0) scale(1.05)`;
  }

  const rise = (n: number) => ({ animationDelay: `${120 + n * 55}ms` });

  return (
    <div
      onPointerMove={parallax}
      onPointerLeave={() => {
        if (art.current) art.current.style.transform = "";
      }}
      className={cx(
        "@container w-full max-w-[760px] rounded-[16px] bg-paper p-2 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent),0_1px_2px_rgb(0_0_0/0.05),0_30px_60px_-28px_rgb(0_0_0/0.45)]",
        className,
      )}
    >
      <div className="grid gap-2 @min-[620px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div className="relative h-[220px] overflow-hidden rounded-[11px] @min-[620px]:h-auto">
          <div ref={art} className={cx("aui-splan-parallax absolute -inset-3 transition-transform duration-[900ms]", EASE)}>
            <img src={image} alt={imageAlt} loading="lazy" decoding="async" className="aui-splan-art h-full w-full object-cover object-[50%_30%]" />
          </div>
          {imageCaption && (
            <span className="aui-splan-rise absolute bottom-3 left-3 rounded-[6px] bg-paper/85 px-2 py-1 text-[11px] text-ink-2 backdrop-blur-sm" style={rise(10)}>
              {imageCaption}
            </span>
          )}
        </div>

        <div className="flex flex-col px-4 pb-4 pt-5 @min-[620px]:px-6 @min-[620px]:pb-6 @min-[620px]:pt-7">
          <p className="aui-splan-rise text-[13px] text-mute" style={rise(0)}>
            {eyebrow}
          </p>
          <h3 className="aui-splan-rise mt-2 font-serif text-[44px] font-normal leading-[1.02] tracking-[-0.02em] @min-[620px]:text-[50px]" style={rise(1)}>
            {name}
          </h3>
          <p className="aui-splan-rise mt-3 max-w-[34ch] text-[14px] leading-relaxed text-mute" style={rise(2)}>
            {description}
          </p>

          <div className="aui-splan-rise mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3" style={rise(3)}>
            <div>
              <div className="flex items-end gap-2">
                <span className="flex items-start font-medium leading-none tracking-[-0.045em]">
                  <span className="mr-0.5 mt-1 text-[18px]">{currency}</span>
                  <span className="text-[48px]">
                    <Roll value={amount} />
                  </span>
                </span>
                <span className="relative pb-1.5 text-[13px] text-mute">
                  <span
                    aria-hidden={!yearly}
                    className={cx("absolute bottom-[26px] left-0 whitespace-nowrap text-[12px] line-through decoration-ink/40 transition-[opacity,transform] duration-500", EASE, yearly ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0")}
                  >
                    {currency}
                    {price.monthly}
                  </span>
                  / month
                </span>
              </div>
              <p className="mt-1.5 h-4 text-[12px] text-mute" aria-live="polite">
                <span key={String(yearly)} className="aui-splan-rise inline-block">
                  {yearly ? `${currency}${price.yearly * 12} billed once a year` : "Billed monthly"}
                </span>
              </p>
            </div>

            <div role="radiogroup" aria-label="Billing period" className="relative grid grid-cols-2 rounded-[10px] bg-paper-2 p-1">
              <span
                aria-hidden
                className={cx(
                  "absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-[7px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.1),0_0_0_1px_color-mix(in_srgb,var(--color-ink)_7%,transparent)] transition-transform duration-500",
                  EASE,
                  yearly ? "translate-x-full" : "translate-x-0",
                )}
              />
              {(["Monthly", "Yearly"] as const).map((label, i) => {
                const on = yearly === (i === 1);
                return (
                  <button
                    key={label}
                    ref={(el) => {
                      opts.current[i] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    onClick={() => choose(i === 1)}
                    onKeyDown={onKey}
                    className={cx(
                      "relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-[7px] px-3.5 text-[13px] font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand/50",
                      on ? "text-ink" : "text-mute hover:text-ink",
                    )}
                  >
                    {label}
                    {i === 1 && saving && <span className="rounded-[4px] bg-brand/10 px-1 text-[10.5px] leading-[16px] text-brand">{saving}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <a
            href={cta.href}
            className={cx(
              "aui-splan-rise group mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-brand text-[14px] font-medium text-white shadow-[0_10px_24px_-12px_var(--color-brand)] outline-none transition-[transform,box-shadow] duration-300 hover:-translate-y-px hover:shadow-[0_14px_28px_-12px_var(--color-brand)] active:translate-y-0 active:scale-[.985] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              EASE,
            )}
            style={rise(4)}
          >
            {cta.label}
            <svg viewBox="0 0 16 16" className={cx("h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5", EASE)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
          {note && (
            <p className="aui-splan-rise mt-2.5 text-center text-[12px] text-mute" style={rise(5)}>
              {note}
            </p>
          )}

          <ul className="mt-6 grid gap-2.5">
            {included.map((f, i) => (
              <li key={f} className="aui-splan-rise flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-2" style={rise(6 + i)}>
                <svg viewBox="0 0 16 16" className="mt-[2px] h-3.5 w-3.5 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m3.5 8.5 3 3 6-7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <style href="asta-pricing-aui-022" precedence="asta">{CSS}</style>
    </div>
  );
}

export default SinglePlan;
