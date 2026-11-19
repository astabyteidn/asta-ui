"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const step = (i: number) => ({ "--i": i }) as CSSProperties;

type Glyph = "x" | "github" | "linkedin";

export interface CenteredFooterProps {
  brand?: ReactNode;
  tagline?: ReactNode;
  links?: { label: string; href: string }[];
  socials?: { label: string; href: string; icon: Glyph }[];
  /** Legal line under everything. Defaults to © year, Astabyte and two policy links. */
  legal?: ReactNode;
  className?: string;
}

const GLYPHS: Record<Glyph, ReactNode> = {
  x: <path d="M3 3h3.6l3.1 4.3L13.4 3H15l-4.6 5.4L15.5 15h-3.6l-3.3-4.6L4.6 15H3l5-5.8L3 3Zm2.2 1.2 7.3 9.6h1.1L6.4 4.2H5.2Z" fill="currentColor" />,
  github: (
    <path
      d="M9 1.8a7.2 7.2 0 0 0-2.3 14c.4.1.5-.1.5-.3v-1.3c-2 .4-2.4-.9-2.4-.9-.3-.8-.8-1-.8-1-.7-.5 0-.5 0-.5.7 0 1.1.8 1.1.8.6 1.1 1.7.8 2.1.6 0-.5.3-.8.5-1-1.6-.2-3.3-.8-3.3-3.5 0-.8.3-1.4.7-1.9 0-.2-.3-.9.1-1.9 0 0 .6-.2 2 .7a6.8 6.8 0 0 1 3.6 0c1.4-.9 2-.7 2-.7.4 1 .1 1.7.1 1.9.5.5.7 1.1.7 1.9 0 2.8-1.7 3.4-3.3 3.5.3.2.5.7.5 1.3v2c0 .2.1.4.5.3A7.2 7.2 0 0 0 9 1.8Z"
      fill="currentColor"
    />
  ),
  linkedin: <path d="M3 6.5h2.6V15H3V6.5Zm1.3-4.1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM7.2 6.5h2.5v1.2c.4-.7 1.2-1.4 2.6-1.4 2.7 0 3.2 1.8 3.2 4.1V15h-2.6v-4.1c0-1 0-2.2-1.4-2.2s-1.6 1.1-1.6 2.2V15H7.2V6.5Z" fill="currentColor" />,
};

const DEFAULT_LINKS = [
  { label: "Features", href: "#" },
  { label: "Customers", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Docs", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "#" },
];

const DEFAULT_SOCIALS: { label: string; href: string; icon: Glyph }[] = [
  { label: "X", href: "#", icon: "x" },
  { label: "GitHub", href: "#", icon: "github" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
];

const CSS = `
@keyframes aui-f26-rise { from { opacity: 0; transform: translateY(14px) } }
@keyframes aui-f26-glow { from { opacity: 0; transform: scale(.7) } }
.aui-f26-in { animation: aui-f26-rise .7s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--i, 0) * 60ms) }
.aui-f26-glow { animation: aui-f26-glow 1.4s cubic-bezier(.16,1,.3,1) both }
@media (prefers-reduced-motion: reduce) { .aui-f26-in, .aui-f26-glow { animation: none } }
`;

function Mark() {
  return (
    <span className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.03em] text-paper">
      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-[10px] bg-brand text-white shadow-[0_8px_24px_-6px_color-mix(in_srgb,var(--color-brand)_70%,transparent)]">
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M8 2.5 13.5 13h-11L8 2.5Z" />
        </svg>
      </span>
      Astabyte
    </span>
  );
}

/** aui-026 · A dark centred footer with a brand glow that follows the cursor, a big tagline, one row of links and social icons that lift and name themselves on hover. */
export function CenteredFooter({
  brand = <Mark />,
  tagline = (
    <>
      Tools for small teams <span className="text-paper/45">who ship every week.</span>
    </>
  ),
  links = DEFAULT_LINKS,
  socials = DEFAULT_SOCIALS,
  legal,
  className,
}: CenteredFooterProps) {
  const glow = useRef<HTMLDivElement>(null);
  const year = new Date().getFullYear();

  const follow = (e: React.PointerEvent<HTMLElement> | null) => {
    const el = glow.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!e) {
      el.style.transform = "translate(-50%, -50%)";
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    el.style.transform = `translate(calc(-50% + ${e.clientX - r.left - r.width / 2}px), calc(-50% + ${e.clientY - r.top - r.height / 2}px))`;
  };

  return (
    <footer
      onPointerMove={follow}
      onPointerLeave={() => follow(null)}
      className={cx("relative isolate flex w-full flex-col items-center overflow-hidden rounded-2xl bg-ink px-6 pb-8 pt-14 text-center text-paper sm:pt-16", className)}
    >
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] -z-10">
        <div ref={glow} className={cx("transition-transform duration-[1200ms] motion-reduce:transition-none", EASE)} style={{ transform: "translate(-50%, -50%)" }}>
          <div className="aui-f26-glow h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_38%,transparent),transparent)] blur-2xl" />
        </div>
      </div>

      <div className="aui-f26-in" style={step(0)}>
        {brand}
      </div>
      <p className="aui-f26-in mt-6 max-w-[17ch] text-[34px] font-medium leading-[1.04] tracking-[-0.045em] sm:text-[44px]" style={step(1)}>
        {tagline}
      </p>

      <nav aria-label="Footer" className="aui-f26-in mt-9" style={step(2)}>
        <ul className="flex flex-wrap justify-center gap-x-1 gap-y-1">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className={cx("inline-flex h-8 items-center rounded-[8px] px-3 text-[13.5px] text-paper/65 transition-[color,background-color] duration-300 hover:bg-paper/[0.07] hover:text-paper", ring)}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="mt-8 flex items-center gap-2.5">
        {socials.map((s, i) => (
          <li key={s.label} className="aui-f26-in" style={step(3 + i)}>
            <a
              href={s.href}
              aria-label={s.label}
              className={cx(
                "group/s relative grid h-10 w-10 place-items-center rounded-[10px] bg-paper/[0.06] text-paper/70 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_10%,transparent)] transition-[transform,color,background-color] duration-500 hover:-translate-y-1 hover:bg-paper/[0.1] hover:text-paper focus-visible:-translate-y-1 active:scale-95 motion-reduce:transition-colors motion-reduce:hover:translate-y-0",
                EASE,
                ring,
              )}
            >
              <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
                {GLYPHS[s.icon]}
              </svg>
              <span
                aria-hidden
                className={cx(
                  "pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-[6px] bg-paper px-2 py-1 text-[11px] font-medium text-ink opacity-0 transition-[transform,opacity] duration-300 group-hover/s:translate-y-0 group-hover/s:opacity-100 group-focus-visible/s:translate-y-0 group-focus-visible/s:opacity-100",
                  EASE,
                )}
              >
                {s.label}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="aui-f26-in mt-14 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11.5px] text-paper/40 sm:justify-between" style={step(3 + socials.length)}>
        {legal ?? (
          <>
            <span>© {year} Astabyte Made with care in Lisbon.</span>
            <span className="flex gap-5">
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-paper", ring)}>
                Privacy
              </a>
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-paper", ring)}>
                Terms
              </a>
              <a href="#" className={cx("rounded-[4px] transition-colors hover:text-paper", ring)}>
                Security
              </a>
            </span>
          </>
        )}
      </div>
      <style href="asta-footer-aui-026" precedence="asta">
        {CSS}
      </style>
    </footer>
  );
}

export default CenteredFooter;
