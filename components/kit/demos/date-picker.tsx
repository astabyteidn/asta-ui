"use client";

import { useState } from "react";
import { DatePicker, type DateRange } from "@/components/kit/date-picker";

const NIGHTLY = 148;

export default function DatePickerDemo() {
  const [stay, setStay] = useState<DateRange>({ start: null, end: null });
  const nights = stay.start && stay.end ? Math.round((stay.end.getTime() - stay.start.getTime()) / 864e5) : 0;

  return (
    <div className="flex min-h-[420px] w-full items-start justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="rounded-xl bg-paper-2 p-4 pl-5">
          <p className="text-[14px] font-medium tracking-[-0.01em] text-ink">Loft by the harbour</p>
          <p className="mt-0.5 text-[13px] tabular-nums text-mute">
            ${NIGHTLY} / night{nights > 0 && ` · ${nights} night${nights === 1 ? "" : "s"} · $${nights * NIGHTLY}`}
          </p>
          <div className="mt-3">
            <DatePicker mode="range" label="Check-in and check-out" placeholder="Check-in → Check-out" value={stay} onChange={setStay} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 px-1">
          <p className="text-[13px] font-medium tracking-[-0.01em] text-ink">Invoice due</p>
          <DatePicker label="Invoice due" size="sm" locale="en-GB" weekStartsOn={1} />
        </div>
        <p className="text-center text-[12.5px] text-mute">Arrows move days, Page Up/Down months, Enter picks, Esc closes.</p>
      </div>
    </div>
  );
}
