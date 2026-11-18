"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface ComboboxOption {
  value: string;
  label: string;
  /** Muted text on the right, e.g. a count or a shortcut. */
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface CommonProps {
  options: ComboboxOption[];
  placeholder?: string;
  label?: string;
  /** Shown when nothing matches what was typed. */
  emptyText?: ReactNode;
  /** Form field name. Multiple values submit as one hidden input each. */
  name?: string;
  disabled?: boolean;
  className?: string;
}

export interface SingleComboboxProps extends CommonProps {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
}

export interface MultipleComboboxProps extends CommonProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
}

export type ComboboxProps = SingleComboboxProps | MultipleComboboxProps;

const KEYFRAMES = `@keyframes kit-combo-in { from { opacity: 0; transform: translateY(-4px) scale(.97) } }
@keyframes kit-combo-chip { from { opacity: 0; transform: scale(.8) } }`;

/** The label with the typed part in bold. */
function Match({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-ink">{text.slice(i, i + query.length)}</span>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * Type to filter, arrows to move, Enter to pick, Escape to close. Matches are substring, case-insensitive,
 * with the typed part in bold. With `multiple`, picks become chips inside the field: click × or press
 * Backspace on an empty field to remove the last one.
 */
export function Combobox(props: ComboboxProps) {
  const { options, placeholder = "Search…", label, emptyText = "No results", name, disabled, className } = props;
  const multi = props.multiple === true;

  const [innerOne, setInnerOne] = useState<string | null>(!multi ? ((props as SingleComboboxProps).defaultValue ?? null) : null);
  const [innerMany, setInnerMany] = useState<string[]>(multi ? ((props as MultipleComboboxProps).defaultValue ?? []) : []);
  const one = !multi ? ((props as SingleComboboxProps).value !== undefined ? (props as SingleComboboxProps).value! : innerOne) : null;
  const many = multi ? ((props as MultipleComboboxProps).value ?? innerMany) : [];

  const [open, setOpen] = useState(false);
  // `null` = not typing: a single combobox then shows the picked label and the full list.
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const uid = useId();

  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const q = (query ?? "").trim();
  const shown = useMemo(() => (q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options), [options, q]);
  const isPicked = (v: string) => (multi ? many.includes(v) : one === v);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  // Leaving a single combobox with its text cleared clears the value.
  const dismiss = () => {
    if (!multi && query !== null && !query.trim() && one !== null) {
      const p = props as SingleComboboxProps;
      if (p.value === undefined) setInnerOne(null);
      p.onChange?.(null);
    }
    setOpen(false);
    setQuery(null);
  };
  const dismissRef = useRef(dismiss);
  useEffect(() => {
    dismissRef.current = dismiss;
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) dismissRef.current();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const firstEnabled = (from: number, step: 1 | -1, items = shown) => {
    let n = from;
    for (let k = 0; k < items.length; k++) {
      n = (n + step + items.length) % items.length;
      if (!items[n]?.disabled) return n;
    }
    return 0;
  };

  const show = () => {
    if (disabled || open) return;
    const at = options.findIndex((o) => isPicked(o.value) && !o.disabled);
    setActive(at >= 0 && !multi ? at : firstEnabled(-1, 1, options));
    setOpen(true);
  };

  const setMany = (next: string[]) => {
    const p = props as MultipleComboboxProps;
    if (p.value === undefined) setInnerMany(next);
    p.onChange?.(next);
  };

  const pick = (o: ComboboxOption | undefined) => {
    if (!o || o.disabled) return;
    if (multi) {
      setMany(many.includes(o.value) ? many.filter((v) => v !== o.value) : [...many, o.value]);
      setQuery(null);
      input.current?.focus();
      return;
    }
    const p = props as SingleComboboxProps;
    if (p.value === undefined) setInnerOne(o.value);
    p.onChange?.(o.value);
    setQuery(null);
    setOpen(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (!open) show();
      else setActive((a) => firstEnabled(a, 1));
    } else if (e.key === "ArrowUp") {
      if (!open) show();
      else setActive((a) => firstEnabled(a, -1));
    } else if (e.key === "Enter") {
      if (!open) return;
      pick(shown[active]);
    } else if (e.key === "Escape") {
      if (!open && query === null) return;
      setOpen(false);
      setQuery(null);
    } else if (e.key === "Backspace" && multi && !e.currentTarget.value && many.length) {
      setMany(many.slice(0, -1));
    } else return;
    e.preventDefault();
  };

  const selectedLabel = one ? (byValue.get(one)?.label ?? "") : "";
  const inputValue = query ?? (multi ? "" : selectedLabel);
  const activeId = open && shown[active] ? `${uid}-o-${active}` : undefined;

  return (
    <div ref={root} className={cx("relative w-full", className)}>
      <style href="asta-combobox" precedence="asta">{KEYFRAMES}</style>
      <div
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            input.current?.focus();
            show();
          }
        }}
        className={cx(
          "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-lg bg-paper py-1 pl-1.5 pr-1 transition-shadow duration-200",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)]",
          "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]",
          disabled && "cursor-not-allowed opacity-45",
        )}
      >
        {multi &&
          many.map((v) => {
            const o = byValue.get(v);
            if (!o) return null;
            return (
              <span
                key={v}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-paper-2 pl-2 pr-0.5 text-[13px] text-ink animate-[kit-combo-chip_.24s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:!animate-none"
              >
                {o.icon && <span className="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5">{o.icon}</span>}
                {o.label}
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled}
                  aria-label={`Remove ${o.label}`}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setMany(many.filter((x) => x !== v))}
                  className="flex h-6 w-6 items-center justify-center rounded-[5px] text-mute outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] hover:text-ink"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
                  </svg>
                </button>
              </span>
            );
          })}
        <input
          ref={input}
          value={inputValue}
          disabled={disabled}
          placeholder={multi && many.length ? "" : placeholder}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          spellCheck={false}
          onFocus={(e) => {
            if (!multi) e.currentTarget.select();
            show();
          }}
          onClick={show}
          onChange={(e) => {
            setQuery(e.target.value);
            const v = e.target.value.trim().toLowerCase();
            const next = v ? options.filter((o) => o.label.toLowerCase().includes(v)) : options;
            setActive(firstEnabled(-1, 1, next));
            if (!open) setOpen(true);
          }}
          onKeyDown={onKey}
          onBlur={(e) => {
            if (root.current?.contains(e.relatedTarget as Node)) return;
            dismiss();
          }}
          className="h-8 min-w-[6rem] flex-1 bg-transparent px-1.5 text-[14px] text-ink outline-none placeholder:text-mute disabled:cursor-not-allowed"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? "Close list" : "Open list"}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) {
              setOpen(false);
              setQuery(null);
            } else {
              input.current?.focus();
              show();
            }
          }}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <svg
            viewBox="0 0 16 16"
            className={cx("h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", open && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </button>
      </div>
      {name &&
        (multi ? many.map((v) => <input key={v} type="hidden" name={name} value={v} />) : <input type="hidden" name={name} value={one ?? ""} />)}

      {open && (
        <ul
          ref={list}
          id={`${uid}-list`}
          role="listbox"
          aria-label={label}
          aria-multiselectable={multi || undefined}
          onPointerDown={(e) => e.preventDefault()}
          className={cx(
            "absolute inset-x-0 top-full z-50 mt-1.5 max-h-64 origin-top overflow-y-auto rounded-xl bg-paper p-1 outline-none [scrollbar-width:thin]",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-8px_rgb(0_0_0/0.22),0_4px_8px_-4px_rgb(0_0_0/0.08)]",
            "animate-[kit-combo-in_.22s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:!animate-none",
          )}
        >
          {shown.map((o, i) => {
            const on = isPicked(o.value);
            return (
              <li
                key={o.value}
                id={`${uid}-o-${i}`}
                data-i={i}
                role="option"
                aria-selected={on}
                aria-disabled={o.disabled || undefined}
                onPointerMove={() => !o.disabled && active !== i && setActive(i)}
                onClick={() => pick(o)}
                className={cx(
                  "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] text-ink-2 transition-colors duration-150",
                  i === active && !o.disabled && "bg-paper-2 text-ink",
                  o.disabled && "cursor-not-allowed opacity-40",
                )}
              >
                {o.icon && <span className="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4">{o.icon}</span>}
                <span className="min-w-0 flex-1 truncate">
                  <Match text={o.label} query={q} />
                </span>
                {o.hint && <span className="text-[12px] tabular-nums text-mute">{o.hint}</span>}
                <svg
                  viewBox="0 0 16 16"
                  className={cx("h-4 w-4 shrink-0 text-brand transition-[opacity,transform] duration-200 ease-[cubic-bezier(.16,1,.3,1)]", on ? "scale-100 opacity-100" : "scale-75 opacity-0")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m3.5 8.5 3 3 6-7" />
                </svg>
              </li>
            );
          })}
          {shown.length === 0 && (
            <li role="presentation" className="flex flex-col items-center gap-1 px-2.5 py-6 text-center">
              <span className="text-[13px] text-ink-2">{emptyText}</span>
              {q && <span className="text-[12px] text-mute">Nothing matches “{q}”</span>}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default Combobox;
