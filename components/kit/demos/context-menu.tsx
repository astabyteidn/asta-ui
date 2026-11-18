"use client";

import { useState, type ReactNode } from "react";
import { ContextMenu, type ContextMenuEntry } from "@/components/kit/context-menu";

const icon = (d: string): ReactNode => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

export default function ContextMenuDemo() {
  const [last, setLast] = useState<string | null>(null);
  const act = (label: string) => () => setLast(label);

  const items: ContextMenuEntry[] = [
    { label: "Open", icon: icon("M2.5 4.5h4l1.5 1.5h5.5v6.5h-11z"), shortcut: "⌘O", onSelect: act("Opened") },
    { label: "Copy link", icon: icon("M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 0 1 4.5 9l1-1"), shortcut: "⌘L", onSelect: act("Link copied") },
    { label: "Duplicate", icon: icon("M5.5 5.5h7v7h-7zM3.5 10.5v-7h7"), shortcut: "⌘D", onSelect: act("Duplicated") },
    "separator",
    {
      label: "Move to",
      icon: icon("M3 8h9M9 4.5 12.5 8 9 11.5"),
      items: [
        { label: "Inbox", onSelect: act("Moved to Inbox") },
        { label: "Shared with me", onSelect: act("Moved to Shared with me") },
        { label: "Archive", onSelect: act("Moved to Archive") },
      ],
    },
    { label: "Rename", icon: icon("M10.5 3.5l2 2-7 7h-2v-2z"), shortcut: "F2", onSelect: act("Renaming") },
    { label: "Add to favourites", icon: icon("M8 3l1.5 3.2 3.5.4-2.6 2.4.7 3.5L8 10.8 4.9 12.5l.7-3.5L3 6.6l3.5-.4z"), disabled: true },
    "separator",
    { label: "Move to trash", icon: icon("M3.5 5h9M6.5 5V3.5h3V5M4.5 5l.6 7.5h5.8l.6-7.5"), shortcut: "⌫", onSelect: act("Moved to trash") },
  ];

  return (
    <div className="flex min-h-[460px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-4">
        <ContextMenu items={items} label="File actions" contained className="rounded-xl">
          <div className="flex flex-col gap-3 rounded-xl bg-paper-2 p-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[10px]">
              <img src="/lab/headphones.jpg" alt="" draggable={false} className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center justify-between gap-3 px-1 pb-1">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink">studio-shot-04.jpg</p>
                <p className="mt-0.5 text-[12.5px] text-mute">2.4 MB · Edited yesterday</p>
              </div>
              <span className="shrink-0 text-[12px] text-mute">JPG</span>
            </div>
          </div>
        </ContextMenu>
        <p className="text-center text-[12.5px] text-mute" aria-live="polite">
          {last ? (
            <>
              <span className="text-ink-2">{last}</span> · right-click again
            </>
          ) : (
            "Right-click the card, long-press on touch, or focus it and press Shift+F10."
          )}
        </p>
      </div>
    </div>
  );
}
