"use client";

import { useRef, useState, type KeyboardEvent, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Tool = { id: string; label: string; key?: string; before: string; after: string; line?: boolean; d: string };

const TOOLS: Tool[] = [
  { id: "bold", label: "Bold", key: "b", before: "**", after: "**", d: "M5 3h4a2.5 2.5 0 0 1 0 5H5zM5 8h4.5a2.5 2.5 0 0 1 0 5H5z" },
  { id: "italic", label: "Italic", key: "i", before: "_", after: "_", d: "M10 3H7M9 13H6M9 3 7 13" },
  { id: "code", label: "Code", key: "e", before: "`", after: "`", d: "m6 4-4 4 4 4M10 4l4 4-4 4" },
  { id: "link", label: "Link", key: "k", before: "[", after: "](https://)", d: "M7 9a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4l-.5.5M9 7a3 3 0 0 0-4 0L3 9a3 3 0 0 0 4 4l.5-.5" },
  { id: "quote", label: "Quote", before: "> ", after: "", line: true, d: "M3 6h4v4H4l-1 3M9 6h4v4h-3l-1 3" },
  { id: "list", label: "List", before: "- ", after: "", line: true, d: "M6 4h8M6 8h8M6 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" },
];

export interface MarkdownTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Tools to show, by id: bold, italic, code, link, quote, list. */
  tools?: string[];
}

/** aui-005 · A textarea with a formatting toolbar that wraps the selection in Markdown. ⌘/Ctrl + B, I, E, K work too. */
export function MarkdownTextarea({ tools = TOOLS.map((t) => t.id), className, rows = 6, ...rest }: MarkdownTextareaProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const controlled = rest.value !== undefined;
  const [inner, setInner] = useState(String(rest.defaultValue ?? ""));
  const value = controlled ? String(rest.value) : inner;
  const [flash, setFlash] = useState<string | null>(null);
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  function apply(t: Tool) {
    const el = area.current;
    if (!el) return;
    el.focus();
    const { selectionStart: s, selectionEnd: e } = el;
    if (t.line) {
      const from = el.value.lastIndexOf("\n", s - 1) + 1;
      const block = el.value.slice(from, e).split("\n").map((l) => t.before + l).join("\n");
      el.setRangeText(block, from, e, "end");
    } else {
      const picked = el.value.slice(s, e) || t.label.toLowerCase();
      el.setRangeText(t.before + picked + t.after, s, e, "end");
      el.setSelectionRange(s + t.before.length, s + t.before.length + picked.length);
    }
    // setRangeText doesn't fire React's onChange: dispatch an input event so controlled parents see it.
    el.dispatchEvent(new Event("input", { bubbles: true }));
    if (!controlled) setInner(el.value);
    setFlash(t.id);
    setTimeout(() => setFlash((f) => (f === t.id ? null : f)), 300);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.metaKey || e.ctrlKey) {
      const t = TOOLS.find((x) => x.key === e.key.toLowerCase() && tools.includes(x.id));
      if (t) {
        e.preventDefault();
        apply(t);
        return;
      }
    }
    rest.onKeyDown?.(e);
  }

  return (
    <div
      className={cx(
        "w-full overflow-hidden rounded-xl bg-paper transition-shadow duration-200 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)] motion-reduce:transition-none",
        className,
      )}
    >
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 bg-paper-2/60 px-1.5 py-1.5">
        {TOOLS.filter((t) => tools.includes(t.id)).map((t) => (
          <button
            key={t.id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply(t)}
            aria-label={t.label}
            title={t.key ? `${t.label} (⌘${t.key.toUpperCase()})` : t.label}
            className={cx(
              "grid h-7 w-7 place-items-center rounded-md text-mute transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(.16,1,.3,1)] hover:bg-paper hover:text-ink active:scale-90 motion-reduce:transition-none",
              flash === t.id && "scale-90 bg-paper text-brand",
            )}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={t.d} />
            </svg>
          </button>
        ))}
      </div>
      <textarea
        ref={area}
        rows={rows}
        {...rest}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          if (!controlled) setInner(e.target.value);
          rest.onChange?.(e);
        }}
        className="block w-full resize-y bg-transparent px-3.5 py-3 font-mono text-[16px] sm:text-[13px] leading-[1.6] text-ink outline-none placeholder:font-sans placeholder:text-mute"
      />
      <div className="flex items-center justify-between px-3.5 pb-2.5 text-[11.5px] text-mute">
        <span>Markdown supported</span>
        <span className="tabular-nums">
          {words} {words === 1 ? "word" : "words"}
        </span>
      </div>
    </div>
  );
}

export default MarkdownTextarea;
