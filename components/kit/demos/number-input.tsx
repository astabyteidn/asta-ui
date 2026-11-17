"use client";

import { useState } from "react";
import { NumberInput } from "@/components/kit/number-input";

export default function NumberInputDemo() {
  const [seats, setSeats] = useState(8);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-paper-2 p-4 pl-5">
          <div>
            <p className="text-[14px] font-medium tracking-[-0.01em] text-ink">Seats</p>
            <p className="mt-0.5 text-[13px] tabular-nums text-mute">${seats * 12}/month</p>
          </div>
          <NumberInput label="Seats" value={seats} onChange={setSeats} min={1} max={250} />
        </div>
        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-[14px] text-ink-2">Quantity</p>
          <NumberInput label="Quantity" size="sm" defaultValue={1} min={1} max={10} />
        </div>
        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-[14px] text-ink-2">Weight</p>
          <NumberInput label="Weight" size="sm" defaultValue={20} step={5} max={300} suffix="kg" />
        </div>
        <p className="text-center text-[12.5px] text-mute">Hold − or + to repeat. Arrows, Page Up/Down and digits work too.</p>
      </div>
    </div>
  );
}
