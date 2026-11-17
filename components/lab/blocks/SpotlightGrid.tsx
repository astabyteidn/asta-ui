"use client";

import { useRef } from "react";

const ITEMS = ["Brand", "Web", "Product", "Motion", "3D", "Systems", "Rust", "AI", "Docs"];

export default function SpotlightGrid() {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent) => {
    for (const tile of ref.current!.children as HTMLCollectionOf<HTMLElement>) {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--x", `${e.clientX - r.left}px`);
      tile.style.setProperty("--y", `${e.clientY - r.top}px`);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div ref={ref} onPointerMove={move} className="group grid w-full max-w-[300px] grid-cols-3 gap-1.5">
        {ITEMS.map((t) => (
          <div
            key={t}
            className="relative aspect-square overflow-hidden rounded-xl bg-ink p-px [background-image:radial-gradient(140px_circle_at_var(--x,-200px)_var(--y,-200px),var(--color-signal),transparent_60%)]"
          >
            <div className="flex h-full w-full items-end rounded-[11px] bg-ink p-2.5 [background-image:radial-gradient(160px_circle_at_var(--x,-200px)_var(--y,-200px),color-mix(in_srgb,var(--color-signal)_18%,transparent),transparent_60%)]">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/70">{t}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
