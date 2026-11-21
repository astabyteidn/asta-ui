"use client";

import { useState } from "react";
import { Button } from "@/components/kit/button";
import { PhoneInput, type PhoneValue } from "@/components/kit/phone-input";

export default function PhoneInputDemo() {
  const [value, setValue] = useState<PhoneValue | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex min-h-[460px] w-full items-start justify-center p-6 pt-12 sm:p-10 sm:pt-14">
      <form
        className="flex w-full max-w-[380px] flex-col gap-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (value?.valid) return setSent(true);
          // The button stays enabled: an unfinished number gets a message and focus instead.
          setError(value?.e164 ? "Finish the number, then send the code." : "Enter your phone number first.");
          (e.currentTarget.elements.namedItem("phone") as HTMLInputElement | null)?.focus();
        }}
      >
        <div>
          <p className="text-[18px] font-medium tracking-[-0.02em] text-ink">Turn on two-step sign-in</p>
          <p className="mt-1 text-[13px] leading-snug text-mute">We text a six-digit code to this number each time you sign in to Astabyte.</p>
        </div>
        <PhoneInput
          defaultCountry="ID"
          hint="Try pasting +44 7700 900123"
          name="phone"
          error={error}
          onChange={(v) => {
            setValue(v);
            setSent(false);
            setError("");
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[12px] tabular-nums text-mute" aria-live="polite">
            {sent ? `Code sent to ${value?.e164}` : value?.e164 ? `${value.e164}${value.valid ? "" : " · keep typing"}` : "No number yet"}
          </p>
          <Button type="submit" size="sm" variant="accent">
            Send code
          </Button>
        </div>
      </form>
    </div>
  );
}
