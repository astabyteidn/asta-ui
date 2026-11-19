"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui053-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui053 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui053-rise .6s ${EASE} ${80 + i * 50}ms both` });

export interface TaskItem {
  id: string;
  title: string;
  /** Small line under the title, e.g. a due time. */
  meta?: string;
  /** Initials of the owner, shown as an avatar. */
  owner?: string;
}

const TASKS: TaskItem[] = [
  { id: "copy", title: "Final pass on launch copy", meta: "Due 11:00", owner: "MS" },
  { id: "og", title: "Export social cards", meta: "Due 13:30", owner: "RA" },
  { id: "dns", title: "Point the domain to the new build", meta: "Due 15:00", owner: "DK" },
  { id: "mail", title: "Schedule the announcement email", meta: "Due 16:00", owner: "MS" },
  { id: "brief", title: "Write the kickoff brief", meta: "Done yesterday", owner: "RA" },
];

export interface TaskCheckboxProps {
  tasks?: TaskItem[];
  /** Ids of finished tasks (controlled). */
  done?: string[];
  defaultDone?: string[];
  onChange?: (done: string[]) => void;
  eyebrow?: string;
  title?: string;
  className?: string;
}

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * aui-053 · A task list. Signature: ticking a task sweeps a line through it, then the row glides down to the
 * done pile (FLIP, transform only) while the progress bar and count catch up.
 */
export function TaskCheckbox({ tasks = TASKS, done: doneProp, defaultDone = ["brief"], onChange, eyebrow = "Astabyte · Thu 19 Nov", title = "Launch day", className }: TaskCheckboxProps) {
  const uid = useId();
  const [inner, setInner] = useState<string[]>(defaultDone);
  const done = doneProp ?? inner;
  const doneKey = done.join("|");
  // Visual order lags the check by a beat, so the strike lands before the row moves.
  const [order, setOrder] = useState<string[]>(() => [...tasks.filter((t) => !done.includes(t.id)), ...tasks.filter((t) => done.includes(t.id))].map((t) => t.id));
  const settled = useRef(done);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const last = useRef(new Map<string, number>());

  useEffect(() => {
    const now = doneKey ? doneKey.split("|") : [];
    const t = setTimeout(() => {
      const prev = settled.current;
      settled.current = now;
      setOrder((o) => {
        const open = o.filter((x) => !now.includes(x));
        const kept = o.filter((x) => now.includes(x) && prev.includes(x));
        const fresh = o.filter((x) => now.includes(x) && !prev.includes(x));
        return [...open, ...kept, ...fresh];
      });
    }, 480);
    return () => clearTimeout(t);
  }, [doneKey]);

  // FLIP: measure only when the order changes, then play the move as a transform.
  useLayoutEffect(() => {
    const reduce = prefersReduced();
    rows.current.forEach((el, id) => {
      const top = el.offsetTop;
      const was = last.current.get(id);
      if (was !== undefined && was !== top && !reduce) {
        el.animate([{ transform: `translateY(${was - top}px)` }, { transform: "none" }], { duration: 560, easing: EASE });
      }
      last.current.set(id, top);
    });
  }, [order]);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    if (doneProp === undefined) setInner(next);
    onChange?.(next);
  };

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const count = done.filter((d) => byId.has(d)).length;

  return (
    <section
      aria-labelledby={`${uid}-t`}
      className={cx(
        "aui053 w-full max-w-[420px] rounded-[14px] bg-paper p-5 sm:p-6",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-aui053" precedence="asta">
        {CSS}
      </style>
      <div style={rise(0)}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">{eyebrow}</p>
            <h3 id={`${uid}-t`} className="mt-1.5 text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink">
              {title}
            </h3>
          </div>
          <p className="pb-0.5 text-[13px] tabular-nums text-mute" aria-live="polite">
            <span className="font-medium text-ink">{count}</span> of {tasks.length} done
          </p>
        </div>
        <div aria-hidden className="mt-4 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
          <div className="h-full origin-left rounded-full bg-brand transition-transform duration-700" style={{ transform: `scaleX(${tasks.length ? count / tasks.length : 0})`, transitionTimingFunction: EASE }} />
        </div>
      </div>

      <ul className="relative mt-3 -mx-2">
        {order.map((id) => {
          const t = byId.get(id);
          if (!t) return null;
          const on = done.includes(id);
          const cid = `${uid}-${id}`;
          return (
            <li
              key={id}
              ref={(el) => {
                if (el) rows.current.set(id, el);
                else rows.current.delete(id);
              }}
              className="relative"
            >
              <label htmlFor={cid} style={rise(tasks.indexOf(t) + 1)} className="group/task relative flex cursor-pointer select-none items-center gap-3 rounded-[10px] px-2 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand">
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[10px] bg-paper-2 opacity-0 transition-opacity duration-300 group-hover/task:opacity-70" />
                <input id={cid} type="checkbox" checked={on} onChange={() => toggle(id)} className="sr-only" />
                <Circle on={on} />
                <span className="relative min-w-0 flex-1">
                  <span className="relative inline-block max-w-full align-top">
                    <span className="block truncate text-[14px] tracking-[-0.01em] text-ink transition-opacity duration-500" style={{ opacity: on ? 0.42 : 1 }}>
                      {t.title}
                    </span>
                    {/* The strike sweeps left to right. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-1/2 h-[1.5px] origin-left rounded-full bg-ink transition-transform"
                      style={{ transform: `scaleX(${on ? 1 : 0})`, opacity: 0.55, transitionDuration: on ? "420ms" : "220ms", transitionTimingFunction: EASE }}
                    />
                  </span>
                  {t.meta && <span className="mt-0.5 block text-[12px] text-mute">{t.meta}</span>}
                </span>
                {t.owner && (
                  <span aria-label={`Owner ${t.owner}`} className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper-2 text-[10px] font-medium tracking-[0.02em] text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)] transition-opacity duration-500" style={{ opacity: on ? 0.5 : 1 }}>
                    {t.owner}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Circle({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="relative grid h-[18px] w-[18px] shrink-0 place-items-center">
      <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] transition-opacity duration-200 group-hover/task:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_42%,transparent)]" style={{ opacity: on ? 0 : 1 }} />
      <span className="absolute inset-0 rounded-full bg-brand transition-[transform,opacity] duration-500" style={{ transform: on ? "scale(1)" : "scale(0.3)", opacity: on ? 1 : 0, transitionTimingFunction: SPRING }} />
      <svg viewBox="0 0 16 16" className="relative h-[11px] w-[11px] text-white" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5l3 3 6-7" pathLength={1} strokeDasharray="1" className="transition-[stroke-dashoffset]" style={{ strokeDashoffset: on ? 0 : 1, transitionDuration: on ? "380ms" : "100ms", transitionDelay: on ? "100ms" : "0ms", transitionTimingFunction: EASE }} />
      </svg>
    </span>
  );
}

export default TaskCheckbox;
