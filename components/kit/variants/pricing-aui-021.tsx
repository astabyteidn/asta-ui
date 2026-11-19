"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type PointerEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface PricingTableProps {
  /** Plan columns, left to right. The `recommended` one is where the lens rests. */
  plans?: { name: string; price: number; period?: string; recommended?: boolean; cta?: { label: string; href: string } }[];
  /** Feature rows in groups. Each value lines up with `plans`: `true` = included, `false` = not, text = a limit. */
  groups?: { name: string; rows: { label: string; values: (boolean | string)[] }[] }[];
  currency?: string;
  /** Height of the scroll box. The header row sticks to its top. */
  maxHeight?: number;
  /** Sweep the lens across the columns once after mount, to show it follows the pointer. */
  hint?: boolean;
  className?: string;
}

const PLANS: NonNullable<PricingTableProps["plans"]> = [
  { name: "Starter", price: 0, period: "Free forever", cta: { label: "Start free", href: "#" } },
  { name: "Team", price: 24, period: "Per seat / month", recommended: true, cta: { label: "Try Team", href: "#" } },
  { name: "Business", price: 49, period: "Per seat / month", cta: { label: "Talk to sales", href: "#" } },
];

const GROUPS: NonNullable<PricingTableProps["groups"]> = [
  {
    name: "Workspace",
    rows: [
      { label: "Projects", values: ["3", "Unlimited", "Unlimited"] },
      { label: "File history", values: ["7 days", "90 days", "Forever"] },
      { label: "Guests", values: [false, "10", "Unlimited"] },
      { label: "Custom domains", values: [false, true, true] },
    ],
  },
  {
    name: "Collaboration",
    rows: [
      { label: "Comments and mentions", values: [true, true, true] },
      { label: "Shared views", values: [false, true, true] },
      { label: "Approval flows", values: [false, false, true] },
    ],
  },
  {
    name: "Security",
    rows: [
      { label: "Two-factor auth", values: [true, true, true] },
      { label: "SAML single sign-on", values: [false, false, true] },
      { label: "Audit log", values: [false, "30 days", "1 year"] },
    ],
  },
];

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const LINE = "shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--color-ink)_6%,transparent)]";

const CSS = `
@keyframes aui-ptable-rise { from { opacity: 0; transform: translateY(8px) } }
.aui-ptable-rise { animation: aui-ptable-rise .6s cubic-bezier(.16,1,.3,1) both }
@media (prefers-reduced-motion: reduce) { .aui-ptable-rise { animation: none } .aui-ptable-lens { transition: none !important } }
`;

function Cell({ v, on }: { v: boolean | string; on: boolean }) {
  if (v === true)
    return (
      <>
        <span
          aria-hidden
          className={cx(
            "mx-auto grid h-5 w-5 place-items-center rounded-full transition-[background-color,color,transform] duration-500",
            EASE,
            on ? "scale-110 bg-brand text-white" : "bg-ink/[0.06] text-ink",
          )}
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3.5 8.5 3 3 6-7" />
          </svg>
        </span>
        <span className="sr-only">Included</span>
      </>
    );
  if (v === false)
    return (
      <>
        <span aria-hidden className="mx-auto block h-px w-3 bg-ink/25" />
        <span className="sr-only">Not included</span>
      </>
    );
  return <span className={cx("text-[13.5px] transition-colors duration-300", on ? "font-medium text-ink" : "text-ink-2")}>{v}</span>;
}

/** aui-021 · Comparison table with a brand lens that rests on the recommended plan and glides to whichever column you point at or tab into. */
export function PricingTable({ plans = PLANS, groups = GROUPS, currency = "$", maxHeight = 420, hint = false, className }: PricingTableProps) {
  const rec = Math.max(0, plans.findIndex((p) => p.recommended));
  const [hover, setHover] = useState<number | null>(null);
  const [sweep, setSweep] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [lens, setLens] = useState({ x: 0, w: 0 });
  const heads = useRef<(HTMLTableCellElement | null)[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const active = hover ?? sweep ?? rec;

  const measure = useCallback(() => {
    const el = heads.current[active];
    if (el) setLens({ x: el.offsetLeft, w: el.offsetWidth });
  }, [active]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!hint || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const order = [...plans.map((_, i) => i).filter((i) => i !== rec), null];
    const timers = order.map((i, n) => setTimeout(() => setSweep(i), 1100 + n * 750));
    return () => timers.forEach(clearTimeout);
  }, [hint, plans, rec]);

  const pick = (e: PointerEvent | FocusEvent) => {
    const col = (e.target as HTMLElement).closest<HTMLElement>("[data-col]")?.dataset.col;
    setHover(col === undefined ? null : Number(col));
  };

  let row = 0;

  return (
    <div
      className={cx(
        "w-full overflow-hidden rounded-[14px] bg-paper text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <div
        className="overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
        style={{ maxHeight }}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
        tabIndex={0}
        role="region"
        aria-label="Plan comparison"
      >
        <div ref={wrap} className="relative min-w-[600px] px-2" onPointerOver={pick} onPointerLeave={() => setHover(null)} onFocus={pick} onBlur={() => setHover(null)}>
          <span
            aria-hidden
            className={cx("aui-ptable-lens pointer-events-none absolute bottom-2 left-0 top-2 z-[25] rounded-[12px] transition-transform duration-700", EASE)}
            style={{
              width: lens.w,
              transform: `translateX(${lens.x + 8}px)`,
              background: "linear-gradient(to bottom, color-mix(in srgb, var(--color-brand) 7%, transparent), color-mix(in srgb, var(--color-brand) 2.5%, transparent) 45%)",
              boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-brand) 28%, transparent), 0 18px 40px -24px color-mix(in srgb, var(--color-brand) 55%, transparent)",
            }}
          />
          <table className="relative w-full table-fixed border-separate border-spacing-0 text-left">
            <caption className="sr-only">Compare plans and features</caption>
            <colgroup>
              <col className="w-[34%]" />
              {plans.map((p) => (
                <col key={p.name} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <td className="sticky left-0 top-0 z-30 bg-paper px-4 pb-5 pt-6 align-bottom">
                  <span className="aui-ptable-rise block font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Compare plans</span>
                  <span
                    aria-hidden
                    className={cx("pointer-events-none absolute inset-x-0 top-full h-4 bg-gradient-to-b from-ink/[0.06] to-transparent transition-opacity duration-300", scrolled ? "opacity-100" : "opacity-0")}
                  />
                </td>
                {plans.map((p, i) => {
                  const on = i === active;
                  return (
                    <th
                      key={p.name}
                      ref={(el) => {
                        heads.current[i] = el;
                      }}
                      data-col={i}
                      scope="col"
                      className="sticky top-0 z-20 bg-paper/80 px-4 pb-5 pt-6 align-top font-normal backdrop-blur-md"
                    >
                      <div className="aui-ptable-rise flex flex-col" style={{ animationDelay: `${80 + i * 60}ms` }}>
                        <span className="flex h-5 items-center gap-2 text-[14px] font-medium">
                          {p.name}
                          {p.recommended && <span className="rounded-[4px] bg-brand px-1.5 text-[10.5px] font-medium leading-[18px] text-white">Popular</span>}
                        </span>
                        <span className="mt-3 flex items-start font-medium leading-none tracking-[-0.04em]">
                          <span className="mr-0.5 mt-0.5 text-[15px]">{currency}</span>
                          <span className="text-[36px] tabular-nums">{p.price}</span>
                        </span>
                        {p.period && <span className="mt-1.5 text-[12px] text-mute">{p.period}</span>}
                        {p.cta && (
                          <a
                            href={p.cta.href}
                            className={cx(
                              "group mt-4 inline-flex h-9 items-center whitespace-nowrap justify-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium outline-none transition-[background-color,color,box-shadow,transform] duration-500 hover:-translate-y-px active:translate-y-0 active:scale-[.98] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                              EASE,
                              on
                                ? "bg-brand text-white shadow-[0_8px_20px_-10px_var(--color-brand)]"
                                : "bg-paper text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]",
                            )}
                          >
                            {p.cta.label}
                            <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5", EASE)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M3 8h10M9 4l4 4-4 4" />
                            </svg>
                          </a>
                        )}
                      </div>
                      <span
                        aria-hidden
                        className={cx("pointer-events-none absolute inset-x-0 top-full h-4 bg-gradient-to-b from-ink/[0.06] to-transparent transition-opacity duration-300", scrolled ? "opacity-100" : "opacity-0")}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.name}>
                  <tr>
                    <th scope="rowgroup" className="sticky left-0 z-10 bg-paper px-4 pb-2 pt-7 font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-mute">
                      <span className="aui-ptable-rise block" style={{ animationDelay: `${160 + row * 40}ms` }}>
                        {g.name}
                      </span>
                    </th>
                    {plans.map((p, i) => (
                      <td key={p.name} data-col={i} />
                    ))}
                  </tr>
                  {g.rows.map((r) => {
                    const delay = `${180 + row++ * 40}ms`;
                    return (
                      <tr key={r.label} className="group/row">
                        <th scope="row" className={cx("sticky left-0 z-10 bg-paper px-4 py-3 text-[13.5px] font-normal text-ink-2 transition-colors duration-200 group-hover/row:text-ink", LINE)}>
                          <span className="aui-ptable-rise block" style={{ animationDelay: delay }}>
                            {r.label}
                          </span>
                        </th>
                        {plans.map((p, i) => (
                          <td key={p.name} data-col={i} className={cx("px-4 py-3 text-center", LINE)}>
                            <span className="aui-ptable-rise block" style={{ animationDelay: delay }}>
                              <Cell v={r.values[i] ?? false} on={i === active} />
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
              <tr aria-hidden>
                <td className="h-5" />
                {plans.map((p, i) => (
                  <td key={p.name} data-col={i} className="h-5" />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <style href="asta-pricing-aui-021" precedence="asta">{CSS}</style>
    </div>
  );
}

export default PricingTable;
