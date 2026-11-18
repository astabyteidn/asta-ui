"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-crumb-menu { from { opacity: 0; transform: translateY(-4px) scale(.97) } }`;

export interface Crumb {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

export interface BreadcrumbProps {
  /** Root first, current page last. The last one is marked as the current page. */
  items: Crumb[];
  /** Between items. Defaults to a slim chevron. */
  separator?: ReactNode;
  /** "auto" folds middle items into a menu when the row overflows. A number caps the visible items. `false` never folds. */
  collapse?: "auto" | number | false;
  /** Render links your way, e.g. with next/link. */
  renderLink?: (props: { href: string; className: string; children: ReactNode; onClick?: () => void }) => ReactNode;
  className?: string;
}

const Chevron = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 3.5 4.5 4.5L6 12.5" />
  </svg>
);

const LINK = "flex min-w-0 items-center gap-1.5 rounded-md text-mute outline-none transition-colors hover:text-ink focus-visible:text-ink focus-visible:ring-2 focus-visible:ring-brand/50";

function Item({ item, current, renderLink }: { item: Crumb; current: boolean; renderLink?: BreadcrumbProps["renderLink"] }) {
  const body = (
    <>
      {item.icon && <span className="flex shrink-0">{item.icon}</span>}
      <span className="truncate">{item.label}</span>
    </>
  );
  if (current)
    return (
      <span aria-current="page" className="flex min-w-0 items-center gap-1.5 font-medium text-ink">
        {body}
      </span>
    );
  if (item.href) {
    if (renderLink) return <>{renderLink({ href: item.href, className: LINK, children: body, onClick: item.onClick })}</>;
    return (
      <a href={item.href} onClick={item.onClick} className={LINK}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={item.onClick} className={LINK}>
      {body}
    </button>
  );
}

// Menu items are plain anchors so they stay real menu items.
function Overflow({ items }: { items: Crumb[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = [...(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = all.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % all.length;
    else if (e.key === "ArrowUp") next = (i - 1 + all.length) % all.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
      btn.current?.focus();
      return;
    } else return;
    e.preventDefault();
    all[next]?.focus();
  };

  const ROW = "flex w-full min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink-2 outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:bg-paper-2 focus-visible:text-ink";

  return (
    <div ref={root} className="relative flex">
      <button
        ref={btn}
        type="button"
        aria-label={`Show ${items.length} more`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cx(
          "flex h-6 w-7 items-center justify-center rounded-md text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50",
          open && "bg-paper-2 text-ink",
        )}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <circle cx="3.5" cy="8" r="1.25" />
          <circle cx="8" cy="8" r="1.25" />
          <circle cx="12.5" cy="8" r="1.25" />
        </svg>
      </button>
      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label="Hidden pages"
          onKeyDown={onKey}
          className="absolute left-0 top-full z-50 mt-1.5 flex w-max min-w-40 max-w-64 origin-top-left flex-col rounded-[10px] bg-paper p-1 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_14px_32px_-14px_rgb(0_0_0/0.3)] animate-[asta-crumb-menu_.22s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none"
        >
          {items.map((item) => {
            const body = (
              <>
                {item.icon && <span className="flex shrink-0 text-mute">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </>
            );
            const close = () => {
              item.onClick?.();
              setOpen(false);
            };
            return item.href ? (
              <a key={item.label} role="menuitem" tabIndex={-1} href={item.href} onClick={close} className={ROW}>
                {body}
              </a>
            ) : (
              <button key={item.label} role="menuitem" tabIndex={-1} type="button" onClick={close} className={ROW}>
                {body}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * A trail back to the root. The last item is the current page. When the row runs out of room the middle
 * items fold into a menu behind an ellipsis, keeping the root and the nearest parents in view.
 */
export function Breadcrumb({ items, separator, collapse = "auto", renderLink, className }: BreadcrumbProps) {
  const wrap = useRef<HTMLElement>(null);
  const measure = useRef<HTMLOListElement>(null);
  const [fit, setFit] = useState(0);
  const sep = separator ?? <Chevron />;

  // How many middle items to hide. Fixed caps are simple; "auto" measures a hidden copy of the full row.
  const capped = typeof collapse === "number" ? Math.max(0, items.length - Math.max(2, collapse)) : 0;
  const hidden = collapse === "auto" ? fit : capped;

  useLayoutEffect(() => {
    if (collapse !== "auto") return;
    const calc = () => {
      const box = wrap.current;
      const ol = measure.current;
      if (!box || !ol) return;
      const kids = [...ol.children] as HTMLElement[];
      const more = kids.pop()!.offsetWidth;
      const widths = kids.map((k) => k.offsetWidth);
      const room = box.clientWidth;
      let total = widths.reduce((a, b) => a + b, 0);
      let n = 0;
      // Hide from the second item onward, keeping the root and the current page.
      while (total > room && n < items.length - 2) {
        total -= widths[n + 1];
        if (n === 0) total += more;
        n++;
      }
      setFit(n);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(wrap.current!);
    return () => ro.disconnect();
  }, [collapse, items]);

  const folded = hidden > 0 ? items.slice(1, 1 + hidden) : [];
  const shown: (Crumb | "more")[] = hidden > 0 ? [items[0], "more", ...items.slice(1 + hidden)] : items;

  const li = "flex min-w-0 items-center gap-1.5";
  const sepEl = (
    <span aria-hidden className="flex shrink-0 text-[color-mix(in_srgb,var(--color-ink)_28%,transparent)]">
      {sep}
    </span>
  );

  return (
    <nav ref={wrap} aria-label="Breadcrumb" className={cx("relative min-w-0 text-[13.5px]", className)}>
      <style href="asta-breadcrumb" precedence="asta">{KEYFRAMES}</style>
      <ol className="flex min-w-0 items-center gap-1.5">
        {shown.map((item, i) => {
          const last = i === shown.length - 1;
          return (
            <li key={item === "more" ? "more" : item.label + i} className={cx(li, item === "more" || i === 0 ? "shrink-0" : last ? "min-w-8 shrink" : "shrink-[2]")}>
              {item === "more" ? <Overflow items={folded} /> : <Item item={item} current={last} renderLink={renderLink} />}
              {!last && sepEl}
            </li>
          );
        })}
      </ol>
      {collapse === "auto" && (
        <ol ref={measure} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 flex w-max items-center gap-0 whitespace-nowrap">
          {items.map((item, i) => (
            <li key={item.label + i} className="flex items-center gap-1.5 pr-1.5">
              {item.icon && <span className="flex">{item.icon}</span>}
              <span className={i === items.length - 1 ? "font-medium" : undefined}>{item.label}</span>
              {i < items.length - 1 && sepEl}
            </li>
          ))}
          <li className="flex items-center gap-1.5 pr-1.5">
            <span className="w-7" />
            {sepEl}
          </li>
        </ol>
      )}
    </nav>
  );
}

export default Breadcrumb;
