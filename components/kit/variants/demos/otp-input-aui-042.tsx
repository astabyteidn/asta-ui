"use client";

import { useEffect, useRef, useState } from "react";
import { VerifyOtp } from "@/components/kit/variants/otp-input-aui-042";

export default function Demo() {
  const [run, setRun] = useState(0);
  const [preset, setPreset] = useState("");
  const box = useRef<HTMLDivElement>(null);

  // Play the check once when the card scrolls into view: ripple, fold into the badge, then reset for you to try.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      timers.push(
        setTimeout(() => {
          setPreset("424242");
          setRun((r) => r + 1);
        }, 1100),
        setTimeout(() => {
          setPreset("");
          setRun((r) => r + 1);
        }, 4600),
      );
    });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={box} className="flex min-h-[380px] w-full flex-col items-center justify-center gap-4 bg-paper-2 p-5 sm:p-8">
      <VerifyOtp
        key={run}
        defaultValue={preset}
        onContinue={() => {
          setPreset("");
          setRun((r) => r + 1);
        }}
      />
      <p className="text-[12.5px] text-mute">
        Try <span className="font-mono text-ink">424242</span>, anything else is wrong
      </p>
    </div>
  );
}
