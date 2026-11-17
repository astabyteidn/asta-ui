"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/kit/segmented-control";

const Grid = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
    <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
    <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
    <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
  </svg>
);
const List = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h0M2.5 8h0M2.5 12h0" />
  </svg>
);
const Board = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="2.5" y="2.5" width="3.5" height="11" rx="1" />
    <rect x="7.5" y="2.5" width="3.5" height="7" rx="1" />
  </svg>
);

export default function SegmentedControlDemo() {
  const [range, setRange] = useState("week");

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <SegmentedControl
            label="Range"
            value={range}
            onChange={setRange}
            segments={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "year", label: "Year" },
            ]}
          />
          <p className="text-[13px] text-mute">
            Showing the last <span className="text-ink">{range}</span>
          </p>
        </div>
        <SegmentedControl
          label="Layout"
          size="sm"
          defaultValue="grid"
          segments={[
            { value: "grid", label: "Grid", icon: <Grid /> },
            { value: "list", label: "List", icon: <List /> },
            { value: "board", label: "Board", icon: <Board /> },
          ]}
        />
        <SegmentedControl
          label="Billing"
          full
          defaultValue="yearly"
          segments={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly · save 20%" },
          ]}
        />
      </div>
    </div>
  );
}
