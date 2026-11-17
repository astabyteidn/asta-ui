"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";

const CartIcon = ({ className = "h-[18px] w-[18px]" }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2.5 3h2l2 9.5h8.5l1.8-6.5H6" />
    <circle cx="8" cy="16" r="1.1" />
    <circle cx="14.5" cy="16" r="1.1" />
  </svg>
);

/** One focused moment: a dot arcs into the cart, the badge pops and the button becomes a stepper. Loops until you take over. */
export interface AddToCartProps {
  /** Product photo. Defaults to a neutral Unsplash photo hosted on ui.astabyte.com. */
  image?: string;
  imageAlt?: string;
  name?: string;
  meta?: string;
  price?: string;
}

export default function AddToCart({
  image = "https://ui.astabyte.com/lab/headphones.jpg",
  imageAlt = "",
  name = "Studio headphones",
  meta = "Audio · Graphite",
  price = "$189.00",
}: AddToCartProps = {}) {
  const [count, setCount] = useState(0);
  const [pressed, setPressed] = useState(false);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const from = useRef<HTMLDivElement>(null);
  const cart = useRef<HTMLDivElement>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const badge = useRef<HTMLSpanElement>(null);

  // Catch: the cart squashes under the dot and settles; the badge springs.
  const bump = () => {
    cart.current?.animate(
      [
        { transform: "scale(1, 1)" },
        { transform: "scale(1.12, 0.88)", offset: 0.22 },
        { transform: "scale(0.95, 1.05)", offset: 0.5 },
        { transform: "scale(1.02, 0.99)", offset: 0.75 },
        { transform: "scale(1, 1)" },
      ],
      { duration: 680, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    badge.current?.animate(
      [{ transform: "scale(0.5)" }, { transform: "scale(1.22)", offset: 0.4 }, { transform: "scale(0.94)", offset: 0.7 }, { transform: "scale(1)" }],
      { duration: 620, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  };

  /** Arc a small accent dot from the button into the cart, then count it. */
  const fly = (then: () => void) => {
    const box = root.current;
    const a = from.current?.getBoundingClientRect();
    const c = cart.current?.getBoundingClientRect();
    if (!box || !a || !c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      then();
      bump();
      return;
    }
    const b = box.getBoundingClientRect();
    const dot = document.createElement("span");
    const x0 = a.left + a.width / 2 - b.left;
    const y0 = a.top + a.height / 2 - b.top;
    Object.assign(dot.style, {
      position: "absolute",
      left: `${x0 - 6}px`,
      top: `${y0 - 6}px`,
      width: "12px",
      height: "12px",
      borderRadius: "999px",
      background: "var(--color-brand)",
      boxShadow: "0 0 0 4px color-mix(in srgb, var(--color-brand) 22%, transparent)",
      pointerEvents: "none",
      zIndex: "20",
    });
    box.appendChild(dot);
    const dx = c.left + c.width / 2 - b.left - x0;
    const dy = c.top + c.height / 2 - b.top - y0;
    const lift = Math.min(110, Math.abs(dy) * 0.6 + 40);
    // Quadratic bezier from the button to the cart, sampled with an ease-in-out t so the dot
    // leaves gently, speeds through the arc and slows as it lands.
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const cx = dx * 0.35;
    const cy = Math.min(0, dy) - lift;
    const frames: Keyframe[] = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const t = ease(i / N);
      const x = 2 * (1 - t) * t * cx + t * t * dx;
      const y = 2 * (1 - t) * t * cy + t * t * dy;
      frames.push({ transform: `translate(${x}px, ${y}px) scale(${1 - 0.5 * t})`, opacity: t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2 });
    }
    dot.style.willChange = "transform, opacity";
    const anim = dot.animate(frames, { duration: 760, easing: "linear" });
    anim.onfinish = () => {
      dot.remove();
      then();
      bump();
    };
  };

  const add = () => fly(() => setCount((c) => c + 1));

  const takeOver = () => {
    setPaused(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 8000);
  };
  useEffect(() => () => void (idle.current && clearTimeout(idle.current)), []);

  // Demo loop: press, fly, add one more, reset.
  useEffect(() => {
    if (paused) return;
    const t: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const run = () => {
      t.push(setTimeout(() => setPressed(true), 1100));
      t.push(
        setTimeout(() => {
          setPressed(false);
          if (alive) add();
        }, 1280),
      );
      t.push(setTimeout(() => alive && add(), 3200));
      t.push(setTimeout(() => setCount(0), 5600));
      t.push(setTimeout(() => alive && run(), 6400));
    };
    t.push(setTimeout(() => alive && setCount(0), 0));
    run();
    return () => {
      alive = false;
      t.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const on = count > 0;

  return (
    <div ref={root} className="relative h-full w-full overflow-hidden" style={{ containerType: "size" }}>
      <style>{`
        @keyframes lab-atc-roll { from { transform: translateY(70%); opacity: 0; filter: blur(2px) } to { transform: none; opacity: 1; filter: none } }
        @media (prefers-reduced-motion: reduce) { .lab-atc-anim { animation: none !important } }
      `}</style>

      {/* Cart */}
      <div
        ref={cart}
        className={`absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-[9px] bg-paper-2 text-ink-2 ${RING}`}
        aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
        role="status"
      >
        <CartIcon />
        <span
          ref={badge}
          aria-hidden
          className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10.5px] font-semibold tabular-nums text-paper transition-[opacity,scale] duration-500 motion-reduce:transition-none"
          style={{ transitionTimingFunction: EASE, opacity: on ? 1 : 0, scale: on ? "1" : "0.4" }}
        >
          {Math.max(count, 1)}
        </span>
      </div>

      <div className="flex h-full w-full items-center justify-center px-5 pt-10">
        <div className="flex w-full max-w-[460px] items-center gap-[5cqw]">
          {/* Product tile */}
          <div className={`relative shrink-0 overflow-hidden rounded-[12px] bg-[#f4f4f4] ${RING}`} style={{ width: "min(38cqw, 62cqh)", aspectRatio: "1" }}>
            {/* Photo: Unsplash (free licence), self-hosted. */}
            <img src={image} alt={imageAlt} width={480} height={480} loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover grayscale" />
            <span className="absolute bottom-2.5 left-3 font-mono text-[10px] uppercase tracking-wider text-black/45">Nº 04</span>
          </div>

          {/* Details + action */}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-mute">{meta}</span>
            <span className="mt-1.5 truncate text-[clamp(15px,4.4cqw,22px)] font-medium tracking-[-0.02em] text-ink">{name}</span>
            <span className="mt-0.5 text-[clamp(13px,3.4cqw,16px)] tabular-nums text-ink-2">{price}</span>

            <div ref={from} className="relative mt-[max(14px,5cqh)] h-10 w-full max-w-[220px]">
              <button
                type="button"
                onClick={() => {
                  takeOver();
                  add();
                }}
                tabIndex={on ? -1 : 0}
                aria-hidden={on}
                className={`absolute inset-0 flex items-center justify-center gap-2 rounded-[9px] bg-ink text-[13.5px] font-medium text-paper outline-none transition-[opacity,transform] duration-[600ms] focus-visible:ring-2 focus-visible:ring-brand/60 ${
                  on ? "pointer-events-none scale-[0.92] opacity-0" : pressed ? "scale-[0.96]" : ""
                }`}
                style={{ transitionTimingFunction: EASE }}
              >
                Add to cart
              </button>
              <div
                className={`absolute inset-0 flex items-center justify-between rounded-[9px] bg-paper-2 px-1 transition-[opacity,transform] duration-[600ms] ${RING} ${on ? "" : "pointer-events-none scale-[1.06] opacity-0"}`}
                style={{ transitionTimingFunction: EASE }}
                aria-hidden={!on}
              >
                <button
                  type="button"
                  tabIndex={on ? 0 : -1}
                  aria-label="Remove one"
                  onClick={() => {
                    takeOver();
                    setCount((c) => Math.max(0, c - 1));
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[17px] text-ink-2 outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  −
                </button>
                <span className="relative h-5 overflow-hidden text-[13.5px] font-medium tabular-nums text-ink">
                  <span key={count} className="lab-atc-anim block" style={{ animation: `lab-atc-roll .55s ${EASE}` }}>
                    {count} in cart
                  </span>
                </span>
                <button
                  type="button"
                  tabIndex={on ? 0 : -1}
                  aria-label="Add one"
                  onClick={() => {
                    takeOver();
                    add();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[17px] text-ink-2 outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
