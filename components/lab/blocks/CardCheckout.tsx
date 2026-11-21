"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const DEMO = { number: "4242424242424242", name: "ALEX MORGAN", exp: "1229", cvc: "123" };
const INK = "#111113";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Line-art doodles for the card face, drawn on a 32×32 grid. x/y are % of the card, s is the size in card units (card = 100×63). */
const DOODLES: { d: string; x: number; y: number; s: number; r: number }[] = [
  { d: "M9 22h14a5 5 0 0 0 .6-9.96A7 7 0 0 0 10.2 13 4.5 4.5 0 0 0 9 22Z M14 17l2 2 3-4", x: 33, y: 3, s: 15, r: -6 }, // cloud
  { d: "M16 4c1 6 3 8 9 9-6 1-8 3-9 9-1-6-3-8-9-9 6-1 8-3 9-9Z M26 22c.4 2 1 2.6 3 3-2 .4-2.6 1-3 3-.4-2-1-2.6-3-3 2-.4 2.6-1 3-3Z", x: 8, y: 5, s: 12, r: 0 }, // sparkle
  { d: "M16 9a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z M4 20c3 2 21-5 24-10 1-2-2-2.4-5-1.6 M8 23.6c-3 .8-5 .4-4-1.6", x: 79, y: 17, s: 15, r: 8 }, // planet
  { d: "M16 26S5 19.5 5 12.5A5.5 5.5 0 0 1 16 10a5.5 5.5 0 0 1 11 2.5C27 19.5 16 26 16 26Z M10 13c1.5-2 4-2 6 0", x: 62, y: 27, s: 11, r: -10 }, // heart
  { d: "M18 3 8 18h7l-2 11 11-16h-7l1-10Z", x: 86, y: 36, s: 9, r: 10 }, // bolt
  { d: "M16 16a2 2 0 1 1 2-2 4 4 0 1 1-4-4 6 6 0 1 1-6 6 8 8 0 1 1 8 8", x: 30, y: 24, s: 10, r: 0 }, // swirl
  { d: "M4 17c6-7 18-7 24 0-6 7-18 7-24 0Z M16 13.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z M9 11 7.5 8.5 M16 9.5V6.5 M23 11l1.5-2.5", x: 53, y: 3, s: 12, r: 6 }, // eye
];

/**
 * A two-card stack: an illustrated card that fills in as you type, with the back of the card behind it.
 * For the CVC the front card slides aside and the back comes forward. The stack leans toward the pointer.
 */
export default function CardCheckout() {
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [back, setBack] = useState(false);
  const [user, setUser] = useState(false);
  const [fade, setFade] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const input = useRef<HTMLInputElement>(null);

  // Demo loop: number, name and expiry, slide to the back for the CVC, slide back, clear, repeat.
  useEffect(() => {
    if (user) return;
    let dead = false;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = async () => {
      await sleep(300);
      if (still) {
        if (dead) return;
        setNum(DEMO.number);
        setName(DEMO.name);
        setExp(DEMO.exp);
        return;
      }
      let first = true;
      while (!dead) {
        if (!first) {
          setFade(true);
          await sleep(420);
          if (dead) return;
        }
        first = false;
        setNum("");
        setName("");
        setExp("");
        setCvc("");
        setFade(false);
        await sleep(600);
        for (let i = 1; i <= 16 && !dead; i++) {
          setNum(DEMO.number.slice(0, i));
          await sleep(i % 4 === 0 ? 190 : 85);
        }
        for (let i = 1; i <= DEMO.name.length && !dead; i++) {
          setName(DEMO.name.slice(0, i));
          await sleep(55);
        }
        await sleep(150);
        for (let i = 1; i <= 4 && !dead; i++) {
          setExp(DEMO.exp.slice(0, i));
          await sleep(110);
        }
        await sleep(700);
        if (dead) return;
        setBack(true);
        await sleep(750);
        for (let i = 1; i <= 3 && !dead; i++) {
          setCvc(DEMO.cvc.slice(0, i));
          await sleep(160);
        }
        await sleep(1000);
        if (dead) return;
        setBack(false);
        await sleep(2600);
      }
    };
    run();
    return () => {
      dead = true;
    };
  }, [user]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ x: (0.5 - py) * 12, y: (px - 0.5) * 16 });
  };

  const groups = [0, 1, 2, 3].map((g) => (
    <span key={g} className="flex gap-[0.08em]">
      {[0, 1, 2, 3].map((k) => {
        const i = g * 4 + k;
        const ch = num[i];
        return (
          <span key={`${i}-${ch ?? "_"}`} className={`inline-block w-[0.6em] text-center ${ch ? "lab-cc-in" : "opacity-25"}`}>
            {ch ?? "•"}
          </span>
        );
      })}
    </span>
  ));

  const shadow =
    "inset 0 1px 0 rgb(255 255 255 / .9), 0 0 0 1px rgb(0 0 0 / .06), 0 28px 50px -24px rgb(0 0 0 / .7), 0 8px 18px -10px rgb(0 0 0 / .4)";
  const move = (t: string) => ({ transform: t, transition: `transform .8s ${EASE}` });
  const ghost = "text-black/25";

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 pb-5 pt-12"
      style={{ containerType: "size" }}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <style href="asta-cardcheckout" precedence="asta">{`
        @keyframes lab-cc-in { from { transform: translateY(-40%); opacity: 0 } to { transform: none; opacity: 1 } }
        .lab-cc-in { animation: lab-cc-in .35s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-cc-in { animation: none } }
      `}</style>

      <button
        type="button"
        aria-label="Payment card. Click to type a card number"
        onClick={() => input.current?.focus()}
        className="relative shrink-0 cursor-text outline-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-brand/60"
        style={{ width: "min(64cqw, 330px, calc((100cqh - 90px) * 1.25))", aspectRatio: "1.586" }}
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: "preserve-3d", transition: `transform .7s ${EASE}` }}
        >
          {/* Back of the card, peeking out behind */}
          <div className="absolute inset-0 will-change-transform" style={move(back ? "translate(3%, -3%) rotate(-3deg) scale(1.04)" : "translate(15%, -11%) rotate(-7deg)")}>
            <div
              className="absolute inset-0 overflow-hidden rounded-[6%/9.5%] text-left"
              style={{ containerType: "inline-size", background: "linear-gradient(160deg, #f5f5f3, #e6e6e3)", boxShadow: shadow, color: INK }}
            >
              <div className="absolute inset-x-0 top-[11%] h-[18%] bg-[#b9b9b6]" />
              <svg viewBox="0 0 24 24" className="absolute right-[8%] top-[38%] h-[7cqw] w-[7cqw] opacity-50" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <path d="M8.5 7.5a6 6 0 0 1 0 9M12 5a9.5 9.5 0 0 1 0 14M5 10a2.5 2.5 0 0 1 0 4" />
              </svg>
              <div className="absolute left-[8%] top-[40%] flex items-center gap-[2.5cqw]">
                <div className="h-[9cqw] w-[38cqw] rounded-[1cqw] bg-[repeating-linear-gradient(90deg,rgb(0_0_0/0.07)_0_5px,rgb(0_0_0/0.03)_5px_10px)]" />
                <div className="grid h-[9cqw] w-[16cqw] place-items-center rounded-[1cqw] bg-white font-mono text-[4.6cqw] tabular-nums shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
                  <span className="flex">
                    {[0, 1, 2].map((i) => (
                      <span key={`${i}-${cvc[i] ?? "_"}`} className={cvc[i] ? "lab-cc-in" : "opacity-25"}>
                        {cvc[i] ?? "•"}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
              <div className="absolute left-[8%] top-[60%] text-[2.6cqw] uppercase tracking-[0.14em] opacity-50">CVC</div>
              <div className="absolute bottom-[9%] right-[8%] text-right leading-none">
                <div className="text-[3.4cqw] tracking-[0.08em] opacity-55">DEBIT</div>
                <div className="mt-[1.4cqw] text-[7cqw] font-semibold italic tracking-[-0.04em]">northpay</div>
              </div>
            </div>
          </div>

          {/* Front: the illustrated card */}
          <div className="absolute inset-0 will-change-transform" style={move(back ? "translate(-28%, 24%) rotate(-13deg)" : "translate(-4%, 6%) rotate(-6deg)")}>
            <div
              className="absolute inset-0 overflow-hidden rounded-[6%/9.5%] text-left"
              style={{ containerType: "inline-size", background: "linear-gradient(165deg, #ffffff, #f2f2f0)", boxShadow: shadow, color: INK }}
            >
              <svg viewBox="0 0 100 63" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {DOODLES.map((o, i) => (
                  <g key={i} transform={`translate(${o.x} ${(o.y * 63) / 100}) rotate(${o.r} ${o.s / 2} ${o.s / 2}) scale(${o.s / 32})`}>
                    <path d={o.d} strokeWidth={0.5 * (32 / o.s)} />
                  </g>
                ))}
              </svg>
              <div className="absolute right-[7%] top-[7%] text-[3.6cqw] tracking-[0.04em] text-black/55">Astabyte</div>
              <div className="absolute left-[8%] top-[34%] h-[11cqw] w-[15cqw] rounded-[2cqw] bg-gradient-to-br from-[#ececea] to-[#cdcdc9] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]">
                <span className="absolute inset-x-[32%] inset-y-0 border-x border-black/15" />
                <span className="absolute inset-x-0 top-1/2 border-t border-black/15" />
              </div>
              <div
                style={{ opacity: fade ? 0 : 1, transition: `opacity .4s ${EASE}` }}
                className="absolute left-[8%] top-[56%] flex gap-[0.45em] font-mono text-[5.4cqw] tabular-nums tracking-tight"
              >
                {groups}
              </div>
              <div
                style={{ opacity: fade ? 0 : 1, transition: `opacity .4s ${EASE}` }}
                className="absolute bottom-[8%] left-[8%] right-[7%] flex items-end justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-[2.4cqw] uppercase tracking-[0.14em] text-black/45">Card holder</div>
                  <div className="truncate text-[3.8cqw] font-medium uppercase tracking-wide">{name || <span className={ghost}>Your name</span>}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[2.4cqw] uppercase tracking-[0.14em] text-black/45">Expires</div>
                  <div className="font-mono text-[3.8cqw] tabular-nums">
                    <span className={exp[0] ? "" : ghost}>{exp[0] ?? "M"}</span>
                    <span className={exp[1] ? "" : ghost}>{exp[1] ?? "M"}</span>
                    <span className="text-black/40">/</span>
                    <span className={exp[2] ? "" : ghost}>{exp[2] ?? "Y"}</span>
                    <span className={exp[3] ? "" : ghost}>{exp[3] ?? "Y"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>

      <input
        ref={input}
        name="cardNumber"
        inputMode="numeric"
        autoComplete="cc-number"
        aria-label="Card number"
        className="sr-only text-[16px]"
        value={num}
        onFocus={() => {
          setUser(true);
          setFade(false);
          setBack(false);
          setNum("");
          setName("");
          setExp("");
          setCvc("");
        }}
        onBlur={() => setUser(false)}
        onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 16))}
      />
      <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-mute">{user ? "Type a card number" : "Click the card to type"}</span>
    </div>
  );
}
