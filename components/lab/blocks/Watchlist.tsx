"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";

type Row = { sym: string; name: string; price: number; open: number; hist: number[] };

const START: Row[] = [
  { sym: "ASTA", name: "Astabyte Inc.", price: 186.42, open: 182.1 },
  { sym: "TIDE", name: "Tidewater Energy", price: 311.2, open: 309.85 },
  { sym: "NRTH", name: "Northpeak Labs", price: 64.12, open: 64.4 },
  { sym: "JNPR", name: "Juniper Goods", price: 23.85, open: 24.31 },
  { sym: "OAKL", name: "Oakline Freight", price: 9.47, open: 9.81 },
].map((r, i) => ({ ...r, hist: Array.from({ length: 18 }, (_, k) => r.open + (r.price - r.open) * (k / 17) + Math.sin(k * 1.3 + i) * r.open * 0.004) }));

const pct = (r: Row) => ((r.price - r.open) / r.open) * 100;
const ranks = (rs: Row[]) => new Map([...rs].sort((a, b) => pct(b) - pct(a)).map((r, i) => [r.sym, i]));
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// A fixed script of moves so the demo reshuffles in an interesting order, then loops.
const MOVES: [string, number][] = [
  ["NRTH", 0.012], ["OAKL", 0.02], ["ASTA", -0.006], ["NRTH", 0.014], ["JNPR", 0.018], ["TIDE", 0.009], ["OAKL", 0.03], ["ASTA", -0.012],
  ["JNPR", 0.016], ["NRTH", -0.01], ["TIDE", 0.011], ["OAKL", -0.028], ["ASTA", 0.018], ["JNPR", -0.034], ["NRTH", -0.016], ["OAKL", -0.022], ["TIDE", -0.02],
];

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const W = 64;
  const H = 22;
  const d = data.map((v, i) => `${i ? "L" : "M"}${((i / (data.length - 1)) * W).toFixed(1)} ${(H - 2 - ((v - lo) / (hi - lo || 1)) * (H - 4)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[22px] w-[clamp(40px,16cqw,64px)] shrink-0" fill="none" aria-hidden preserveAspectRatio="none">
      <path d={d} stroke={up ? "var(--color-brand)" : "var(--color-mute)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ transition: `stroke .4s ${EASE}` }} />
    </svg>
  );
}

/** Top movers re-rank live: a tick flashes the price and the row glides to its new place. Hover to pause. */
export default function Watchlist() {
  const [rows, setRows] = useState<Row[]>(START);
  const [flash, setFlash] = useState<{ sym: string; up: boolean; n: number } | null>(null);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const step = useRef(0);
  const live = useRef(START);
  // Which way each row last moved: rows climbing pass over rows falling, so their text never overlaps.
  const [lift, setLift] = useState<Record<string, number>>({});
  const paused = hover || !visible;

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

  useEffect(() => {
    if (paused) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!alive) return;
      const [sym, m] = MOVES[step.current++ % MOVES.length];
      const before = ranks(live.current);
      const next = live.current.map((r) => {
        if (r.sym !== sym) return r;
        const price = Math.round(r.price * (1 + m) * 100) / 100;
        return { ...r, price, hist: [...r.hist.slice(1), price] };
      });
      const after = ranks(next);
      live.current = next;
      setRows(next);
      setLift(Object.fromEntries(next.map((r) => [r.sym, Math.sign(before.get(r.sym)! - after.get(r.sym)!)])));
      setFlash((f) => ({ sym, up: m > 0, n: (f?.n ?? 0) + 1 }));
      t = setTimeout(tick, 1500);
    };
    t = setTimeout(tick, 700);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [paused]);

  const rank = ranks(rows);
  const best = rows.find((r) => rank.get(r.sym) === 0)!;

  return (
    <div
      ref={root}
      role="group"
      tabIndex={0}
      aria-label={`Watchlist, top movers. ${best.sym} leads at ${pct(best).toFixed(2)}%. ${hover ? "Paused" : "Live"}. Press space to ${hover ? "resume" : "pause"}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      onPointerUp={(e) => e.pointerType !== "mouse" && setHover((h) => !h)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setHover((h) => !h);
        }
      }}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
      style={{ containerType: "size" }}
    >
      <style href="asta-watchlist" precedence="asta">{`
        @keyframes lab-wl-up { 0% { opacity: 1 } 100% { opacity: 0 } }
        @keyframes lab-wl-live { from { transform: scale(1); opacity: .6 } to { transform: scale(2.6); opacity: 0 } }
        .lab-wl-flash { animation: lab-wl-up 1.1s ${EASE} both }
        .lab-wl-live { animation: lab-wl-live 1.6s ${EASE} infinite }
        @media (prefers-reduced-motion: reduce) { .lab-wl-flash, .lab-wl-live { animation: none; opacity: 0 } .lab-wl-row { transition: none !important } }
      `}</style>

      <div className={`flex w-full max-w-[480px] flex-col gap-[max(8px,2.6cqh)] rounded-[14px] bg-paper p-[clamp(10px,3.6cqmin,16px)] ${RING} shadow-[0_18px_40px_-28px_rgb(0_0_0/0.35)]`}>
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium tracking-[-0.01em] text-ink">Watchlist</p>
            <p className="truncate text-[11.5px] text-mute">Sorted by today’s change</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-paper-2 px-2 py-1 text-[11px] text-mute">
            <span className="relative inline-flex h-1.5 w-1.5">
              {!paused && <span className="lab-wl-live absolute inset-0 rounded-full bg-brand" />}
              <span className={`relative h-1.5 w-1.5 rounded-full ${paused ? "bg-mute" : "bg-brand"}`} />
            </span>
            {hover ? "Paused" : "Live"}
          </span>
        </div>

        <ol className="relative" style={{ height: `calc(${rows.length} * clamp(34px, 13cqh, 48px))` }} aria-label="Top movers">
          {rows.map((r) => {
            const p = pct(r);
            const up = p >= 0;
            const i = rank.get(r.sym)!;
            const hot = flash?.sym === r.sym;
            return (
              <li
                key={r.sym}
                className="lab-wl-row absolute inset-x-0 top-0 flex h-[clamp(34px,13cqh,48px)] items-center gap-3 bg-paper px-1"
                style={{ transform: `translateY(${i * 100}%)`, transition: `transform .7s ${EASE}`, zIndex: 2 + (lift[r.sym] ?? 0) }}
              >
                <span className="w-4 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-mute">{i + 1}</span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-[12.5px] font-semibold tracking-[0.01em] text-ink">{r.sym}</span>
                  <span className="block truncate text-[11px] text-mute">{r.name}</span>
                </span>
                <Spark data={r.hist} up={up} />
                <span className="relative w-[72px] shrink-0 rounded-md px-1.5 py-0.5 text-right text-[12.5px] tabular-nums text-ink">
                  {hot && (
                    <span key={flash.n} aria-hidden className={`lab-wl-flash absolute inset-0 rounded-md ${flash.up ? "bg-brand/15" : "bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)]"}`} />
                  )}
                  <span className="relative">{money(r.price)}</span>
                </span>
                <span
                  className={`w-[62px] shrink-0 rounded-md py-1 text-center text-[11.5px] font-medium tabular-nums ${up ? "bg-brand text-paper" : "bg-paper-2 text-ink-2"}`}
                  style={{ transition: `background-color .4s ${EASE}, color .4s ${EASE}` }}
                >
                  {up ? "+" : "−"}
                  {Math.abs(p).toFixed(2)}%
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
