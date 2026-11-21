"use client";

import { useState } from "react";
import { Button } from "@/components/kit/button";
import { CookieConsent, type Consent } from "@/components/kit/cookie-consent";

export default function CookieConsentDemo() {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<Consent | null>(null);
  const on = result ? Object.entries(result).filter(([, v]) => v).map(([k]) => k) : [];

  return (
    <div className="relative flex min-h-[520px] w-full overflow-hidden p-6 sm:p-10">
      {/* A page behind the banner */}
      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-3 pt-2 sm:items-end sm:text-right">
        <p className="font-mono text-[11px] uppercase tracking-wider text-mute">astabyte.com</p>
        <p className="text-[26px] font-medium leading-[1.1] tracking-[-0.035em] text-ink sm:text-[32px]">Studio tools for small teams</p>
        <p className="max-w-[420px] text-[13.5px] leading-relaxed text-mute">Plan, design and ship from one place. Your choice below is only kept in this preview.</p>
        <div className="mt-2 flex flex-col gap-2 rounded-xl bg-paper-2 px-4 py-3 text-left text-[12.5px] sm:w-[280px]">
          <p className="font-medium text-ink">Saved choice</p>
          <p className="text-mute">{result ? (on.length ? on.join(", ") : "none") : "Waiting for a choice…"}</p>
          <Button
            size="xs"
            variant="outline"
            className="self-start"
            disabled={!result}
            onClick={() => {
              setResult(null);
              setRound((r) => r + 1);
            }}
          >
            Show the banner again
          </Button>
        </div>
      </div>
      <CookieConsent key={round} contained policyHref="#cookie-consent" onConsent={setResult} />
    </div>
  );
}
