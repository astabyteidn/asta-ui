"use client";

import { useId, useSyncExternalStore, type ReactNode } from "react";
import type { Primitive } from "@/lib/primitive";
import { PRIMITIVE_KEY } from "@/lib/primitive";

export type { Primitive };

const subs = new Set<() => void>();
const read = (): Primitive => (document.documentElement.dataset.primitive === "base" ? "base" : "radix");
const subscribe = (fn: () => void) => {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
};

/** The primitive picked on this device. Radix on the server and during hydration, then the real choice. */
export function usePrimitive(): Primitive {
  return useSyncExternalStore(subscribe, read, () => "radix");
}

export function setPrimitive(p: Primitive) {
  const root = document.documentElement;
  if (p === "base") root.dataset.primitive = "base";
  else delete root.dataset.primitive;
  try {
    localStorage.setItem(PRIMITIVE_KEY, p);
  } catch {}
  try {
    const u = new URL(location.href);
    if (p === "base") u.searchParams.set("primitive", "base");
    else u.searchParams.delete("primitive");
    history.replaceState(history.state, "", u);
  } catch {}
  subs.forEach((fn) => fn());
}

const OPTIONS: { id: Primitive; label: string }[] = [
  { id: "radix", label: "Radix" },
  { id: "base", label: "Base UI" },
];

/** "Primitive: Radix | Base UI". A segmented switch with a sliding slab; the choice is global and remembered. */
export function PrimitiveSwitch({ className = "" }: { className?: string }) {
  const p = usePrimitive();
  const id = useId();
  const i = OPTIONS.findIndex((o) => o.id === p);
  // The slab position and the active label colour come from CSS on <html data-primitive>, so they are right on first paint.
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="label text-mute" id={id}>
        Primitive
      </span>
      <div role="radiogroup" aria-labelledby={id} className="relative grid grid-cols-2 rounded-[9px] bg-paper-2 p-0.5">
        <span
          aria-hidden
          className="pv-slab absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-[7px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)] transition-transform duration-500 ease-expo motion-reduce:transition-none"
        />
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={p === o.id}
            tabIndex={p === o.id ? 0 : -1}
            onClick={() => setPrimitive(o.id)}
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
              e.preventDefault();
              const next = OPTIONS[(i + 1) % OPTIONS.length];
              setPrimitive(next.id);
              (e.currentTarget.parentElement?.querySelector(`[data-id="${next.id}"]`) as HTMLElement | null)?.focus();
            }}
            data-id={o.id}
            className="pv-opt relative h-7 whitespace-nowrap rounded-[7px] px-3 text-[13.5px] font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Shows one of two versions by primitive. Both stay in the same grid cell, so the block is as tall as the taller one and
 * switching never shifts the page; the hidden one is `visibility: hidden` (out of the tab order and the a11y tree) and they
 * crossfade. Pure CSS on `<html data-primitive>`, so the right one is visible on first paint.
 */
export function ByPrimitive({ radix, base, className = "" }: { radix: ReactNode; base: ReactNode; className?: string }) {
  return (
    <div className={`pv-stack ${className}`}>
      <div className="pv pv-radix">{radix}</div>
      <div className="pv pv-base">{base}</div>
    </div>
  );
}

/** Inline text that follows the primitive (no layout box of its own). */
export function PrimitiveText({ radix, base }: { radix: ReactNode; base: ReactNode }) {
  return (
    <>
      <span className="pv-inline pv-radix">{radix}</span>
      <span className="pv-inline pv-base">{base}</span>
    </>
  );
}
