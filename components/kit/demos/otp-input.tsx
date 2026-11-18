"use client";

import { useState } from "react";
import { OtpInput } from "@/components/kit/otp-input";

// The "right" code for this demo.
const CODE = "424242";

export default function OtpInputDemo() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "wrong" | "ok">("idle");

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-paper-2 text-ink">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="5" y="2.5" width="10" height="15" rx="2.2" />
              <path d="M8.5 14.5h3" />
            </svg>
          </span>
          <p className="mt-1 text-[16px] font-medium tracking-[-0.01em] text-ink">Check your phone</p>
          <p className="text-[13px] leading-relaxed text-ink-2">
            We sent a 6-digit code to <span className="tabular-nums text-ink">+1 (415) ••• 0192</span>
          </p>
        </div>

        <OtpInput
          value={code}
          groupSize={3}
          error={status === "wrong"}
          onChange={(v) => {
            setCode(v);
            if (status !== "idle") setStatus("idle");
          }}
          onComplete={(v) => setStatus(v === CODE ? "ok" : "wrong")}
        />

        <p className="h-5 text-[13px]" aria-live="polite">
          {status === "ok" ? (
            <span className="text-brand">Verified. Signing you in…</span>
          ) : status === "wrong" ? (
            <span className="text-ink-2">That code didn&apos;t match. Try again.</span>
          ) : (
            <span className="text-mute">
              Didn&apos;t get it?{" "}
              <button type="button" onClick={() => setCode("")} className="font-medium text-ink underline-offset-2 hover:underline">
                Resend in 0:24
              </button>
            </span>
          )}
        </p>

        <p className="text-center text-[12.5px] text-mute">Type or paste a code. 424242 passes, anything else shakes.</p>
      </div>
    </div>
  );
}
