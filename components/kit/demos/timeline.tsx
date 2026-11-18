"use client";

import { Timeline, type TimelineItem } from "@/components/kit/timeline";

const EVENTS: TimelineItem[] = [
  { title: "Order placed", description: "Linen overshirt and canvas tote", time: "Mon 09:41" },
  { title: "Packed", description: "Lisbon warehouse", time: "Mon 16:20" },
  { title: "On the way", description: "Arriving between 14:00 and 16:00", time: "Today", state: "active" },
  { title: "Delivered", description: "Leave at the front door", state: "pending" },
];

export default function TimelineDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-sm rounded-xl bg-paper-2 p-5">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">Order #10482</p>
          <span className="text-[12px] text-mute">Tracking 4R7-22X</span>
        </div>
        <Timeline items={EVENTS} label="Delivery progress" />
      </div>
    </div>
  );
}
