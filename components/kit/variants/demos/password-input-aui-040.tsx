"use client";

import { useState } from "react";
import { ChecklistPassword } from "@/components/kit/variants/password-input-aui-040";

export default function Demo() {
  const [valid, setValid] = useState(false);
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center bg-paper-2 p-5 sm:p-8">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-full max-w-[440px] rounded-[14px] bg-paper p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]"
      >
        <div className="mb-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Settings · Security</p>
          <h3 className="mt-1 text-[20px] font-medium tracking-[-0.02em] text-ink">Change password</h3>
        </div>
        <ChecklistPassword defaultValue="astabyte2" onChange={(_, ok) => setValid(ok)} />
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-mute">Signs out other devices</span>
          <button
            type="submit"
            disabled={!valid}
            className="h-10 shrink-0 rounded-[9px] bg-ink px-4 text-[13.5px] font-medium text-paper outline-none transition-[opacity,transform] duration-200 active:scale-[.97] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
          >
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}
