"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { kitDemos } from "@/components/kit/demos";
import { variantDemos } from "@/components/kit/variants";
import { labComponents } from "@/components/lab/components";

const noop = () => () => {};

/**
 * Mounts a live component while it's near the viewport and unmounts it once it's well out of view, so only the demos
 * you can see are animating. `eager` mounts it as soon as the page hydrates (component pages); `ssr`
 * renders it on the server too, so a stage that sizes to its content has its final height on first paint. Either way the
 * placeholder crossfades into the component (opacity + a 0.98 → 1 settle), so nothing pops or shifts.
 */
export function Live({ slug, eager = false, ssr = false }: { slug: string; eager?: boolean; ssr?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  // false on the server and during hydration, true right after: no hydration mismatch, no effect-driven state.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    const el = ref.current;
    if (!el || eager || ssr) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [eager, ssr]);
  const on = ssr || (eager ? hydrated : near);
  const C = labComponents[slug] ?? kitDemos[slug] ?? variantDemos[slug];
  return (
    <div ref={ref} className="relative h-full w-full">
      {on && C ? (
        <>
          <div className="ui-live-in relative h-full w-full">
            <C />
          </div>
          <div aria-hidden className="ui-live-ph absolute inset-0 bg-ink/[0.03]" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 animate-pulse bg-ink/[0.03]" />
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
