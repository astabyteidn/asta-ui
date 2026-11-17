"use client";

import { useState } from "react";
import { Button } from "@/components/kit/button";
import { Toaster, useToast } from "@/components/kit/toast";

function Buttons() {
  const { toast } = useToast();
  const [archived, setArchived] = useState(0);

  return (
    <div className="flex max-w-sm flex-wrap justify-center gap-2.5">
      <Button variant="outline" onClick={() => toast({ title: "Changes saved", description: "Your profile is up to date.", tone: "success" })}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast({ title: "Payment failed", description: "The card was declined. Try another one.", tone: "error" })}>
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setArchived((n) => n + 1);
          toast({ title: "Conversation archived", action: { label: "Undo", onClick: () => setArchived((n) => n - 1) } });
        }}
      >
        With action
      </Button>
      <Button variant="soft" onClick={() => toast({ title: "Link copied" })}>
        Plain
      </Button>
      <p className="w-full text-center text-[12px] text-mute">
        Archived: <span className="tabular-nums text-ink">{archived}</span> · hover the stack to fan it out, swipe a toast to dismiss
      </p>
    </div>
  );
}

export default function ToastDemo() {
  return (
    <div className="relative flex min-h-[420px] w-full items-start justify-center overflow-hidden p-6 pt-12 sm:p-10 sm:pt-16">
      <Toaster contained>
        <Buttons />
      </Toaster>
    </div>
  );
}
