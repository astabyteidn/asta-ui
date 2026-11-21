"use client";

import { BULK_CSS, FIELD_CSS, PLANS_CSS } from "./code";

/** A field wrapper that reacts to focus, invalid and valid input inside it. No JavaScript. */
export function HasField() {
  return (
    <div className="has-field flex h-full items-center justify-center p-5 sm:p-8">
      <style href="asta-blog-has-field" precedence="asta">
        {FIELD_CSS}
      </style>
      <form className="w-full max-w-sm" onSubmit={(e) => e.preventDefault()} noValidate={false}>
        <label className="field flex h-14 items-center gap-3 bg-paper px-3.5">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11.5px] text-mute">Work email</span>
            <input type="email" required placeholder="you@astabyte.com" className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-mute/70" />
          </span>
          <span className="ok grid h-6 w-6 place-items-center rounded-full bg-brand text-[12px] text-white" aria-hidden>
            ✓
          </span>
        </label>
        <p className="hint mt-2 px-1 text-[13px] text-ink-2">Use an address like name@company.com</p>
        <p className="mt-6 px-1 text-[12.5px] text-mute">Type something that is not an email, then click outside the field.</p>
      </form>
    </div>
  );
}

const PLANS = [
  { id: "plan-solo", name: "Solo", price: "$12", per: "per month", note: "One seat. Upgrade any time." },
  { id: "plan-team", name: "Team", price: "$9", per: "per seat, per month", note: "Five seats or more. Shared library and roles." },
];

/** Radio cards and a summary that both read the checked input. */
export function HasPlans() {
  return (
    <div className="has-plans flex h-full flex-col justify-center gap-4 p-5 sm:p-8">
      <style href="asta-blog-has-plans" precedence="asta">
        {PLANS_CSS}
      </style>
      <fieldset className="grid gap-2.5 sm:grid-cols-2">
        <legend className="sr-only">Plan</legend>
        {PLANS.map((p, i) => (
          <label key={p.id} className="plan relative flex cursor-pointer flex-col gap-1 rounded-[12px] bg-paper p-4">
            <input type="radio" name="has-plan" id={p.id} defaultChecked={i === 1} className="absolute right-4 top-4 h-4 w-4 accent-[var(--color-brand)]" />
            <span className="text-[14px] font-medium text-ink">{p.name}</span>
            <span className="text-[26px] font-medium tracking-[-0.03em] text-ink tabular-nums">{p.price}</span>
            <span className="text-[12.5px] text-mute">{p.per}</span>
          </label>
        ))}
      </fieldset>
      <div className="grid rounded-[10px] bg-paper-2 px-4 py-3 text-[13.5px] text-ink-2">
        {PLANS.map((p) => (
          <p key={p.id} className={`note note-${p.id.slice(5)} [grid-area:1/1]`}>
            <span className="font-medium text-ink">{p.name}:</span> {p.note}
          </p>
        ))}
      </div>
    </div>
  );
}

const ROWS = [
  ["INV-2041", "Astabyte Studio", "$1,240.00", "Paid"],
  ["INV-2042", "Astabyte Labs", "$860.00", "Due"],
  ["INV-2043", "Astabyte Cloud", "$2,115.50", "Due"],
  ["INV-2044", "Astabyte Shop", "$412.00", "Draft"],
];

/** Pick rows: they tint, a CSS counter counts them, and a bulk bar slides in. Still no JavaScript. */
export function HasBulk() {
  return (
    <div className="has-bulk relative flex h-full flex-col justify-center p-3 sm:p-6">
      <style href="asta-blog-has-bulk" precedence="asta">
        {BULK_CSS}
      </style>
      <div className="overflow-x-auto rounded-[12px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent)]">
        <table className="w-full min-w-[440px] text-left text-[13.5px]">
          <thead className="text-[12px] text-mute">
            <tr>
              <th className="w-10 py-2.5 pl-4" />
              <th className="py-2.5 font-normal">Invoice</th>
              <th className="py-2.5 font-normal">Client</th>
              <th className="py-2.5 pr-4 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([id, client, amount, status]) => (
              <tr key={id}>
                <td className="py-2.5 pl-4">
                  <input type="checkbox" aria-label={`Select ${id}`} className="h-4 w-4 accent-[var(--color-brand)]" />
                </td>
                <td className="py-2.5 font-mono text-[12.5px] text-ink">{id}</td>
                <td className="py-2.5 text-ink-2">
                  {client} <span className="ml-1 text-[12px] text-mute">· {status}</span>
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-ink">{amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bar mx-auto mt-3 flex items-center gap-3 rounded-[10px] bg-ink py-2 pl-4 pr-2 text-[13.5px] text-paper">
        <span className="count tabular-nums" />
        <button type="button" className="rounded-[7px] bg-paper/10 px-3 py-1.5 text-[13px] hover:bg-paper/20">
          Send reminder
        </button>
        <button type="button" className="rounded-[7px] bg-paper px-3 py-1.5 text-[13px] text-ink">
          Export
        </button>
      </div>
    </div>
  );
}
