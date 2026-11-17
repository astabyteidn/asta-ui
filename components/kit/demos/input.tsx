"use client";

import { useState } from "react";
import { Input, PasswordInput } from "@/components/kit/input";

const Search = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" />
  </svg>
);
const Mail = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="3.5" width="12" height="9" rx="2" />
    <path d="m2.5 4.5 5.5 4 5.5-4" />
  </svg>
);

export default function InputDemo() {
  const [email, setEmail] = useState("hello@astabyte");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Input iconLeft={<Search />} placeholder="Search components" clearable defaultValue="Navbar" aria-label="Search" />
        <div className="flex flex-col gap-1.5">
          <Input
            iconLeft={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            state={email ? (valid ? "success" : "error") : "default"}
            placeholder="you@company.com"
            aria-label="Email"
            aria-describedby="email-hint"
          />
          <p id="email-hint" className={`text-[12.5px] ${email && !valid ? "text-[#e5484d]" : "text-mute"}`}>
            {email && !valid ? "That doesn’t look like an email yet." : valid ? "Looks good." : "We’ll never share it."}
          </p>
        </div>
        <PasswordInput placeholder="Password" defaultValue="correct-horse" aria-label="Password" />
        <div className="flex gap-2">
          <Input size="sm" placeholder="Small" aria-label="Small" />
          <Input size="sm" placeholder="Disabled" disabled aria-label="Disabled" />
        </div>
        <Input size="lg" placeholder="Large" aria-label="Large" />
      </div>
    </div>
  );
}
