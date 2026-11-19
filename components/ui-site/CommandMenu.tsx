"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CommandPalette, { type Command } from "@/components/kit/command-palette";
import { uiItems } from "@/lib/ui-catalog";
import { variantItems } from "@/lib/variant-items";
import { GUIDES } from "./Sidebar";
import Icon from "@/components/icons/Icon";


/** Header search button + ⌘K palette over guides, components and variants. Built on our own command palette. */
export default function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      ...GUIDES.map((g) => ({ id: g.href, label: g.title, group: "Get started", icon: <Icon name="book" />, onSelect: go(g.href) })),
      { id: "/icons", label: "Astabyte Icons", group: "Icons", icon: <Icon name="sparkle" />, keywords: "svg icon set arrow", onSelect: go("/icons") },
      { id: "/logos", label: "Brand logos", group: "Icons", icon: <Icon name="grid" />, keywords: "logo brand svg github react stripe simple icons", onSelect: go("/logos") },
      ...uiItems.map((b) => ({
        id: b.slug,
        label: b.title,
        group: b.group.startsWith("Motion") ? "Motion lab" : b.group,
        icon: <Icon name={b.group.startsWith("Motion") ? "wave" : "box"} />,
        shortcut: b.id,
        keywords: `${b.description} ${b.slug}`,
        onSelect: go(`/${b.slug}`),
      })),
      ...variantItems.map((v) => ({
        id: `v-${v.id}`,
        label: v.title,
        group: "Variants",
        icon: <Icon name="layers" />,
        shortcut: v.id.replace(/^.*-/, ""),
        keywords: `${v.description} ${v.id}`,
        onSelect: go(`/${v.variant.base}#${v.id}`),
      })),
    ];
  }, [router]);

    return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="icon-hover btn btn-quiet btn-sm hidden w-44 !justify-start text-mute md:inline-flex xl:w-56"
        aria-label="Search components"
      >
        <Icon name="search" className="h-3.5 w-3.5" />
        <span className="font-normal text-mute">Search<span className="hidden xl:inline"> components</span></span>
        <span className="kbd ml-auto">⌘K</span>
      </button>
      <button type="button" onClick={() => setOpen(true)} className="icon-hover btn btn-ghost btn-sm btn-icon md:hidden" aria-label="Search components">
        <Icon name="search" className="h-4 w-4" />
      </button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={commands}
        groups={["Get started", "Icons", "Atoms", "Molecules", "Organisms", "Motion lab", "Variants"]}
        placeholder="Search guides, components and variants…"
      />
    </>
  );
}
