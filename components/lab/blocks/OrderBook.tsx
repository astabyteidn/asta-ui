"use client";

import { useEffect, useState } from "react";

const UP = "var(--color-brand)";
const DOWN = "var(--color-ink-2)";
const LEVELS = 5;
const TICK = 0.01;
const EASE = "cubic-bezier(.16,1,.3,1)";

type Row = { p: number; s: number; f: number };
type Book = { mid: number; dir: 1 | -1; asks: Row[]; bids: Row[]; n: number };

const size = () => +(0.4 + Math.random() * 6).toFixed(3);

function make(mid: number, prev?: Book): Book {
  const n = (prev?.n ?? 0) + 1;
  const side = (k: 1 | -1, old?: Row[]) =>
    Array.from({ length: LEVELS }, (_, i) => {
      const p = +(mid + k * (i + 1) * TICK).toFixed(2);
      const was = old?.find((r) => r.p === p);
      // Only a couple of levels change per update, so the book reads calm.
      const change = !was || Math.random() < 0.28;
      return { p, s: change ? size() : was.s, f: change && was ? n : (was?.f ?? 0) };
    });
  return { mid, dir: prev ? (mid >= prev.mid ? 1 : -1) : 1, asks: side(1, prev?.asks), bids: side(-1, prev?.bids), n };
}

/** Five asks, the mid price, five bids. Depth bars ease to their size and changed levels flash. */
export default function OrderBook() {
  const [book, setBook] = useState<Book>(() => make(1842.5));

  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      setBook((b) => {
        const r = Math.random();
        const mid = r < 0.12 ? b.mid + TICK : r < 0.24 ? b.mid - TICK : b.mid;
        return make(+mid.toFixed(2), b);
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const cum = (rows: Row[]) => rows.reduce<number[]>((a, r) => [...a, (a.at(-1) ?? 0) + r.s], []);
  const ca = cum(book.asks);
  const cb = cum(book.bids);
  const max = Math.max(ca.at(-1)!, cb.at(-1)!);

  const row = (r: Row, depth: number, color: string, key: string, i: number) => (
    <div key={key} className="relative flex min-h-0 flex-1 items-center justify-between overflow-hidden rounded-[5px] px-3">
      <span
        aria-hidden
        className="absolute inset-y-[2px] left-0 right-0 origin-right rounded-[4px] transition-transform duration-[900ms] will-change-transform motion-reduce:transition-none"
        style={{
          transform: `scaleX(${depth / max})`,
          background: `color-mix(in srgb, ${color} ${color === UP ? 20 : 7}%, transparent)`,
          transitionTimingFunction: EASE,
          transitionDelay: `${i * 40}ms`,
        }}
      />
      {r.f === book.n && (
        <span
          key={r.f}
          aria-hidden
          className="absolute inset-0 rounded-[5px] animate-[ob-flash_1.4s_cubic-bezier(.16,1,.3,1)_forwards] motion-reduce:hidden"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
        />
      )}
      <span className="relative tabular-nums" style={{ color }}>
        {r.p.toFixed(2)}
      </span>
      <span className="relative tabular-nums text-ink-2">{r.s.toFixed(3)}</span>
    </div>
  );

  const mc = book.dir > 0 ? UP : DOWN;

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-14 [container-type:size]">
      <style>{`@keyframes ob-flash { from { opacity: 1 } to { opacity: 0 } }`}</style>
      <div className="flex h-full max-h-[460px] w-full max-w-[380px] flex-col gap-[3px] font-mono text-[clamp(11px,2.6cqh,15px)]">
        {[...book.asks].reverse().map((r, i) => row(r, ca[LEVELS - 1 - i], DOWN, `a${i}`, LEVELS - 1 - i))}
        <div className="my-1.5 flex flex-[1.6] items-center justify-between px-3">
          <span className="flex items-center gap-2 text-[1.55em] font-medium tabular-nums tracking-[-0.02em] transition-colors duration-700" style={{ color: mc, transitionTimingFunction: EASE }}>
            {book.mid.toFixed(2)}
            <span className={`text-[0.6em] transition-transform duration-500 ${book.dir > 0 ? "" : "rotate-180"}`} style={{ transitionTimingFunction: EASE }}>
              ▲
            </span>
          </span>
          <span className="text-[0.85em] uppercase tracking-[0.1em] text-mute">mid</span>
        </div>
        {book.bids.map((r, i) => row(r, cb[i], UP, `b${i}`, i))}
      </div>
    </div>
  );
}
