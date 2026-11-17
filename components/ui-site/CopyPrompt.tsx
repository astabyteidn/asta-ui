"use client";

import { useState } from "react";
import { CopyIcon } from "./CodeTabs";
import { usePrimitive } from "./Primitive";

/**
 * Copies a ready-made prompt for an AI coding agent. Label swaps in place, so the button never changes width.
 * `textBase` is the Base UI version, copied when Base UI is the picked primitive.
 */
export default function CopyPrompt({ text, textBase, label = "Copy prompt", className = "" }: { text: string; textBase?: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const primitive = usePrimitive();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(primitive === "base" && textBase ? textBase : text);
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
