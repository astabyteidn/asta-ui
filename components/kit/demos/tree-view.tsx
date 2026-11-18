"use client";

import { useState } from "react";
import { TreeView, type TreeViewNode } from "@/components/kit/tree-view";

const FILES: TreeViewNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "src/app",
        label: "app",
        children: [
          { id: "src/app/layout.tsx", label: "layout.tsx", meta: "1.2 KB" },
          { id: "src/app/page.tsx", label: "page.tsx", meta: "3.8 KB" },
          { id: "src/app/globals.css", label: "globals.css", meta: "2.1 KB" },
        ],
      },
      {
        id: "src/components",
        label: "components",
        children: [
          { id: "src/components/button.tsx", label: "button.tsx", meta: "2.6 KB" },
          { id: "src/components/card.tsx", label: "card.tsx", meta: "1.4 KB" },
          { id: "src/components/dialog.tsx", label: "dialog.tsx", meta: "4.9 KB" },
        ],
      },
      { id: "src/lib", label: "lib", children: [{ id: "src/lib/utils.ts", label: "utils.ts", meta: "0.6 KB" }] },
    ],
  },
  { id: "public", label: "public", children: [{ id: "public/logo.svg", label: "logo.svg", meta: "0.9 KB" }] },
  { id: "drafts", label: "drafts", children: [] },
  { id: "package.json", label: "package.json", meta: "1.1 KB" },
  { id: "README.md", label: "README.md", meta: "2.3 KB" },
  { id: ".env.local", label: ".env.local", disabled: true },
];

export default function TreeViewDemo() {
  const [sel, setSel] = useState<string | null>("src/app/page.tsx");
  const parts = sel?.split("/") ?? [];

  return (
    <div className="flex min-h-[460px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="rounded-xl bg-paper p-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
          <p className="px-2.5 pb-2 pt-1.5 text-[11.5px] font-medium text-mute">Explorer</p>
          <TreeView nodes={FILES} label="Project files" selected={sel} onSelect={(id) => setSel(id)} defaultExpanded={["src", "src/app"]} />
        </div>
        <p className="flex min-h-5 flex-wrap items-center justify-center gap-1 text-[12.5px] text-mute" aria-live="polite">
          {parts.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              <span className={i === parts.length - 1 ? "text-ink-2" : undefined}>{p}</span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
