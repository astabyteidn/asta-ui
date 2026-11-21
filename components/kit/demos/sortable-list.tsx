"use client";

import { useState } from "react";
import { SortableList } from "@/components/kit/sortable-list";

interface Item {
  id: string;
  title: string;
  team: string;
  votes: number;
}

const START: Item[] = [
  { id: "sso", title: "Single sign-on for teams", team: "Platform", votes: 214 },
  { id: "export", title: "Export reports as CSV", team: "Insights", votes: 168 },
  { id: "dark", title: "Dark mode for the editor", team: "Design", votes: 152 },
  { id: "mobile", title: "Offline mode on mobile", team: "Apps", votes: 97 },
  { id: "api", title: "Webhooks for new orders", team: "Platform", votes: 83 },
];

export default function SortableListDemo() {
  const [items, setItems] = useState(START);
  const changed = items.some((it, i) => it.id !== START[i].id);

  return (
    <div className="flex min-h-[480px] w-full items-center justify-center p-5 sm:p-10">
      <div className="w-full max-w-[460px]">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium tracking-[-0.01em] text-ink">Q1 priorities</p>
            <p className="mt-0.5 text-[12.5px] text-mute">Drag by the handle, or focus it and press Space.</p>
          </div>
          <button
            type="button"
            onClick={() => setItems(START)}
            disabled={!changed}
            className="shrink-0 rounded-md px-2 py-1 text-[12.5px] text-mute outline-none transition-opacity hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-0"
          >
            Reset
          </button>
        </div>
        <SortableList
          label="Q1 priorities"
          items={items}
          onReorder={setItems}
          getLabel={(it) => it.title}
          renderItem={(it, { index }) => (
            <div className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center font-mono text-[12px] tabular-nums text-mute">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink">{it.title}</p>
                <p className="text-[12px] text-mute">{it.team}</p>
              </div>
              <span className="shrink-0 rounded-md bg-paper-2 px-2 py-0.5 text-[11.5px] tabular-nums text-ink-2">▲ {it.votes}</span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
