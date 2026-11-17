"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";
const WORDS = ["ASTABYTE", "LAB-2026", "SHIPPING", "JAKARTA ", "ON TIME "];

/** A departure board: each flap steps through the alphabet until it lands. */
export default function SplitFlap() {
  const [cells, setCells] = useState(WORDS[0].split(""));
  const word = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const go = () => {
    word.current = (word.current + 1) % WORDS.length;
    const target = WORDS[word.current].split("");
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCells((cur) => {
        let moving = false;
        const next = cur.map((c, i) => {
          if (c === target[i]) return c;
          moving = true;
          return CHARS[(CHARS.indexOf(c) + 1) % CHARS.length];
        });
        if (!moving) clearInterval(timer.current);
        return next;
      });
    }, 45);
  };

  useEffect(() => {
    const auto = setInterval(go, 4200);
    return () => {
      clearInterval(auto);
      clearInterval(timer.current);
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-4">
      <button type="button" onClick={go} aria-label="Next word" className="flex gap-[3px] [perspective:400px]">
        {cells.map((c, i) => (
          <span key={i} className="relative grid h-12 w-8 place-items-center overflow-hidden bg-paper-2 font-mono text-[22px] font-medium text-ink sm:h-14 sm:w-9">
            <span
              key={c}
              ref={(el) => {
                el?.animate([{ transform: "rotateX(-80deg)", opacity: 0.4 }, { transform: "rotateX(0)", opacity: 1 }], { duration: 120, easing: "ease-out" });
              }}
              className="block"
            >
              {c === " " ? " " : c}
            </span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-paper" />
          </span>
        ))}
      </button>
      <span className="label text-mute">Click to flip</span>
    </div>
  );
}
