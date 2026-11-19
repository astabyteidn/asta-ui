"use client";

import { useEffect, useRef } from "react";
import { StatusFooter } from "@/components/kit/variants/footer-aui-028";

const EVENTS = [
  { name: "deploy.succeeded", desc: "A build finished and is live on the edge." },
  { name: "deploy.failed", desc: "A build stopped. The payload has the log URL." },
  { name: "domain.verified", desc: "DNS checks passed for a custom domain." },
  { name: "usage.threshold", desc: "A project crossed 80% of its monthly quota." },
];

export default function Demo() {
  // Start at the bottom so the footer is in view. Scroll up, then try Back to top.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-4 sm:p-8">
      <div
        ref={box}
        className="h-[560px] w-full max-w-[920px] overflow-y-auto rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]"
      >
        <article className="px-6 pb-12 pt-10 @container sm:px-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">API reference · Webhooks</p>
          <h2 className="mt-3 text-[34px] font-medium leading-[1.04] tracking-[-0.045em] text-ink sm:text-[44px]">Listen for deploy events</h2>
          <p className="mt-4 max-w-[58ch] text-[14.5px] leading-relaxed text-mute">
            Point a webhook at any HTTPS endpoint. We sign every request with your project secret and retry for up to 24 hours.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-[12px] bg-ink p-5 font-mono text-[12.5px] leading-relaxed text-paper/85">
            <code>{`curl https://api.astabyte.com/v1/hooks \\
  -H "Authorization: Bearer $ASTABYTE_TOKEN" \\
  -d url=https://example.com/hooks/astabyte \\
  -d events=deploy.succeeded,deploy.failed`}</code>
          </pre>
          <h3 className="mt-10 text-[20px] font-medium tracking-[-0.02em] text-ink">Events</h3>
          <ul className="mt-4 flex flex-col gap-1">
            {EVENTS.map((e) => (
              <li key={e.name} className="flex flex-col gap-1 rounded-[10px] bg-paper-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
                <code className="w-44 shrink-0 font-mono text-[12.5px] text-brand">{e.name}</code>
                <span className="text-[13.5px] text-ink-2">{e.desc}</span>
              </li>
            ))}
          </ul>
        </article>
        <StatusFooter className="bg-paper" />
      </div>
    </div>
  );
}
