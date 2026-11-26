"use client";

import { useRef } from "react";
import { Navbar, type NavItem } from "@/components/kit/navbar";

const icon = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const NAV: NavItem[] = [
  {
    label: "Product",
    menu: {
      width: 600,
      tiles: [
        { title: "Analytics", description: "See what moves revenue, live.", href: "#", icon: icon("M3 13V8M8 13V3M13 13V6"), preview: "chart" },
        { title: "Automations", description: "Rules that run while you sleep.", href: "#", icon: icon("M9 2 4 9h4l-1 5 5-7H8l1-5Z"), preview: "list" },
        { title: "API", description: "Everything, programmable.", href: "#", icon: icon("m6 4-4 4 4 4M10 4l4 4-4 4"), preview: "code" },
      ],
    },
  },
  {
    label: "Solutions",
    menu: {
      width: 620,
      columns: [
        {
          heading: "By team",
          links: [
            { title: "Marketing", description: "Campaigns that report themselves.", href: "#" },
            { title: "Sales", description: "A pipeline you can trust.", href: "#" },
            { title: "Support", description: "Answers in one place.", href: "#" },
          ],
        },
        {
          heading: "By size",
          links: [
            { title: "Startups", description: "Free for your first year.", href: "#" },
            { title: "Enterprise", description: "SSO, audit logs, SLAs.", href: "#" },
          ],
        },
      ],
      feature: { title: "Customer stories", description: "How 2,000 teams ship faster with Astabyte.", href: "#", cta: "Read stories" },
    },
  },
  {
    label: "Resources",
    menu: {
      list: [
        { title: "Docs", description: "Guides and reference.", href: "#", icon: icon("M4 2h6l3 3v9H4zM10 2v3h3") },
        { title: "Changelog", description: "What shipped this week.", href: "#", icon: icon("M8 4v4l2.5 1.5M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z") },
        { title: "Community", description: "Ask, share, meet.", href: "#", icon: icon("M5.5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM2 13c0-2 1.5-3.5 3.5-3.5S9 11 9 13M11 7.5a1.6 1.6 0 1 0 0-3.2M11.5 9.6c1.5.3 2.5 1.6 2.5 3.4") },
        { title: "Templates", description: "Start from a working setup.", href: "#", icon: icon("M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z") },
      ],
    },
  },
  {
    label: "Company",
    menu: {
      list: [
        { title: "About", description: "Who builds Astabyte.", href: "#", icon: icon("M8 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5") },
        { title: "Careers", description: "Four open roles.", href: "#", icon: icon("M2.5 5.5h11v8h-11zM6 5.5v-2h4v2") },
        { title: "Contact", description: "Talk to the team.", href: "#", icon: icon("M2.5 4h11v8h-11zM2.5 4.5 8 9l5.5-4.5") },
      ],
    },
  },
  { label: "Pricing", href: "#" },
];

const Logo = () => (
  <>
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <circle cx="7.5" cy="10" r="5.5" fill="currentColor" />
      <circle cx="12.5" cy="10" r="5.5" fill="var(--color-brand)" fillOpacity="0.85" />
    </svg>
    Astabyte
  </>
);

export default function NavbarDemo() {
  const page = useRef<HTMLDivElement>(null);
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-3 sm:p-4">
      {/* A small browser frame: the navbar sticks inside it and folds as the page scrolls. */}
      <div className="@container relative w-full max-w-[960px] overflow-hidden rounded-xl bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent),0_24px_60px_-30px_rgb(0_0_0/0.35)]">
        <div ref={page} className="h-[520px] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <Navbar brand={<Logo />} items={NAV} docs={{ label: "Docs", href: "#" }} cta={{ label: "Get started", href: "#" }} scrollRoot={page} />
          <main className="px-6 pb-16 pt-14 text-center">
            <p className="mx-auto w-fit rounded-full bg-paper-2 px-3 py-1 text-[12px] text-mute">Hover the menu, then scroll</p>
            <h2 className="mx-auto mt-5 max-w-[16ch] text-[clamp(1.8rem,6cqw,3rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ink">Revenue analytics for teams that ship.</h2>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-mute">A mock page so the header has something to scroll over. The Docs link folds away after 40px.</p>
            <div className="mx-auto mt-10 grid max-w-2xl gap-3 @min-[560px]:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-36 rounded-[10px] bg-paper-2" />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
