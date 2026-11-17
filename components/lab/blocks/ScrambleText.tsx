"use client";

import { useRef } from "react";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ01";
const WORDS = ["Strategy", "Identity", "Interface", "Motion", "Engineering"];

function Word({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);

  const run = () => {
    cancelAnimationFrame(raf.current);
    let frame = 0;
    const total = text.length * 3 + 6;
    const step = () => {
      const out = text
        .split("")
        .map((ch, i) => (frame / 3 > i ? ch : ch === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join("");
      if (ref.current) ref.current.textContent = out;
      frame++;
      if (frame <= total) raf.current = requestAnimationFrame(step);
    };
    step();
  };

  return (
    <span ref={ref} onPointerEnter={run} onFocus={run} tabIndex={0} className="block cursor-default py-0.5 font-mono text-xl uppercase tracking-tight text-ink transition-colors hover:text-signal outline-none focus-visible:text-signal">
      {text}
    </span>
  );
}

export default function ScrambleText() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      {WORDS.map((w) => (
        <Word key={w} text={w} />
      ))}
    </div>
  );
}
