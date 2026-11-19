"use client";

import { useState } from "react";
import { Button } from "@/components/kit/button";
import { Field, fieldInputClass } from "@/components/kit/field";

export default function FieldDemo() {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [errors, setErrors] = useState<{ email?: string; handle?: string }>({});
  const [done, setDone] = useState(false);

  const validate = () => ({
    email: !email ? "Enter your email." : !/^\S+@\S+\.\S+$/.test(email) ? "That doesn't look like an email address." : undefined,
    handle: handle.length < 3 ? "Use at least 3 characters." : undefined,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setDone(!next.email && !next.handle);
  };

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <form onSubmit={submit} noValidate className="flex w-full max-w-sm flex-col gap-5">
        <Field label="Email" required hint="We'll send a sign-in link here." error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => email && setErrors((x) => ({ ...x, email: validate().email }))}
            placeholder="you@company.com"
            className={fieldInputClass}
          />
        </Field>
        <Field label="Username" aside={`${handle.length}/20`} hint="Letters, numbers and dashes." error={errors.handle}>
          <input
            value={handle}
            maxLength={20}
            onChange={(e) => setHandle(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
            placeholder="ada-lovelace"
            className={fieldInputClass}
          />
        </Field>
        <Field label="Company" aside="Optional">
          <input placeholder="Astabyte" className={fieldInputClass} />
        </Field>
        <Button type="submit" variant={done ? "outline" : "solid"} className="mt-1 w-full">
          {done ? "✓ Looks good" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
