"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kitItems } from "@/lib/kit";
import { labBlocks } from "@/lib/lab";
import { DESIGN_URL } from "@/lib/design";

type Item = { key: string; label: string; href: string; external?: boolean };

export const ITEMS: Item[] = [
  { key: "docs", label: "Docs", href: "/introduction" },
  { key: "components", label: "Components", href: "/#kit" },
  { key: "motion", label: "Motion", href: "/#components" },
  { key: "icons", label: "Icons", href: "/icons" },
  { key: "logos", label: "Logos", href: "/logos" },
  { key: "blog", label: "Blog", href: "/blog" },
  { key: "design", label: "Design", href: DESIGN_URL, external: true },
];

const GUIDES = ["/introduction", "/installation", "/skill", "/css", "/prompts", "/changelog"];
const KIT = new Set(kitItems.map((k) => `/${k.slug}`));
const LAB = new Set(labBlocks.map((b) => `/${b.slug}`));

export function activeKey(path: string) {
  if (GUIDES.includes(path)) return "docs";
  if (KIT.has(path)) return "components";
  if (LAB.has(path)) return "motion";
  if (path.startsWith("/icons")) return "icons";
  if (path.startsWith("/logos")) return "logos";
  if (path.startsWith("/blog")) return "blog";
  return null;
}

/**
 * Site header nav: plain links, the current section in ink and the rest muted. No menus or sliding pill: the docs
 * sidebar and ⌘K already reach every component, so the header stays quiet.
 */
export default function SiteNav() {
  const current = activeKey(usePathname());
  return (
    <nav aria-label="Main" className="hidden items-center lg:flex">
      {ITEMS.map((it) => {
        const on = current === it.key;
        const cls = `flex h-8 items-center gap-1 rounded-md px-3 text-[14px] transition-colors duration-150 hover:text-ink ${on ? "text-ink" : "text-mute"}`;
        return it.external ? (
          <a key={it.key} href={it.href} className={cls}>
            {it.label}
            <span aria-hidden className="text-[12px]">
              ↗
            </span>
          </a>
        ) : (
          <Link key={it.key} href={it.href} className={cls} aria-current={on ? "page" : undefined}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
