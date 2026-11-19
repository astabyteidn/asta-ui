"use client";

import { useEffect, useRef } from "react";
import { SuggestTagInput } from "@/components/kit/variants/tag-input-aui-049";

const EASE = "cubic-bezier(.16,1,.3,1)";

export default function Demo() {
  const box = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  // One-time hint: the first suggestion flies into the field shortly after mount.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!touched.current) box.current?.querySelector<HTMLButtonElement>('[id$="-sug"] button')?.click();
    }, 1500);
    return () => clearTimeout(t);
  }, []);
  const rise = (i: number) => ({ animation: `aui049d-rise .6s ${EASE} ${i * 60}ms both` });
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center px-4 py-8 sm:p-10">
      <style href="asta-aui049d" precedence="asta">{`@keyframes aui049d-rise { from { opacity: 0; transform: translateY(10px) } } @media (prefers-reduced-motion: reduce) { .aui049d * { animation: none !important } }`}</style>
      <div className="aui049d w-full max-w-[460px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="flex items-center justify-between" style={rise(0)}>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Research · Draft</span>
          <span className="text-[12px] text-mute">6 min read</span>
        </div>
        <p className="mt-2 text-[19px] font-medium leading-[1.2] tracking-[-0.03em] text-ink" style={rise(1)}>
          A motion system in four rules
        </p>
        <p className="mt-1 text-[13px] text-mute" style={rise(1)}>
          How Astabyte keeps every animation on one curve.
        </p>
        <div ref={box} className="mt-4" style={rise(2)} onPointerDown={() => (touched.current = true)} onKeyDown={() => (touched.current = true)}>
          <SuggestTagInput />
        </div>
      </div>
    </div>
  );
}
