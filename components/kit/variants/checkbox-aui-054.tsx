"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui054-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui054-drop { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui054 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui054-rise .6s ${EASE} ${80 + i * 50}ms both` });

export interface PermissionGroup {
  id: string;
  label: string;
  description?: string;
  children: { id: string; label: string }[];
}

export interface RolePreset {
  name: string;
  /** Leaf ids that make up this role. */
  ids: string[];
}

const GROUPS: PermissionGroup[] = [
  { id: "projects", label: "Projects", description: "Boards, docs and files", children: [{ id: "projects.view", label: "View projects" }, { id: "projects.edit", label: "Edit and comment" }, { id: "projects.delete", label: "Delete projects" }] },
  { id: "members", label: "Members", description: "People in this workspace", children: [{ id: "members.view", label: "See the member list" }, { id: "members.invite", label: "Invite people" }, { id: "members.remove", label: "Remove people" }] },
  { id: "billing", label: "Billing", description: "Plan, invoices and cards", children: [{ id: "billing.view", label: "Download invoices" }, { id: "billing.manage", label: "Change plan and payment" }] },
];

const PRESETS: RolePreset[] = [
  { name: "Viewer", ids: ["projects.view", "members.view"] },
  { name: "Editor", ids: ["projects.view", "projects.edit", "members.view", "members.invite"] },
  { name: "Admin", ids: GROUPS.flatMap((g) => g.children.map((c) => c.id)) },
];

export interface TreeCheckboxProps {
  groups?: PermissionGroup[];
  presets?: RolePreset[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Group ids open on mount. */
  defaultOpen?: string[];
  title?: string;
  /** Who the permissions are for. */
  subject?: string;
  className?: string;
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * aui-054 · Nested permissions with tri-state parents. Signature: role presets and the tree stay in sync, the
 * role name rolls to match and each parent box morphs between empty, dash and tick.
 */
export function TreeCheckbox({
  groups = GROUPS,
  presets = PRESETS,
  value,
  defaultValue = PRESETS[1].ids,
  onChange,
  defaultOpen = ["projects", "members"],
  title = "Permissions",
  subject = "Maya Santos · maya@astabyte.com",
  className,
}: TreeCheckboxProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const [open, setOpen] = useState(defaultOpen);
  const picked = value ?? inner;
  const set = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const toggleLeaf = (id: string) => set(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const toggleGroup = (g: PermissionGroup) => {
    const ids = g.children.map((c) => c.id);
    const all = ids.every((x) => picked.includes(x));
    set(all ? picked.filter((x) => !ids.includes(x)) : [...picked.filter((x) => !ids.includes(x)), ...ids]);
  };

  const names = [...presets.map((p) => p.name), "Custom", "No access"];
  const match = picked.length === 0 ? names.length - 1 : Math.max(presets.findIndex((p) => same(p.ids, picked)), -1);
  const roleIndex = match === -1 ? presets.length : match;

  return (
    <section
      aria-labelledby={`${uid}-t`}
      className={cx(
        "aui054 w-full max-w-[440px] rounded-[14px] bg-paper p-5 sm:p-6",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-aui054" precedence="asta">
        {CSS}
      </style>
      <div className="flex items-start justify-between gap-4" style={rise(0)}>
        <div className="min-w-0">
          <h3 id={`${uid}-t`} className="text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink">
            {title}
          </h3>
          <p className="mt-1 truncate text-[13px] text-mute">{subject}</p>
        </div>
        {/* The role name rolls to whichever preset the tree now matches. */}
        <div className="shrink-0 text-right">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Role</p>
          <span className="relative mt-1 block h-5 w-[78px] overflow-hidden text-right text-[14px] font-medium tracking-[-0.01em] text-ink" aria-live="polite">
            <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500" style={{ transform: `translateY(${-roleIndex * 20}px)`, transitionTimingFunction: EASE }}>
              {names.map((n, i) => (
                <span key={n} aria-hidden={i !== roleIndex} className={cx("block h-5 leading-5", i === presets.length + 1 && "text-mute")}>
                  {n}
                </span>
              ))}
            </span>
          </span>
        </div>
      </div>

      <div role="group" aria-label="Role presets" className="mt-4 flex gap-1.5" style={rise(1)}>
        {presets.map((p, i) => {
          const on = i === match;
          return (
            <button
              key={p.name}
              type="button"
              aria-pressed={on}
              onClick={() => set(p.ids)}
              className={cx(
                "relative h-8 flex-1 rounded-[8px] text-[13px] font-medium outline-none transition-transform duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50",
                on ? "text-white" : "text-ink",
              )}
            >
              <span aria-hidden className="absolute inset-0 rounded-[8px] bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]" />
              <span aria-hidden className="absolute inset-0 rounded-[8px] bg-ink transition-[transform,opacity] duration-300" style={{ opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0.92)", transitionTimingFunction: EASE }} />
              <span className="relative transition-colors duration-300">{p.name}</span>
            </button>
          );
        })}
      </div>

      <ul className="mt-3 -mx-2">
        {groups.map((g, gi) => {
          const ids = g.children.map((c) => c.id);
          const n = ids.filter((x) => picked.includes(x)).length;
          const state = n === 0 ? false : n === ids.length ? true : "mixed";
          const isOpen = open.includes(g.id);
          const gid = `${uid}-${g.id}`;
          return (
            <li key={g.id} style={rise(gi + 2)}>
              <div className="group/row relative flex items-center gap-1 rounded-[10px] py-1.5 pl-1 pr-2">
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[10px] bg-paper-2 opacity-0 transition-opacity duration-300 group-hover/row:opacity-70" />
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${gid}-list`}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${g.label}`}
                  onClick={() => setOpen((o) => (o.includes(g.id) ? o.filter((x) => x !== g.id) : [...o, g.id]))}
                  className="relative grid h-7 w-7 shrink-0 place-items-center rounded-[7px] text-mute outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300" style={{ transform: `rotate(${isOpen ? 90 : 0}deg)`, transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 3.5L10.5 8 6 12.5" />
                  </svg>
                </button>
                <label htmlFor={gid} className="relative flex min-w-0 flex-1 cursor-pointer select-none items-center gap-3 rounded-[7px] py-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand">
                  <TriBox id={gid} state={state} onToggle={() => toggleGroup(g)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium tracking-[-0.01em] text-ink">{g.label}</span>
                    {g.description && <span className="block truncate text-[12px] text-mute">{g.description}</span>}
                  </span>
                  <span className="font-mono text-[11.5px] tabular-nums text-mute">
                    {n}/{ids.length}
                  </span>
                </label>
              </div>
              {isOpen && (
                <ul id={`${gid}-list`} className="relative ml-[22px] pb-1 pl-[18px]">
                  <span aria-hidden className="absolute bottom-3 left-0 top-0 w-px bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]" />
                  {g.children.map((c, ci) => {
                    const cid = `${uid}-${c.id}`;
                    return (
                      <li key={c.id} style={{ animation: `aui054-drop .45s ${EASE} ${ci * 40}ms both` }}>
                        <label htmlFor={cid} className="group/leaf relative flex cursor-pointer select-none items-center gap-3 rounded-[8px] px-2 py-[7px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand">
                          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[8px] bg-paper-2 opacity-0 transition-opacity duration-300 group-hover/leaf:opacity-70" />
                          <TriBox id={cid} state={picked.includes(c.id)} onToggle={() => toggleLeaf(c.id)} small />
                          <span className="relative text-[13.5px] text-ink">{c.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Native checkbox (so `indeterminate` and Space work), drawn as a box that morphs between empty, dash and tick. */
function TriBox({ id, state, onToggle, small }: { id: string; state: boolean | "mixed"; onToggle: () => void; small?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "mixed";
  }, [state]);
  const on = state === true;
  const mixed = state === "mixed";
  const filled = on || mixed;
  return (
    <span className={cx("relative grid shrink-0 place-items-center", small ? "h-4 w-4" : "h-[18px] w-[18px]")}>
      <input ref={ref} id={id} type="checkbox" checked={on} onChange={onToggle} className="sr-only" />
      <span aria-hidden className="absolute inset-0 rounded-[5px] bg-paper shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_24%,transparent)]" />
      <span
        aria-hidden
        className="absolute inset-0 rounded-[5px] bg-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.2)] transition-[transform,opacity] duration-300"
        style={{ opacity: filled ? 1 : 0, transform: filled ? "scale(1)" : "scale(0.6)", transitionTimingFunction: SPRING }}
      />
      <svg aria-hidden viewBox="0 0 16 16" className={cx("relative text-white", small ? "h-2.5 w-2.5" : "h-3 w-3")} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5l3 3 6-7" pathLength={1} strokeDasharray="1" className="transition-[stroke-dashoffset]" style={{ strokeDashoffset: on ? 0 : 1, transitionDuration: on ? "380ms" : "120ms", transitionTimingFunction: EASE }} />
      </svg>
      <span aria-hidden className="absolute h-[2.2px] w-2 rounded-full bg-white transition-transform duration-300" style={{ transform: `scaleX(${mixed ? 1 : 0})`, transitionTimingFunction: EASE }} />
    </span>
  );
}

export default TreeCheckbox;
