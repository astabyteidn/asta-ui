"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface Suggestion {
  /** Inserted after the trigger, e.g. "maya" → "@maya ". */
  value: string;
  label: string;
  /** Second line, e.g. a role or a command description. */
  detail?: string;
}

export interface MentionTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value" | "defaultValue"> {
  /** Trigger character → suggestions, e.g. { "@": people, "/": commands }. */
  suggestions: Record<string, Suggestion[]>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

type Query = { trigger: string; start: number; text: string };

/** Finds an open "@word" or "/word" right before the caret. */
function findQuery(value: string, caret: number, triggers: string[]): Query | null {
  const before = value.slice(0, caret);
  const m = before.match(/(^|\s)(\S)([\w.-]*)$/);
  if (!m || !triggers.includes(m[2])) return null;
  return { trigger: m[2], start: caret - m[3].length - 1, text: m[3].toLowerCase() };
}

const BOX = "px-3.5 py-3 text-[16px] sm:text-[14px] leading-[1.55] whitespace-pre-wrap break-words";

/**
 * aui-006 · Type @ to mention someone or / for a command. The list opens at the caret, filters as you type and is
 * fully keyboard driven (↑ ↓, Enter or Tab to insert, Esc to close).
 */
export function MentionTextarea({ suggestions, value: valueProp, defaultValue = "", onChange, className, rows = 4, ...rest }: MentionTextareaProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const caretMark = useRef<HTMLSpanElement>(null);
  const listId = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [query, setQuery] = useState<Query | null>(null);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const items = query ? (suggestions[query.trigger] ?? []).filter((s) => !query.text || s.value.toLowerCase().includes(query.text) || s.label.toLowerCase().includes(query.text)).slice(0, 6) : [];
  const open = !!query && items.length > 0;

  function set(next: string) {
    if (valueProp === undefined) setInner(next);
    onChange?.(next);
  }

  function sync(el: HTMLTextAreaElement) {
    const q = findQuery(el.value, el.selectionStart, Object.keys(suggestions));
    setQuery(q);
    setActive(0);
  }

  // Place the list under the caret: the mirror holds the text up to the trigger plus a marker span.
  useLayoutEffect(() => {
    const el = area.current;
    const mark = caretMark.current;
    const m = mirror.current;
    if (!open || !el || !mark || !m) return;
    m.style.width = `${el.clientWidth}px`;
    const x = Math.min(mark.offsetLeft, el.clientWidth - 240);
    setPos({ x: Math.max(8, x), y: mark.offsetTop + mark.offsetHeight - el.scrollTop + 6 });
  }, [open, query?.start, value]);

  function insert(s: Suggestion) {
    const el = area.current;
    if (!el || !query) return;
    const end = el.selectionStart;
    const next = value.slice(0, query.start) + query.trigger + s.value + " " + value.slice(end);
    const caret = query.start + s.value.length + 2;
    set(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insert(items[active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setQuery(null);
        return;
      }
    }
    rest.onKeyDown?.(e);
  }

  return (
    <div className={cx("relative w-full", className)}>
      <textarea
        ref={area}
        rows={rows}
        {...rest}
        value={value}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          set(e.target.value);
          sync(e.target);
        }}
        onKeyDown={onKeyDown}
        onClick={(e) => sync(e.currentTarget)}
        onBlur={(e) => {
          setQuery(null);
          rest.onBlur?.(e);
        }}
        className={cx(
          BOX,
          "block w-full resize-none rounded-xl bg-paper text-ink outline-none placeholder:text-mute transition-shadow duration-200 motion-reduce:transition-none",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] focus:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]",
        )}
      />
      <div ref={mirror} aria-hidden className={cx(BOX, "pointer-events-none invisible absolute left-0 top-0")}>
        {value.slice(0, query?.start ?? 0)}
        <span ref={caretMark}>{query?.trigger ?? ""}</span>
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label={query?.trigger === "/" ? "Commands" : "People"}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className={cx(
          "absolute left-0 top-0 z-20 w-[232px] origin-top-left rounded-xl bg-paper p-1 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_16px_40px_-16px_rgb(0_0_0/0.3)] transition-[opacity,scale] duration-200 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        {items.map((s, i) => (
          <li
            key={s.value}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault();
              insert(s);
            }}
            onMouseEnter={() => setActive(i)}
            className={cx("flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors duration-150", i === active ? "bg-paper-2" : "")}
          >
            <span className={cx("grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-medium", i === active ? "bg-brand text-white" : "bg-paper-2 text-ink-2")}>
              {query?.trigger === "@" ? s.label[0] : query?.trigger}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-ink">{s.label}</span>
              {s.detail && <span className="block truncate text-[11.5px] text-mute">{s.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MentionTextarea;
