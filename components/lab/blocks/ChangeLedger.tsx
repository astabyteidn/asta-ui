"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";

type Kind = "file" | "db" | "mail";
type Entry = { id: number; kind: Kind; verb: string; target: string; meta: string; time: string; deps: number[] };

const ENTRIES: Entry[] = [
  { id: 1, kind: "file", verb: "Edited", target: "billing/plan.ts", meta: "+14 −3", time: "14:02", deps: [] },
  { id: 2, kind: "file", verb: "Edited", target: "billing/seats.ts", meta: "+41", time: "14:03", deps: [] },
  { id: 3, kind: "db", verb: "Added column", target: "accounts.seats", meta: "Migration 0042", time: "14:05", deps: [] },
  { id: 4, kind: "db", verb: "Updated 38 rows in", target: "accounts", meta: "seats = 5", time: "14:06", deps: [3] },
  { id: 5, kind: "mail", verb: "Drafted email", target: "Your plan now has 5 seats", meta: "To 38 admins", time: "14:07", deps: [4] },
];
const ICONS: Record<Kind, string> = {
  file: "M4 1.8h5.2L12.5 5v9.2H4zM9 1.8V5.2h3.4M6.2 8.5h4M6.2 11h2.6",
  db: "M3 3.8c0-1 2.2-1.8 5-1.8s5 .8 5 1.8v8.4c0 1-2.2 1.8-5 1.8s-5-.8-5-1.8zM3 3.8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8M3 8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8",
  mail: "M2 4h12v8.5H2zM2.4 4.4 8 9l5.6-4.6",
};

type S = { landed: number; undone: number[]; hot: number | null };
const INIT: S = { landed: 0, undone: [], hot: null };

/** The idle run: five changes land, then the demo hovers #3 and undoes it. Each step is [delay before, change]. */
const STEPS: [number, (s: S) => S][] = [
  ...ENTRIES.map((_, i): [number, (s: S) => S] => [i ? 950 : 700, (s) => ({ ...s, landed: i + 1 })]),
  [1300, (s) => ({ ...s, hot: 3 })],
  [900, (s) => ({ ...s, undone: s.undone.includes(3) ? s.undone : [...s.undone, 3] })],
  [3600, (s) => ({ ...s, hot: null })],
];

/** The first undone change this entry depends on, directly or through another entry. */
function blockedBy(e: Entry, undone: number[]): number | null {
  for (const d of e.deps) {
    if (undone.includes(d)) return d;
    const up = blockedBy(ENTRIES[d - 1], undone);
    if (up) return up;
  }
  return null;
}

/** A feed of changes an agent made. Undo one and it strikes through, and the changes that depend on it dim. */
export default function ChangeLedger() {
  const [s, setS] = useState<S>(INIT);
  const [fade, setFade] = useState(false);
  const [hover, setHover] = useState(false);
  const [held, setHeld] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const k = useRef(0);
  const paused = hover || held || focusIn || !visible;

  // Rest while off screen or in a hidden tab.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = true;
    const sync = () => setVisible(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  useEffect(() => {
    if (paused) return;
    const t: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const later = (ms: number, f: () => void) => t.push(setTimeout(() => alive && f(), ms));
    const step = () => {
      if (k.current >= STEPS.length) {
        setFade(true);
        later(480, () => {
          k.current = 0;
          setS(INIT);
        });
        later(600, () => setFade(false));
        later(700, step);
        return;
      }
      const [wait, f] = STEPS[k.current];
      later(wait, () => {
        k.current++;
        setS(f);
        step();
      });
    };
    step();
    return () => {
      alive = false;
      t.forEach(clearTimeout);
    };
  }, [paused]);

  /** Touch and keys pause the idle run for a while, the mouse pauses it while it is over the card. */
  const hold = () => {
    setHeld(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setHeld(false), 9000);
  };
  const setHot = (id: number | null) => setS((v) => (v.hot === id ? v : { ...v, hot: id }));
  const toggle = (id: number) => {
    hold();
    setS((v) => ({ ...v, hot: id, undone: v.undone.includes(id) ? v.undone.filter((u) => u !== id) : [...v.undone, id] }));
  };

  const shown = ENTRIES.slice(0, s.landed).reverse();
  const onKey = (e: KeyboardEvent) => {
    const i = btns.current.findIndex((b) => b === document.activeElement);
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!d || i < 0) return;
    e.preventDefault();
    hold();
    btns.current[(i + d + shown.length) % shown.length]?.focus();
  };

  const undoneCount = s.undone.filter((u) => u <= s.landed).length;
  const blockedCount = shown.filter((e) => !s.undone.includes(e.id) && blockedBy(e, s.undone)).length;

  return (
    <div
      ref={root}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        setHover(false);
        setHot(null);
      }}
      onKeyDown={onKey}
      onFocus={() => setFocusIn(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocusIn(false)}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11"
      style={{ containerType: "size" }}
    >
      <style href="asta-changeledger" precedence="asta">{`
        @keyframes lab-cl-land { from { transform: translateY(-14px) scale(.97); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-cl-pop { from { transform: scale(.9); opacity: 0 } to { transform: none; opacity: 1 } }
        .lab-cl-land { animation: lab-cl-land .55s ${EASE} both }
        .lab-cl-pop { animation: lab-cl-pop .35s ${EASE} both }
        .lab-cl-meta { display: none }
        @container (min-height: 300px) { .lab-cl-meta { display: block } }
        @container (max-height: 270px) { .lab-cl-sub { display: none } }
        @media (prefers-reduced-motion: reduce) { .lab-cl-land, .lab-cl-pop { animation: none } .lab-cl-move { transition: none !important } }
      `}</style>

      <div
        className={`flex w-full max-w-[480px] flex-col gap-[max(6px,2.2cqh)] rounded-[14px] bg-paper p-[clamp(10px,3.4cqmin,16px)] ${RING} shadow-[0_18px_40px_-28px_rgb(0_0_0/0.35)]`}
        style={{ opacity: fade ? 0 : 1, transition: `opacity .45s ${EASE}`, "--row": "clamp(30px, 11.5cqh, 48px)" } as CSSProperties}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium tracking-[-0.01em] text-ink">Agent changes</p>
            <p className="lab-cl-sub truncate text-[11.5px] text-mute">Astabyte Ops · seats rollout · today</p>
          </div>
          <span className="shrink-0 rounded-md bg-paper-2 px-2 py-1 text-[11px] tabular-nums text-ink-2" aria-live="polite">
            {undoneCount ? `${undoneCount} undone · ${blockedCount} blocked` : `${s.landed} ${s.landed === 1 ? "change" : "changes"}`}
          </span>
        </div>

        <ol className="relative" style={{ height: `calc(${ENTRIES.length} * var(--row))` }} aria-label="Changes, newest first">
          {!s.landed && (
            <li className="absolute inset-0 grid place-items-center rounded-[11px] bg-paper-2 text-[12px] text-mute">Changes the agent makes land here</li>
          )}
          {shown.map((e, i) => {
            const undone = s.undone.includes(e.id);
            const by = undone ? null : blockedBy(e, s.undone);
            const hot = s.hot === e.id;
            return (
              <li
                key={e.id}
                className="lab-cl-move absolute inset-x-0 top-0 h-[var(--row)]"
                style={{ transform: `translateY(calc(${i} * var(--row)))`, transition: `transform .6s ${EASE}` }}
                onPointerEnter={(ev) => ev.pointerType === "mouse" && setHot(e.id)}
                onPointerDown={(ev) => {
                  if (ev.pointerType === "mouse") return;
                  hold();
                  setHot(e.id);
                }}
              >
                <div className={`lab-cl-land relative flex h-full items-center gap-2.5 rounded-[9px] px-2 ${hot ? "bg-paper-2" : ""}`} style={{ transition: `background-color .25s ${EASE}` }}>
                  <span className="flex min-w-0 flex-1 items-center gap-2.5" style={{ opacity: by ? 0.42 : 1, transition: `opacity .45s ${EASE}` }}>
                    <span className={`grid h-[clamp(20px,7cqh,26px)] w-[clamp(20px,7cqh,26px)] shrink-0 place-items-center rounded-[7px] ${undone ? `bg-paper text-mute ${RING}` : "bg-paper-2 text-ink-2"}`}>
                      <svg viewBox="0 0 16 16" className="h-[60%] w-[60%]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={ICONS[e.kind]} />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="relative block w-fit max-w-full truncate text-[12.5px]">
                        <span className={undone ? "text-mute" : "text-ink"}>{e.verb} </span>
                        <span className={`${e.kind === "mail" ? "" : "font-mono text-[11.5px]"} ${undone ? "text-mute" : "text-ink-2"}`}>{e.kind === "mail" ? `“${e.target}”` : e.target}</span>
                        <span
                          aria-hidden
                          className="lab-cl-move absolute inset-x-0 top-1/2 h-px origin-left bg-ink"
                          style={{ transform: `scaleX(${undone ? 1 : 0})`, transition: `transform .45s ${EASE}` }}
                        />
                      </span>
                      <span className="lab-cl-meta truncate text-[10.5px] tabular-nums text-mute">
                        {e.meta} · {e.time}
                      </span>
                    </span>
                  </span>

                  {by && (
                    <span className="lab-cl-pop flex shrink-0 items-center gap-1 rounded-md bg-paper-2 px-1.5 py-0.5 text-[10.5px] text-ink-2">
                      <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                        <path d="M6.5 9.5 9.5 6.5M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7l1.2-1.2" />
                      </svg>
                      Depends on #{by}
                    </span>
                  )}

                  {/* #id and status, swapped for the Undo button while the row is hot. */}
                  <span className="relative grid shrink-0 place-items-end">
                    <span
                      className={`col-start-1 row-start-1 flex items-center gap-1.5 font-mono text-[10.5px] tabular-nums ${undone ? "text-ink" : i === 0 && !by ? "text-brand" : "text-mute"}`}
                      style={{ opacity: hot ? 0 : 1, transition: `opacity .2s ${EASE}` }}
                    >
                      {i === 0 && !undone && !by && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />}
                      {undone ? "Undone" : `#${e.id}`}
                    </span>
                    <button
                      ref={(el) => {
                        btns.current[i] = el;
                      }}
                      type="button"
                      onClick={() => toggle(e.id)}
                      onFocus={() => setHot(e.id)}
                      aria-label={`${undone ? "Restore" : "Undo"} change #${e.id}: ${e.verb} ${e.target}${by ? `. Depends on #${by}, which is undone` : ""}`}
                      className={`col-start-1 row-start-1 rounded-[7px] px-2 py-1 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand/60 active:scale-[.96] ${undone ? `bg-paper text-ink ${RING}` : "bg-ink text-paper"} ${hot ? "" : "pointer-events-none"}`}
                      style={{ opacity: hot ? 1 : 0, transform: hot ? "none" : "scale(.94)", transition: `opacity .2s ${EASE}, transform .2s ${EASE}` }}
                    >
                      {undone ? "Restore" : "Undo"}
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
