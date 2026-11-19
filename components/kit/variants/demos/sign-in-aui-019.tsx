"use client";

import { useRef } from "react";
import { PasskeySignIn } from "@/components/kit/variants/sign-in-aui-019";

const METHODS = [
  { label: "Face ID", d: "M3 6V4.5A1.5 1.5 0 0 1 4.5 3H6M10 3h1.5A1.5 1.5 0 0 1 13 4.5V6M13 10v1.5a1.5 1.5 0 0 1-1.5 1.5H10M6 13H4.5A1.5 1.5 0 0 1 3 11.5V10M6 6.5v1M10 6.5v1M8 6.5V9h-.5M6.2 10.5c1 .8 2.6.8 3.6 0" },
  { label: "Touch ID", d: "M4.5 5.5a4.5 4.5 0 0 1 8 2.5v1M3.5 9V8M6 12.5c-.3-.9-.5-2-.5-3.2V8a2.5 2.5 0 0 1 5 0v1M8 8v1.8c0 1.2.2 2.2.6 3.2" },
  { label: "Security key", d: "M6 2.5h4v6H6zM5 8.5h6V13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8.5ZM7.5 4.5h1" },
];

export default function Demo() {
  // The first try fails so you can see the error, the next one succeeds.
  const tries = useRef(0);
  const passkey = () =>
    new Promise<void>((resolve, reject) => setTimeout(() => (tries.current++ === 0 ? reject(new Error("The request timed out. Try again.")) : resolve()), 2000));
  return (
    <div className="relative isolate flex min-h-[620px] w-full flex-col items-center justify-center overflow-hidden bg-paper px-4 py-10 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(45% 50% at 50% 42%, color-mix(in srgb, var(--color-brand) 14%, transparent), transparent 70%)" }}
      />
      <p className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Passwords are optional now</p>
      <PasskeySignIn onPasskey={passkey} onPassword={() => new Promise((r) => setTimeout(r, 1200))} />
      <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {METHODS.map((m) => (
          <li key={m.label} className="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12.5px] text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-mute" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={m.d} />
            </svg>
            {m.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
