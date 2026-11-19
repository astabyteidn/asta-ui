"use client";

import { StepSignIn } from "@/components/kit/variants/sign-in-aui-018";

const checkEmail = (email: string) =>
  new Promise<void>((resolve, reject) => setTimeout(() => (email.startsWith("nobody@") ? reject(new Error("No account for that email.")) : resolve()), 800));

export default function Demo() {
  return (
    <div className="flex min-h-[560px] w-full items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[720px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_30px_60px_-30px_rgb(0_0_0/0.35)]">
        <div className="flex items-center gap-3 px-4 py-3 shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          </span>
          <span className="mx-auto flex items-center gap-1.5 rounded-[7px] bg-paper-2 px-3 py-1 font-mono text-[11.5px] text-mute">
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            app.astabyte.com/login
          </span>
          <span className="w-[42px]" aria-hidden />
        </div>
        <div
          className="flex flex-col items-center bg-paper-2 px-4 pb-6 pt-10"
          style={{ backgroundImage: "radial-gradient(60% 50% at 50% 30%, color-mix(in srgb, var(--color-brand) 10%, transparent), transparent 70%)" }}
        >
          <StepSignIn defaultEmail="daniel.okafor@astabyte.com" onEmail={checkEmail} onSubmit={() => new Promise((r) => setTimeout(r, 1200))} />
          <div className="mt-8 flex w-full max-w-[400px] items-center justify-between text-[12px] text-mute">
            <span>© 2026 Astabyte</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              All systems normal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
