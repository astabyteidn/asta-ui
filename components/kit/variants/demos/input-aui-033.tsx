"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SlugInput } from "@/components/kit/variants/input-aui-033";

const EASE = "cubic-bezier(.16,1,.3,1)";
const rise = (i: number): CSSProperties => ({ animation: `aui033d-rise .6s ${EASE} ${120 + i * 55}ms both` });
const TITLE = "Shipping the motion lab";

export default function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const touched = useRef(false);

  // Types a title once so the URL can be seen rewriting itself.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTitle(TITLE);
      for (let i = 1; i <= TITLE.length; i++) timers.push(setTimeout(() => !touched.current && setTitle(TITLE.slice(0, i)), 700 + i * 65));
    });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={ref} className="flex min-h-[340px] w-full items-center justify-center p-5 sm:p-8">
      <style href="asta-input-aui-033-demo" precedence="asta">{`@keyframes aui033d-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } } @media (prefers-reduced-motion: reduce) { .aui033d * { animation: none !important } }`}</style>
      <div className="aui033d w-full max-w-[500px] rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="flex items-center gap-2 px-5 pb-1 pt-4 text-[12.5px] text-mute" style={rise(0)}>
          <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-ink text-[10px] font-semibold text-paper">A</span>
          <span className="text-ink">Research</span>
          <span>/</span>
          <span>New note</span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Autosaved
          </span>
        </div>
        <div className="px-5 pt-4" style={rise(1)}>
          <SlugInput
            title={title}
            onTitleChange={(t) => {
              touched.current = true;
              setTitle(t);
            }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 px-5 pb-5" style={rise(2)}>
          <span className="flex items-center gap-2 text-[12.5px] text-mute">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-paper-2 text-[10px] font-medium text-ink">RA</span>
            Rani · 4 min read
          </span>
          <button
            type="button"
            className="h-9 rounded-[8px] bg-ink px-4 text-[13.5px] font-medium text-paper outline-none transition-transform duration-200 hover:-translate-y-px active:scale-[.98] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
