"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

type Tx = { id: number; name: string; amount: number; via: string };

const BASE = 12480.2;
const OLD: Tx[] = [
  { id: -1, name: "Pine Cafe", amount: 34, via: "Card ·· 2207" },
  { id: -2, name: "M. Silva", amount: 120, via: "Transfer" },
  { id: -3, name: "Orbit Print", amount: 76.5, via: "Card ·· 5530" },
];
const INCOMING: Tx[] = [
  { id: 1, name: "Maple & Co.", amount: 128, via: "Card ·· 4821" },
  { id: 2, name: "Juniper Studio", amount: 342.5, via: "Transfer" },
  { id: 3, name: "R. Okafor", amount: 46.2, via: "Card ·· 0937" },
  { id: 4, name: "Northfield Goods", amount: 219.99, via: "Transfer" },
  { id: 5, name: "Corner Bakery", amount: 18.75, via: "Card ·· 1150" },
  { id: 6, name: "Atlas Rentals", amount: 512, via: "Transfer" },
  { id: 7, name: "K. Tanaka", amount: 89.4, via: "Card ·· 7718" },
  { id: 8, name: "Harbor Supply", amount: 264.1, via: "Transfer" },
];
const SPARK = [80, 140, 60, 210, 120, 180, 90, 160, 230, 110];
const ROWS = 3;

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const initials = (n: string) =>
  n
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

/** Digits that roll to the new value instead of jumping. */
function Roll({ value, instant }: { value: string; instant: boolean }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-start leading-[1.1em] tabular-nums" aria-label={value}>
      {chars.map((c, i) => {
        const key = chars.length - i;
        if (!/\d/.test(c))
          return (
            <span key={`s${key}`} aria-hidden className="inline-block h-[1.1em]">
              {c}
            </span>
          );
        return (
          <span key={`d${key}`} aria-hidden className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1em]">
            <span className="invisible">0</span>
            <span
              className="absolute left-0 top-0 flex flex-col motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(c) * 1.1}em)`, transition: instant ? "none" : `transform .8s ${EASE} ${(chars.length - i) * 22}ms` }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.1em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const Incoming = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11.5 4.5l-7 7M4.5 5.5v6h6" />
  </svg>
);

/** One focused moment: a payment lands, the balance rolls up and the sparkline grows a point. Hover to pause. */
export default function PaymentReceived() {
  const [shown, setShown] = useState(0);
  const [applied, setApplied] = useState(0);
  const [hot, setHot] = useState(false);
  const [fade, setFade] = useState(false);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const k = useRef(0);

  // Demo loop: a payment every 3s; after the last one, fade out, reset unseen and start again.
  useEffect(() => {
    if (paused) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const later = (ms: number, f: () => void) => t.push(setTimeout(() => alive && f(), ms));
    const cycle = () => {
      if (k.current >= INCOMING.length) {
        setFade(true);
        later(450, () => {
          k.current = 0;
          setInstant(true);
          setShown(0);
          setApplied(0);
          setHot(false);
        });
        later(560, () => setInstant(false));
        later(620, () => setFade(false));
        later(1500, cycle);
        return;
      }
      const i = ++k.current;
      setShown(i);
      later(still ? 0 : 420, () => {
        setApplied(i);
        setHot(true);
      });
      later(2000, () => setHot(false));
      later(3000, cycle);
    };
    later(900, cycle);
    return () => {
      alive = false;
      t.forEach(clearTimeout);
      // Pausing mid-arrival: settle what's already on screen.
      setApplied(k.current);
      setHot(false);
      setFade(false);
    };
  }, [paused]);

  const got = INCOMING.slice(0, applied);
  const sum = got.reduce((a, b) => a + b.amount, 0);
  const toasts = INCOMING.slice(Math.max(0, shown - 3), shown).reverse();
  const rows = [...got].reverse().concat(OLD).slice(0, ROWS + 1);

  // Sparkline: fixed y range, the line slides left one step as each point lands.
  const pts = SPARK.concat(got.map((g) => Math.min(560, g.amount)));
  const W = 120;
  const H = 44;
  const step = W / (SPARK.length - 1);
  const y = (v: number) => H - 5 - (v / 560) * (H - 12);
  const xy = (i: number) => `${(i * step).toFixed(2)} ${y(pts[i]).toFixed(2)}`;
  const line = pts.slice(0, -1).map((_, i) => `${i ? "L" : "M"}${xy(i)}`).join(" ");
  const tail = `M${xy(pts.length - 2)} L${xy(pts.length - 1)}`;
  const area = `${pts.map((_, i) => `${i ? "L" : "M"}${xy(i)}`).join(" ")} L${((pts.length - 1) * step).toFixed(2)} ${H} L0 ${H} Z`;
  const shift = (pts.length - SPARK.length) * step;
  const last = pts.length - 1;

  const toggle = () => setPaused((p) => !p);

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`Merchant balance ${money(BASE + sum)}. ${paused ? "Paused" : "Live"}. Press space to ${paused ? "resume" : "pause"}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
      onPointerUp={(e) => e.pointerType !== "mouse" && toggle()}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      style={{ containerType: "size" }}
    >
      <style href="asta-paymentreceived" precedence="asta">{`
        @keyframes lab-pr-drop { from { transform: translateY(-120%) scale(.96); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-pr-in { from { opacity: 0; transform: translateY(-40%) } to { opacity: 1; transform: none } }
        @keyframes lab-pr-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes lab-pr-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lab-pr-dot { 0% { transform: scale(0) } 60% { transform: scale(1.4) } 100% { transform: scale(1) } } /* perf-ok: chart end dot, not a surface */
        @keyframes lab-pr-live { from { transform: scale(1); opacity: .6 } to { transform: scale(2.6); opacity: 0 } }
        .lab-pr-drop { animation: lab-pr-drop .6s ${EASE} backwards }
        .lab-pr-in { animation: lab-pr-in .55s ${EASE} backwards }
        .lab-pr-draw { stroke-dasharray: 1; animation: lab-pr-draw .6s ${EASE} .15s both }
        .lab-pr-fade { animation: lab-pr-fade .8s ${EASE} .2s both }
        .lab-pr-dot { transform-box: fill-box; transform-origin: center; animation: lab-pr-dot .5s ${EASE} .55s both }
        .lab-pr-live { animation: lab-pr-live 1.6s ${EASE} infinite }
        @media (prefers-reduced-motion: reduce) { .lab-pr-drop, .lab-pr-in, .lab-pr-draw, .lab-pr-fade, .lab-pr-dot, .lab-pr-live { animation: none } }
      `}</style>

      <div className="flex w-full max-w-[460px] flex-col gap-[max(10px,3.6cqh)]" style={{ opacity: fade ? 0 : 1, transition: `opacity .45s ${EASE}` }}>
        {/* Toast stack */}
        <div className="relative h-[clamp(42px,15cqh,50px)]" aria-live="polite">
          {toasts.length === 0 && (
            <div className={`flex h-full items-center justify-center rounded-[11px] text-[12px] text-mute ${RING}`}>Waiting for payments…</div>
          )}
          {toasts.map((tx, d) => (
            <div
              key={tx.id}
              className="absolute inset-0 origin-bottom"
              style={{
                zIndex: 3 - d,
                opacity: d === 0 ? 1 : d === 1 ? 0.55 : 0,
                transform: d === 0 ? "none" : `translateY(${d * 7}px) scale(${1 - d * 0.05})`,
                transition: instant ? "none" : `transform .6s ${EASE}, opacity .6s ${EASE}`,
              }}
            >
              <div className="lab-pr-drop flex h-full items-center gap-2.5 rounded-[11px] bg-paper px-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_10px_24px_-14px_rgb(0_0_0/0.7)]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-paper">
                  <Incoming className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-[12.5px] font-medium text-ink">Payment received</span>
                  <span className="block truncate text-[11.5px] text-mute">from {tx.name}</span>
                </span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums text-brand">+{money(tx.amount)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Balance + sparkline */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-mute">
              Available balance
              <span className="relative inline-flex h-1.5 w-1.5">
                {!paused && <span className="lab-pr-live absolute inset-0 rounded-full bg-brand" />}
                <span className={`relative h-1.5 w-1.5 rounded-full transition-opacity duration-300 ${paused ? "bg-mute" : "bg-brand"}`} />
              </span>
              <span className="normal-case tracking-normal">{paused ? "Paused" : "Live"}</span>
            </div>
            <div className="mt-1.5 font-medium tracking-[-0.035em] text-ink" style={{ fontSize: "clamp(24px, 9.5cqmin, 38px)", lineHeight: 1 }}>
              <Roll value={money(BASE + sum)} instant={instant} />
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-[34%] max-w-[150px] shrink-0 overflow-hidden" fill="none" aria-hidden>
            <defs>
              <linearGradient id="lab-pr-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--color-brand)" stopOpacity="0.22" />
                <stop offset="1" stopColor="var(--color-brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g style={{ transform: `translateX(${-shift}px)`, transition: instant ? "none" : `transform .8s ${EASE}` }}>
              <path key={`a${last}`} d={area} fill="url(#lab-pr-area)" className={applied ? "lab-pr-fade" : ""} />
              <path d={line} stroke="var(--color-brand)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path key={`t${last}`} d={tail} pathLength={1} stroke="var(--color-brand)" strokeWidth="1.6" strokeLinecap="round" className={applied ? "lab-pr-draw" : ""} />
              <circle key={`d${last}`} cx={last * step} cy={y(pts[last])} r="2.6" fill="var(--color-brand)" className={applied ? "lab-pr-dot" : ""} />
            </g>
          </svg>
        </div>

        {/* Recent transactions: rows sit on a fixed rhythm and glide down as a new one lands on top. */}
        <div aria-label="Recent payments">
          <div className="relative" style={{ height: `calc(${ROWS} * clamp(28px, 9.5cqh, 38px))` }}>
            {rows.map((tx, i) => (
              <div
                key={tx.id}
                className={`absolute inset-x-0 top-0 flex h-[clamp(28px,9.5cqh,38px)] items-center gap-2.5 px-2`}
                style={{
                  transform: `translateY(${i * 100}%)`,
                  opacity: i < ROWS ? 1 : 0,
                  transition: instant ? "none" : `transform .7s ${EASE}, opacity .5s ${EASE}`,
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[8px] bg-brand/12"
                  style={{ opacity: hot && i === 0 && tx.id > 0 ? 1 : 0, transition: `opacity ${hot ? ".3s" : "1.2s"} ${EASE}` }}
                />
                <span className={`relative flex w-full items-center gap-2.5 ${tx.id > 0 && i === 0 && !instant ? "lab-pr-in" : ""}`}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-[9.5px] font-semibold text-ink-2 ${RING}`}>
                    {initials(tx.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                    {tx.name} <span className="text-mute">· {tx.via}</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] tabular-nums text-ink-2">+{money(tx.amount)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
