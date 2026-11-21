"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/icons/Icon";
import { DESIGN_URL } from "@/lib/design";

const EASE = "cubic-bezier(.16,1,.3,1)";

/** Phone menu: the header's links and Hire us, in a panel that drops under the header. */
export default function MobileMenu({ studio }: { studio: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

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

  const links = [
    { href: "/introduction", label: "Docs" },
    { href: "/#kit", label: "Kit" },
    { href: "/#components", label: "Motion" },
    { href: "/icons", label: "Icons" },
    { href: "/logos", label: "Logos" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="btn btn-ghost btn-sm btn-icon"
      >
        <Icon name={open ? "x" : "menu"} className="h-[18px] w-[18px]" />
      </button>
      <div
        className="fixed inset-x-0 bottom-0 top-14 z-50 bg-paper px-[var(--gutter)] pb-8 pt-4"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "none" : "translateY(-8px)",
          pointerEvents: open ? "auto" : "none",
          visibility: open ? "visible" : "hidden",
          transition: `opacity .35s ${EASE}, transform .45s ${EASE}, visibility 0s linear ${open ? "0s" : ".35s"}`,
        }}
        aria-hidden={!open}
      >
        <nav className="flex flex-col">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="icon-hover flex items-center justify-between py-3.5 text-[24px] font-medium tracking-[-0.02em]"
              style={{ opacity: open ? 1 : 0, transform: open ? "none" : "translateY(10px)", transition: `opacity .4s ${EASE} ${open ? 60 + i * 40 : 0}ms, transform .5s ${EASE} ${open ? 60 + i * 40 : 0}ms` }}
            >
              {l.label}
              <Icon name="arrow-right" className="h-5 w-5 text-mute" />
            </Link>
          ))}
          <a
            href={DESIGN_URL}
            className="icon-hover flex items-center justify-between py-3.5 text-[24px] font-medium tracking-[-0.02em]"
            style={{ opacity: open ? 1 : 0, transition: `opacity .4s ${EASE} ${open ? 300 : 0}ms` }}
          >
            Design
            <Icon name="arrow-up-right" className="h-5 w-5 text-mute" />
          </a>
          <a
            href={`${studio}/?utm_source=ui`}
            className="icon-hover flex items-center justify-between py-3.5 text-[24px] font-medium tracking-[-0.02em]"
            style={{ opacity: open ? 1 : 0, transition: `opacity .4s ${EASE} ${open ? 340 : 0}ms` }}
          >
            Studio
            <Icon name="arrow-up-right" className="h-5 w-5 text-mute" />
          </a>
        </nav>
        <a href={`${studio}/contact?utm_source=ui`} className="btn btn-primary btn-lg mt-8 w-full justify-center">
          Hire us <span className="btn-arrow" />
        </a>
      </div>
    </div>
  );
}
