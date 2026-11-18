"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.22,1,.36,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const HEART = "M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z";

// Monochrome line art, so the products stay in the palette.
const ITEMS = [
  { name: "Arc floor lamp", price: "$148", art: "M8 21h8M12 21V9M7.5 3.5h9L14 9h-4ZM12 9v0" },
  { name: "Clay vase", price: "$38", art: "M9.5 3h5M10.5 3v3.2C7.8 8 6.5 10.6 6.5 13.5a5.5 5.5 0 0 0 11 0c0-2.9-1.3-5.5-4-7.3V3M7 13h10" },
  { name: "Oak stool", price: "$96", art: "M5 7.5h14v2.5H5ZM7 10l-1.5 11M17 10l1.5 11M8.6 15.5h6.8M12 10v5.5" },
  { name: "Linen throw", price: "$64", art: "M5 4.5h14v11H5ZM5 15.5c0 2.2 1.8 4 4 4h10v-4M8 8h8M8 11.5h8" },
];
const VISIBLE = 3;
/** Idle tour: save three, then remove them in a different order, so the loop ends where it began. */
const DEMO = [0, 2, 1, 2, 0, 1];
const BURST = [0, 45, 90, 135, 180, 225, 270, 315];

const Heart = ({ filled, className = "" }: { filled?: boolean; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
    <path d={HEART} />
  </svg>
);

/** One focused moment: the heart bursts and the item flies into Saved, whose badge pops. Tap again and it flies back. */
export default function Wishlist() {
  const [saved, setSaved] = useState<boolean[]>(() => ITEMS.map(() => false));
  const [count, setCount] = useState(0);
  const [burst, setBurst] = useState<number[]>(() => ITEMS.map(() => 0));
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLSpanElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  const hearts = useRef<(HTMLButtonElement | null)[]>([]);
  const state = useRef<boolean[]>(ITEMS.map(() => false));
  const busy = useRef<Set<number>>(new Set());
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pop = () => {
    if (still()) return;
    tray.current?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.14, .9)", offset: 0.25 }, { transform: "scale(.96, 1.04)", offset: 0.55 }, { transform: "scale(1)" }],
      { duration: 600, easing: SPRING },
    );
    badge.current?.animate([{ transform: "scale(.5)" }, { transform: "scale(1.25)", offset: 0.4 }, { transform: "scale(.94)", offset: 0.7 }, { transform: "scale(1)" }], {
      duration: 600,
      easing: SPRING,
    });
  };

  /** Arc a small filled heart between a tile and the tray. */
  const fly = (i: number, toTray: boolean, then: () => void) => {
    const box = root.current?.getBoundingClientRect();
    const h = hearts.current[i]?.getBoundingClientRect();
    const t = tray.current?.getBoundingClientRect();
    if (!root.current || !box || !h || !t || still()) {
      then();
      return;
    }
    const a = toTray ? h : t;
    const b = toTray ? t : h;
    const x0 = a.left + a.width / 2 - box.left;
    const y0 = a.top + a.height / 2 - box.top;
    const dx = b.left + b.width / 2 - box.left - x0;
    const dy = b.top + b.height / 2 - box.top - y0;
    const el = document.createElement("span");
    el.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="${HEART}"/></svg>`;
    Object.assign(el.style, {
      position: "absolute",
      left: `${x0 - 8}px`,
      top: `${y0 - 8}px`,
      width: "16px",
      height: "16px",
      color: "var(--color-brand)",
      pointerEvents: "none",
      zIndex: "20",
      willChange: "transform, opacity",
    });
    root.current.appendChild(el);
    // Quadratic arc that bows sideways and up, sampled with an ease-in-out t.
    const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const cx = dx * 0.25 - 24;
    const cy = Math.min(0, dy) - 36;
    const frames: Keyframe[] = [];
    for (let n = 0; n <= 36; n++) {
      const k = ease(n / 36);
      const x = 2 * (1 - k) * k * cx + k * k * dx;
      const y = 2 * (1 - k) * k * cy + k * k * dy;
      const s = toTray ? 1 - 0.35 * k : 0.65 + 0.35 * k;
      frames.push({ transform: `translate(${x}px, ${y}px) scale(${s})`, opacity: toTray ? (k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15) : k < 0.15 ? k / 0.15 : 1 });
    }
    const anim = el.animate(frames, { duration: toTray ? 680 : 560, easing: "linear" });
    anim.onfinish = () => {
      el.remove();
      then();
    };
  };

  const toggle = (i: number) => {
    if (busy.current.has(i)) return;
    busy.current.add(i);
    const on = !state.current[i];
    state.current[i] = on;
    const set = (v: boolean) => setSaved((s) => s.map((x, j) => (j === i ? v : x)));
    if (on) {
      // Fill + burst right away, count it when the heart lands.
      set(true);
      setBurst((b) => b.map((x, j) => (j === i ? x + 1 : x)));
      fly(i, true, () => {
        setCount((c) => c + 1);
        pop();
        busy.current.delete(i);
      });
    } else {
      // Reverse: the tray gives it back, the heart empties when it arrives.
      setCount((c) => Math.max(0, c - 1));
      pop();
      fly(i, false, () => {
        set(false);
        busy.current.delete(i);
      });
    }
  };

  const takeOver = () => {
    setPaused(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  // Demo loop: walk the tour, picking up from whatever is saved right now.
  useEffect(() => {
    if (paused || still()) return;
    let n = 0;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      // Skip steps that would double-save, so the tour can resume after you played with it.
      let guard = 0;
      while (guard++ < DEMO.length) {
        const i = DEMO[n % DEMO.length];
        const wantOn = DEMO.slice(0, (n % DEMO.length) + 1).filter((x) => x === i).length % 2 === 1;
        n++;
        if (state.current[i] !== wantOn) {
          toggle(i);
          break;
        }
      }
      id = setTimeout(tick, 1600);
    };
    id = setTimeout(tick, 1100);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const on = count > 0;

  return (
    <div ref={root} className="relative h-full w-full overflow-hidden" style={{ containerType: "size" }}>
      <style href="asta-wishlist" precedence="asta">{`
        .lab-wl-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: min(3cqw, 14px) }
        .lab-wl-4 { display: none }
        @container (min-width: 600px) { .lab-wl-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) } .lab-wl-4 { display: flex } }
        @keyframes lab-wl-heart { 0% { transform: scale(.55) } 45% { transform: scale(1.3) } 70% { transform: scale(.92) } 100% { transform: scale(1) } }
        @keyframes lab-wl-ring { from { transform: scale(.4); opacity: .7 } to { transform: scale(1.9); opacity: 0 } }
        @keyframes lab-wl-spark { 0% { transform: rotate(var(--a)) translateY(0) scale(1); opacity: 1 } 100% { transform: rotate(var(--a)) translateY(-17px) scale(.3); opacity: 0 } }
        .lab-wl-heart { animation: lab-wl-heart .6s ${SPRING} both }
        .lab-wl-ring { animation: lab-wl-ring .6s ${EASE} both }
        .lab-wl-spark { animation: lab-wl-spark .6s ${EASE} .05s both }
        @media (prefers-reduced-motion: reduce) { .lab-wl-heart, .lab-wl-ring, .lab-wl-spark { animation: none; opacity: 0 } .lab-wl-heart { opacity: 1 } }
      `}</style>

      <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11">
        <div className="flex w-full max-w-[560px] flex-col gap-[max(10px,4cqh)]">
          {/* Header + Saved tray */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-mute">New in · Home</span>
              <span className="mt-1 block truncate text-[clamp(15px,4.6cqmin,20px)] font-medium tracking-[-0.02em] text-ink">Living room</span>
            </div>
            <span
              ref={tray}
              role="status"
              aria-label={`Saved, ${count} item${count === 1 ? "" : "s"}`}
              className={`relative flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] bg-paper px-3 text-[13px] font-medium text-ink ${RING}`}
            >
              <Heart filled={on} className={`h-4 w-4 transition-colors duration-500 ${on ? "text-brand" : "text-ink-2"}`} />
              Saved
              <span
                ref={badge}
                aria-hidden
                className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10.5px] font-semibold tabular-nums text-paper transition-[opacity,scale] duration-500 motion-reduce:transition-none"
                style={{ transitionTimingFunction: EASE, opacity: on ? 1 : 0, scale: on ? "1" : "0.4" }}
              >
                {Math.max(count, 1)}
              </span>
            </span>
          </div>

          {/* Product grid */}
          <div className="lab-wl-grid">
            {ITEMS.map((it, i) => (
              <div key={it.name} className={`min-w-0 flex-col ${i >= VISIBLE ? "lab-wl-4" : "flex"}`}>
                <div className={`relative w-full overflow-hidden rounded-[11px] bg-paper ${RING}`} style={{ aspectRatio: "1 / 1.05", maxHeight: "44cqh" }}>
                  <svg viewBox="0 0 24 24" className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 text-ink-2" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={it.art} />
                  </svg>
                  <button
                    ref={(el) => {
                      hearts.current[i] = el;
                    }}
                    type="button"
                    aria-pressed={saved[i]}
                    aria-label={`${saved[i] ? "Remove" : "Save"} ${it.name}`}
                    onClick={() => {
                      takeOver();
                      toggle(i);
                    }}
                    className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full outline-none transition-transform duration-200 active:scale-90 focus-visible:ring-2 focus-visible:ring-brand/60"
                  >
                    {burst[i] > 0 && saved[i] && (
                      <span key={`b${burst[i]}`} aria-hidden className="pointer-events-none absolute inset-0">
                        <span className="lab-wl-ring absolute inset-[5px] rounded-full" style={{ boxShadow: "0 0 0 1.5px var(--color-brand)" }} />
                        {BURST.map((a) => (
                          <span key={a} className="absolute left-1/2 top-1/2 -ml-[2px] -mt-[2px] h-1 w-1">
                            <span className="lab-wl-spark block h-1 w-1 rounded-full bg-brand" style={{ ["--a" as string]: `${a}deg` }} />
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="relative h-[18px] w-[18px]">
                      <Heart className="absolute inset-0 h-full w-full text-ink-2" />
                      <span
                        className="absolute inset-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none"
                        style={{ opacity: saved[i] ? 1 : 0, transform: saved[i] ? "none" : "scale(.5)", transitionTimingFunction: EASE }}
                      >
                        <span key={`h${burst[i]}`} className={`block h-full w-full text-brand ${burst[i] > 0 ? "lab-wl-heart" : ""}`}>
                          <Heart filled className="h-full w-full" />
                        </span>
                      </span>
                    </span>
                  </button>
                </div>
                <span className="mt-2 truncate text-[clamp(11.5px,3.4cqmin,13.5px)] font-medium text-ink">{it.name}</span>
                <span className="text-[clamp(11px,3.1cqmin,12.5px)] tabular-nums text-mute">{it.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
