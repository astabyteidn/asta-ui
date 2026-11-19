"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

const CSS = `
@keyframes aui047-pop { from { opacity: 0; transform: translateY(var(--aui047-y, -6px)) scale(.97) } }
@keyframes aui047-row { from { opacity: 0; transform: translateY(5px) } }
@keyframes aui047-chip { 0% { opacity: 0; transform: scale(.6) } 60% { opacity: 1; transform: scale(1.06) } 100% { transform: none } }
@keyframes aui047-drop { 0% { transform: scale(0) } 60% { transform: scale(1.5) } 100% { transform: none } }
@keyframes aui047-ripple { from { opacity: .5; transform: scale(1) } to { opacity: 0; transform: scale(3.2) } }
@media (prefers-reduced-motion: reduce) { .aui047 *, .aui047 { animation: none !important; transition: none !important } }
`;

/** Brand and ink tints only. */
const TINTS = [
  "bg-brand",
  "bg-[color-mix(in_srgb,var(--color-brand)_58%,var(--color-paper))]",
  "bg-[color-mix(in_srgb,var(--color-brand)_30%,var(--color-paper))]",
  "bg-ink",
  "bg-[color-mix(in_srgb,var(--color-ink)_52%,var(--color-paper))]",
  "bg-[color-mix(in_srgb,var(--color-ink)_24%,var(--color-paper))]",
];

export interface CreatableLabel {
  id: string;
  name: string;
  /** Index into the six brand and ink tints. */
  tint?: number;
  /** Muted count on the right, e.g. open issues. */
  count?: number;
}

export interface CreatableComboboxProps {
  options?: CreatableLabel[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (ids: string[]) => void;
  /** Called with the new label after "Create" so you can save it. */
  onCreate?: (label: CreatableLabel) => void;
  label?: string;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

const LABELS: CreatableLabel[] = [
  { id: "bug", name: "Bug", tint: 3, count: 14 },
  { id: "design", name: "Design", tint: 0, count: 9 },
  { id: "frontend", name: "Frontend", tint: 1, count: 22 },
  { id: "motion", name: "Motion", tint: 2, count: 4 },
  { id: "docs", name: "Docs", tint: 4, count: 7 },
  { id: "research", name: "Research", tint: 5, count: 3 },
];

function Dot({ tint = 0, size = 8, pop }: { tint?: number; size?: number; pop?: boolean }) {
  return (
    <span aria-hidden className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {pop && <span className={cx("absolute inset-0 rounded-full", TINTS[tint % TINTS.length])} style={{ animation: `aui047-ripple .7s ${EASE} both` }} />}
      <span
        className={cx("relative h-full w-full rounded-full shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]", TINTS[tint % TINTS.length])}
        style={pop ? { animation: `aui047-drop .5s ${EASE} both` } : undefined}
      />
    </span>
  );
}

/** Measured once on open: does the panel fit below inside the nearest clipping box? */
function roomBelow(el: HTMLElement, need: number) {
  const r = el.getBoundingClientRect();
  let top = 0;
  let bottom = window.innerHeight;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (/hidden|auto|scroll|clip/.test(getComputedStyle(p).overflowY)) {
      const c = p.getBoundingClientRect();
      top = c.top;
      bottom = c.bottom;
      break;
    }
  }
  const below = bottom - r.bottom;
  return below >= need || below >= r.top - top;
}

/** aui-047 · Create on enter: filter labels, or press Enter to create a new one with a picked tint that drops into the field. */
export function CreatableCombobox({ options = LABELS, value, defaultValue = ["bug", "frontend"], onChange, onCreate, label = "Labels", placeholder = "Add label…", name, disabled, className }: CreatableComboboxProps) {
  const [made, setMade] = useState<CreatableLabel[]>([]);
  const known = useMemo(() => [...options, ...made], [options, made]);
  const byId = useMemo(() => new Map(known.map((l) => [l.id, l])), [known]);
  const [inner, setInner] = useState(defaultValue);
  const ids = value ?? inner;
  const [open, setOpen] = useState(false);
  const [down, setDown] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [tint, setTint] = useState((options.length + 1) % TINTS.length);
  const [fresh, setFresh] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const uid = useId();

  const t = q.trim();
  const tl = t.toLowerCase();
  const matches = useMemo(() => (tl ? known.filter((l) => l.name.toLowerCase().includes(tl)) : known), [known, tl]);
  const exact = known.some((l) => l.name.toLowerCase() === tl);
  const canCreate = !!t && !exact;
  const rows = canCreate ? matches.length + 1 : matches.length;

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const set = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const show = () => {
    if (disabled || open || !field.current) return;
    setDown(roomBelow(field.current, 250));
    setActive(0);
    setOpen(true);
  };
  const toggle = (l?: CreatableLabel) => {
    if (!l) return;
    set(ids.includes(l.id) ? ids.filter((x) => x !== l.id) : [...ids, l.id]);
    setFresh(null);
    setQ("");
  };
  const create = () => {
    if (!canCreate) return;
    const base = tl.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "label";
    let id = base;
    for (let n = 2; byId.has(id); n++) id = `${base}-${n}`;
    const l: CreatableLabel = { id, name: t, tint, count: 0 };
    setMade((m) => [...m, l]);
    set([...ids, id]);
    setFresh(id);
    setTint((x) => (x + 1) % TINTS.length);
    setQ("");
    setActive(0);
    onCreate?.(l);
  };
  const choose = (i: number) => (canCreate && i === 0 ? create() : toggle(matches[canCreate ? i - 1 : i]));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (!open) show();
      else setActive((a) => (rows ? (a + 1) % rows : 0));
    } else if (e.key === "ArrowUp") {
      if (!open) show();
      else setActive((a) => (rows ? (a - 1 + rows) % rows : 0));
    } else if (e.key === "Enter") {
      if (open && rows) choose(active);
      else if (canCreate) create();
    } else if (e.key === "Escape") {
      if (!open && !q) return;
      setOpen(false);
      setQ("");
    } else if (e.key === "Backspace" && !q && ids.length) set(ids.slice(0, -1));
    else return;
    e.preventDefault();
  };

  return (
    <div ref={root} className={cx("aui047 relative w-full", open && "z-40", className)}>
      <style href="asta-aui047" precedence="asta">{CSS}</style>
      <div
        ref={field}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            input.current?.focus();
            show();
          }
        }}
        className={cx(
          "flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-[10px] bg-paper p-1.5 transition-shadow duration-300",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]",
          "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
          disabled && "cursor-not-allowed opacity-45",
        )}
      >
        {ids.map((id) => {
          const l = byId.get(id);
          if (!l) return null;
          return (
            <span key={id} className="inline-flex h-7 items-center gap-1.5 rounded-[7px] bg-paper-2 pl-2.5 pr-0.5 text-[12.5px] font-medium text-ink" style={{ animation: `aui047-chip .45s ${EASE} both` }}>
              <Dot tint={l.tint} pop={fresh === id} />
              {l.name}
              <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                aria-label={`Remove ${l.name}`}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => set(ids.filter((x) => x !== id))}
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
          value={q}
          disabled={disabled}
          placeholder={ids.length ? placeholder : `${label}…`}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && rows ? `${uid}-o-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          onFocus={show}
          onClick={show}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            if (!open) show();
          }}
          onKeyDown={onKey}
          onBlur={(e) => {
            if (root.current?.contains(e.relatedTarget as Node)) return;
            setOpen(false);
            setQ("");
          }}
          className="h-7 min-w-[7rem] flex-1 bg-transparent px-1.5 text-[13.5px] text-ink outline-none placeholder:text-mute disabled:cursor-not-allowed"
        />
      </div>
      {name && ids.map((id) => <input key={id} type="hidden" name={name} value={byId.get(id)?.name ?? id} />)}

      {open && (
        <div
          onPointerDown={(e) => e.preventDefault()}
          className={cx(
            "absolute inset-x-0 z-50 overflow-hidden rounded-[13px] bg-paper",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_22px_48px_-16px_rgb(0_0_0/0.3),0_4px_10px_-4px_rgb(0_0_0/0.08)]",
            down ? "top-full mt-2 origin-top" : "bottom-full mb-2 origin-bottom [--aui047-y:6px]",
          )}
          style={{ animation: `aui047-pop .3s ${EASE} both` }}
        >
          <ul ref={list} id={`${uid}-list`} role="listbox" aria-multiselectable aria-label={label} className="max-h-[208px] overflow-y-auto overscroll-contain p-1 [scrollbar-width:thin]">
            {canCreate && (
              <li
                id={`${uid}-o-0`}
                data-i={0}
                role="option"
                aria-selected={false}
                onPointerMove={() => active !== 0 && setActive(0)}
                onClick={create}
                className={cx("mb-1 flex h-11 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 transition-colors duration-150", active === 0 ? "bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)]" : "")}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-brand text-white" aria-hidden>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8 3.5v9M3.5 8h9" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">
                  Create{" "}
                  <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-paper-2 px-1.5 py-0.5 align-middle font-medium text-ink">
                    <Dot key={tint} tint={tint} pop />
                    {t}
                  </span>
                </span>
                <span className="flex items-center gap-1" role="radiogroup" aria-label="Label colour">
                  {TINTS.map((_, n) => (
                    <button
                      key={n}
                      type="button"
                      tabIndex={-1}
                      role="radio"
                      aria-checked={n === tint}
                      aria-label={`Colour ${n + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTint(n);
                      }}
                      className={cx("flex h-4 w-4 items-center justify-center rounded-full outline-none transition-transform duration-200 hover:scale-110", n === tint && "shadow-[0_0_0_1.5px_var(--color-paper),0_0_0_3px_var(--color-brand)]")}
                    >
                      <Dot tint={n} size={10} />
                    </button>
                  ))}
                </span>
              </li>
            )}
            {matches.map((l, k) => {
              const i = canCreate ? k + 1 : k;
              const on = ids.includes(l.id);
              return (
                <li
                  key={l.id}
                  id={`${uid}-o-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={on}
                  onPointerMove={() => active !== i && setActive(i)}
                  onClick={() => toggle(l)}
                  className={cx("flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 transition-colors duration-150", i === active && "bg-paper-2")}
                  style={{ animation: `aui047-row .35s ${EASE} ${Math.min(k, 6) * 25}ms both` }}
                >
                  <Dot tint={l.tint} />
                  <span className={cx("min-w-0 flex-1 truncate text-[13.5px] text-ink", on && "font-medium")}>{l.name}</span>
                  {l.count !== undefined && <span className="font-mono text-[11px] tabular-nums text-mute">{l.count}</span>}
                  <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5 shrink-0 text-brand transition-[opacity,transform] duration-300", on ? "scale-100 opacity-100" : "scale-50 opacity-0")} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m3.5 8.5 3 3 6-7" />
                  </svg>
                </li>
              );
            })}
          </ul>
          <p className="px-3.5 py-2 text-[11.5px] text-mute shadow-[0_-1px_0_color-mix(in_srgb,var(--color-ink)_7%,transparent)]">
            {canCreate ? (
              <>
                <kbd className="font-sans text-ink-2">↵</kbd> creates “{t}”
              </>
            ) : (
              <>Type a new name to create a label</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default CreatableCombobox;
