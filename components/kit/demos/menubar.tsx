"use client";

import { useState } from "react";
import { Menubar, type MenubarMenu } from "@/components/kit/menubar";

export default function MenubarDemo() {
  const [last, setLast] = useState("Nothing yet");
  const [ruler, setRuler] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [zoom, setZoom] = useState("100%");
  const [saved, setSaved] = useState(true);
  const act = (name: string) => () => {
    setLast(name);
    if (name === "Save") setSaved(true);
    else if (name !== "Export as PDF") setSaved(false);
  };

  const menus: MenubarMenu[] = [
    {
      label: "File",
      items: [
        { label: "New note", shortcut: "⌘N", onSelect: act("New note") },
        { label: "Open…", shortcut: "⌘O", onSelect: act("Open") },
        { type: "separator" },
        { label: "Save", shortcut: "⌘S", onSelect: act("Save") },
        { label: "Export as PDF", onSelect: act("Export as PDF") },
        { type: "separator" },
        { label: "Share with team", disabled: true },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", shortcut: "⌘Z", onSelect: act("Undo") },
        { label: "Redo", shortcut: "⇧⌘Z", onSelect: act("Redo") },
        { type: "separator" },
        { label: "Cut", shortcut: "⌘X", onSelect: act("Cut") },
        { label: "Copy", shortcut: "⌘C", onSelect: act("Copy") },
        { label: "Paste", shortcut: "⌘V", onSelect: act("Paste") },
        { type: "separator" },
        { label: "Find…", shortcut: "⌘F", onSelect: act("Find") },
      ],
    },
    {
      label: "View",
      items: [
        { type: "checkbox", label: "Show ruler", checked: ruler, onCheckedChange: setRuler },
        { type: "checkbox", label: "Wrap lines", shortcut: "⌥Z", checked: wrap, onCheckedChange: setWrap },
        { type: "separator" },
        { type: "label", label: "Zoom" },
        ...["75%", "100%", "125%"].map((z) => ({ type: "radio" as const, label: z, checked: zoom === z, onSelect: () => setZoom(z) })),
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Keyboard shortcuts", shortcut: "⌘/", onSelect: act("Keyboard shortcuts") },
        { label: "What's new", onSelect: act("What's new") },
        { label: "Contact support", onSelect: act("Contact support") },
      ],
    },
  ];

  return (
    <div className="flex min-h-[460px] w-full items-start justify-center p-4 pt-8 sm:p-10">
      <div className="w-full max-w-[640px] rounded-xl bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_18px_40px_-24px_rgb(0_0_0/0.3)]">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="ml-1.5 mr-1 hidden h-5 w-5 shrink-0 place-items-center rounded-[5px] bg-ink text-[10px] font-semibold text-paper sm:grid">A</span>
          <Menubar menus={menus} label="Astabyte Notes" />
          <span className="ml-auto hidden pr-2 text-[12px] text-mute sm:block">{saved ? "Saved" : "Edited"}</span>
        </div>
        <div className="mx-2 mb-2 rounded-[9px] bg-paper-2 px-5 py-6 sm:px-8">
          {ruler && (
            // A page ruler: a major tick per unit with its number, eight minor ticks between.
            <div
              aria-hidden
              className="relative -mx-1 mb-4 h-4"
              style={{
                backgroundImage:
                  "linear-gradient(to right, color-mix(in srgb, var(--color-ink) 35%, transparent) 1px, transparent 1px), linear-gradient(to right, color-mix(in srgb, var(--color-ink) 18%, transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb, var(--color-ink) 18%, transparent), color-mix(in srgb, var(--color-ink) 18%, transparent))",
                backgroundSize: "calc(100% / 6) 10px, calc(100% / 48) 4px, 100% 1px",
                backgroundPosition: "left bottom, left bottom, left bottom",
                backgroundRepeat: "repeat-x, repeat-x, no-repeat",
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <span key={n} className="absolute top-0 pl-1 font-mono text-[9.5px] leading-none text-mute" style={{ left: `${(n / 6) * 100}%` }}>
                  {n}
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: `${(parseInt(zoom) / 100) * 14}px` }} className="text-ink-2">
            <p className="text-[1.3em] font-medium tracking-[-0.02em] text-ink">Launch week notes</p>
            <p className={`mt-2 leading-relaxed ${wrap ? "" : "truncate"}`}>Ship the new pricing page on Monday, then the changelog post and a short demo video for the newsletter on Wednesday.</p>
          </div>
          <p className="mt-6 text-[12px] text-mute">
            Last action: <span className="text-ink">{last}</span> · Zoom {zoom}
          </p>
        </div>
      </div>
    </div>
  );
}
