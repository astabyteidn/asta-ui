"use client";

import { SignUpCard } from "@/components/kit/variants/sign-in-aui-020";

const signUp = ({ email }: { name: string; email: string; password: string }) =>
  new Promise<void>((resolve, reject) => setTimeout(() => (email.startsWith("taken@") ? reject(new Error("There's already an account with that email.")) : resolve()), 1300));

const FEATURES = ["Unlimited invoices and clients", "Bank sync with 2,400 banks", "Approvals and audit trail", "Priority support, 4h reply"];

export default function Demo() {
  return (
    <div className="@container relative isolate w-full overflow-hidden bg-paper-2 px-4 py-10 sm:px-10">
      <div className="mx-auto grid max-w-[860px] items-center gap-8 @min-[680px]:grid-cols-[1fr_minmax(0,400px)]">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand">Growth plan · 14-day trial</p>
          <h2 className="mt-3 text-[clamp(2rem,4.6cqw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink">
            Get paid on time,
            <br />
            every time.
          </h2>
          <div className="mt-6 flex items-end gap-1.5">
            <span className="flex items-start font-medium leading-none tracking-[-0.04em] text-ink">
              <span className="mr-0.5 mt-1 text-[20px]">$</span>
              <span className="text-[44px] tabular-nums">24</span>
            </span>
            <span className="pb-1.5 text-[13px] text-mute">per seat / month after trial</span>
          </div>
          <ul className="mt-6 flex flex-col gap-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[14px] text-ink">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m3.5 8.5 3 3 6-7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
          <figure className="mt-8 flex items-center gap-3">
            <span className="flex -space-x-1.5">
              {["ML", "DO", "PR"].map((i) => (
                <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10.5px] font-semibold text-paper ring-2 ring-paper-2">
                  {i}
                </span>
              ))}
            </span>
            <figcaption className="text-[13px] leading-snug text-mute">
              <span className="font-medium text-ink">4,000+ finance teams</span>
              <br />
              closed the month 3 days faster.
            </figcaption>
          </figure>
        </div>
        <div className="flex justify-center">
          <SignUpCard defaults={{ name: "Maya Lindqvist", email: "maya@astabyte.com", password: "Astabyte2026" }} onSubmit={signUp} />
        </div>
      </div>
    </div>
  );
}
