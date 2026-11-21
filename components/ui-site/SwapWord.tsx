"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionPaused } from "./MotionPause";

const GLYPHS = "abcdefghijklmnopqrstuvwxyz";

/**
 * A word you can click to swap, drawn as a selected layer in a design tool: a blue frame with corner
 * handles and a name tag. The letters scramble into the next word. Cycles on its own until clicked or motion is paused.
 */
export default function SwapWord({ words, className = "" }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState(words[0]);
  const raf = useRef(0);
  const touched = useRef(false);
  const paused = useMotionPaused();

  const go = (next: number) => {
    const to = words[next];
    const from = text;
    const len = Math.max(from.length, to.length);
    const t0 = performance.now();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(raf.current);
    setI(next);
    if (still) return setText(to);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 520);
      let out = "";
      for (let c = 0; c < len; c++) {
        const settle = (c + 1) / len;
        if (k >= settle) out += to[c] ?? "";
        else if (k > settle - 0.45) out += to[c] === "." ? "." : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else out += from[c] ?? "";
      }
      setText(out);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      if (!touched.current && !document.hidden) go((i + 1) % words.length);
    }, 2600);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, paused]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const handle = "absolute h-[0.11em] w-[0.11em] min-h-[7px] min-w-[7px] border-[1.5px] border-accent bg-paper";

  return (
    <button
      type="button"
      onClick={() => {
        touched.current = true;
        go((i + 1) % words.length);
      }}
      aria-label={`${words[i]} (click for another word)`}
      className={`group relative inline-block cursor-pointer px-[0.08em] text-accent outline-none ${className}`}
    >
      <span aria-hidden className="whitespace-nowrap">
        {text}
      </span>
      {/* Selection frame */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[0.02em] top-[0.12em] border-[1.5px] border-accent/80 transition-colors group-hover:border-accent group-focus-visible:border-accent">
        <span className={`${handle} -left-[0.07em] -top-[0.07em]`} />
        <span className={`${handle} -right-[0.07em] -top-[0.07em]`} />
        <span className={`${handle} -bottom-[0.07em] -left-[0.07em]`} />
        <span className={`${handle} -bottom-[0.07em] -right-[0.07em]`} />
        <span className="absolute -top-[0.26em] left-[-1.5px] -translate-y-full whitespace-nowrap bg-accent px-1.5 py-0.5 font-mono text-[max(10px,0.13em)] font-normal leading-none tracking-normal text-white">
          word {String(i + 1).padStart(2, "0")}/{String(words.length).padStart(2, "0")}
        </span>
      </span>
    </button>
  );
}
