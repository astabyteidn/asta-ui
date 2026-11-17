"use client";

import { useState } from "react";
import { CopyIcon } from "./CodeTabs";

/** Copies a ready-made prompt for an AI coding agent. Label swaps in place, so the button never changes width. */
export default function CopyPrompt({ text, label = "Copy prompt", className = "" }: { text: string; label?: string; className?: string }) {
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
      className={`btn btn-quiet btn-sm ${done ? "btn-on" : ""} ${className}`}
      aria-label={done ? "Prompt copied" : label}
      title="Paste into Claude Code, Cursor, Codex, v0 or Lovable"
    >
      <span className={`transition-colors ${done ? "text-accent" : ""}`}>
        <CopyIcon done={done} />
      </span>
      <span className="ui-labels">
        <span data-on={!done}>{label}</span>
        <span data-on={done} aria-hidden={!done}>
          Copied
        </span>
      </span>
    </button>
  );
}
