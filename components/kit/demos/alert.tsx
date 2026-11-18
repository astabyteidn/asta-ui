"use client";

import { useState } from "react";
import { Alert } from "@/components/kit/alert";

const link = "text-[13px] font-medium text-brand outline-none underline-offset-4 hover:underline focus-visible:underline";

export default function AlertDemo() {
  const [key, setKey] = useState(0);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div key={key} className="flex w-full max-w-md flex-col gap-3">
        <Alert tone="info" title="New billing dashboard" dismissible>
          Invoices and receipts now live in one place.
        </Alert>
        <Alert
          tone="warning"
          title="Your card expires next week"
          action={
            <button type="button" className={link}>
              Update card
            </button>
          }
        >
          Update it before 1 December to keep your plan running.
        </Alert>
        <Alert tone="success" dismissible>
          Domain verified. Emails now send from hello@northwind.studio.
        </Alert>
        <Alert tone="neutral">Read-only access. Ask an admin to make changes.</Alert>
        <button type="button" onClick={() => setKey((k) => k + 1)} className="mt-3 self-center text-[12.5px] text-mute outline-none hover:text-ink focus-visible:text-ink">
          Dismiss one, then reset
        </button>
      </div>
    </div>
  );
}
