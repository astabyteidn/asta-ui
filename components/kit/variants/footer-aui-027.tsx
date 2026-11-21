"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export interface CtaFooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface CtaFooterProps {
  title?: ReactNode;
  description?: string;
  primary?: { label: string; href: string };
  /** Optional second, quieter button next to the primary one. */
  secondary?: { label: string; href: string };
  brand?: ReactNode;
  columns?: CtaFooterColumn[];
  languages?: { value: string; label: string }[];
  onLanguageChange?: (value: string) => void;
  /** Painting along the bottom. Any wide image works, it is cropped with object-cover. */
  image?: string;
  imageAlt?: string;
  legal?: ReactNode;
  className?: string;
}

const DEFAULT_COLUMNS: CtaFooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Overview", href: "#" },
      { label: "Integrations", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Journal", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Customers", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    heading: "Social",
    links: [
      { label: "X", href: "#" },
      { label: "LinkedIn", href: "#" },
      { label: "GitHub", href: "#" },
    ],
  },
];

const DEFAULT_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

const CSS = `
@keyframes aui-f27-rise { from { opacity: 0; transform: translateY(12px) } }
.aui-f27-in { animation: aui-f27-rise .7s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--i, 0) * 55ms) }
@media (prefers-reduced-motion: reduce) { .aui-f27-in { animation: none } }
`;

function Mark() {
  return (
    <span className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.03em] text-ink">
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] text-brand" aria-hidden fill="currentColor">
        <path d="M4 20V4h4v6.5L14.5 4H20l-7 7.2L20 20h-5.4L8 13v7H4Z" />
      </svg>
      Astabyte
    </span>
  );
}

/** aui-027 · A light footer with a brand glow along the top, a pitch and one call to action, link columns with a language picker, and a painted landscape that rises in along the bottom. */
export function CtaFooter({
  title = "Ready to ship?",
  description = "Astabyte turns scattered release notes into one calm timeline. Start free, bring the team when you are ready.",
  primary = { label: "Get started today", href: "#" },
  secondary,
  brand = <Mark />,
  columns = DEFAULT_COLUMNS,
  languages = DEFAULT_LANGUAGES,
  onLanguageChange,
  image = "/lab/art/wheat.webp",
  imageAlt = "Painted wheat field under a swirling sky, with dark cypress trees",
  legal,
  className,
}: CtaFooterProps) {
  const art = useRef<HTMLDivElement>(null);
  const pan = useRef<HTMLImageElement>(null);
  const [seen, setSeen] = useState(false);
  const langId = useId();
  const year = new Date().getFullYear();

  useEffect(() => {
    const el = art.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const parallax = (e: React.PointerEvent<HTMLElement> | null) => {
    const el = pan.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!e) {
      el.style.transform = "";
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `scale(1.04) translate(${-x * 14}px, ${-y * 6}px)`;
  };

  return (
    <footer
      onPointerMove={parallax}
      onPointerLeave={() => parallax(null)}
      className={cx("@container relative isolate w-full overflow-hidden bg-paper", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(60%_100%_at_62%_0%,color-mix(in_srgb,var(--color-brand)_16%,transparent),transparent_70%)]"
      />

      <div className="grid gap-10 px-6 pt-12 @min-[720px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] @min-[720px]:gap-10 @min-[720px]:px-10 @min-[720px]:pt-14">
        <div className="flex flex-col items-start">
          <div className="aui-f27-in" style={step(0)}>
            {brand}
          </div>
          <h2 className="aui-f27-in mt-6 font-serif text-[40px] font-normal leading-[1.02] tracking-[-0.02em] text-ink @min-[720px]:text-[46px]" style={step(1)}>
            {title}
          </h2>
          {description && (
            <p className="aui-f27-in mt-3 max-w-[34ch] text-[14px] leading-relaxed text-mute" style={step(2)}>
              {description}
            </p>
          )}
          <div className="aui-f27-in mt-6 flex flex-wrap gap-2" style={step(3)}>
            <a
              href={primary.href}
              className={cx(
                "group/cta inline-flex h-10 items-center gap-2 rounded-[8px] bg-brand px-4 text-[13.5px] font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.1),0_10px_24px_-10px_color-mix(in_srgb,var(--color-brand)_80%,transparent)] transition-transform duration-300 hover:-translate-y-px active:scale-[.97] motion-reduce:transition-none",
                EASE,
                ring,
              )}
            >
              {primary.label}
              <svg viewBox="0 0 16 16" aria-hidden className={cx("h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-0.5 motion-reduce:transition-none", EASE)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
            {secondary && (
              <a
                href={secondary.href}
                className={cx("inline-flex h-10 items-center rounded-[8px] px-4 text-[13.5px] font-medium text-ink transition-colors duration-300 hover:bg-paper-2", ring)}
              >
                {secondary.label}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-8 @min-[520px]:grid-cols-[repeat(3,minmax(0,1fr))_minmax(132px,auto)]">
          <nav aria-label="Footer" className="contents">
            {columns.map((c, ci) => (
              <div key={c.heading} className="aui-f27-in" style={step(2 + ci)}>
                <p className="text-[12.5px] font-medium text-ink">{c.heading}</p>
                <ul className="mt-3.5 flex flex-col gap-2.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className={cx("group/l inline-flex items-center gap-1 rounded-[4px] text-[13px] text-mute transition-colors duration-300 hover:text-ink", ring)}>
                        {l.label}
                        <span aria-hidden className={cx("-translate-x-1 text-[10px] opacity-0 transition-[transform,opacity] duration-300 group-hover/l:translate-x-0 group-hover/l:opacity-70", EASE)}>
                          ↗
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="aui-f27-in" style={step(2 + columns.length)}>
            <label htmlFor={langId} className="text-[12.5px] font-medium text-ink">
              Language
            </label>
            <div className="relative mt-3">
              <select
                id={langId}
                name="language"
                defaultValue={languages[0]?.value}
                onChange={(e) => onLanguageChange?.(e.target.value)}
                className={cx(
                  "h-9 w-full cursor-pointer appearance-none rounded-[8px] bg-paper-2 pl-3 pr-8 text-[16px] sm:text-[13px] text-ink transition-shadow duration-300 hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]",
                  ring,
                )}
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="aui-f27-in mt-12 flex flex-wrap justify-between gap-x-6 gap-y-2 px-6 text-[12px] text-mute @min-[720px]:px-10" style={step(7)}>
        {legal ?? (
          <>
            <span>© {year} Astabyte All rights reserved.</span>
            <span className="flex gap-5">
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-ink", ring)}>
                Terms
              </a>
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-ink", ring)}>
                Privacy
              </a>
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-ink", ring)}>
                Cookies
              </a>
            </span>
          </>
        )}
      </div>

      <div
        ref={art}
        className={cx(
          "relative -mt-6 h-[220px] overflow-hidden transition-[transform,opacity] duration-[1400ms] @min-[720px]:h-[300px] motion-reduce:transition-none",
          EASE,
          seen ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[1.06] opacity-0",
        )}
        style={{
          maskImage: "linear-gradient(to bottom, transparent, #000 38%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 38%)",
        }}
      >
        <img
          ref={pan}
          src={image}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          className={cx("h-full w-full scale-[1.04] object-cover object-[50%_70%] transition-transform duration-[1200ms] motion-reduce:transition-none", EASE)}
        />
      </div>
      <style href="asta-footer-aui-027" precedence="asta">
        {CSS}
      </style>
    </footer>
  );
}

export default CtaFooter;
