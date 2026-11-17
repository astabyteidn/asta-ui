"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/kit/button";
import { CommandPalette, type Command } from "@/components/kit/command-palette";

const icon = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const DOC = "M4 1.5h5L12.5 5v9.5h-8.5zM9 1.5V5h3.5";
const CLOCK = "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 5v3l2 1.5";

export default function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const inside = useRef(false);

  // ⌘J / Ctrl+J opens it, but only while the pointer or focus is inside this demo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const here = inside.current || root.current?.contains(document.activeElement);
      if (here && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (label: string) => () => setLast(label);
  const commands: Command[] = [
    { id: "r1", group: "Recent", label: "Pricing page", icon: icon(CLOCK), onSelect: go("Pricing page") },
    { id: "r2", group: "Recent", label: "Invite teammates", icon: icon(CLOCK), onSelect: go("Invite teammates") },
    { id: "p1", group: "Pages", label: "Dashboard", icon: icon(DOC), shortcut: "G D", onSelect: go("Dashboard") },
    { id: "p2", group: "Pages", label: "Projects", icon: icon(DOC), shortcut: "G P", onSelect: go("Projects") },
    { id: "p3", group: "Pages", label: "Billing and invoices", icon: icon(DOC), keywords: "payment plan", onSelect: go("Billing and invoices") },
    { id: "p4", group: "Pages", label: "Team settings", icon: icon(DOC), keywords: "members", onSelect: go("Team settings") },
    { id: "a1", group: "Actions", label: "Create new project", icon: icon("M8 3v10M3 8h10"), shortcut: "⌘N", onSelect: go("Create new project") },
    { id: "a2", group: "Actions", label: "Copy current link", icon: icon("M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 0 1 4.5 9l1-1"), shortcut: "⌘⇧C", onSelect: go("Copy current link") },
    { id: "a3", group: "Actions", label: "Switch theme", icon: icon("M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5z"), keywords: "dark light mode", onSelect: go("Switch theme") },
    { id: "a4", group: "Actions", label: "Log out", icon: icon("M10 11.5l3-3.5-3-3.5M13 8H6M7 2.5H3.5v11H7"), onSelect: go("Log out") },
  ];

  return (
    <div
      ref={root}
      onPointerEnter={() => (inside.current = true)}
      onPointerLeave={() => (inside.current = false)}
      className="relative flex min-h-[420px] w-full flex-col items-center justify-center gap-4 overflow-hidden p-4 sm:p-8"
    >
      <Button
        variant="outline"
        kbd="⌘J"
        onClick={() => setOpen(true)}
        className="w-full max-w-[300px] !justify-between font-normal text-mute"
        iconLeft={icon("M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM10.5 10.5l3 3")}
      >
        <span className="mr-auto">Search or run a command…</span>
      </Button>
      <p className="text-[13px] text-mute" aria-live="polite">
        {last ? (
          <>
            Ran <span className="text-ink">{last}</span>
          </>
        ) : (
          "Click it, or hover here and press ⌘J."
        )}
      </p>

      <CommandPalette open={open} onOpenChange={setOpen} commands={commands} groups={["Recent", "Pages", "Actions"]} contained />
    </div>
  );
}
