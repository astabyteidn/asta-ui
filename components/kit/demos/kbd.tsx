"use client";

import { useState } from "react";
import { Kbd, KbdCombo } from "@/components/kit/kbd";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wider text-mute">{label}</span>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </div>
);

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Search" },
  { keys: ["⌘", "⇧", "P"], label: "Commands" },
  { keys: ["⌥", "↵"], label: "Open in new tab" },
];

export default function KbdDemo() {
  const [hits, setHits] = useState(0);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex flex-col gap-7">
        <Row label="Size">
          <Kbd size="sm">K</Kbd>
          <Kbd>K</Kbd>
          <Kbd size="lg">K</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>⌫</Kbd>
        </Row>
        <Row label="Live">
          {["←", "↑", "↓", "→", "Space", "Shift"].map((k) => (
            <Kbd key={k} size="lg" live>
              {k}
            </Kbd>
          ))}
        </Row>
        <Row label="Combo">
          <div className="flex items-center gap-3">
            <KbdCombo keys={["Shift", "A"]} size="lg" separator="+" live onTrigger={() => setHits((n) => n + 1)} />
            <span className="text-[13px] tabular-nums text-mute">{hits ? `Pressed ${hits}×` : "Hold both keys"}</span>
          </div>
        </Row>
        <Row label="In a menu">
          <ul className="w-full min-w-[260px] rounded-xl bg-paper p-1.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_8px_24px_-12px_rgb(0_0_0/0.2)]">
            {SHORTCUTS.map((s) => (
              <li key={s.label} className="flex h-9 items-center justify-between gap-6 rounded-[10px] px-2.5 text-[13px] text-ink-2 hover:bg-paper-2">
                {s.label}
                <KbdCombo keys={s.keys} size="sm" />
              </li>
            ))}
          </ul>
        </Row>
      </div>
    </div>
  );
}
