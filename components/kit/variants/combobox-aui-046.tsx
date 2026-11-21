"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

const CSS = `
@keyframes aui046-pop { from { opacity: 0; transform: translateY(var(--aui046-y, -6px)) scale(.97) } }
@keyframes aui046-row { from { opacity: 0; transform: translateY(5px) } }
@keyframes aui046-join { 0% { opacity: 0; transform: translateX(10px) scale(.4) } 60% { opacity: 1; transform: translateX(-1px) scale(1.08) } 100% { transform: none } }
@keyframes aui046-roll { from { opacity: 0; transform: translateY(60%) } }
@keyframes aui046-draw { from { stroke-dashoffset: 16 } }
@media (prefers-reduced-motion: reduce) { .aui046 *, .aui046 { animation: none !important; transition: none !important } }
`;

export interface AssignPerson {
  id: string;
  name: string;
  /** Muted line under the name, e.g. a role or an email. */
  detail?: string;
  /** Avatar photo. Initials are used without one. */
  src?: string;
}

export interface AssignComboboxProps {
  people?: AssignPerson[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (ids: string[]) => void;
  label?: string;
  /** Most avatars shown in the stack before "+N". */
  maxStack?: number;
  name?: string;
  disabled?: boolean;
  className?: string;
}

const TEAM: AssignPerson[] = [
  { id: "lena", name: "Lena Marsh", detail: "Design lead" },
  { id: "arif", name: "Arif Rahman", detail: "Frontend" },
  { id: "tom", name: "Tom Kessler", detail: "Product" },
  { id: "sari", name: "Sari Nugroho", detail: "Brand" },
  { id: "maya", name: "Maya Chen", detail: "Motion" },
  { id: "daniel", name: "Daniel Ortiz", detail: "Backend" },
];

const TONES = [
  "bg-brand text-white",
  "bg-ink text-paper",
  "bg-[color-mix(in_srgb,var(--color-brand)_16%,var(--color-paper))] text-brand",
  "bg-paper-2 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]",
  "bg-[color-mix(in_srgb,var(--color-ink)_70%,var(--color-paper))] text-paper",
  "bg-[color-mix(in_srgb,var(--color-brand)_55%,var(--color-ink))] text-white",
];
const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Avatar({ p, tone, size = 28, ring }: { p: AssignPerson; tone: number; size?: number; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx("flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold tracking-[-0.02em]", TONES[tone % TONES.length], ring && "shadow-[0_0_0_2px_var(--color-paper)]")}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {p.src ? <img src={p.src} alt="" width={size} height={size} loading="lazy" className="h-full w-full object-cover" /> : initials(p.name)}
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

/** aui-046 · Multi assign: pick people from a searchable list, they spring into an avatar stack and the count rolls. */
export function AssignCombobox({ people = TEAM, value, defaultValue = ["lena", "arif"], onChange, label = "Assignees", maxStack = 4, name, disabled, className }: AssignComboboxProps) {
  const [inner, setInner] = useState(defaultValue);
  const ids = value ?? inner;
  const byId = useMemo(() => new Map(people.map((p, i) => [p.id, { p, i }])), [people]);
  const picked = ids.map((id) => byId.get(id)).filter((x): x is { p: AssignPerson; i: number } => !!x);
  const [open, setOpen] = useState(false);
  const [down, setDown] = useState(true);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const uid = useId();

  const t = q.trim().toLowerCase();
  const shown = useMemo(() => (t ? people.filter((p) => `${p.name} ${p.detail ?? ""}`.toLowerCase().includes(t)) : people), [people, t]);

  useEffect(() => {
    if (open) input.current?.focus({ preventScroll: true });
  }, [open]);
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
  const toggle = (p?: AssignPerson) => {
    if (!p) return;
    set(ids.includes(p.id) ? ids.filter((x) => x !== p.id) : [...ids, p.id]);
  };
  const show = () => {
    if (disabled || !btn.current) return;
    setDown(roomBelow(btn.current, 240));
    setQ("");
    setActive(0);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    btn.current?.focus({ preventScroll: true });
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") setActive((a) => (shown.length ? (a + 1) % shown.length : 0));
    else if (e.key === "ArrowUp") setActive((a) => (shown.length ? (a - 1 + shown.length) % shown.length : 0));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(Math.max(0, shown.length - 1));
    else if (e.key === "Enter") toggle(shown[active]);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return setOpen(false);
    else if (e.key === "Backspace" && !q && ids.length) set(ids.slice(0, -1));
    else return;
    e.preventDefault();
  };

  const stack = picked.slice(0, maxStack);
  const extra = picked.length - stack.length;
  const summary = picked.length === 0 ? "Unassigned" : picked.length === 1 ? picked[0].p.name : picked.length === 2 ? `${picked[0].p.name.split(" ")[0]} and ${picked[1].p.name.split(" ")[0]}` : `${picked[0].p.name.split(" ")[0]} and ${picked.length - 1} others`;

  return (
    <div ref={root} className={cx("aui046 relative w-full", open && "z-40", className)}>
      <style href="asta-aui046" precedence="asta">{CSS}</style>
      <button
        ref={btn}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-label={`${label}: ${picked.map((x) => x.p.name).join(", ") || "none"}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (!open && e.key === "ArrowDown") {
            e.preventDefault();
            show();
          }
        }}
        className={cx(
          "group flex h-11 w-full items-center gap-3 rounded-[10px] bg-paper pl-2 pr-3 text-left outline-none transition-[box-shadow,transform] duration-300 active:scale-[.995] disabled:cursor-not-allowed disabled:opacity-45",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]",
          "focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
          open && "!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        )}
      >
        <span className="flex items-center -space-x-1.5 pl-0.5">
          {stack.map(({ p, i }) => (
            <span key={p.id} className="relative inline-flex" style={{ animation: `aui046-join .5s ${EASE} both` }}>
              <Avatar p={p} tone={i} ring />
            </span>
          ))}
          {extra > 0 && (
            <span key={extra} className="relative flex h-7 min-w-7 items-center justify-center rounded-full bg-paper-2 px-1.5 text-[11px] font-semibold tabular-nums text-ink shadow-[0_0_0_2px_var(--color-paper)]" style={{ animation: `aui046-join .5s ${EASE} both` }}>
              +{extra}
            </span>
          )}
          {picked.length === 0 && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-mute shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]" aria-hidden>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M8 3.5v9M3.5 8h9" />
              </svg>
            </span>
          )}
        </span>
        <span className="relative min-w-0 flex-1 overflow-hidden">
          <span key={summary} className={cx("block truncate text-[13.5px]", picked.length ? "text-ink" : "text-mute")} style={{ animation: `aui046-roll .4s ${EASE} both` }}>
            {summary}
          </span>
        </span>
        <svg viewBox="0 0 16 16" className={cx("h-4 w-4 shrink-0 text-mute transition-transform duration-300", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {name && ids.map((id) => <input key={id} type="hidden" name={name} value={id} />)}

      {open && (
        <div
          className={cx(
            "absolute left-0 z-50 w-full min-w-[280px] overflow-hidden rounded-[13px] bg-paper",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_22px_48px_-16px_rgb(0_0_0/0.3),0_4px_10px_-4px_rgb(0_0_0/0.08)]",
            down ? "top-full mt-2 origin-top" : "bottom-full mb-2 origin-bottom [--aui046-y:6px]",
          )}
          style={{ animation: `aui046-pop .3s ${EASE} both` }}
        >
          <div className="flex items-center gap-2 px-3.5 shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_7%,transparent)]">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              ref={input}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
              onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}
              placeholder="Assign people…"
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded
              aria-autocomplete="list"
              aria-controls={`${uid}-list`}
              aria-activedescendant={shown[active] ? `${uid}-o-${active}` : undefined}
              aria-label={`Search ${label.toLowerCase()}`}
              className="h-11 min-w-0 flex-1 bg-transparent text-[16px] sm:text-[13.5px] text-ink outline-none placeholder:text-mute"
            />
            <button
              type="button"
              disabled={!ids.length}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => set([])}
              className="flex items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-[11.5px] text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-40"
            >
              <span key={ids.length} className="inline-block font-mono tabular-nums text-ink-2" style={{ animation: `aui046-roll .35s ${EASE} both` }}>
                {ids.length}
              </span>
              Clear
            </button>
          </div>
          <ul ref={list} id={`${uid}-list`} role="listbox" aria-multiselectable aria-label={label} className="max-h-[184px] overflow-y-auto overscroll-contain p-1 [scrollbar-width:thin]">
            {shown.map((p, n) => {
              const on = ids.includes(p.id);
              return (
                <li
                  key={p.id}
                  id={`${uid}-o-${n}`}
                  data-i={n}
                  role="option"
                  aria-selected={on}
                  onPointerMove={() => active !== n && setActive(n)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => toggle(p)}
                  className={cx("flex h-11 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2 transition-colors duration-150", n === active && "bg-paper-2")}
                  style={{ animation: `aui046-row .4s ${EASE} ${Math.min(n, 6) * 30}ms both` }}
                >
                  <Avatar p={p} tone={byId.get(p.id)?.i ?? n} />
                  <span className="min-w-0 flex-1">
                    <span className={cx("block truncate text-[13.5px] text-ink", on && "font-medium")}>{p.name}</span>
                    {p.detail && <span className="block truncate text-[11.5px] text-mute">{p.detail}</span>}
                  </span>
                  <span
                    aria-hidden
                    className={cx(
                      "flex h-[18px] w-[18px] items-center justify-center rounded-[5px] transition-[background-color,box-shadow,transform] duration-300",
                      on ? "scale-100 bg-brand text-white" : "scale-90 shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]",
                    )}
                  >
                    {on && (
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16" style={{ animation: `aui046-draw .35s ${EASE} both` }}>
                        <path d="m4 8.5 2.6 2.5L12 5.5" />
                      </svg>
                    )}
                  </span>
                </li>
              );
            })}
            {!shown.length && <li className="px-3 py-6 text-center text-[13px] text-mute">Nobody called “{q.trim()}”</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AssignCombobox;
