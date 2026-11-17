"use client";

import { useId, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface TagInputProps {
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  /** Most tags allowed. */
  max?: number;
  placeholder?: string;
  label?: string;
  className?: string;
}

/**
 * Type and press Enter or comma to add a tag. Backspace on an empty field marks the last tag, a second
 * Backspace removes it. Pasting "a, b, c" adds all three. A duplicate makes the existing tag shake.
 */
export function TagInput({ value, defaultValue = [], onChange, max = 8, placeholder = "Add a tag", label = "Tags", className }: TagInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const tags = value ?? inner;
  const [text, setText] = useState("");
  const [armed, setArmed] = useState(false);
  const [shake, setShake] = useState<{ tag: string; n: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const full = tags.length >= max;

  const set = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const add = (raw: string[]) => {
    const next = [...tags];
    for (const r of raw) {
      const t = r.trim().replace(/\s+/g, " ");
      if (!t) continue;
      const dup = next.find((x) => x.toLowerCase() === t.toLowerCase());
      if (dup) {
        setShake((s) => ({ tag: dup, n: (s?.n ?? 0) + 1 }));
        continue;
      }
      if (next.length >= max) break;
      next.push(t);
    }
    if (next.length !== tags.length) set(next);
    setText("");
  };

  const remove = (t: string) => {
    set(tags.filter((x) => x !== t));
    setArmed(false);
    input.current?.focus();
  };

  return (
    <div className={cx("w-full", className)}>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        <span className={cx("font-mono text-[11px] tabular-nums transition-colors", full ? "text-[#e5484d]" : "text-mute")} aria-live="polite">
          {tags.length}/{max}
        </span>
      </div>
      <div
        onClick={() => input.current?.focus()}
        className={cx(
          "flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-[9px] bg-paper p-1.5 transition-shadow duration-200",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]",
          "focus-within:shadow-[inset_0_0_0_1px_var(--color-accent),0_0_0_4px_color-mix(in_srgb,var(--color-accent)_14%,transparent)]",
        )}
      >
        <style>{`
          @keyframes kit-tag-in { from { transform: scale(.6); opacity: 0 } }
          @keyframes kit-tag-shake { 0%,100% { transform: none } 20% { transform: translateX(-4px) } 40% { transform: translateX(4px) } 60% { transform: translateX(-3px) } 80% { transform: translateX(2px) } }
          @media (prefers-reduced-motion: reduce) { [data-kit-tag] { animation: none !important } }
        `}</style>
        <ul className="contents" aria-label={label}>
          {tags.map((t, i) => {
            const last = i === tags.length - 1;
            const shaking = shake?.tag === t;
            return (
              <li
                key={shaking ? `${t}-${shake.n}` : t}
                data-kit-tag
                className={cx(
                  "flex h-8 items-center gap-1 rounded-md pl-3 pr-1 text-[13px] transition-colors duration-200",
                  last && armed ? "bg-[#e5484d] text-white" : "bg-paper-2 text-ink",
                )}
                style={{ animation: shaking ? "kit-tag-shake .4s ease" : "kit-tag-in .35s cubic-bezier(.16,1,.3,1)" }}
              >
                {t}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(t);
                  }}
                  aria-label={`Remove ${t}`}
                  className={cx(
                    "flex h-6 w-6 items-center justify-center rounded-[5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50",
                    last && armed ? "hover:bg-white/20" : "text-mute hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] hover:text-ink",
                  )}
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
        <input
          ref={input}
          id={id}
          value={text}
          disabled={full && !text}
          placeholder={full ? "Limit reached" : tags.length ? "" : placeholder}
          onChange={(e) => {
            setArmed(false);
            const v = e.target.value;
            if (v.includes(",")) add(v.split(","));
            else setText(v);
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData("text");
            if (/[,\n]/.test(v)) {
              e.preventDefault();
              add(v.split(/[,\n]/));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add([text]);
            } else if (e.key === "Backspace" && !text && tags.length) {
              if (armed) remove(tags[tags.length - 1]);
              else setArmed(true);
            } else if (e.key === "Escape") setArmed(false);
          }}
          onBlur={() => {
            setArmed(false);
            if (text.trim()) add([text]);
          }}
          className="h-8 min-w-[4rem] flex-1 bg-transparent px-2 text-[14px] text-ink outline-none placeholder:text-mute disabled:cursor-not-allowed"
        />
      </div>
      <p className="mt-2 text-[12px] text-mute">
        <kbd className="font-sans text-ink-2">Enter</kbd> or <kbd className="font-sans text-ink-2">,</kbd> to add ·{" "}
        <kbd className="font-sans text-ink-2">⌫</kbd> twice to remove
      </p>
    </div>
  );
}

export default TagInput;
