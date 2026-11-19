"use client";

import { SocialSignIn } from "@/components/kit/variants/sign-in-aui-017";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const DEPLOYS = [
  { name: "checkout-api", branch: "main", time: "2m ago", state: "Live" },
  { name: "web", branch: "release/4.2", time: "18m ago", state: "Live" },
  { name: "search-worker", branch: "main", time: "1h ago", state: "Live" },
];

export default function Demo() {
  return (
    <div className="@container relative isolate w-full overflow-hidden bg-paper px-5 py-10 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(50% 60% at 78% 45%, color-mix(in srgb, var(--color-brand) 12%, transparent), transparent 70%)" }}
      />
      <div className="mx-auto grid max-w-[880px] grid-cols-[minmax(0,1fr)] items-center gap-10 @min-[700px]:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand">Astabyte</p>
          <h2 className="mt-3 text-[clamp(2.25rem,6cqw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink">
            Ship on Friday.
            <br />
            Sleep easy.
          </h2>
          <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-mute">Previews for every branch, instant rollbacks and logs that make sense at 2am.</p>
          <ul className="mt-7 flex max-w-[360px] flex-col gap-1">
            {DEPLOYS.map((d) => (
              <li key={d.name} className="flex items-center gap-3 rounded-[9px] px-3 py-2.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand/60 motion-reduce:animate-none" />
                  <span className="relative h-2 w-2 rounded-full bg-brand" />
                </span>
                <span className="text-[13.5px] font-medium text-ink">{d.name}</span>
                <span className="truncate font-mono text-[11.5px] text-mute">{d.branch}</span>
                <span className="ml-auto shrink-0 text-[12px] text-mute">{d.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <SocialSignIn hint onProvider={() => wait(1400)} onEmail={() => wait(1100)} />
        </div>
      </div>
    </div>
  );
}
