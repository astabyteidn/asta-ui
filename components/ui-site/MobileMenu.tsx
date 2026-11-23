"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/icons/Icon";
import { uiItems } from "@/lib/ui-catalog";
import { MotionToggle } from "./MotionPause";
import { Index } from "./Sidebar";
import { activeKey, ITEMS } from "./SiteNav";

/**
 * Phone menu, the only menu on small screens: the site links in a compact grid, GitHub and the motion switch, then the
 * full component index with its filter. Hire us stays pinned at the bottom. It opens under the header with a short fade.
 */
export default function MobileMenu({ studio, children }: { studio: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const current = activeKey(path);

  // Close on route change (back/forward too), adjusted during render instead of in an effect.
  const [at, setAt] = useState(path);
  if (at !== path) {
    setAt(path);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const links = [...ITEMS, { key: "studio", label: "Studio", href: `${studio}/?utm_source=ui`, external: true }];
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="btn btn-ghost btn-sm btn-icon">
        <Icon name={open ? "x" : "menu"} className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-x-0 bottom-0 top-14 z-50 flex animate-[ui-fade_.15s_ease-out_both] flex-col bg-paper">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[var(--gutter)] pb-6" data-lenis-prevent data-scroll>
            <nav aria-label="Main" className="grid grid-cols-2 gap-1 pt-2">
              {links.map((l) => {
                const on = current === l.key;
                const cls = `flex h-11 items-center justify-between rounded-lg px-3 text-[15px] ${on ? "bg-paper-2 font-medium text-ink" : "text-ink-2 active:bg-paper-2"}`;
                return l.external ? (
                  <a key={l.key} href={l.href} className={cls}>
                    {l.label}
                    <span aria-hidden className="text-[13px] text-mute">
                      ↗
                    </span>
                  </a>
                ) : (
                  <Link key={l.key} href={l.href} onClick={close} aria-current={on ? "page" : undefined} className={cls}>
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 flex items-center gap-2 px-1">
              {children}
              <MotionToggle className="btn btn-quiet btn-sm btn-icon" />
            </div>
            <div className="mt-2">
              <Index items={uiItems} onNavigate={close} />
            </div>
          </div>
          <div className="px-[var(--gutter)] pb-[max(12px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_16px_-8px_var(--color-paper)]">
            <a href={`${studio}/contact?utm_source=ui`} className="btn btn-primary btn-lg w-full justify-center">
              Hire us <span className="btn-arrow" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
