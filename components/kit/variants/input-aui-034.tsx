"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui034-new { from { opacity: 0; transform: translateY(40%) } to { opacity: 1; transform: none } }
@keyframes aui034-blink { 0%, 45% { opacity: 1 } 55%, 100% { opacity: 0 } }
@keyframes aui034-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui034 * { animation: none !important; transition: none !important } }
`;

export interface AmountCurrency {
  code: string;
  symbol: string;
  /** Units per 1 of the first currency, used to convert when you switch. */
  rate: number;
}

const CURRENCIES: AmountCurrency[] = [
  { code: "USD", symbol: "$", rate: 1 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "GBP", symbol: "£", rate: 0.79 },
];

export interface AmountInputProps {
  label?: string;
  /** Controlled amount. */
  value?: number;
  defaultValue?: number;
  onChange?: (value: number, currency: string) => void;
  currencies?: AmountCurrency[];
  currency?: string;
  onCurrencyChange?: (code: string) => void;
  /** One-tap amounts in the selected currency. */
  quick?: number[];
  /** The highest amount allowed. Typing past it clamps with a calm note. */
  max?: number;
  /** Line under the amount, e.g. fees or arrival time. */
  note?: string;
  className?: string;
}

const fmt = (raw: string) => {
  const [int, dec] = raw.split(".");
  const grouped = (int || "0").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec === undefined ? grouped : `${grouped}.${dec}`;
};
const toRaw = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""));
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** A digit as a strip of 0–9 that slides to its value. */
function Digit({ d, delay }: { d: number; delay: number }) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden" style={{ animation: `aui034-new .45s ${EASE} both` }}>
      <span className="flex flex-col transition-transform duration-700" style={{ transform: `translateY(${-d * 10}%)`, transitionTimingFunction: EASE, transitionDelay: `${delay}ms` }}>
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block h-[1em] leading-[1em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * aui-034 · Amount. Signature: a big dark money field whose digits roll into place, a currency switch that
 * converts the amount with a roll, and quick-amount chips.
 */
export function AmountInput({
  label = "Amount",
  value,
  defaultValue = 0,
  onChange,
  currencies = CURRENCIES,
  currency: currencyProp,
  onCurrencyChange,
  quick = [50, 100, 250, 500],
  max = 10000,
  note = "No fee · Arrives in your Astabyte balance instantly",
  className,
}: AmountInputProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(toRaw(defaultValue));
  const [code, setCode] = useState(currencies[0].code);
  const [focused, setFocused] = useState(false);
  const [capped, setCapped] = useState(false);
  const cur = currencies.find((c) => c.code === (currencyProp ?? code)) ?? currencies[0];
  const ci = currencies.indexOf(cur);
  const raw = value !== undefined && Number(inner || 0) !== value ? toRaw(value) : inner;
  const num = Number(raw || 0);

  const commit = (next: string) => {
    let r = next;
    let hit = false;
    if (Number(r || 0) > max) {
      r = String(max);
      hit = true;
    }
    setCapped(hit);
    setInner(r);
    onChange?.(Number(r || 0), cur.code);
  };

  const onType = (v: string) => {
    let s = v.replace(/[^\d.]/g, "");
    const dot = s.indexOf(".");
    if (dot >= 0) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "").slice(0, 2);
    s = s.replace(/^0+(?=\d)/, "").slice(0, 9);
    commit(s);
  };

  const switchTo = (i: number) => {
    const next = currencies[(i + currencies.length) % currencies.length];
    if (next.code === cur.code) return;
    const converted = Math.round((num / cur.rate) * next.rate * 100) / 100;
    if (currencyProp === undefined) setCode(next.code);
    onCurrencyChange?.(next.code);
    setCapped(false);
    setInner(toRaw(converted));
    onChange?.(converted, next.code);
  };

  const onSwitchKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      switchTo(ci + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      switchTo(ci - 1);
    }
  };

  const shown = fmt(raw);
  const chars = shown.split("");
  const len = chars.length;
  const dotAt = shown.indexOf(".");
  const size = len > 9 ? "text-[38px]" : len > 7 ? "text-[46px]" : "text-[56px]";
  const hasDot = raw.includes(".");
  const ghost = hasDot ? "00".slice(raw.split(".")[1].length) : ".00";

  return (
    <div
      className={cx(
        "aui034 relative isolate w-full overflow-hidden rounded-[14px] bg-ink p-5 text-paper sm:p-6",
        "shadow-[0_1px_2px_rgb(0_0_0/0.1),0_30px_60px_-28px_rgb(0_0_0/0.55)]",
        className,
      )}
    >
      <style href="asta-input-aui-034" precedence="asta">
        {CSS}
      </style>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-56 w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_38%,transparent),transparent)] transition-opacity duration-500"
        style={{ opacity: focused ? 1 : 0.55 }}
      />

      <div className="flex items-center justify-between gap-3" style={{ animation: `aui034-rise .6s ${EASE} .1s both` }}>
        <label htmlFor={id} className="truncate whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-paper)_60%,transparent)]">
          {label}
        </label>
        {/* Currency switch: one pill glides between equal slots. */}
        <div
          role="radiogroup"
          aria-label="Currency"
          className="relative grid rounded-[8px] bg-[color-mix(in_srgb,var(--color-paper)_8%,transparent)] p-0.5"
          style={{ gridTemplateColumns: `repeat(${currencies.length}, 3rem)` }}
        >
          <span
            aria-hidden
            className="absolute bottom-0.5 left-0.5 top-0.5 w-12 rounded-[6px] bg-paper transition-transform duration-500"
            style={{ transform: `translateX(${ci * 100}%)`, transitionTimingFunction: EASE }}
          />
          {currencies.map((c, i) => (
            <button
              key={c.code}
              type="button"
              role="radio"
              aria-checked={i === ci}
              tabIndex={i === ci ? 0 : -1}
              onClick={() => switchTo(i)}
              onKeyDown={onSwitchKey}
              className={cx(
                "relative h-7 rounded-[6px] text-[12px] font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand",
                i === ci ? "text-ink" : "text-[color-mix(in_srgb,var(--color-paper)_60%,transparent)] hover:text-paper",
              )}
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {/* The amount. A transparent input sits on top and takes the typing, the digits underneath roll. */}
      <div className="relative mt-5 cursor-text" style={{ animation: `aui034-rise .6s ${EASE} .16s both` }}>
        <div aria-hidden className={cx("flex items-start font-medium leading-none tracking-[-0.045em] tabular-nums", size)}>
          <span className="mr-1 mt-[0.12em] text-[0.46em] tracking-normal text-[color-mix(in_srgb,var(--color-paper)_55%,transparent)]">{cur.symbol}</span>
          <span className="inline-flex">
            {/* Whole digits are keyed from the right and decimals from the point, so digits roll in place. */}
            {chars.map((ch, i) => {
              const key = dotAt < 0 || i < dotAt ? `i${(dotAt < 0 ? len : dotAt) - i}` : `f${i - dotAt}`;
              return /\d/.test(ch) ? (
                <Digit key={key} d={Number(ch)} delay={Math.max(0, (dotAt < 0 ? len : dotAt) - i - 1) * 35} />
              ) : (
                <span key={key + ch} className="inline-block h-[1em] leading-[1em]">
                  {ch}
                </span>
              );
            })}
          </span>
          <span className="relative inline-block h-[1em] leading-[1em] text-[color-mix(in_srgb,var(--color-paper)_28%,transparent)]">
            <span
              className="absolute -left-px top-[0.1em] h-[0.8em] w-[2px] rounded-full bg-brand"
              style={{ opacity: focused ? undefined : 0, animation: focused ? "aui034-blink 1.05s steps(1) infinite" : "none" }}
            />
            {ghost}
          </span>
        </div>
        <input
          ref={input}
          id={id}
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${label} in ${cur.code}`}
          aria-describedby={`${id}-note`}
          value={raw}
          onChange={(e) => onType(e.target.value)}
          onFocus={(e) => {
            setFocused(true);
            const el = e.currentTarget;
            el.setSelectionRange(el.value.length, el.value.length);
          }}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
        />
      </div>
      <p id={`${id}-note`} aria-live="polite" className="mt-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-paper)_55%,transparent)]" style={{ animation: `aui034-rise .6s ${EASE} .22s both` }}>
        {capped ? `Up to ${cur.symbol}${money(max)} per top-up.` : note}
      </p>

      <div className="mt-5 grid grid-cols-4 gap-1.5" style={{ animation: `aui034-rise .6s ${EASE} .28s both` }}>
        {quick.map((q) => {
          const on = num === q;
          return (
            <button
              key={q}
              type="button"
              aria-pressed={on}
              onClick={() => {
                commit(String(q));
                input.current?.focus();
              }}
              className={cx(
                "h-9 rounded-[8px] text-[13px] font-medium tabular-nums outline-none transition-[background-color,color,transform] duration-300 active:scale-[.96] focus-visible:ring-2 focus-visible:ring-brand",
                on
                  ? "bg-brand text-paper"
                  : "bg-[color-mix(in_srgb,var(--color-paper)_7%,transparent)] text-[color-mix(in_srgb,var(--color-paper)_80%,transparent)] hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--color-paper)_12%,transparent)]",
              )}
            >
              {cur.symbol}
              {q.toLocaleString("en-US")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AmountInput;
