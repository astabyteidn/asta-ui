"use client";

import { useState } from "react";
import { AnnouncementBar, type AnnouncementMessage } from "@/components/kit/announcement-bar";

const ROTATING: AnnouncementMessage[] = [
  { badge: "New", text: "Saved views are here. Pin the filters you use every day.", href: "#views", linkLabel: "See how" },
  { text: "Spring plans are 20% off for the first year.", href: "#pricing", linkLabel: "View plans" },
  { text: "Join the live product walkthrough on Thursday.", href: "#event", linkLabel: "Save a seat" },
];

export default function AnnouncementBarDemo() {
  const [round, setRound] = useState(0);
  const [gone, setGone] = useState(0);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-xl flex-col gap-4">
        {/* A page frame: the bars sit on top, the header below. */}
        <div key={round} className="overflow-hidden rounded-xl bg-paper-2">
          <AnnouncementBar messages={ROTATING} onExited={() => setGone((g) => g + 1)} />
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-[14px] font-medium tracking-[-0.01em] text-ink">Northwind</span>
            <span className="flex gap-4 text-[12.5px] text-mute">
              <span>Product</span>
              <span>Pricing</span>
              <span>Docs</span>
            </span>
          </div>
          <div className="flex flex-col gap-2 px-5 pb-6">
            <span className="h-3 w-2/3 rounded bg-paper" />
            <span className="h-3 w-1/2 rounded bg-paper" />
          </div>
        </div>

        <div key={`s${round}`} className="overflow-hidden rounded-xl">
          <AnnouncementBar variant="subtle" messages={[{ text: "Scheduled maintenance on Sunday, 02:00–03:00 UTC.", href: "#status", linkLabel: "Status page" }]} onExited={() => setGone((g) => g + 1)} />
        </div>

        <p className="text-center text-[12.5px] text-mute">
          Hover to pause the rotation. Close a bar to see it leave.
          {gone > 0 && (
            <>
              {" "}
              <button type="button" onClick={() => {
                  setRound((r) => r + 1);
                  setGone(0);
                }} className="rounded-sm font-medium text-ink-2 underline underline-offset-4 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50">
                Show again
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
