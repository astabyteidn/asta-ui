"use client";

import { ClipboardButton } from "@/components/kit/copy-button";

const KEY = "nw_live_8f2k4q9xm3t7v1p6";
const INVITE = "https://app.astabyte.com/join/7f3k-q9xm";

export default function CopyButtonDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="rounded-xl bg-paper-2 p-4 pl-5">
          <p className="text-[12px] text-mute">Secret key</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <code className="truncate font-mono text-[13px] text-ink">{KEY.slice(0, 12)}••••••••</code>
            <ClipboardButton value={KEY} aria-label="Copy secret key" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <code className="truncate font-mono text-[13px] text-ink-2">bunx asta-ui@latest add copy-button</code>
          <ClipboardButton value="bunx asta-ui@latest add copy-button" size="sm" variant="soft" aria-label="Copy command" />
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium tracking-[-0.01em] text-ink">Invite link</p>
            <p className="truncate text-[12.5px] text-mute">{INVITE}</p>
          </div>
          <ClipboardButton value={INVITE} label="Copy link" copiedLabel="Link copied" variant="outline" />
        </div>

        <p className="text-center text-[12.5px] text-mute">The check shows for a moment, then the button settles back.</p>
      </div>
    </div>
  );
}
