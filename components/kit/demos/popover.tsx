"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "@/components/kit/popover";

const LINK = "https://docs.astabyte.com/q4-launch-plan";

const PEOPLE = [
  { name: "Ana Lindqvist", initials: "AL", role: "Product lead", team: "Launch team", docs: 42, since: "2023" },
  { name: "Kenji Moto", initials: "KM", role: "Designer", team: "Brand", docs: 18, since: "2024" },
];

const triggerBtn =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium outline-none transition-[background-color,transform] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50";

function CopyField() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(LINK).catch(() => {});
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex h-9 items-center gap-1 rounded-lg bg-paper-2 pl-3 pr-1">
      <input readOnly value={LINK} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} className="h-full min-w-0 flex-1 truncate bg-transparent text-[16px] sm:text-[12.5px] text-ink-2 outline-none" />
      <button
        type="button"
        data-autofocus
        onClick={copy}
        className="relative inline-flex h-7 w-[72px] items-center justify-center overflow-hidden rounded-md bg-paper text-[12.5px] font-medium text-ink outline-none shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] transition-transform duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <span className={`transition-[transform,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${copied ? "-translate-y-3 opacity-0" : ""}`}>Copy</span>
        <span className={`absolute inset-0 flex items-center justify-center gap-1 text-brand transition-[transform,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${copied ? "" : "translate-y-3 opacity-0"}`} aria-hidden={!copied}>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
          Copied
        </span>
      </button>
    </div>
  );
}

export default function PopoverDemo() {
  const [access, setAccess] = useState<"view" | "edit">("view");

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="rounded-xl bg-paper-2 p-4 pl-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink">Q4 launch plan</p>
              <p className="mt-0.5 text-[12.5px] text-mute">Edited 4 minutes ago</p>
            </div>
            <Popover
              align="end"
              label="Share Q4 launch plan"
              className="w-[320px] p-4"
              trigger={
                <button type="button" className={`${triggerBtn} bg-ink text-paper hover:bg-[color-mix(in_srgb,var(--color-ink)_84%,var(--color-paper))] data-[state=open]:bg-[color-mix(in_srgb,var(--color-ink)_84%,var(--color-paper))]`}>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M8 2.5v8M5 5.5l3-3 3 3M3.5 9.5v4h9v-4" />
                  </svg>
                  Share
                </button>
              }
            >
              {({ close }) => (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[14px] font-medium tracking-[-0.01em] text-ink">Share this doc</p>
                    <p className="mt-0.5 text-[12.5px] text-mute">Anyone with the link can {access}.</p>
                  </div>
                  <CopyField />
                  <div role="radiogroup" aria-label="Link access" className="grid grid-cols-2 gap-1 rounded-lg bg-paper-2 p-1">
                    {(["view", "edit"] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        role="radio"
                        aria-checked={access === a}
                        onClick={() => setAccess(a)}
                        className={`h-7 rounded-md text-[12.5px] font-medium capitalize outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/50 ${access === a ? "bg-paper text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-mute hover:text-ink"}`}
                      >
                        Can {a}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={close} className="h-8 self-end rounded-md px-3 text-[12.5px] font-medium text-ink-2 outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50">
                    Done
                  </button>
                </div>
              )}
            </Popover>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-[14px] text-ink-2">Editors</p>
          <div className="flex items-center gap-1.5">
            {PEOPLE.map((p) => (
              <Popover
                key={p.name}
                side="top"
                arrow
                label={p.name}
                className="w-[248px] p-4"
                trigger={(props, open) => (
                  <button
                    {...props}
                    type="button"
                    aria-label={p.name}
                    className={`grid h-9 w-9 place-items-center rounded-full text-[12px] font-medium outline-none transition-[transform,background-color] duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${open ? "bg-brand text-white" : "bg-paper-2 text-ink"}`}
                  >
                    {p.initials}
                  </button>
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-medium text-white">{p.initials}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink">{p.name}</p>
                    <p className="truncate text-[12.5px] text-mute">
                      {p.role} · {p.team}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div className="rounded-lg bg-paper-2 px-2.5 py-2">
                    <p className="text-mute">Docs</p>
                    <p className="mt-0.5 text-[14px] font-medium tabular-nums text-ink">{p.docs}</p>
                  </div>
                  <div className="rounded-lg bg-paper-2 px-2.5 py-2">
                    <p className="text-mute">Member since</p>
                    <p className="mt-0.5 text-[14px] font-medium tabular-nums text-ink">{p.since}</p>
                  </div>
                </div>
                <button type="button" className={`${triggerBtn} mt-3 h-8 w-full justify-center bg-ink text-paper hover:bg-[color-mix(in_srgb,var(--color-ink)_84%,var(--color-paper))]`}>
                  Message
                </button>
              </Popover>
            ))}
          </div>
        </div>

        <p className="text-center text-[12.5px] text-mute">Click Share or an avatar. Esc or a click outside closes it.</p>
      </div>
    </div>
  );
}
