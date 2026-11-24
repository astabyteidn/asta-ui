"use client";

import { useState } from "react";
import { ApiKeys, type ApiKey, type NewApiKey } from "@/components/kit/api-keys";

const DAY = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * DAY);

const KEYS: ApiKey[] = [
  { id: "k1", name: "Production server", prefix: "ak_live", last4: "9f2c", scopes: ["projects:read", "deploys:write"], created: at(-92), lastUsed: new Date(Date.now() - 3 * 60_000), expires: at(270) },
  { id: "k2", name: "GitHub Actions deploy pipeline for the marketing site and the docs", prefix: "ak_live", last4: "a71e", scopes: ["deploys:write", "projects:read", "projects:write"], created: at(-81), lastUsed: new Date(Date.now() - 2 * 3_600_000), expires: at(9) },
  { id: "k3", name: "Staging", prefix: "ak_test", last4: "04bd", scopes: ["projects:read"], created: at(-40), lastUsed: at(-6), expires: null },
  { id: "k4", name: "Old analytics export", prefix: "ak_live", last4: "e3a8", scopes: ["billing:read"], created: at(-400), lastUsed: at(-104), expires: at(-12) },
];

// Pretend server: waits a moment and returns a key that is clearly a demo.
async function createKey({ name, scopes, expiresInDays }: NewApiKey) {
  await new Promise((r) => setTimeout(r, 700));
  const tail = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  return {
    secret: `ak_live_demo_${tail}`,
    key: { id: `k${Date.now()}`, name, prefix: "ak_live", last4: tail.slice(-4), scopes, created: new Date(), lastUsed: null, expires: expiresInDays ? at(expiresInDays) : null },
  };
}

const VIEWS = ["Keys", "Empty", "Loading", "Error"] as const;

export default function ApiKeysDemo() {
  const [view, setView] = useState<(typeof VIEWS)[number]>("Keys");

  return (
    <div className="flex min-h-[620px] w-full flex-col items-center justify-center gap-5 p-4 sm:p-10">
      <ApiKeys
        key={view}
        defaultKeys={view === "Keys" ? KEYS : []}
        loading={view === "Loading"}
        error={view === "Error" ? "Couldn't load your API keys" : null}
        onRetry={() => setView("Keys")}
        onCreate={createKey}
        className="max-w-[880px]"
      />
      <div role="group" aria-label="Preview state" className="flex gap-1 rounded-lg bg-paper-2 p-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className="h-7 rounded-md px-2.5 text-[12.5px] text-mute outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 aria-pressed:bg-paper aria-pressed:text-ink aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
