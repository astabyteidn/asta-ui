"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/kit/button";
import { Meter } from "@/components/kit/meter";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-billing-roll { from { opacity: 0; transform: translateY(55%) } }
@keyframes asta-billing-in { from { opacity: 0; transform: translateY(-4px) } }
@media (prefers-reduced-motion: reduce) { .asta-billing-a { animation: none !important } }`;

export interface BillingPlan {
  id: string;
  name: string;
  /** Price per month. */
  price: number;
  /** One short line, e.g. "For small teams". */
  blurb?: string;
  features?: string[];
}

export interface BillingUsage {
  label: string;
  value: number;
  max: number;
  format?: (n: number) => string;
}

export interface BillingInvoice {
  id: string;
  /** Already formatted. */
  date: string;
  amount: number;
  status: "paid" | "due" | "failed";
  href?: string;
}

export interface BillingProps {
  plans: BillingPlan[];
  currentPlan: string;
  /** Already formatted renewal date, e.g. "Dec 1, 2026". */
  renewsOn: string;
  /** Days left in the period and its length, for the proration preview. */
  daysLeft?: number;
  periodDays?: number;
  usage?: BillingUsage[];
  /** Card on file. Leave the network out; the last four digits and expiry are enough. */
  card?: { last4: string; expires: string; holder?: string };
  invoices?: BillingInvoice[];
  currency?: string;
  locale?: string;
  /** Resolve to switch plans, throw to stay. */
  onChangePlan?: (id: string) => Promise<void> | void;
  onUpdateCard?: () => void;
  className?: string;
}

/** A number that rolls up into place when it changes. */
function Roll({ children }: { children: string }) {
  return (
    <span className="inline-flex overflow-hidden align-bottom" aria-live="polite">
      <span key={children} className="asta-billing-a inline-block animate-[asta-billing-roll_.45s_cubic-bezier(.16,1,.3,1)_both] tabular-nums">
        {children}
      </span>
    </span>
  );
}

function Group({ title, hint, children, aside }: { title: string; hint?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="grid gap-3 py-6 first:pt-0 @min-[720px]:grid-cols-[220px_1fr] @min-[720px]:gap-10">
      <div className="flex items-start justify-between gap-3 @min-[720px]:block">
        <div>
          <h3 className="text-[14px] font-medium tracking-[-0.01em]">{title}</h3>
          {hint && <p className="mt-1 text-[12.5px] leading-relaxed text-mute">{hint}</p>}
        </div>
        {aside && <div className="@min-[720px]:mt-3">{aside}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const rowCls = "flex items-center gap-3 rounded-[10px] bg-paper-2 px-4 py-3";

/**
 * A billing settings page: the current plan with its renewal date, a plan picker that previews the prorated amount
 * due today (the numbers roll as you pick), usage meters, the card on file and past invoices. Laid out as grouped
 * rows that use the full width, with titles on the left once the container is wide enough.
 */
export function Billing({ plans, currentPlan, renewsOn, daysLeft = 0, periodDays = 30, usage = [], card, invoices = [], currency = "USD", locale = "en-US", onChangePlan, onUpdateCard, className }: BillingProps) {
  const [current, setCurrent] = useState(currentPlan);
  const [pick, setPick] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);

  const cur = plans.find((p) => p.id === current) ?? plans[0];
  const next = pick ? plans.find((p) => p.id === pick) : undefined;
  const share = periodDays ? daysLeft / periodDays : 0;
  const credit = Math.round(cur.price * share * 100) / 100;
  const charge = next ? Math.round(next.price * share * 100) / 100 : 0;
  const today = Math.max(0, Math.round((charge - credit) * 100) / 100);
  const upgrade = next ? next.price > cur.price : false;

  const confirm = async () => {
    if (!next || saving) return;
    setSaving(true);
    try {
      await onChangePlan?.(next.id);
      setCurrent(next.id);
      setDone(`You're on ${next.name} now.`);
      setPick(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cx("@container w-full text-ink", className)}>
      <style href="asta-billing" precedence="asta">{KEYFRAMES}</style>
      <div className="flex flex-col">
        <Group title="Plan" hint={`Renews on ${renewsOn}. Change any time; we prorate the rest of the month.`}>
          <div role="radiogroup" aria-label="Plan" className="grid gap-2 @min-[560px]:grid-cols-3">
            {plans.map((p) => {
              const isCur = p.id === current;
              const on = (pick ?? current) === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setPick(isCur ? null : p.id);
                    setDone(null);
                  }}
                  className={cx(
                    "group/plan relative flex flex-col gap-1 rounded-[12px] p-4 text-left outline-none transition-[box-shadow,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-brand/50",
                    on ? "bg-paper shadow-[inset_0_0_0_2px_var(--color-brand)]" : "bg-paper-2 hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_18%,transparent)]",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-medium">{p.name}</span>
                    {isCur && <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10.5px] font-medium text-paper">Current</span>}
                  </span>
                  <span className="text-[22px] font-medium tracking-[-0.03em] tabular-nums">
                    {money(p.price)}
                    <span className="text-[12.5px] font-normal tracking-normal text-mute"> /mo</span>
                  </span>
                  {p.blurb && <span className="text-[12px] text-mute">{p.blurb}</span>}
                  {p.features && (
                    <ul className="mt-2 flex flex-col gap-1 text-[12px] text-ink-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-1.5">
                          <svg viewBox="0 0 16 16" className="mt-[3px] h-3 w-3 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="m3.5 8.5 3 3 6-7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>

          {next ? (
            <div key="preview" className="asta-billing-a mt-3 flex animate-[asta-billing-in_.35s_cubic-bezier(.16,1,.3,1)_both] flex-col gap-4 rounded-[12px] bg-paper-2 p-4">
              <dl className="grid flex-1 grid-cols-3 gap-3 text-[12px]">
                <div>
                  <dt className="text-mute">{next.name}, {daysLeft} days</dt>
                  <dd className="mt-0.5 text-[14px] font-medium">
                    <Roll>{money(charge)}</Roll>
                  </dd>
                </div>
                <div>
                  <dt className="text-mute">Unused {cur.name}</dt>
                  <dd className="mt-0.5 text-[14px] font-medium">
                    <Roll>{`−${money(credit)}`}</Roll>
                  </dd>
                </div>
                <div>
                  <dt className="text-mute">{upgrade ? "Due today" : "Credit"}</dt>
                  <dd className="mt-0.5 text-[14px] font-medium text-brand">
                    <Roll>{upgrade ? money(today) : money(Math.max(0, credit - charge))}</Roll>
                  </dd>
                </div>
              </dl>
              <div className="flex justify-end gap-2 @max-[559px]:[&>*]:flex-1">
                <Button size="sm" variant="ghost" onClick={() => setPick(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="accent" loading={saving} onClick={confirm}>
                  {upgrade ? `Upgrade to ${next.name}` : `Switch to ${next.name}`}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 h-5 text-[12.5px] text-mute" aria-live="polite">
              {done ?? `${cur.name} · ${money(cur.price)} a month · next charge on ${renewsOn}`}
            </p>
          )}
        </Group>

        {usage.length > 0 && (
          <Group title="Usage" hint="This billing period. Limits reset on renewal.">
            <div className="grid gap-3 @min-[560px]:grid-cols-2">
              {usage.map((u) => (
                <div key={u.label} className="rounded-[12px] bg-paper-2 p-4">
                  <Meter label={u.label} value={u.value} max={u.max} format={u.format} size="sm" />
                </div>
              ))}
            </div>
          </Group>
        )}

        {card && (
          <Group title="Payment method" hint="Charged on each renewal.">
            <div className={rowCls}>
              <span className="grid h-8 w-12 shrink-0 place-items-center rounded-md bg-ink text-paper" aria-hidden>
                <svg viewBox="0 0 24 16" className="h-4 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <rect x="1.5" y="1.5" width="21" height="13" rx="2" />
                  <path d="M1.5 5.5h21M5 11h4" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium">Card ending {card.last4}</span>
                <span className="block truncate text-[12px] text-mute">
                  Expires {card.expires}
                  {card.holder ? ` · ${card.holder}` : ""}
                </span>
              </span>
              {onUpdateCard && (
                <Button size="xs" variant="outline" onClick={onUpdateCard}>
                  Update
                </Button>
              )}
            </div>
          </Group>
        )}

        {invoices.length > 0 && (
          <Group title="Invoices" hint="Download any invoice as a PDF.">
            <ul className="flex flex-col gap-1">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 rounded-[10px] px-4 py-2.5 text-[13px] odd:bg-paper-2">
                  <span className="w-[92px] shrink-0 tabular-nums text-ink-2 @max-[420px]:w-auto">{inv.date}</span>
                  <span className="hidden min-w-0 flex-1 truncate font-mono text-[12px] text-mute @min-[480px]:block">{inv.id}</span>
                  <span className="ml-auto font-medium tabular-nums @min-[480px]:ml-0">{money(inv.amount)}</span>
                  <span className={cx("w-[52px] shrink-0 text-right text-[12px]", inv.status === "paid" ? "text-mute" : inv.status === "due" ? "text-ink" : "font-medium text-ink")}>
                    {inv.status === "paid" ? "Paid" : inv.status === "due" ? "Due" : "Failed"}
                  </span>
                  {inv.href ? (
                    <a href={inv.href} aria-label={`Download ${inv.id}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-mute outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50">
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
                      </svg>
                    </a>
                  ) : (
                    <span className="w-7 shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          </Group>
        )}
      </div>
    </div>
  );
}

export default Billing;
