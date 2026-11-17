"use client";

import { useState } from "react";
import { CopyIcon } from "./CodeTabs";

/** A command chip that copies the full command. */
export default function CopyChip({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
      title={text}
      className="btn btn-quiet btn-lg w-full min-w-0 justify-start font-mono !text-[13px] !font-normal"
    >
      <span className="text-accent">$</span>
      <span className="min-w-0 flex-1 truncate text-left text-ink-2">{label}</span>
      <span className={`ml-1 shrink-0 transition-colors ${done ? "text-accent" : "text-mute"}`}>
        <CopyIcon done={done} />
      </span>
    </button>
  );
}
