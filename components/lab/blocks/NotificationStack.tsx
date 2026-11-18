"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const H = 60;
const GAP = 8;
const SHOWN = 3;
const SWIPE = 72;

const POOL = [
  { who: "Maya Chen", what: "Commented on Q4 roadmap", tag: "MC" },
  { who: "Invoice #2041", what: "Paid by Juniper Studio", tag: "IN" },
  { who: "Deploy", what: "web · main finished in 48s", tag: "DP" },
  { who: "Tomás Rey", what: "Invited you to Harbor", tag: "TR" },
  { who: "New sign-in", what: "Chrome on macOS · Lisbon", tag: "SI" },
  { who: "Ines Park", what: "Approved your pull request", tag: "IP" },
];

type Item = { id: number; n: number; out: 0 | 1 | -1 };

/** Demo rhythm: arrivals and dismissals balance out. The list stays short, so the loop never resets. */
const STEPS = ["dismiss", "add", "add", "dismiss"] as const;

/** One focused moment: notifications land on top of a soft stack. Hover fans it out, swipe or X dismisses and the rest settle up. */
export default function NotificationStack() {
  const [items, setItems] = useState<Item[]>([
    { id: 2, n: 2, out: 0 },
    { id: 1, n: 1, out: 0 },
    { id: 0, n: 0, out: 0 },
  ]);
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState<{ id: number; dx: number } | null>(null);
  const seq = useRef(3);
  const list = useRef<Item[]>([]);
  const start = useRef<{ id: number; x: number; moved: boolean } | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Only timers still pending: each one removes itself when it fires.
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const takeOver = () => {
    setPaused(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(
    () => () => {
      if (idle.current) clearTimeout(idle.current);
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const add = () => {
    const id = seq.current++;
    setItems((v) => [{ id, n: id % POOL.length, out: 0 as const }, ...v].slice(0, SHOWN + 2));
  };

  const dismiss = (id: number, dir: 1 | -1 = 1) => {
    setItems((v) => v.map((it) => (it.id === id ? { ...it, out: dir } : it)));
    const t = setTimeout(() => {
      timers.current.delete(t);
      setItems((v) => v.filter((it) => it.id !== id));
    }, still() ? 0 : 340);
    timers.current.add(t);
  };

  useEffect(() => {
    if (paused || hover || open || still()) return;
    let n = 0;
    const id = setInterval(() => {
      const step = STEPS[n++ % STEPS.length];
      if (step === "add") add();
      else {
        const rest = list.current.filter((it) => !it.out);
        if (rest.length > 1) dismiss(rest[0].id, 1);
      }
    }, 2200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, hover, open]);

  useEffect(() => {
    list.current = items;
  }, [items]);

  const live = items.filter((it) => !it.out);
  // Stack position: live cards count up from the top, a leaving card keeps the slot it had.
  const pos: number[] = [];
  items.reduce((r, it) => {
    pos.push(r);
    return it.out ? r : r + 1;
  }, 0);
  const fan = hover || open;

  const down = (e: ReactPointerEvent, id: number) => {
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { id, x: e.clientX, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: ReactPointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 4) s.moved = true;
    if (s.moved) setDrag({ id: s.id, dx });
  };
  const up = (e: ReactPointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    takeOver();
    const dx = e.clientX - s.x;
    setDrag(null);
    if (Math.abs(dx) > SWIPE) dismiss(s.id, dx > 0 ? 1 : -1);
    else if (!s.moved && e.pointerType !== "mouse") setOpen((o) => !o);
  };

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11" style={{ containerType: "size" }}>
      <style href="asta-notificationstack" precedence="asta">{`
        @keyframes lab-ns-in { from { transform: translateY(-10px) scale(.97); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-ns-pop { 0% { transform: scale(.6) } 60% { transform: scale(1.12) } 100% { transform: scale(1) } }
        .lab-ns-in { animation: lab-ns-in .55s ${EASE} both }
        .lab-ns-pop { animation: lab-ns-pop .45s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-ns-in, .lab-ns-pop { animation: none } }
      `}</style>

      <div className="flex w-full max-w-[380px] flex-col gap-[max(12px,4cqh)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-[clamp(15px,4.6cqmin,18px)] font-medium tracking-[-0.02em] text-ink">Inbox</span>
            <span
              key={live.length}
              role="status"
              aria-label={`${live.length} unread`}
              className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1.5 text-[10.5px] font-semibold tabular-nums text-paper transition-opacity duration-300 ${live.length ? "lab-ns-pop" : ""}`}
              style={{ opacity: live.length ? 1 : 0 }}
            >
              {live.length}
            </span>
          </span>
          <button
            type="button"
            aria-expanded={fan}
            onClick={() => {
              takeOver();
              setOpen((o) => !o);
            }}
            className="rounded-[6px] px-1.5 py-1 text-[11.5px] text-mute outline-none transition-opacity hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            {fan ? "Collapse" : "Show all"}
          </button>
        </div>

        <ul
          aria-label="Notifications"
          onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
          onFocus={() => setOpen(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(false)}
          className="relative"
          style={{ height: SHOWN * H + (SHOWN - 1) * GAP }}
        >
          {live.length === 0 && (
            <li className={`flex items-center justify-center rounded-[12px] text-[12px] text-mute ${RING}`} style={{ height: H }}>
              You’re all caught up
            </li>
          )}
          {items.map((it, k) => {
            const p = POOL[it.n];
            const i = pos[k];
            const hidden = i >= SHOWN;
            const dx = drag?.id === it.id ? drag.dx : 0;
            const y = fan ? i * (H + GAP) : Math.min(i, SHOWN - 1) * 9;
            const s = fan ? 1 : 1 - Math.min(i, SHOWN - 1) * 0.05;
            const o = it.out ? 0 : hidden ? 0 : fan ? 1 : i === 0 ? 1 : i === 1 ? 0.7 : 0.4;
            const x = it.out ? `${it.out * 110}%` : `${dx}px`;
            const reach = fan || i === 0;
            return (
              <li
                key={it.id}
                className="absolute inset-x-0 top-0 origin-top"
                style={{
                  height: H,
                  zIndex: 20 - i,
                  opacity: dx ? Math.max(0.3, 1 - Math.abs(dx) / 220) : o,
                  transform: `translate(${x}, ${y}px) scale(${s})`,
                  transition: dx ? "none" : `transform .55s ${EASE}, opacity .4s ${EASE}`,
                  pointerEvents: hidden || it.out ? "none" : "auto",
                  touchAction: "pan-y",
                }}
                aria-hidden={hidden || !!it.out}
                onPointerDown={(e) => reach && down(e, it.id)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={() => {
                  start.current = null;
                  setDrag(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Delete" || e.key === "Backspace") {
                    e.preventDefault();
                    takeOver();
                    dismiss(it.id);
                  }
                }}
              >
                <div className={`lab-ns-in group flex h-full select-none items-center gap-3 rounded-[12px] bg-paper px-3 shadow-[0_8px_24px_-16px_rgb(0_0_0/0.45)] ${RING}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-2 text-[10.5px] font-medium text-ink-2">{p.tag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-ink">{p.who}</span>
                      <span className="shrink-0 text-[11px] text-mute">{i === 0 ? "now" : `${i * 2}m`}</span>
                    </span>
                    <span className="block truncate text-[12px] text-mute">{p.what}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Dismiss ${p.who}`}
                    tabIndex={reach && !hidden ? 0 : -1}
                    onClick={() => {
                      takeOver();
                      dismiss(it.id);
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-mute outline-none transition-opacity duration-300 hover:text-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/60"
                    style={{ opacity: reach ? (fan ? 1 : 0.55) : 0 }}
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
