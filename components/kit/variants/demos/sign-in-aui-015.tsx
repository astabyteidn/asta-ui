"use client";

import { MagicLinkSignIn } from "@/components/kit/variants/sign-in-aui-015";

const send = (email: string) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (email.endsWith("@blocked.com") ? reject(new Error("That domain can't receive sign-in links.")) : resolve()), 1100),
  );

export default function Demo() {
  return (
    <div className="relative isolate flex min-h-[560px] w-full flex-col items-center justify-center overflow-hidden bg-paper-2 px-4 py-10 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 38%, color-mix(in srgb, var(--color-brand) 16%, transparent), transparent 70%), radial-gradient(40% 40% at 80% 90%, color-mix(in srgb, var(--color-brand) 8%, transparent), transparent 70%)",
        }}
      />
      <MagicLinkSignIn defaultEmail="maya@astabyte.com" onSend={send} />
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Trusted by 4,000 finance teams</p>
      </div>
    </div>
  );
}
