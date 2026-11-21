"use client";

import { useState } from "react";
import { InlineEdit } from "@/components/kit/inline-edit";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function InlineEditDemo() {
  const [title, setTitle] = useState("Homepage refresh");

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="rounded-xl bg-paper-2 p-5">
          <p className="text-[12px] text-mute">Project</p>
          <div className="mt-1">
            <InlineEdit label="Project name" size="lg" required value={title} onSave={async (v) => { await wait(450); setTitle(v); }} />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-[13px] text-mute">Owner</span>
              <InlineEdit label="Owner" size="sm" defaultValue="Maya Rahman" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-[13px] text-mute">Due</span>
              <InlineEdit label="Due date" size="sm" defaultValue="Friday, 14 Nov" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-[13px] text-mute">Notes</span>
              <InlineEdit label="Notes" size="sm" placeholder="Add a note…" maxLength={60} />
            </div>
          </div>
        </div>

        <p className="text-center text-[12.5px] text-mute">Click or press Enter to edit. Enter saves, Esc puts the old text back.</p>
      </div>
    </div>
  );
}
