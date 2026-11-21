"use client";

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/icons/Icon";
import { LOGO_CATEGORIES, LOGOS, type Logo, type LogoCategory } from "@/components/logos/logos";

type Tone = "mono" | "brand";
type Kind = "svg" | "jsx";

const SIZES = [
  { id: "s", label: "S", scale: 0.5 },
  { id: "m", label: "M", scale: 0.70833 },
  { id: "l", label: "L", scale: 1 },
] as const;
type Size = (typeof SIZES)[number]["id"];

const COUNT: Record<string, number> = { All: LOGOS.length };
for (const l of LOGOS) COUNT[l.category] = (COUNT[l.category] ?? 0) + 1;

/** Relative luminance of a hex colour, so very light brand colours get a dark tile instead of vanishing. */
function luminance(hex: string) {
  const c = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

const componentName = (title: string) =>
  title
    .replace(/\+/g, " Plus ")
    .replace(/&/g, " And ")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("")
    .replace(/^1/, "One") + "Logo";

function svgString(l: Logo, tone: Tone) {
  const fill = tone === "brand" ? `#${l.hex}` : "currentColor";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}" role="img" aria-label="${l.title}"><path d="${l.path}"/></svg>`;
}

function jsxString(l: Logo, tone: Tone) {
  const fill = tone === "brand" ? `#${l.hex}` : "currentColor";
  return `export function ${componentName(l.title)}(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill}" role="img" aria-label="${l.title}" {...props}>
      <path d="${l.path}" />
    </svg>
  );
}
`;
}

// Tone and size live on the grid as a data attribute and a CSS variable, so switching them restyles 200 tiles without re-rendering one.
const CSS = `
.logo-tile{content-visibility:auto;contain-intrinsic-size:auto 168px}
.logo-glyph{width:48px;height:48px;fill:currentColor;transform:scale(var(--logo-scale,.70833));transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .3s cubic-bezier(.16,1,.3,1)}
.logo-btn:active .logo-glyph{transform:scale(calc(var(--logo-scale,.70833)*.86));transition-duration:.1s}
[data-tone=brand] .logo-glyph{fill:var(--c)}
.logo-face{transition:opacity .3s cubic-bezier(.16,1,.3,1)}
[data-tone=brand] .logo-tile[data-light] .logo-face{opacity:1}
[data-tone=brand] .logo-tile[data-light] .logo-name{color:color-mix(in srgb,var(--color-paper) 70%,transparent)}
.logo-jsx{opacity:0;transform:translateY(2px);transition:opacity .25s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.16,1,.3,1)}
.logo-tile:hover .logo-jsx,.logo-tile:focus-within .logo-jsx{opacity:1;transform:none}
@media (hover:none) and (pointer:coarse){.logo-jsx{opacity:1;transform:none}}
.logo-toast{transition:opacity .35s cubic-bezier(.16,1,.3,1),transform .5s cubic-bezier(.16,1,.3,1)}
@media (prefers-reduced-motion:reduce){.logo-glyph,.logo-jsx,.logo-toast,.logo-face{transition:none}}
`;

const Tile = memo(function Tile({ logo, onCopy }: { logo: Logo; onCopy: (l: Logo, k: Kind) => void }) {
  const light = luminance(logo.hex) > 0.75;
  return (
    <li className="logo-tile group relative" data-light={light ? "" : undefined} style={{ "--c": `#${logo.hex}` } as React.CSSProperties}>
      <button
        type="button"
        onClick={() => onCopy(logo, "svg")}
        aria-label={`Copy ${logo.title} SVG`}
        title={`${logo.title} · #${logo.hex}`}
        className="logo-btn relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-paper-2 text-ink hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,var(--color-paper-2))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span aria-hidden className="logo-face absolute inset-0 bg-ink opacity-0" />
        <span className="relative grid h-12 w-12 place-items-center">
          <svg viewBox="0 0 24 24" aria-hidden className="logo-glyph">
            <path d={logo.path} />
          </svg>
        </span>
        <span className="logo-name absolute inset-x-0 bottom-3 truncate px-3 text-center text-[12.5px] text-mute">{logo.title}</span>
      </button>
      <button
        type="button"
        onClick={() => onCopy(logo, "jsx")}
        aria-label={`Copy ${logo.title} as JSX`}
        className="logo-jsx absolute right-2 top-2 rounded-[6px] bg-paper px-1.5 py-0.5 font-mono text-[10.5px] text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
      >
        JSX
      </button>
    </li>
  );
});

/** Searchable, filterable grid of brand logos. Click copies the SVG, the JSX chip copies a React component. */
export default function LogoGrid() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<LogoCategory | "All">("All");
  const [tone, setTone] = useState<Tone>("mono");
  const [size, setSize] = useState<Size>("m");
  const [toast, setToast] = useState({ on: false, text: "" });
  const toneRef = useRef(tone);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    toneRef.current = tone;
  }, [tone]);

  const term = useDeferredValue(q.trim().toLowerCase());
  const shown = useMemo(
    () => LOGOS.filter((l) => (cat === "All" || l.category === cat) && (!term || l.title.toLowerCase().includes(term) || l.slug.includes(term.replace(/[\s.]/g, "")))),
    [term, cat],
  );

  const onCopy = useCallback(async (l: Logo, kind: Kind) => {
    const t = toneRef.current;
    try {
      await navigator.clipboard.writeText(kind === "svg" ? svgString(l, t) : jsxString(l, t));
      setToast({ on: true, text: `${l.title} copied as ${kind === "svg" ? "SVG" : "JSX"}${t === "brand" ? ` · #${l.hex}` : ""}` });
    } catch {
      setToast({ on: true, text: "Clipboard blocked. Try again." });
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((p) => ({ ...p, on: false })), 1800);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !el.closest("input,textarea,[contenteditable=true]")) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer.current);
    };
  }, []);

  const scale = SIZES.find((s) => s.id === size)!.scale;

  return (
    <div className="mt-10" data-tone={tone} style={{ "--logo-scale": scale } as React.CSSProperties}>
      <style href="asta-logo-grid" precedence="asta">
        {CSS}
      </style>

      <div className="flex flex-col gap-2 lg:flex-row">
        <label className="flex h-11 min-w-0 shrink-0 items-center lg:flex-1 gap-3 rounded-lg bg-paper-2 px-4 text-mute">
          <Icon name="search" className="h-4 w-4 shrink-0" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQ("")}
            placeholder={`Search ${LOGOS.length} logos`}
            aria-label="Search logos"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute"
          />
          <span className="kbd hidden sm:inline-flex">/</span>
        </label>
        <div className="flex gap-2">
          <Segmented
            label="Colour"
            value={tone}
            onChange={setTone}
            options={[
              { id: "mono", label: "Mono" },
              { id: "brand", label: "Brand" },
            ]}
          />
          <Segmented label="Size" value={size} onChange={setSize} options={SIZES.map((s) => ({ id: s.id, label: s.label }))} />
        </div>
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto rounded-[10px] bg-paper-2 p-1 [scrollbar-width:none]" role="group" aria-label="Category">
        {(["All", ...LOGO_CATEGORIES] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setCat(k)}
            aria-pressed={cat === k}
            className={`flex h-8 shrink-0 items-center gap-2 rounded-[7px] px-3.5 text-[14px] font-medium focus-visible:outline-2 focus-visible:outline-brand ${cat === k ? "bg-ink text-paper" : "text-mute hover:text-ink"}`}
          >
            {k}
            <span className={`font-mono text-[11.5px] tabular-nums ${cat === k ? "text-paper/60" : "text-mute"}`}>{COUNT[k]}</span>
          </button>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10" aria-label={`${shown.length} logos`}>
        {shown.map((l) => (
          <Tile key={l.slug} logo={l} onCopy={onCopy} />
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="py-14 text-center text-[15px] text-mute">
          No logo matches “{q}”{cat !== "All" ? ` in ${cat}` : ""}.
        </p>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" aria-live="polite">
        <div
          className="logo-toast flex items-center gap-2 rounded-[9px] bg-ink px-4 py-2.5 text-[14px] text-paper shadow-[0_8px_30px_-10px_rgb(0_0_0/0.4),inset_0_0_0_1px_rgb(255_255_255/0.12)]"
          style={{ opacity: toast.on ? 1 : 0, transform: toast.on ? "none" : "translateY(8px)" }}
        >
          <Icon name="check" className="h-4 w-4 text-[color-mix(in_srgb,var(--color-brand)_45%,var(--color-paper))]" />
          {toast.text}
        </div>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="flex h-11 shrink-0 gap-1 rounded-lg bg-paper-2 p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-w-9 rounded-[7px] px-3 text-[14px] font-medium focus-visible:outline-2 focus-visible:outline-brand ${value === o.id ? "bg-paper text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]" : "text-mute hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
