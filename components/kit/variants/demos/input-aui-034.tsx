"use client";

import { useEffect, useRef, useState } from "react";
import { AmountInput } from "@/components/kit/variants/input-aui-034";

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

export default function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState(0);
  const [code, setCode] = useState("USD");
  const touched = useRef(false);

  // Rolls the amount up once, the first time the card is on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      t = setTimeout(() => !touched.current && setAmount(250), 650);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <div ref={ref} className="flex min-h-[360px] w-full items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-[400px] rounded-[18px] bg-paper p-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <AmountInput
          label="Top up"
          value={amount}
          currency={code}
          onCurrencyChange={setCode}
          onChange={(v) => {
            touched.current = true;
            setAmount(v);
          }}
        />
        <div className="flex items-center gap-3 px-3 pb-2 pt-3.5">
          <span className="grid h-8 w-11 shrink-0 place-items-center rounded-[6px] bg-paper-2 font-mono text-[10.5px] text-ink-2">4242</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-ink">Debit card</span>
            <span className="block text-[12px] text-mute">Expires 08/29</span>
          </span>
          <button
            type="button"
            disabled={!amount}
            className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-brand px-4 text-[13.5px] font-medium tabular-nums text-paper outline-none transition-[transform,opacity] duration-300 enabled:active:scale-[.98] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Add {SYMBOL[code]}
            {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-enabled:group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
