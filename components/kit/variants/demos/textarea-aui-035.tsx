"use client";

import { useEffect, useRef, useState } from "react";
import { BudgetTextarea } from "@/components/kit/variants/textarea-aui-035";

const DRAFT = "Shipped the new pricing page today. Rolling digits, a darker Pro card and a tidier FAQ. Next up: onboarding emails and search for the docs, both before Friday.";

export default function Demo() {
  const [text, setText] = useState("");
  const [typed, setTyped] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Type the draft once when the card scrolls into view, so the ring and the overflow wash show themselves.
  useEffect(() => {
    const el = box.current;
    if (!el || typed) return;
    const chunk = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? DRAFT.length : 2;
    let t: ReturnType<typeof setTimeout> | undefined;
    let i = 0;
    const step = () => {
      if (document.hidden) {
        t = setTimeout(step, 300);
        return;
      }
      i += chunk;
      setText(DRAFT.slice(0, i));
      if (i < DRAFT.length) t = setTimeout(step, 28);
      else setTyped(true);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        t = setTimeout(step, 700);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [typed]);

  return (
    <div ref={box} className="flex min-h-[360px] w-full items-center justify-center bg-paper-2 p-5 sm:p-8">
      <div className="w-full max-w-[460px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-paper">A</span>
          <div className="min-w-0 leading-tight">
            <p className="text-[13.5px] font-medium text-ink">Astabyte · #weekly</p>
            <p className="text-[12px] text-mute">Posting as Rani Prasetyo</p>
          </div>
        </div>
        <BudgetTextarea
          limit={140}
          rows={5}
          label="Weekly update"
          value={text}
          onChange={(v) => {
            setTyped(true);
            setText(v);
          }}
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] text-mute">Shared with 14 people</span>
          <button
            type="button"
            className="h-9 shrink-0 whitespace-nowrap rounded-[8px] bg-ink px-4 text-[13.5px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
          >
            Post update
          </button>
        </div>
      </div>
    </div>
  );
}
