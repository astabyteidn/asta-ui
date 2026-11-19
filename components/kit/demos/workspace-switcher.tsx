"use client";

import { useState } from "react";
import { WorkspaceSwitcher, type Workspace } from "@/components/kit/workspace-switcher";

const WORKSPACES: Workspace[] = [
  { id: "studio", name: "Astabyte Studio", plan: "Pro", meta: "12 members" },
  { id: "labs", name: "Astabyte Labs", plan: "Team", meta: "4 members" },
  { id: "me", name: "Personal", plan: "Free", meta: "Just you" },
];

const NAV = ["Recents", "Drafts", "All projects", "Trash"];

export default function WorkspaceSwitcherDemo() {
  const [ws, setWs] = useState("studio");
  const [extra, setExtra] = useState(0);
  const list = [...WORKSPACES, ...Array.from({ length: extra }, (_, i) => ({ id: `new-${i}`, name: `Untitled workspace ${i + 1}`, plan: "Free", meta: "Just you" }))];
  const current = list.find((w) => w.id === ws)!;
  return (
    <div className="flex min-h-[460px] w-full items-start justify-center p-6 sm:p-10">
      <div className="flex h-[380px] w-full max-w-2xl overflow-hidden rounded-[14px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
        <aside className="w-64 shrink-0 bg-paper-2 p-2">
          <WorkspaceSwitcher
            workspaces={list}
            value={ws}
            onChange={setWs}
            onCreate={() => {
              setExtra((n) => n + 1);
              setWs(`new-${extra}`);
            }}
            account={{ name: "Rina Putri", email: "rina@astabyte.com" }}
          />
          <nav className="mt-3 space-y-0.5">
            {NAV.map((n, i) => (
              <span key={n} className={`block rounded-[8px] px-2.5 py-1.5 text-[13px] ${i === 0 ? "bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] text-ink" : "text-ink-2"}`}>
                {n}
              </span>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 bg-paper p-5">
          <p className="text-[15px] font-medium text-ink">{current.name}</p>
          <p className="mt-1 text-[13px] text-mute">{current.meta}. Open the menu on the left, or focus it and press ↓.</p>
        </main>
      </div>
    </div>
  );
}
