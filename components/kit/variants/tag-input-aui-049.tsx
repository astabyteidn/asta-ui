"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

const KEYFRAMES = `
@keyframes aui049-in { 0% { opacity: 0; transform: scale(.7) } 60% { opacity: 1; transform: scale(1.04) } 100% { transform: none } }
@keyframes aui049-sug { from { opacity: 0; transform: translateY(6px) } }
@keyframes aui049-shake { 0%,100% { transform: none } 25% { transform: translateX(-4px) } 50% { transform: translateX(4px) } 75% { transform: translateX(-2px) } }
@media (prefers-reduced-motion: reduce) { .aui049 *, .aui049 { animation: none !important; transition: none !important } }
`;

export interface SuggestTagInputProps {
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  /** Offered under the field. Click one and it flies in. Typing a prefix shows it as a ghost, Tab accepts. */
  suggestions?: string[];
  max?: number;
  label?: string;
  placeholder?: string;
  name?: string;
  className?: string;
}

const SUGGEST = ["design-systems", "motion", "typography", "frontend", "accessibility", "case-study", "process"];
const norm = (t: string) => t.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");

/** aui-049 · Suggested tags: suggestions fly into the field when picked and a typed prefix shows the rest as a ghost that Tab accepts. */
export function SuggestTagInput({
  value,
  defaultValue = ["motion"],
  onChange,
  suggestions = SUGGEST,
  max = 6,
  label = "Tags",
  placeholder = "Add a tag…",
  name,
  className,
}: SuggestTagInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const tags = value ?? inner;
  const [text, setText] = useState("");
  const [shake, setShake] = useState<{ tag: string; n: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLDivElement>(null);
  // Where a picked suggestion started, so the new chip can fly in from there.
  const fly = useRef<{ tag: string; x: number; y: number } | null>(null);
  const id = useId();
  const full = tags.length >= max;

  const t = norm(text);
  const open = suggestions.filter((s) => !tags.includes(s));
  const ghost = t ? open.find((s) => s.startsWith(t) && s !== t) : undefined;

  useLayoutEffect(() => {
    const f = fly.current;
    fly.current = null;
    if (!f || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = field.current?.querySelector<HTMLElement>(`[data-tag="${CSS.escape(f.tag)}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.animate(
      [
        { transform: `translate(${f.x - r.left}px, ${f.y - r.top}px) scale(.94)`, opacity: 0.4 },
        { transform: "translate(0,0) scale(1.04)", opacity: 1, offset: 0.75 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 560, easing: EASE },
    );
  }, [tags]);

  const set = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const add = (raw: string, from?: HTMLElement) => {
    const tag = norm(raw);
    setText("");
    if (!tag) return;
    if (tags.includes(tag)) return setShake((s) => ({ tag, n: (s?.n ?? 0) + 1 }));
    if (full) return;
    if (from) {
      const r = from.getBoundingClientRect();
      fly.current = { tag, x: r.left, y: r.top };
    }
    set([...tags, tag]);
  };
  const remove = (tag: string) => {
    set(tags.filter((x) => x !== tag));
    input.current?.focus();
  };

  return (
    <div className={cx("aui049 w-full", className)}>
      <style href="asta-aui049" precedence="asta">{KEYFRAMES}</style>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[12.5px] font-medium text-ink">
          {label}
        </label>
        <span className="font-mono text-[11px] tabular-nums text-mute" aria-live="polite">
          <span className={cx("transition-colors", full && "text-ink")}>{tags.length}</span>/{max}
        </span>
      </div>
      <div
        ref={field}
        onClick={() => input.current?.focus()}
        className={cx(
          "flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-[10px] bg-paper p-1.5 transition-shadow duration-300",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]",
          "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        )}
      >
        <ul className="contents" aria-label={label}>
          {tags.map((tag) => {
            const shaking = shake?.tag === tag;
            return (
              <li
                key={shaking ? `${tag}-${shake.n}` : tag}
                data-tag={tag}
                className="relative flex h-7 items-center gap-0.5 rounded-[7px] bg-ink pl-2.5 pr-0.5 text-[12.5px] font-medium text-paper"
                style={{ animation: shaking ? `aui049-shake .4s ${EASE}` : `aui049-in .45s ${EASE} both` }}
              >
                <span className="mr-0.5 opacity-50" aria-hidden>
                  #
                </span>
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(tag);
                  }}
                  aria-label={`Remove ${tag}`}
                  className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-[5px] opacity-60 outline-none transition-[opacity,background-color] hover:bg-[color-mix(in_srgb,var(--color-paper)_14%,transparent)] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
        <span className="relative flex h-7 min-w-[7rem] flex-1 items-center">
          {ghost && (
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre px-1.5 text-[13.5px]">
              <span className="invisible">{text}</span>
              <span className="text-mute">{ghost.slice(t.length)}</span>
              <kbd className="ml-2 rounded-[4px] bg-paper-2 px-1 font-mono text-[10px] text-mute">tab</kbd>
            </span>
          )}
          <input
            ref={input}
            id={id}
            value={text}
            disabled={full && !text}
            placeholder={full ? "That's the limit" : tags.length ? "" : placeholder}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-sug`}
            onChange={(e) => {
              const v = e.target.value;
              if (v.includes(",")) v.split(",").forEach((p) => add(p));
              else setText(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(text);
              } else if ((e.key === "Tab" || e.key === "ArrowRight") && ghost && e.currentTarget.selectionStart === text.length) {
                e.preventDefault();
                add(ghost);
              } else if (e.key === "Backspace" && !text && tags.length) {
                e.preventDefault();
                remove(tags[tags.length - 1]);
              } else if (e.key === "Escape") setText("");
            }}
            onBlur={() => text.trim() && add(text)}
            className="relative h-7 w-full bg-transparent px-1.5 text-[16px] sm:text-[13.5px] text-ink outline-none placeholder:text-mute disabled:cursor-not-allowed"
          />
        </span>
      </div>
      {name && <input type="hidden" name={name} value={tags.join(",")} />}

      <div id={`${id}-sug`} className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Suggested</span>
        {open.length === 0 && <span className="text-[12px] text-mute">All added</span>}
        {open.map((s, i) => {
          const hit = !!t && s.startsWith(t);
          return (
            <button
              key={s}
              type="button"
              disabled={full}
              onClick={(e) => add(s, e.currentTarget)}
              className={cx(
                "group flex h-7 items-center gap-1 rounded-[7px] px-2 text-[12.5px] outline-none transition-[background-color,box-shadow,transform,color] duration-200 hover:-translate-y-px active:scale-[.96] focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-40",
                hit
                  ? "bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] text-brand shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_35%,transparent)]"
                  : "text-ink-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] hover:bg-paper-2 hover:text-ink",
              )}
              style={{ animation: `aui049-sug .45s ${EASE} ${Math.min(i, 6) * 40}ms both` }}
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M8 3.5v9M3.5 8h9" />
              </svg>
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SuggestTagInput;
