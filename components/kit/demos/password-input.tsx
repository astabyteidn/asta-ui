"use client";

import { useState } from "react";
import { Button } from "@/components/kit/button";
import { PasswordField } from "@/components/kit/password-input";

export default function PasswordInputDemo() {
  const [strong, setStrong] = useState(false);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <form onSubmit={(e) => e.preventDefault()} className="flex w-full max-w-sm flex-col gap-6 rounded-xl bg-paper-2 p-5">
        <div>
          <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">Choose a new password</p>
          <p className="mt-1 text-[13px] text-mute">You will use it to sign in on every device.</p>
        </div>
        <PasswordField label="New password" placeholder="Type a password…" onChange={(_, s) => setStrong(s.strong)} />
        <Button type="submit" disabled={!strong}>
          Update password
        </Button>
      </form>
    </div>
  );
}
