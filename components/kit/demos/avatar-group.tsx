"use client";

import { useState } from "react";
import { AvatarStack } from "@/components/kit/avatar-group";

const TEAM = [
  { name: "Maya Rahman" },
  { name: "Tomás Kirsch" },
  { name: "Ayu Lestari" },
  { name: "Jonah Weiss" },
  { name: "Lena Okafor" },
  { name: "Ravi Menon" },
  { name: "Sofia Lund" },
  { name: "Kenji Ito" },
];

export default function AvatarGroupDemo() {
  const [all, setAll] = useState(false);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="rounded-xl bg-paper-2 p-5">
          <p className="text-[12px] text-mute">Q3 launch · Design</p>
          <p className="mt-1 text-[15px] font-medium tracking-[-0.01em] text-ink">Homepage refresh</p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <AvatarStack label="Project members" people={TEAM} max={all ? TEAM.length : 4} onOverflowClick={() => setAll(true)} />
            {all ? (
              <button type="button" onClick={() => setAll(false)} className="rounded-[7px] px-2 py-1 text-[12.5px] text-mute outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50">
                Collapse
              </button>
            ) : (
              <span className="text-[12.5px] text-mute">{TEAM.length} members</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 px-1">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[14px] text-ink-2">Viewing now</p>
            <AvatarStack size="sm" people={TEAM.slice(0, 3)} label="3 people viewing" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[14px] text-ink-2">Reviewers</p>
            <AvatarStack size="lg" max={3} people={TEAM.slice(2)} label="Reviewers" />
          </div>
        </div>

        <p className="text-center text-[12.5px] text-mute">Hover the stack to spread it. Tab in, then use the arrow keys to read each name.</p>
      </div>
    </div>
  );
}
