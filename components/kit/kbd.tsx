"use client";

import { useEffect, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// Display label → KeyboardEvent.key values that should press it.
const MATCH: Record<string, string[]> = {
  "⌘": ["Meta"],
  Cmd: ["Meta"],
  Ctrl: ["Control"],
  "⌃": ["Control"],
  "⌥": ["Alt"],
  Alt: ["Alt"],
  "⇧": ["Shift"],
  Shift: ["Shift"],
  "↵": ["Enter"],
  Enter: ["Enter"],
  Esc: ["Escape"],
  "⌫": ["Backspace"],
  Tab: ["Tab"],
  Space: [" "],
  "↑": ["ArrowUp"],
  "↓": ["ArrowDown"],
  "←": ["ArrowLeft"],
  "→": ["ArrowRight"],
};
const keysFor = (label: string) => MATCH[label] ?? [label.toLowerCase()];

/** Tracks which of the given labels are held down right now. */
function useHeld(labels: string[], on: boolean) {
  const [held, setHeld] = useState<Set<string>>(new Set());
  const sig = labels.join("\u0000");
  useEffect(() => {
    if (!on) return;
    const list = sig.split("\u0000");
    const set = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const hit = list.filter((l) => keysFor(l).includes(k));
      if (!hit.length) return;
      setHeld((prev) => {
        const next = new Set(prev);
        hit.forEach((h) => (down ? next.add(h) : next.delete(h)));
        return next;
      });
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    const clear = () => setHeld(new Set());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [sig, on]);
  return held;
}

export interface KbdProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Force the pressed look. */
  pressed?: boolean;
  /** Press down when the matching real key is pressed (children must be a string like "K" or "⌘"). */
  live?: boolean;
  className?: string;
}

const SIZE = {
  sm: "h-5 min-w-5 px-1 text-[11px] rounded-[5px]",
  md: "h-7 min-w-7 px-1.5 text-[12.5px] rounded-[7px]",
  lg: "h-10 min-w-10 px-2.5 text-[15px] rounded-[10px]",
};

/** A key cap. A thicker bottom edge sinks when pressed. */
export function Kbd({ children, size = "md", pressed, live, className }: KbdProps) {
  const label = typeof children === "string" ? children : "";
  const held = useHeld(label ? [label] : [], !!live && !!label);
  const down = pressed || held.has(label);
  return (
    <kbd
      data-pressed={down || undefined}
      className={cx(
        "inline-flex select-none items-center justify-center bg-paper font-sans font-medium text-ink-2",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent),inset_0_-2px_0_color-mix(in_srgb,var(--color-ink)_12%,transparent)]",
        "transition-[transform,box-shadow,background-color,color] duration-100 ease-out",
        "data-[pressed]:translate-y-px data-[pressed]:bg-paper-2 data-[pressed]:text-accent data-[pressed]:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]",
        SIZE[size],
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/**
 * A shortcut made of several keys. With `live`, each cap presses with its real key, and `onTrigger`
 * fires when the whole combo is held at once.
 */
export function KbdCombo({
  keys,
  size = "md",
  live,
  separator,
  onTrigger,
  className,
}: {
  keys: string[];
  size?: KbdProps["size"];
  live?: boolean;
  /** Shown between caps, e.g. "+" or "then". Omit for none. */
  separator?: ReactNode;
  onTrigger?: () => void;
  className?: string;
}) {
  const held = useHeld(keys, !!live);
  const all = keys.every((k) => held.has(k));
  useEffect(() => {
    if (all && live) onTrigger?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);
  return (
    <span className={cx("inline-flex items-center gap-1", className)} aria-label={keys.join(" + ")}>
      {keys.map((k, i) => (
        <span key={k} className="inline-flex items-center gap-1">
          {i > 0 && separator && <span className="text-[12px] text-mute">{separator}</span>}
          <Kbd size={size} pressed={held.has(k)}>
            {k}
          </Kbd>
        </span>
      ))}
    </span>
  );
}

export default Kbd;
