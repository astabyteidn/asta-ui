"use client";

import { useEffect, useRef, useState } from "react";

const CODE: Record<string, string> = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
  "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
  "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
};
const DASH = 220;

/** Tap short for a dot, hold for a dash. Pauses commit a letter, longer pauses a space. */
export default function MorseTap() {
  const [seq, setSeq] = useState("");
  const [text, setText] = useState("");
  const [down, setDown] = useState(false);
  const t0 = useRef(0);
  const seqRef = useRef("");
  const letter = useRef<ReturnType<typeof setTimeout>>(undefined);
  const space = useRef<ReturnType<typeof setTimeout>>(undefined);

  const press = () => {
    if (down) return;
    clearTimeout(letter.current);
    clearTimeout(space.current);
    t0.current = performance.now();
    setDown(true);
  };
  const release = () => {
    if (!down) return;
    setDown(false);
    const s = seqRef.current + (performance.now() - t0.current < DASH ? "." : "-");
    seqRef.current = s.slice(-5);
    setSeq(seqRef.current);
    letter.current = setTimeout(() => {
      const ch = CODE[seqRef.current] ?? "?";
      setText((t) => (t + ch).slice(-14));
      seqRef.current = "";
      setSeq("");
      space.current = setTimeout(() => setText((t) => (t.endsWith(" ") || !t ? t : t + " ")), 900);
    }, 550);
  };

  useEffect(
    () => () => {
      clearTimeout(letter.current);
      clearTimeout(space.current);
    },
    [],
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
      <div className="flex h-10 w-full max-w-[280px] items-center justify-between border-b border-line">
        <span className="truncate font-mono text-xl tracking-[0.15em] text-ink">
          {text}
          <span className="animate-pulse text-signal">_</span>
        </span>
        <button type="button" onClick={() => setText("")} className="label text-mute hover:text-ink">
          Clear
        </button>
      </div>
      <button
        type="button"
        onPointerDown={press}
        onPointerUp={release}
        onPointerLeave={release}
        onKeyDown={(e) => {
          if (e.key === " " && !e.repeat) {
            e.preventDefault();
            press();
          }
        }}
        onKeyUp={(e) => e.key === " " && release()}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative grid h-20 w-20 select-none place-items-center border transition-all duration-100 [touch-action:none] ${down ? "scale-95 border-signal bg-signal text-paper" : "border-line bg-paper-2 text-ink"}`}
      >
        <span className="label">Tap</span>
      </button>
      <div className="flex h-5 items-center gap-1.5">
        {seq.split("").map((c, i) => (
          <span key={i} className={`bg-signal ${c === "." ? "h-1.5 w-1.5" : "h-1.5 w-5"}`} />
        ))}
        {!seq && <span className="label text-mute">··· −−− ··· = SOS</span>}
      </div>
    </div>
  );
}
