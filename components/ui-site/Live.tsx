"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { baseDemos } from "@/components/kit/base/demos";
import { kitDemos } from "@/components/kit/demos";
import { variantDemos } from "@/components/kit/variants";
import { labComponents } from "@/components/lab/components";
import { usePrimitive } from "./Primitive";

const noop = () => () => {};

/**
 * Mounts a live component while it's near the viewport and unmounts it once it's well out of view, so only the demos
 * you can see are animating. It remembers the height it rendered at and keeps that space while unmounted, so scrolling
 * past a demo never collapses it and the page never jumps. `eager` mounts it as soon as the page hydrates (component
 * pages); `ssr` renders it on the server too. Either way the placeholder crossfades into the component, and items with
 * a Base UI build swap to it when Base UI is the picked primitive (same crossfade, same size).
 */
function useNearMount(eager: boolean, ssr: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [held, setHeld] = useState<number | null>(null);
  // false on the server and during hydration, true right after: no hydration mismatch, no effect-driven state.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    const el = ref.current;
    if (!el || eager || ssr) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "900px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [eager, ssr]);
  const on = ssr || (eager ? hydrated : near);
  // Remember the rendered height, so the slot keeps its size after the demo unmounts.
  useEffect(() => {
    const el = inner.current;
    if (!on || !el) return;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (h > 0) setHeld(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [on]);
  return { ref, inner, on, held };
}

export function Live({ slug, eager = false, ssr = false }: { slug: string; eager?: boolean; ssr?: boolean }) {
  const { ref, inner, on, held } = useNearMount(eager, ssr);
  const primitive = usePrimitive();
  const base = primitive === "base" ? baseDemos[slug] : undefined;
  const C = base ?? labComponents[slug] ?? kitDemos[slug] ?? variantDemos[slug];
  return (
    <div ref={ref} className="relative h-full w-full" style={!on && held ? { minHeight: held } : undefined}>
      {on && C ? (
        <>
          <div ref={inner} key={base ? "base" : "radix"} className="ui-live-in relative h-full w-full" data-primitive={base ? "base" : undefined}>
            <C />
          </div>
          <div aria-hidden className="ui-live-ph absolute inset-0 bg-ink/[0.03]" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-ink/[0.025]" />
      )}
    </div>
  );
}

/** Same near-viewport mounting as `Live`, for any children (the blog demos). */
export function LiveSlot({ children }: { children: ReactNode }) {
  const { ref, inner, on, held } = useNearMount(false, false);
  return (
    <div ref={ref} className="relative h-full w-full" style={!on && held ? { minHeight: held } : undefined}>
      {on ? (
        <>
          <div ref={inner} className="ui-live-in relative h-full w-full">
            {children}
          </div>
          <div aria-hidden className="ui-live-ph absolute inset-0 bg-ink/[0.03]" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-ink/[0.025]" />
      )}
    </div>
  );
}

/** A surface with a soft blue light that follows the pointer. */
export function Spot({ className = "", style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - r.left}px`);
        el.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }}
      style={style}
      className={`spot group relative overflow-hidden rounded-xl bg-paper-2 ${className}`}
    >
      {children}
    </div>
  );
}
