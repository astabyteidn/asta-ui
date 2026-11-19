"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui052-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui052 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui052-rise .6s ${EASE} ${80 + i * 50}ms both` });

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

export interface CheckboxCardItem {
  value: string;
  title: string;
  description?: string;
  /** Monthly price, added to the total when picked. */
  price: number;
  icon?: ReactNode;
  disabled?: boolean;
}

const ITEMS: CheckboxCardItem[] = [
  { value: "notes", title: "AI notes", description: "Summaries after every call", price: 8, icon: <Icon d="M8 2.5l1.4 3.1 3.1 1.4-3.1 1.4L8 11.5 6.6 8.4 3.5 7l3.1-1.4L8 2.5zM12.5 11l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z" /> },
  { value: "guests", title: "Guest seats", description: "Invite clients for free", price: 5, icon: <Icon d="M6 7.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.5 13.5c.6-2.3 2.3-3.5 4.5-3.5s3.9 1.2 4.5 3.5M11 4h3.5M12.75 2.25v3.5" /> },
  { value: "audit", title: "Audit log", description: "Every change, kept a year", price: 12, icon: <Icon d="M4 2.5h6l2.5 2.5v8.5H4zM6.5 7.5h4M6.5 10h4M10 2.5V5h2.5" /> },
  { value: "support", title: "Priority support", description: "Answers within the hour", price: 9, icon: <Icon d="M2.5 9V8a5.5 5.5 0 0111 0v1M2.5 9h2v3.5h-2zM11.5 9h2v3.5h-2zM13.5 12.5c0 1-1 1.5-2.5 1.5H9" /> },
];

/** Digits that roll to the new value, right to left. Screen readers get the plain text. */
function Roll({ text }: { text: string }) {
  const chars = text.split("");
  return (
    <span className="relative inline-flex tabular-nums">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={chars.length - i} className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
              <span
                className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-700"
                style={{ transform: `translateY(${-Number(ch) * 10}%)`, transitionTimingFunction: EASE, transitionDelay: `${(chars.length - 1 - i) * 50}ms` }}
              >
                {Array.from({ length: 10 }, (_, n) => (
                  <span key={n} className="block h-[1em] text-center leading-[1em]">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={`c${chars.length - i}`} className="leading-[1em]">
              {ch}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

export interface CheckboxCardProps {
  items?: CheckboxCardItem[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  eyebrow?: string;
  title?: string;
  /** Price before add-ons. */
  base?: number;
  currency?: string;
  name?: string;
  className?: string;
}

/**
 * aui-052 · Add-on cards you tick on and off. Signature: the check pops and draws itself in, the card lifts a
 * brand ring and the monthly total rolls digit by digit.
 */
export function CheckboxCard({
  items = ITEMS,
  value,
  defaultValue = ["notes", "audit"],
  onChange,
  eyebrow = "Astabyte · Add-ons",
  title = "Shape your workspace",
  base = 12,
  currency = "$",
  name,
  className,
}: CheckboxCardProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const picked = value ?? inner;
  const total = base + items.filter((it) => picked.includes(it.value)).reduce((s, it) => s + it.price, 0);

  const toggle = (v: string) => {
    const next = picked.includes(v) ? picked.filter((x) => x !== v) : [...picked, v];
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  return (
    <fieldset
      className={cx(
        "aui052 w-full max-w-[460px] rounded-[14px] bg-paper p-5 sm:p-6",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-aui052" precedence="asta">
        {CSS}
      </style>
      <div className="flex items-end justify-between gap-4" style={rise(0)}>
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">{eyebrow}</p>
          <legend className="mt-1.5 block text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink">{title}</legend>
        </div>
        <p className="shrink-0 text-right">
          <span className="flex items-start justify-end text-[30px] font-medium leading-none tracking-[-0.04em] text-ink">
            <span className="mr-0.5 mt-[3px] text-[14px] tracking-normal text-mute">{currency}</span>
            <Roll text={String(total)} />
          </span>
          <span className="mt-1.5 block text-[11.5px] text-mute">per seat / month</span>
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-2.5">
        {items.map((it, i) => {
          const on = picked.includes(it.value);
          const id = `${uid}-${it.value}`;
          return (
            <label
              key={it.value}
              htmlFor={id}
              style={rise(i + 1)}
              className={cx(
                "group/cc relative flex select-none flex-col rounded-[11px] bg-paper p-3 sm:p-3.5 transition-transform duration-300 active:scale-[0.98]",
                "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
                it.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              )}
            >
              <input
                id={id}
                type="checkbox"
                name={name}
                value={it.value}
                checked={on}
                disabled={it.disabled}
                onChange={() => toggle(it.value)}
                aria-describedby={it.description ? `${id}-d` : undefined}
                className="sr-only"
              />
              {/* Hover wash and the selected ring sit on their own layers, so only opacity animates. */}
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[11px] bg-paper-2 opacity-0 transition-opacity duration-300 group-hover/cc:opacity-60" />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[11px] bg-[color-mix(in_srgb,var(--color-brand)_5%,transparent)] shadow-[inset_0_0_0_1.5px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_12%,transparent),0_10px_22px_-16px_color-mix(in_srgb,var(--color-brand)_55%,transparent)] transition-opacity duration-300"
                style={{ opacity: on ? 1 : 0 }}
              />
              <span className="relative flex items-start justify-between">
                <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[8px] bg-paper-2 text-ink">
                  <span aria-hidden className="absolute inset-0 bg-brand transition-opacity duration-300" style={{ opacity: on ? 1 : 0 }} />
                  <span className={cx("relative transition-colors duration-300", on && "text-white")}>{it.icon}</span>
                </span>
                <Check on={on} />
              </span>
              <span className="relative mt-5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-medium tracking-[-0.01em] text-ink">{it.title}</span>
                  <span className="font-mono text-[11.5px] tabular-nums text-mute">
                    +{currency}
                    {it.price}
                  </span>
                </span>
                {it.description && (
                  <span id={`${id}-d`} className="mt-0.5 block text-[12.5px] leading-snug text-mute">
                    {it.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Round check: the disc pops with a small overshoot, then the tick draws. */
function Check({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="relative grid h-5 w-5 place-items-center">
      <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)] transition-opacity duration-200" style={{ opacity: on ? 0 : 1 }} />
      <span
        className="absolute inset-0 rounded-full bg-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_6px_-1px_color-mix(in_srgb,var(--color-brand)_60%,transparent)] transition-[transform,opacity] duration-500"
        style={{ transform: on ? "scale(1)" : "scale(0.4)", opacity: on ? 1 : 0, transitionTimingFunction: SPRING }}
      />
      <svg viewBox="0 0 16 16" className="relative h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M3.5 8.5l3 3 6-7"
          pathLength={1}
          strokeDasharray="1"
          className="transition-[stroke-dashoffset]"
          style={{ strokeDashoffset: on ? 0 : 1, transitionDuration: on ? "420ms" : "120ms", transitionDelay: on ? "120ms" : "0ms", transitionTimingFunction: EASE }}
        />
      </svg>
    </span>
  );
}

export default CheckboxCard;
