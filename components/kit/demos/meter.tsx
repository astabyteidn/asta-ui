"use client";

import { useState } from "react";
import { Button } from "@/components/kit/button";
import { Meter } from "@/components/kit/meter";

const gb = (n: number) => `${n.toFixed(1)} GB`;

const FULL = [
  { label: "Photos", value: 38.4 },
  { label: "Videos", value: 27.9 },
  { label: "Documents", value: 9.6 },
  { label: "Other", value: 4.1 },
];

export default function MeterDemo() {
  const [cleaned, setCleaned] = useState(false);
  const [calls, setCalls] = useState(8420);
  const storage = cleaned ? FULL.map((s) => (s.label === "Videos" ? { ...s, value: 11.2 } : s.label === "Other" ? { ...s, value: 0.8 } : s)) : FULL;

  return (
    <div className="flex min-h-[460px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-[520px] flex-col gap-8">
        <Meter
          label="Storage"
          max={100}
          segments={storage}
          format={gb}
          warnAt={0.85}
          warning="Running low on space"
          action={
            <Button size="xs" variant="ghost" onClick={() => setCleaned((c) => !c)}>
              {cleaned ? "Undo clean-up" : "Clean up"}
            </Button>
          }
        />
        <Meter
          label="API requests this month"
          value={calls}
          max={10_000}
          action={
            <Button size="xs" variant="ghost" onClick={() => setCalls((c) => (c >= 9800 ? 6200 : c + 700))}>
              {calls >= 9800 ? "Reset" : "Send 700"}
            </Button>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Meter label="Seats" value={7} max={10} size="sm" format={(n) => String(n)} />
          <Meter label="Projects" value={3} max={5} size="sm" format={(n) => String(n)} />
        </div>
      </div>
    </div>
  );
}
