"use client";

import { useEffect, useState, type ReactNode } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const QR_SECS = 300;

const I = {
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M7 15h3" />
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 9.5 12 4.5l8.5 5M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 19.5h17" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3" />
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="M16 13.5h.01" />
    </svg>
  ),
  qr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2M20 14v.01M18 18h2v2M14 20h.01" />
    </svg>
  ),
};

const METHODS = [
  { key: "card", label: "Card", icon: I.card },
  { key: "bank", label: "Bank", icon: I.bank },
  { key: "wallet", label: "Wallet", icon: I.wallet },
  { key: "qr", label: "QR", icon: I.qr },
] as const;

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x + 0.5} y={y + 0.5} width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  );
}

/** A tiny, deterministic QR-looking matrix with the three finder squares. */
function MiniQr() {
  const N = 17;
  const cells: ReactNode[] = [];
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
      if (x >= fx && x < fx + 7 && y >= fy && y < fy + 7) return true;
    }
    return false;
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (finder(x, y)) continue;
      if (((x * 7 + y * 13 + x * y * 3) % 5) < 2) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="h-full w-full text-ink" fill="currentColor" shapeRendering="crispEdges" aria-hidden>
      {cells}
      <Finder x={0} y={0} />
      <Finder x={N - 7} y={0} />
      <Finder x={0} y={N - 7} />
    </svg>
  );
}

/** Four ways to pay. The highlight glides between them and one line below changes with it. */
export default function PayMethods() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const [secs, setSecs] = useState(QR_SECS);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setI((v) => {
        const n = (v + 1) % METHODS.length;
        if (n === 3) setSecs(QR_SECS);
        return n;
      });
    }, 2600);
    return () => clearInterval(id);
  }, [auto]);

  useEffect(() => {
    if (i !== 3) return;
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : QR_SECS)), 1000);
    return () => clearInterval(id);
  }, [i]);

  const pick = (n: number) => {
    setAuto(false);
    if (n === 3 && i !== 3) setSecs(QR_SECS);
    setI(n);
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const detail = [
    <span key="card" className="flex items-center gap-2 font-mono tabular-nums text-ink">
      <span className="text-mute">••••</span> 4242 <span className="text-mute">· 12/29</span>
    </span>,
    <span key="bank" className="flex items-center gap-2 font-mono tabular-nums text-ink">
      <span className="text-mute">VA</span> 8808 1234 5678 90
    </span>,
    <span key="wallet" className="text-ink">
      Confirm in the app <span className="text-mute">· +62 812 ••• 0921</span>
    </span>,
    <span key="qr" className="flex items-center gap-3 text-ink">
      <span className="h-11 w-11 rounded-[4px] bg-paper p-1 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
        <MiniQr />
      </span>
      <span className="relative grid h-7 w-7 place-items-center">
        <svg viewBox="0 0 28 28" className="absolute inset-0 -rotate-90" fill="none" aria-hidden>
          <circle cx="14" cy="14" r="12" stroke="var(--color-ink)" strokeOpacity="0.12" strokeWidth="2.5" />
          <circle
            cx="14"
            cy="14"
            r="12"
            stroke={secs < 60 ? "var(--color-mute)" : "var(--color-brand)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 12}
            strokeDashoffset={2 * Math.PI * 12 * (1 - secs / QR_SECS)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
      </span>
      <span className="font-mono tabular-nums">
        {mm}:{ss}
      </span>
    </span>,
  ];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 pb-6 pt-12" style={{ containerType: "size" }}>
      <div
        role="radiogroup"
        aria-label="Payment method"
        className="relative grid w-full grid-cols-4 rounded-[12px] bg-paper-2 p-1.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]"
        style={{ maxWidth: "min(400px, 92cqw)" }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") pick((i + 1) % 4);
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp") pick((i + 3) % 4);
          else return;
          e.preventDefault();
        }}
      >
        <span
          aria-hidden
          className="absolute bottom-1.5 top-1.5 rounded-[8px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.3),0_8px_20px_-10px_rgb(0_0_0/0.6),inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_55%,transparent)] transition-transform duration-700 will-change-transform"
          style={{ left: 6, width: "calc((100% - 12px) / 4)", transform: `translateX(${i * 100}%)`, transitionTimingFunction: EASE }}
        />
        {METHODS.map((m, n) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={i === n}
            tabIndex={i === n ? 0 : -1}
            onClick={() => pick(n)}
            className={`relative z-10 flex flex-col items-center justify-center gap-1.5 rounded-[8px] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand/50 ${i === n ? "text-ink [&_svg]:text-brand" : "text-mute hover:text-ink-2"}`}
            style={{ height: "clamp(58px, 24cqh, 84px)" }}
          >
            <span className="h-6 w-6">{m.icon}</span>
            <span className="text-[12.5px] font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      {/* All four lines share one cell and cross-fade, so the old one leaves while the new one arrives. */}
      <div className="grid h-11 place-items-center text-[14px]" aria-live="polite">
        {detail.map((d, n) => (
          <span
            key={n}
            aria-hidden={i !== n}
            className="col-start-1 row-start-1 transition-[transform,opacity] duration-500 motion-reduce:transition-none"
            style={{
              opacity: i === n ? 1 : 0,
              transform: i === n ? "none" : `translateY(${n < i ? -30 : 30}%)`,
              transitionTimingFunction: EASE,
              transitionDelay: i === n ? "120ms" : "0ms",
            }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
