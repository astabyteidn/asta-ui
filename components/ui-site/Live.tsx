"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { kitDemos } from "@/components/kit/demos";
import { labComponents } from "@/components/lab/components";

/** Mounts a live component while it's near the viewport and unmounts it once it's well out of view, so only the demos you can see are animating. */
export function Live({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setOn(e.isIntersecting),
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const C = labComponents[slug] ?? kitDemos[slug];
  return (
    <div ref={ref} className="relative h-full w-full">
      {on && C ? <C /> : <div className="absolute inset-0 animate-pulse bg-ink/[0.02]" />}
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
