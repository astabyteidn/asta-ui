"use client";

import { Breadcrumb, type Crumb } from "@/components/kit/breadcrumb";

const Home = (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
    <path d="M2.5 7 8 2.5 13.5 7v6.5h-3.5V10H6v3.5H2.5z" />
  </svg>
);

const PATH: Crumb[] = [
  { label: "Home", href: "#", icon: Home },
  { label: "Projects", href: "#" },
  { label: "Astabyte", href: "#" },
  { label: "Brand refresh", href: "#" },
  { label: "Assets", href: "#" },
  { label: "Logo exports", href: "#" },
];

export default function BreadcrumbDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-lg flex-col gap-8">
        <div className="w-full min-w-48 max-w-full resize-x overflow-hidden rounded-xl bg-paper-2 px-4 py-3.5">
          <Breadcrumb items={PATH} />
        </div>
        <div className="px-1">
          <Breadcrumb items={PATH.slice(1)} collapse={3} separator={<span className="text-[13px]">/</span>} />
        </div>
        <p className="text-center text-[12.5px] text-mute">Drag the corner of the card. Middle pages fold into the menu as it narrows.</p>
      </div>
    </div>
  );
}
