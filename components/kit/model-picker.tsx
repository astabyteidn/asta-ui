"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface ModelOption {
  value: string;
  label: string;
  /** Family heading the model sits under, e.g. "Astra 2". Models keep their order inside a group. */
  group?: string;
  /** One line about what it is good at. */
  hint?: string;
  /** Short tag next to the name in the trigger, e.g. "Pro" or "Fast". */
  tag?: string;
  /** 1 to 5. */
  speed: number;
  /** 1 to 5. */
  intelligence: number;
  /** Context window label, e.g. "200K". */
  context?: string;
  isNew?: boolean;
  disabled?: boolean;
  /** Why it is disabled, shown instead of the hint. */
  disabledReason?: string;
}

export interface ModelPickerProps {
  models: ModelOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Accessible name of the trigger and the list. */
  label?: string;
  /** Show a search field at the top of the list. Default true. */
  searchable?: boolean;
  /** `field` is a bordered select, `chip` a quiet trigger for toolbars (e.g. inside a prompt composer). */
  variant?: "field" | "chip";
  /** Where the list opens. Default bottom. */
  side?: "bottom" | "top";
  align?: "start" | "end";
  /** Form field name, submitted as a hidden input. */
  name?: string;
  disabled?: boolean;
  className?: string;
}

const KEYFRAMES = `@keyframes asta-mp-in { from { opacity: 0; transform: translateY(var(--asta-mp-y, -4px)) scale(.97) } }
@media (prefers-reduced-motion: reduce) { .asta-mp, .asta-mp * { animation: none !important; transition-duration: 0s !important } }`;

const ROW = 56;
const BAR = 22;
const EASE = "cubic-bezier(.16,1,.3,1)";

const icon = { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const SPEED = "M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z";
const SMART = "M8 2.5c.3 2.2 1.3 3.2 3.5 3.5-2.2.3-3.2 1.3-3.5 3.5-.3-2.2-1.3-3.2-3.5-3.5 2.2-.3 3.2-1.3 3.5-3.5ZM12.5 10.5v3M11 12h3";

function Dots({ n, label }: { n: number; label: string }) {
  const v = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <span className="flex items-center gap-[3px]">
      <span className="sr-only">{`${label} ${v} of 5.`}</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} aria-hidden className={cx("h-[5px] w-[5px] rounded-full", i < v ? "bg-ink" : "bg-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]")} />
      ))}
    </span>
  );
}

/**
 * A select for AI models. The list is grouped by family and every row shows a one-line hint, speed and
 * intelligence dots, the context size and a New badge. Search filters as you type. Arrows, Home/End,
 * Enter and Escape work, and without search, typing jumps to a model. The selection mark slides between rows.
 */
export function ModelPicker({
  models,
  value,
  defaultValue,
  onChange,
  label = "Model",
  searchable = true,
  variant = "field",
  side = "bottom",
  align = "start",
  name,
  disabled,
  className,
}: ModelPickerProps) {
  const [inner, setInner] = useState(defaultValue ?? models.find((m) => !m.disabled)?.value ?? "");
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const typed = useRef({ text: "", at: 0 });
  const uid = useId();

  const selected = models.find((m) => m.value === current);
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => (q ? models.filter((m) => `${m.label} ${m.group ?? ""} ${m.hint ?? ""} ${m.tag ?? ""}`.toLowerCase().includes(q)) : models),
    [models, q],
  );
  // Groups in first-seen order, and the visual order of rows for keyboard movement.
  const groups = useMemo(() => {
    const out: { name: string; items: { m: ModelOption; i: number }[] }[] = [];
    shown.forEach((m, i) => {
      const g = m.group ?? "";
      let bucket = out.find((x) => x.name === g);
      if (!bucket) out.push((bucket = { name: g, items: [] }));
      bucket.items.push({ m, i });
    });
    return out;
  }, [shown]);
  const order = useMemo(() => groups.flatMap((g) => g.items.map((x) => x.i)), [groups]);
  const usable = order.filter((i) => !shown[i].disabled);
  // After filtering, fall back to the first enabled match.
  const act = usable.includes(active) ? active : (usable[0] ?? -1);

  const step = (dir: 1 | -1) => {
    if (!usable.length) return;
    const k = usable.indexOf(act);
    setActive(usable[(k + dir + usable.length) % usable.length]);
  };

  const show = (seed = "") => {
    if (disabled) return;
    placed.current = false;
    setQuery(seed);
    setActive(seed ? -1 : models.findIndex((m) => m.value === current));
    setOpen(true);
  };
  const hide = (refocus = true) => {
    setOpen(false);
    setQuery("");
    if (refocus) trigger.current?.focus();
  };
  const pick = (m: ModelOption | undefined) => {
    if (!m || m.disabled) return;
    if (value === undefined) setInner(m.value);
    onChange?.(m.value);
    hide();
  };

  // Focus the search field (or the list) when the popup opens.
  useEffect(() => {
    if (open) (searchable ? search.current : list.current)?.focus({ preventScroll: true });
  }, [open, searchable]);

  // Keep the popup inside the viewport with a 16px gutter (narrow phones, or a chip near the edge).
  useLayoutEffect(() => {
    const el = pop.current;
    if (!open || !el) return;
    el.style.translate = "";
    const r = el.getBoundingClientRect();
    const dx = r.left < 16 ? 16 - r.left : r.right > window.innerWidth - 16 ? window.innerWidth - 16 - r.right : 0;
    if (dx) el.style.translate = `${Math.round(dx)}px 0`;
  }, [open]);

  // Slide the hover highlight and the selection bar to their rows. Measured when they change, never per frame.
  useLayoutEffect(() => {
    const box = list.current;
    if (!open || !box || !hl.current || !bar.current) return;
    const row = (i: number) => (i < 0 ? null : box.querySelector<HTMLElement>(`[data-i="${i}"]`));
    const a = row(act);
    const s = row(shown.findIndex((m) => m.value === current));
    const first = !placed.current;
    for (const el of [hl.current, bar.current]) el.style.transition = first ? "none" : `transform ${el === bar.current ? 300 : 200}ms ${EASE}, opacity 200ms ${EASE}`;
    hl.current.style.opacity = a ? "1" : "0";
    if (a) hl.current.style.transform = `translateY(${a.offsetTop}px)`;
    bar.current.style.opacity = s ? "1" : "0";
    if (s) bar.current.style.transform = `translateY(${s.offsetTop + (ROW - BAR) / 2}px)`;
    placed.current = true;
    a?.scrollIntoView({ block: "nearest" });
  }, [open, act, shown, current]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onListKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowDown") step(1);
    else if (e.key === "ArrowUp") step(-1);
    else if (e.key === "Home" && !searchable) setActive(usable[0] ?? -1);
    else if (e.key === "End" && !searchable) setActive(usable[usable.length - 1] ?? -1);
    else if (e.key === "Enter") pick(shown[act]);
    else if (e.key === "Escape") hide();
    else if (e.key === "Tab") return hide(false);
    else if (!searchable && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // Typeahead: jump to the first model whose name starts with what was typed.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const t = typed.current.text;
      const hit = usable.find((i) => shown[i].label.toLowerCase().startsWith(t)) ?? usable.find((i) => shown[i].label.toLowerCase().includes(t));
      if (hit !== undefined) setActive(hit);
    } else return;
    e.preventDefault();
  };

  const listId = `${uid}-list`;
  const activeId = open && act >= 0 ? `${uid}-o-${act}` : undefined;
  const chip = variant === "chip";

  return (
    <div ref={root} className={cx("asta-mp relative", chip ? "inline-flex" : "w-full", className)}>
      <style href="asta-model-picker" precedence="asta">{KEYFRAMES}</style>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${selected?.label ?? "none"}`}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(e) => {
          if (open) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          } else if (searchable && e.key.length === 1 && e.key !== " " && !e.metaKey && !e.ctrlKey && !e.altKey) {
            // Typing on the closed trigger opens the list and starts a search.
            e.preventDefault();
            show(e.key);
          }
        }}
        className={cx(
          "flex items-center gap-2 text-left outline-none transition-[background-color,box-shadow,color] duration-200",
          "focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-45",
          chip
            ? "h-8 max-w-[220px] rounded-md px-2 text-[13px] text-ink-2 hover:bg-paper-2 hover:text-ink aria-expanded:bg-paper-2 aria-expanded:text-ink"
            : "h-10 w-full rounded-lg bg-paper px-3 text-[14px] text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] aria-expanded:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]",
        )}
      >
        <svg {...icon} className="h-3.5 w-3.5 shrink-0 text-brand" fill="currentColor" stroke="none">
          <path d="M8 1.5c.4 2.9 1.6 4.1 4.5 4.5-2.9.4-4.1 1.6-4.5 4.5-.4-2.9-1.6-4.1-4.5-4.5C6.4 5.6 7.6 4.4 8 1.5Z" />
        </svg>
        <span className="min-w-0 truncate font-medium">{selected?.label ?? "Choose a model"}</span>
        {selected?.tag && (
          <span className="shrink-0 rounded-[5px] bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] px-1.5 py-px text-[11px] font-medium text-ink-2">{selected.tag}</span>
        )}
        <svg {...icon} className={cx("ml-auto h-3.5 w-3.5 shrink-0 text-mute transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", open && "rotate-180")}>
          <path d={side === "top" ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"} />
        </svg>
      </button>
      {name && <input type="hidden" name={name} value={current} />}

      {open && (
        <div
          ref={pop}
          className={cx(
            "absolute z-50 flex w-[372px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-xl bg-paper",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_16px_40px_-12px_rgb(0_0_0/0.25),0_4px_10px_-6px_rgb(0_0_0/0.1)]",
            "animate-[asta-mp-in_.18s_cubic-bezier(.16,1,.3,1)_both]",
            side === "top" ? "bottom-full mb-1.5 origin-bottom [--asta-mp-y:4px]" : "top-full mt-1.5 origin-top",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {searchable && (
            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
              <svg {...icon} className="h-4 w-4 shrink-0 text-mute">
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3" />
              </svg>
              <input
                ref={search}
                type="search"
                role="combobox"
                aria-label={`Search ${label.toLowerCase()}s`}
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder="Search models…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onListKey}
                className="h-8 min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-mute sm:text-[13.5px] [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          )}
          <div
            ref={list}
            id={listId}
            role="listbox"
            aria-label={label}
            tabIndex={searchable ? undefined : -1}
            aria-activedescendant={searchable ? undefined : activeId}
            onKeyDown={searchable ? undefined : onListKey}
            onPointerDown={(e) => searchable && e.preventDefault()}
            className="relative max-h-[min(360px,60vh)] overflow-y-auto overscroll-contain p-1.5 outline-none [scrollbar-width:thin]"
          >
            {/* The hover highlight and the selection bar slide on transform. */}
            <span ref={hl} aria-hidden className="pointer-events-none absolute inset-x-1.5 top-0 rounded-lg bg-paper-2 opacity-0" style={{ height: ROW }} />
            <span ref={bar} aria-hidden className="pointer-events-none absolute left-1.5 top-0 z-[1] w-[3px] rounded-full bg-brand opacity-0" style={{ height: BAR }} />
            {groups.map((g) => (
              <div key={g.name || "_"} role="group" aria-labelledby={g.name ? `${uid}-g-${g.name}` : undefined} aria-label={g.name ? undefined : label}>
                {g.name && (
                  <p id={`${uid}-g-${g.name}`} className="relative px-3.5 pt-2.5 pb-1 font-mono text-[10.5px] uppercase tracking-wider text-mute">
                    {g.name}
                  </p>
                )}
                {g.items.map(({ m, i }) => {
                  const on = m.value === current;
                  return (
                    <div
                      key={m.value}
                      id={`${uid}-o-${i}`}
                      data-i={i}
                      role="option"
                      aria-selected={on}
                      aria-disabled={m.disabled || undefined}
                      onPointerMove={() => !m.disabled && act !== i && setActive(i)}
                      onClick={() => pick(m)}
                      className={cx("relative flex select-none items-center gap-3 rounded-lg pl-3.5 pr-2.5", m.disabled ? "cursor-not-allowed" : "cursor-pointer")}
                      style={{ height: ROW }}
                    >
                      <span className={cx("min-w-0 flex-1", m.disabled && "opacity-55")}>
                        <span className="flex items-center gap-1.5">
                          <span className={cx("truncate text-[13.5px] font-medium", on ? "text-ink" : "text-ink-2")}>{m.label}</span>
                          {m.isNew && <span className="shrink-0 rounded-[5px] bg-brand px-1.5 text-[10px] font-semibold leading-[16px] text-white">New</span>}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-mute">{m.disabled ? (m.disabledReason ?? "Not available") : m.hint}</span>
                      </span>
                      <span className={cx("flex shrink-0 flex-col items-end gap-1.5", m.disabled && "opacity-55")}>
                        <span className="flex items-center gap-1.5" title="Speed">
                          <svg {...icon} className="h-3 w-3 text-mute">
                            <path d={SPEED} />
                          </svg>
                          <Dots n={m.speed} label="Speed" />
                        </span>
                        <span className="flex items-center gap-1.5" title="Intelligence">
                          <svg {...icon} className="h-3 w-3 text-mute">
                            <path d={SMART} />
                          </svg>
                          <Dots n={m.intelligence} label="Intelligence" />
                        </span>
                      </span>
                      <span className={cx("w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-mute", m.disabled && "opacity-55")} title="Context window">
                        {m.context && <span className="sr-only">Context window </span>}
                        {m.context}
                      </span>
                      <svg
                        {...icon}
                        strokeWidth={2}
                        className={cx("h-3.5 w-3.5 shrink-0 text-brand transition-[opacity,transform] duration-200 ease-[cubic-bezier(.16,1,.3,1)]", on ? "scale-100 opacity-100" : "scale-75 opacity-0")}
                      >
                        <path d="m3.5 8.5 3 3 6-7" />
                      </svg>
                    </div>
                  );
                })}
              </div>
            ))}
            {shown.length === 0 && (
              <div role="presentation" className="flex flex-col items-center gap-1 px-3 py-8 text-center">
                <span className="text-[13px] font-medium text-ink-2">No models found</span>
                <span className="text-[12px] text-mute">Nothing matches “{query.trim()}”. Try a family name.</span>
              </div>
            )}
          </div>
          <div className="hidden items-center gap-3 bg-paper-2 px-3.5 py-2 text-[11.5px] text-mute sm:flex">
            <span className="flex items-center gap-1.5">
              <svg {...icon} className="h-3 w-3">
                <path d={SPEED} />
              </svg>
              Speed
            </span>
            <span className="flex items-center gap-1.5">
              <svg {...icon} className="h-3 w-3">
                <path d={SMART} />
              </svg>
              Intelligence
            </span>
            <span className="ml-auto">↑↓ to move · Enter to pick</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelPicker;
