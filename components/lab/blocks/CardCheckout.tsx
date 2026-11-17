"use client";

import { useEffect, useRef, useState } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
// A flip that settles with a hint of overshoot.
const FLIP = "cubic-bezier(.3,1.25,.45,1)";
const DEMO = { number: "4242424242424242", name: "ALEX MORGAN", exp: "1229", cvc: "123" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A payment card that fills itself in, flips for the CVC and leans toward the pointer. Click it to type your own number. */
export default function CardCheckout() {
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [back, setBack] = useState(false);
  const [user, setUser] = useState(false);
  const [fade, setFade] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 30, gy: 20 });
  const input = useRef<HTMLInputElement>(null);

  // The demo loop: type the number, name and expiry, flip for the CVC, flip back, clear, repeat.
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
        // Cross-fade the old details out instead of clearing them in one frame.
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
        await sleep(600);
        if (dead) return;
        setBack(true);
        await sleep(850);
        for (let i = 1; i <= 3 && !dead; i++) {
          setCvc(DEMO.cvc.slice(0, i));
          await sleep(160);
        }
        await sleep(900);
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
    setTilt({ x: (0.5 - py) * 14, y: (px - 0.5) * 18, gx: px * 100, gy: py * 100 });
  };

  const groups = [0, 1, 2, 3].map((g) => (
    <span key={g} className="flex gap-[0.12em]">
      {[0, 1, 2, 3].map((k) => {
        const i = g * 4 + k;
        const ch = num[i];
        return (
          <span key={`${i}-${ch ?? "_"}`} className={`inline-block w-[0.62em] text-center ${ch ? "lab-cc-in" : "opacity-35"}`}>
            {ch ?? "•"}
          </span>
        );
      })}
    </span>
  ));

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 pb-5 pt-12"
      style={{ containerType: "size" }}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0, gx: 30, gy: 20 })}
    >
      <style>{`
        @keyframes lab-cc-in { from { transform: translateY(-40%); opacity: 0; filter: blur(2px) } to { transform: none; opacity: 1; filter: none } }
        .lab-cc-in { animation: lab-cc-in .35s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-cc-in { animation: none } }
      `}</style>

      <button
        type="button"
        aria-label="Payment card. Click to type a card number"
        onClick={() => input.current?.focus()}
        className="relative shrink-0 cursor-text rounded-[5%/8%] outline-none [perspective:1100px] focus-visible:ring-2 focus-visible:ring-accent/60"
        style={{ width: "min(78cqw, 360px, calc((100cqh - 40px) * 1.586))", aspectRatio: "1.586" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-700 will-change-transform"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: "preserve-3d", transitionTimingFunction: EASE }}
        >
          <div
            className="absolute inset-0 transition-transform duration-[850ms]"
            style={{ transform: `rotateY(${back ? 180 : 0}deg)`, transformStyle: "preserve-3d", transitionTimingFunction: FLIP }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[5%/8%] text-left text-white [backface-visibility:hidden]"
              style={{
                containerType: "inline-size",
                background:
                  "radial-gradient(110% 80% at 100% 0%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 62%), linear-gradient(150deg, #1c1c1e, #0b0b0c 75%)",
                boxShadow: "0 30px 60px -28px rgb(0 0 0 / .8), inset 0 0 0 1px rgb(255 255 255 / .1)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 transition-[background] duration-700"
                style={{ background: `radial-gradient(60% 60% at ${tilt.gx}% ${tilt.gy}%, rgb(255 255 255 / .07), transparent 70%)` }}
              />
              <div className="absolute left-[7%] top-[9%] flex items-center gap-[2cqw] text-[4.4cqw] font-medium tracking-tight">
                <span className="grid h-[6cqw] w-[6cqw] place-items-center rounded-[1.4cqw] bg-white/90 text-[3.4cqw] font-semibold text-black">N</span>
                Northwind
              </div>
              <svg viewBox="0 0 24 24" className="absolute right-[7%] top-[9%] h-[7cqw] w-[7cqw] opacity-70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <path d="M8.5 7.5a6 6 0 0 1 0 9M12 5a9.5 9.5 0 0 1 0 14M5 10a2.5 2.5 0 0 1 0 4" />
              </svg>
              <div className="absolute left-[7%] top-[28%] h-[13cqw] w-[18cqw] rounded-[2cqw] bg-white/[0.06] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.28)]">
                <span className="absolute inset-x-[30%] inset-y-0 border-x border-white/20" />
                <span className="absolute inset-x-0 top-1/2 border-t border-white/20" />
              </div>
              <div style={{ opacity: fade ? 0 : 1, transition: `opacity .4s ${EASE}` }} className="absolute left-[7%] top-[53%] flex gap-[0.5em] font-mono text-[6.2cqw] tabular-nums tracking-tight">{groups}</div>
              <div style={{ opacity: fade ? 0 : 1, transition: `opacity .4s ${EASE}` }} className="absolute bottom-[9%] left-[7%] right-[7%] flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[2.6cqw] uppercase tracking-[0.14em] opacity-55">Card holder</div>
                  <div className="truncate text-[4.2cqw] font-medium uppercase tracking-wide">{name || <span className="opacity-35">Your name</span>}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[2.6cqw] uppercase tracking-[0.14em] opacity-55">Expires</div>
                  <div className="font-mono text-[4.2cqw] tabular-nums">
                    <span className={exp[0] ? "" : "opacity-35"}>{exp[0] ?? "M"}</span>
                    <span className={exp[1] ? "" : "opacity-35"}>{exp[1] ?? "M"}</span>
                    <span className="opacity-55">/</span>
                    <span className={exp[2] ? "" : "opacity-35"}>{exp[2] ?? "Y"}</span>
                    <span className={exp[3] ? "" : "opacity-35"}>{exp[3] ?? "Y"}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[5%/8%] text-white [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{
                containerType: "inline-size",
                background: "linear-gradient(150deg, #19191b, #0b0b0c 75%)",
                boxShadow: "0 30px 60px -28px rgb(0 0 0 / .8), inset 0 0 0 1px rgb(255 255 255 / .1)",
              }}
            >
              <div className="absolute inset-x-0 top-[13%] h-[19%] bg-black/80" />
              <div className="absolute left-[7%] right-[7%] top-[44%] flex items-center gap-[3cqw]">
                <div className="h-[10cqw] flex-1 rounded-[1cqw] bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.12)_0_6px,rgb(255_255_255/0.06)_6px_12px)]" />
                <div className="grid h-[10cqw] w-[18cqw] place-items-center rounded-[1cqw] bg-white font-mono text-[5cqw] tabular-nums text-black">
                  <span className="flex">
                    {[0, 1, 2].map((i) => (
                      <span key={`${i}-${cvc[i] ?? "_"}`} className={cvc[i] ? "lab-cc-in" : "opacity-30"}>
                        {cvc[i] ?? "•"}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-[10%] left-[7%] text-[2.6cqw] uppercase tracking-[0.14em] opacity-50">CVC · 3 digits on the back</div>
            </div>
          </div>
        </div>
      </button>

      <input
        ref={input}
        inputMode="numeric"
        autoComplete="off"
        aria-label="Card number"
        className="sr-only"
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
      <span className="label shrink-0 text-mute">{user ? "Type a card number" : "Click the card to type"}</span>
    </div>
  );
}
