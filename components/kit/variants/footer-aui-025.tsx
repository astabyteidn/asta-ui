"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const step = (i: number) => ({ "--i": i }) as CSSProperties;

type Glyph = "x" | "github" | "linkedin";

export interface MinimalFooterProps {
  brand?: ReactNode;
  links?: { label: string; href: string }[];
  socials?: { label: string; href: string; icon: Glyph }[];
  /** Text after the © sign. The current year is added in front. */
  owner?: string;
  /** Glide the underline across the links once after mount, to show it off. */
  hint?: boolean;
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
  { label: "Product", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Journal", href: "#" },
  { label: "Changelog", href: "#" },
];

const DEFAULT_SOCIALS: { label: string; href: string; icon: Glyph }[] = [
  { label: "X", href: "#", icon: "x" },
  { label: "GitHub", href: "#", icon: "github" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
];

const CSS = `
@keyframes aui-f25-rise { from { opacity: 0; transform: translateY(10px) } }
.aui-f25-in { animation: aui-f25-rise .6s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--i, 0) * 55ms) }
@media (prefers-reduced-motion: reduce) { .aui-f25-in { animation: none } }
`;

function Mark() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.03em] text-ink">
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
        <rect width="24" height="24" rx="7" className="fill-ink" />
        <path d="M7 17V7h2.3l5.4 6.3V7H17v10h-2.3L9.3 10.7V17H7Z" className="fill-paper" />
      </svg>
      Astabyte
    </span>
  );
}

/** aui-025 · One-row footer where a brand underline glides between links, with social icons and copyright, wrapping neatly on small screens. */
export function MinimalFooter({ brand = <Mark />, links = DEFAULT_LINKS, socials = DEFAULT_SOCIALS, owner = "Astabyte", hint = false, className }: MinimalFooterProps) {
  const list = useRef<HTMLUListElement>(null);
  const [line, setLine] = useState<{ x: number; y: number; w: number; on: boolean }>({ x: 0, y: 0, w: 0, on: false });
  const year = new Date().getFullYear();

  const point = (i: number | null) => {
    const el = i === null ? null : list.current?.querySelectorAll<HTMLAnchorElement>("a[data-l]")[i];
    if (!el) return setLine((l) => ({ ...l, on: false }));
    setLine({ x: el.offsetLeft, y: el.offsetTop + el.offsetHeight + 3, w: el.offsetWidth, on: true });
  };

  useEffect(() => {
    if (!hint || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = links.map((_, i) => window.setTimeout(() => point(i), 900 + i * 260));
    timers.push(window.setTimeout(() => point(null), 900 + links.length * 260 + 200));
    return () => timers.forEach(clearTimeout);
  }, [hint, links]);

  return (
    <footer className={cx("@container w-full bg-paper px-6 py-6", className)}>
      <div className="flex flex-col gap-5 @min-[640px]:flex-row @min-[640px]:items-center @min-[640px]:gap-6">
        <div className="aui-f25-in flex items-center justify-between" style={step(0)}>
          {brand}
          <Socials socials={socials} className="@min-[640px]:hidden" />
        </div>
        <nav aria-label="Footer" className="@min-[640px]:flex-1">
          <ul ref={list} className="relative flex flex-wrap gap-x-5 gap-y-3" onPointerLeave={() => point(null)}>
            {links.map((l, i) => (
              <li key={l.label} className="aui-f25-in" style={step(i + 1)}>
                <a
                  data-l
                  href={l.href}
                  onPointerEnter={() => point(i)}
                  onFocus={() => point(i)}
                  onBlur={() => point(null)}
                  className={cx("rounded-[4px] text-[13.5px] text-mute transition-colors duration-300 hover:text-ink focus-visible:text-ink", ring)}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <span
              aria-hidden
              className={cx("pointer-events-none absolute left-0 top-0 h-[1.5px] w-px origin-left rounded-full bg-brand transition-[transform,opacity] duration-500 motion-reduce:transition-none", EASE)}
              style={{ transform: `translate(${line.x}px, ${line.y}px) scaleX(${Math.max(line.w, 1)})`, opacity: line.on ? 1 : 0 }}
            />
          </ul>
        </nav>
        <div className="aui-f25-in flex items-center justify-between gap-3 @min-[640px]:justify-end" style={step(links.length + 1)}>
          <Socials socials={socials} className="hidden @min-[640px]:flex" />
          <p className="font-mono text-[11.5px] tracking-[0.02em] text-mute">
            © {year} {owner}
          </p>
        </div>
      </div>
      <style href="asta-footer-aui-025" precedence="asta">
        {CSS}
      </style>
    </footer>
  );
}

function Socials({ socials, className }: { socials: { label: string; href: string; icon: Glyph }[]; className?: string }) {
  return (
    <ul className={cx("flex items-center gap-1", className)}>
      {socials.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            aria-label={s.label}
            className={cx(
              "grid h-8 w-8 place-items-center rounded-[8px] text-mute transition-[transform,color,background-color] duration-300 hover:-translate-y-px hover:bg-paper-2 hover:text-ink active:scale-90 motion-reduce:transition-colors",
              EASE,
              ring,
            )}
          >
            <svg viewBox="0 0 18 18" className="h-[15px] w-[15px]" aria-hidden>
              {GLYPHS[s.icon]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default MinimalFooter;
