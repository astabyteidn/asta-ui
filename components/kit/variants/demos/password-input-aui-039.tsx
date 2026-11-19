"use client";

import { useEffect, useRef, useState } from "react";
import { StrengthPassword } from "@/components/kit/variants/password-input-aui-039";

const HINT = "Studio#Rani2026";

export default function Demo() {
  const [pw, setPw] = useState("");
  const [touched, setTouched] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Type a password once when the card scrolls into view, so the dial fills by itself.
  useEffect(() => {
    const el = box.current;
    if (!el || touched) return;
    const chunk = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? HINT.length : 1;
    let t: ReturnType<typeof setTimeout> | undefined;
    let i = 0;
    const step = () => {
      if (document.hidden) {
        t = setTimeout(step, 300);
        return;
      }
      i += chunk;
      setPw(HINT.slice(0, i));
      if (i < HINT.length) t = setTimeout(step, 110);
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
  }, [touched]);

  return (
    <div ref={box} className="flex min-h-[360px] w-full items-center justify-center bg-paper-2 p-5 sm:p-8">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-full max-w-[400px] rounded-[14px] bg-paper p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.02em] text-ink">
            <span className="grid h-6 w-6 place-items-center rounded-[6px] bg-ink text-[12px] text-paper">A</span>
            Astabyte
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Step 2 of 3</span>
        </div>
        <StrengthPassword
          value={pw}
          onChange={(v) => {
            setTouched(true);
            setPw(v);
          }}
        />
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="truncate text-[12.5px] text-mute">rani@astabyte.com</span>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-[9px] bg-ink px-4 text-[13.5px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
