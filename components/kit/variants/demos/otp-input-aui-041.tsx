"use client";

import { useEffect, useRef, useState } from "react";
import { SplitOtp } from "@/components/kit/variants/otp-input-aui-041";

const HINT = "382915";

export default function Demo() {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Fill the code once when the card scrolls into view: the frame glides, then the halves snap together.
  useEffect(() => {
    const el = box.current;
    if (!el || touched) return;
    const chunk = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 6 : 1;
    let t: ReturnType<typeof setTimeout> | undefined;
    let i = 0;
    const step = () => {
      if (document.hidden) {
        t = setTimeout(step, 300);
        return;
      }
      i += chunk;
      setCode(HINT.slice(0, i));
      if (i < 6) t = setTimeout(step, 260);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        t = setTimeout(step, 900);
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
      <div className="flex w-full max-w-[400px] flex-col items-center rounded-[14px] bg-paper px-6 py-7 text-center shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-paper-2 text-ink">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
            <rect x="2.5" y="4.5" width="15" height="11" rx="2.2" />
            <path d="m3.5 6 6.5 5 6.5-5" strokeLinecap="round" />
          </svg>
        </span>
        <h3 className="mt-4 text-[20px] font-medium tracking-[-0.02em] text-ink">Check your email</h3>
        <p className="mb-6 mt-1.5 text-[13.5px] text-mute">
          We sent a code to <span className="text-ink">rani@astabyte.com</span>
        </p>
        <SplitOtp
          value={code}
          onChange={(v) => {
            setTouched(true);
            setCode(v);
          }}
        />
      </div>
    </div>
  );
}
