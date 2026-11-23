"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";

/** Five stops. Each step up lets one more action run without asking. */
const STOPS = ["Ask me first", "Edits only", "Edits and email", "Everything but deploys", "Runs on its own"];
const MAX = STOPS.length - 1;
/** The idle sweep, up and back down. */
const SWEEP = [1, 2, 3, 4, 3, 2, 1, 0];

const ICONS: Record<string, string> = {
  edit: "M4 1.8h5.2L12.5 5v9.2H4zM9 1.8V5.2h3.4M6.2 8.5h4M6.2 11h2.6",
  email: "M2 4h12v8.5H2zM2.4 4.4 8 9l5.6-4.6",
  sql: "M3 3.8c0-1 2.2-1.8 5-1.8s5 .8 5 1.8v8.4c0 1-2.2 1.8-5 1.8s-5-.8-5-1.8zM3 3.8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8M3 8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8",
  deploy: "M8 10.5V2.2M4.8 5.2 8 2l3.2 3.2M2.5 9.5v4h11v-4",
};
const ACTIONS = [
  { id: "edit", name: "Edit files", sub: "Write to the repo", risk: 1 },
  { id: "email", name: "Send email", sub: "Reply to customers", risk: 2 },
  { id: "sql", name: "Run SQL", sub: "Read and write prod", risk: 3 },
  { id: "deploy", name: "Deploy", sub: "Ship to production", risk: 4 },
];

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** An autonomy dial for an agent: as it turns, actions glide from "Asks first" to "Runs alone". Drag it, or use the arrows. */
export default function AutonomyDial() {
  const [level, setLevel] = useState(1);
  const [moved, setMoved] = useState<{ id: string; n: number } | null>(null);
  const [demo, setDemo] = useState(true);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const rect = useRef<DOMRect | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lv = useRef(1);

  const go = (n: number) => {
    const next = Math.max(0, Math.min(MAX, n));
    const prev = lv.current;
    if (next === prev) return;
    lv.current = next;
    setLevel(next);
    // The action that just crossed over gets a short highlight.
    const crossed = ACTIONS.find((a) => a.risk === Math.max(next, prev));
    if (crossed && Math.abs(next - prev) === 1) setMoved((m) => ({ id: crossed.id, n: (m?.n ?? 0) + 1 }));
  };

  const takeOver = () => {
    setDemo(false);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setDemo(true), 8000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

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

  // The idle sweep. It picks up from wherever the dial was left.
  useEffect(() => {
    if (!demo || !visible || still()) return;
    let i = Math.max(0, SWEEP.indexOf(lv.current));
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      i = (i + 1) % SWEEP.length;
      go(SWEEP[i]);
      id = setTimeout(tick, 1700);
    };
    id = setTimeout(tick, 1400);
    return () => clearTimeout(id);
  }, [demo, visible]);

  const fromX = (x: number) => {
    const r = rect.current;
    if (!r) return;
    go(Math.round(((x - r.left) / r.width) * MAX));
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    takeOver();
    rect.current = track.current?.getBoundingClientRect() ?? null;
    e.currentTarget.setPointerCapture(e.pointerId);
    fromX(e.clientX);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) fromX(e.clientX);
  };
  const onKey = (e: KeyboardEvent) => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    const to = e.key === "Home" ? 0 : e.key === "End" ? MAX : d !== undefined ? lv.current + d : null;
    if (to === null) return;
    e.preventDefault();
    takeOver();
    go(to);
  };

  const asks = ACTIONS.filter((a) => a.risk > level);
  const alone = ACTIONS.filter((a) => a.risk <= level);

  return (
    <div ref={root} className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11" style={{ containerType: "size" }}>
      <style href="asta-autonomydial" precedence="asta">{`
        @keyframes lab-ad-flash { from { opacity: 1 } to { opacity: 0 } }
        @keyframes lab-ad-pop { from { transform: scale(.9); opacity: 0 } to { transform: none; opacity: 1 } }
        .lab-ad-flash { animation: lab-ad-flash 1.2s ${EASE} .25s both }
        .lab-ad-pop { animation: lab-ad-pop .4s ${EASE} both }
        .lab-ad-sub, .lab-ad-tag { display: none }
        @container (min-height: 320px) { .lab-ad-sub { display: block } }
        @container (min-width: 520px) { .lab-ad-tag { display: inline } }
        @container (max-height: 300px) { .lab-ad-head { display: none } }
        @media (prefers-reduced-motion: reduce) { .lab-ad-flash, .lab-ad-pop { animation: none; opacity: 0 } .lab-ad-glide { transition: none !important } }
      `}</style>

      <div
        className={`flex w-full max-w-[500px] flex-col gap-[max(8px,2.6cqh)] rounded-[14px] bg-paper p-[clamp(10px,3.4cqmin,16px)] ${RING} shadow-[0_18px_40px_-28px_rgb(0_0_0/0.35)]`}
        style={{ "--row": "clamp(26px, 10.5cqh, 44px)" } as CSSProperties}
      >
        <div className="lab-ad-head flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium tracking-[-0.01em] text-ink">Agent permissions</p>
            <p className="truncate text-[11.5px] text-mute">Astabyte Ops · production workspace</p>
          </div>
          <span className="shrink-0 rounded-md bg-paper-2 px-2 py-1 text-[11px] tabular-nums text-ink-2">
            {alone.length} of {ACTIONS.length} run alone
          </span>
        </div>

        {/* The dial: a detented slider. */}
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className={level === 0 ? "font-medium text-ink" : "text-mute"} style={{ transition: `color .3s ${EASE}` }}>
              Ask me first
            </span>
            <span key={level} className="lab-ad-pop hidden truncate px-2 text-[11px] text-ink-2 @[380px]:block">
              {level > 0 && level < MAX ? STOPS[level] : ""}
            </span>
            <span className={level === MAX ? "font-medium text-ink" : "text-mute"} style={{ transition: `color .3s ${EASE}` }}>
              Runs on its own
            </span>
          </div>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Agent autonomy"
            aria-valuemin={0}
            aria-valuemax={MAX}
            aria-valuenow={level}
            aria-valuetext={`${STOPS[level]}. ${alone.length} of ${ACTIONS.length} actions run without asking`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onKeyDown={onKey}
            className="group relative h-6 cursor-grab touch-none rounded-md px-[9px] outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <div ref={track} className="relative h-full">
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-paper-2" />
              <span
                aria-hidden
                className="lab-ad-glide absolute inset-x-0 top-1/2 h-1 origin-left -translate-y-1/2 rounded-full bg-brand"
                style={{ transform: `scaleX(${level / MAX})`, transition: `transform .55s ${EASE}` }}
              />
              {STOPS.map((s, i) => (
                <span
                  key={s}
                  aria-hidden
                  className={`absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${i <= level ? "bg-paper" : "bg-mute"}`}
                  style={{ left: `${(i / MAX) * 100}%`, transition: `background-color .3s ${EASE}` }}
                />
              ))}
              <span aria-hidden className="lab-ad-glide absolute inset-0" style={{ transform: `translateX(${(level / MAX) * 100}%)`, transition: `transform .55s ${EASE}` }}>
                <span className="absolute left-0 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper shadow-[inset_0_0_0_1.5px_var(--color-brand),0_2px_6px_-1px_rgb(0_0_0/0.35)] transition-transform duration-150 group-active:scale-110" />
              </span>
            </div>
          </div>
        </div>

        {/* Two columns. Cards glide across as the dial turns. */}
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-2 gap-[10px] px-1 text-[11px]">
            <span className="text-mute">
              Asks first <span className="tabular-nums text-ink-2">· {asks.length}</span>
            </span>
            <span className="text-mute">
              Runs alone <span className="tabular-nums text-ink-2">· {alone.length}</span>
            </span>
          </div>
          <div className="relative" style={{ height: `calc(${ACTIONS.length} * var(--row) + ${ACTIONS.length - 1} * 5px + 10px)` }}>
            <div aria-hidden className="absolute inset-0 grid grid-cols-2 gap-[10px]">
              <div className="grid place-items-center rounded-[11px] bg-paper-2">
                <span className="text-[11.5px] text-mute" style={{ opacity: asks.length ? 0 : 1, transition: `opacity .4s ${EASE}` }}>
                  Nothing needs your OK
                </span>
              </div>
              <div className="grid place-items-center rounded-[11px] bg-paper-2">
                <span className="text-[11.5px] text-mute" style={{ opacity: alone.length ? 0 : 1, transition: `opacity .4s ${EASE}` }}>
                  Nothing runs alone
                </span>
              </div>
            </div>
            <ul aria-label="Actions" className="absolute inset-[5px]">
              {ACTIONS.map((a) => {
                const on = a.risk <= level;
                const idx = on ? alone.indexOf(a) : asks.indexOf(a);
                return (
                  <li
                    key={a.id}
                    className={`lab-ad-glide absolute left-0 top-0 flex h-[var(--row)] w-[calc(50%-10px)] items-center gap-2 rounded-[8px] bg-paper px-2 ${RING} shadow-[0_1px_2px_rgb(0_0_0/0.12)]`}
                    style={{
                      transform: `translate(${on ? "calc(100% + 20px)" : "0px"}, calc(${idx} * (100% + 5px)))`,
                      transition: `transform .6s ${EASE}`,
                      zIndex: moved?.id === a.id ? 2 : 1,
                    }}
                  >
                    {moved?.id === a.id && (
                      <span key={moved.n} aria-hidden className="lab-ad-flash pointer-events-none absolute inset-0 rounded-[8px] shadow-[inset_0_0_0_1.5px_var(--color-brand)]" />
                    )}
                    <span
                      className={`grid h-[clamp(18px,6cqh,24px)] w-[clamp(18px,6cqh,24px)] shrink-0 place-items-center rounded-[6px] ${on ? "bg-brand text-paper" : "bg-paper-2 text-ink-2"}`}
                      style={{ transition: `background-color .4s ${EASE}, color .4s ${EASE}` }}
                    >
                      <svg viewBox="0 0 16 16" className="h-[62%] w-[62%]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={ICONS[a.id]} />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[12.5px] font-medium text-ink">{a.name}</span>
                      <span className="lab-ad-sub truncate text-[10.5px] text-mute">{a.sub}</span>
                    </span>
                    <span className={`lab-ad-tag shrink-0 text-[10.5px] ${on ? "text-brand" : "text-mute"}`}>{on ? "Auto" : "Needs OK"}</span>
                    <span className="sr-only">{on ? ", runs without asking" : ", asks first"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
