"use client";

import { useEffect, useId, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui033-ch { from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: none } }
@keyframes aui033-in { from { opacity: 0; transform: translateY(3px) } to { opacity: 1; transform: none } }
@keyframes aui033-spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .aui033 * { animation-duration: 1ms !important; transition: none !important } .aui033 .aui033-spin { animation: aui033-spin 1.6s linear infinite !important } }
`;

/** Lowercase, strip accents, dashes between words, at most 60 characters. */
export const slugFromTitle = (s: string, keepTrailing = false) => {
  const out = s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 60);
  return keepTrailing ? out : out.replace(/-+$/, "");
};

const TAKEN = ["motion-lab", "hello-world", "about", "work", "research"];
const fakeCheck = (slug: string) => new Promise<boolean>((r) => setTimeout(() => r(!TAKEN.includes(slug)), 520));

type Check = "idle" | "checking" | "free" | "taken";

export interface SlugInputProps {
  /** Visible label for the title. */
  label?: string;
  title?: string;
  defaultTitle?: string;
  onTitleChange?: (title: string) => void;
  /** Called with the current slug. */
  onSlugChange?: (slug: string) => void;
  /** Shown in front of the slug, without the protocol. */
  base?: string;
  /** Resolve true when the slug is free. Defaults to a fake check against a few taken slugs. */
  check?: (slug: string) => Promise<boolean>;
  placeholder?: string;
  className?: string;
}

/**
 * aui-033 · Title to slug. Signature: the URL preview rewrites itself letter by letter as you type the title,
 * then a tiny spinner checks the address and settles on Available or a one-tap free alternative.
 */
export function SlugInput({
  label = "Title",
  title: titleProp,
  defaultTitle = "",
  onTitleChange,
  onSlugChange,
  base = "astabyte.com/research/",
  check = fakeCheck,
  placeholder = "Untitled note",
  className,
}: SlugInputProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultTitle);
  const title = titleProp ?? inner;
  const [custom, setCustom] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const slug = custom ?? slugFromTitle(title);
  const [state, setState] = useState<{ slug: string; s: Check }>({ slug: "", s: "idle" });
  const run = useRef(0);
  const slugRef = useRef<HTMLInputElement>(null);
  const cb = useRef(onSlugChange);
  useEffect(() => {
    cb.current = onSlugChange;
  });

  useEffect(() => {
    cb.current?.(slug);
    const n = ++run.current;
    if (!slug) return;
    const t = setTimeout(() => {
      setState({ slug, s: "checking" });
      check(slug).then(
        (free) => n === run.current && setState({ slug, s: free ? "free" : "taken" }),
        () => n === run.current && setState({ slug, s: "idle" }),
      );
    }, 280);
    return () => clearTimeout(t);
  }, [slug, check]);

  useEffect(() => {
    if (editing) slugRef.current?.focus();
  }, [editing]);

  const status: Check = !slug ? "idle" : state.slug === slug ? state.s : "checking";
  const alt = `${slug}-2`;
  const setTitle = (v: string) => {
    if (titleProp === undefined) setInner(v);
    onTitleChange?.(v);
  };

  return (
    <div className={cx("aui033 w-full", className)}>
      <style href="asta-input-aui-033" precedence="asta">
        {CSS}
      </style>
      <label htmlFor={`${id}-t`} className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
        {label}
      </label>
      <input
        id={`${id}-t`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-[26px] font-medium leading-[1.15] tracking-[-0.035em] text-ink caret-brand outline-none placeholder:text-mute/60"
      />

      <div className="mt-3 flex min-h-10 items-center gap-2 rounded-[9px] bg-paper-2 py-1.5 pl-3 pr-1.5 text-[13px]">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <circle cx="8" cy="8" r="6" />
          <path d="M2 8h12M8 2c1.8 1.7 2.6 3.7 2.6 6S9.8 12.3 8 14M8 2C6.2 3.7 5.4 5.7 5.4 8s.8 4.3 2.6 6" />
        </svg>
        <div className="flex min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap">
          <span className="min-w-[3ch] truncate text-mute">{base}</span>
          {editing ? (
            <input
              ref={slugRef}
              aria-label="Slug"
              value={slug}
              onChange={(e) => setCustom(slugFromTitle(e.target.value, true))}
              onBlur={() => {
                setEditing(false);
                if (custom !== null) setCustom(slugFromTitle(custom) || null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
              }}
              className="min-w-0 flex-1 rounded-[4px] bg-paper px-1 text-ink shadow-[inset_0_0_0_1px_var(--color-brand)] outline-none"
            />
          ) : (
            <span aria-label={slug ? `Slug ${slug}` : "No slug yet"} className="shrink-0 text-ink">
              {/* Each changed letter re-mounts and rises in, unchanged ones stay put. */}
              {slug ? (
                slug.split("").map((ch, i) => (
                  <span key={`${i}${ch}`} aria-hidden className="inline-block whitespace-pre" style={{ animation: `aui033-ch .35s ${EASE} both` }}>
                    {ch}
                  </span>
                ))
              ) : (
                <span className="text-mute/70">your-title</span>
              )}
            </span>
          )}
        </div>

        <span aria-live="polite" className="flex shrink-0 items-center gap-1.5 text-[12.5px]">
          {status === "checking" && (
            <span key="c" className="flex items-center gap-1.5 text-mute" style={{ animation: `aui033-in .25s ${EASE} both` }}>
              <svg viewBox="0 0 16 16" className="aui033-spin h-3.5 w-3.5" style={{ animation: "aui033-spin .7s linear infinite" }} fill="none" aria-hidden>
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeOpacity=".25" strokeWidth="1.8" />
                <path d="M13.5 8A5.5 5.5 0 0 0 8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Checking</span>
            </span>
          )}
          {status === "free" && (
            <span key="f" className="flex items-center gap-1.5 font-medium text-ink" style={{ animation: `aui033-in .3s ${EASE} both` }}>
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Available
            </span>
          )}
          {status === "taken" && (
            <span key="t" className="flex items-center gap-1.5 text-ink" style={{ animation: `aui033-in .3s ${EASE} both` }}>
              <span className="hidden sm:inline">Taken</span>
              <button
                type="button"
                onClick={() => setCustom(alt)}
                className="rounded-[6px] bg-paper px-1.5 py-0.5 font-medium text-brand shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] outline-none transition-transform duration-200 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                Use {alt.length > 22 ? "-2" : alt}
              </button>
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={() => {
            if (custom !== null && !editing) setCustom(null);
            else setEditing(true);
          }}
          aria-label={custom !== null && !editing ? "Follow the title again" : "Edit slug"}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] text-mute outline-none transition-colors duration-200 hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {custom !== null && !editing ? (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6.5 9.5 9.5 6.5M7 4.5l1.3-1.3a2.5 2.5 0 0 1 3.5 3.5L10.5 8M9 11.5l-1.3 1.3a2.5 2.5 0 0 1-3.5-3.5L5.5 8" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5Z" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-1.5 pl-1 text-[12px] text-mute">{custom !== null ? "Custom slug. Use the link to follow the title again." : "Follows the title until you edit it."}</p>
    </div>
  );
}

export default SlugInput;
