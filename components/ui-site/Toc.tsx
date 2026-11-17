"use client";

import { useEffect, useState } from "react";

/** "On this page" with a marker that follows the section in view. */
export default function Toc({ items }: { items: { id: string; title: string; depth?: number }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(seen[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  const at = Math.max(0, items.findIndex((i) => i.id === active));

  return (
    <nav aria-label="On this page">
      <p className="label mb-3 text-mute">On this page</p>
      <div className="relative">
        <span
          aria-hidden
          className="absolute left-0 h-7 w-0.5 bg-accent transition-transform duration-500 ease-expo"
          style={{ transform: `translateY(${at * 28}px)` }}
        />
        <ul>
          {items.map((i) => (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                className={`flex h-7 items-center text-[13px] transition-colors ${i.depth ? "pl-7" : "pl-4"} ${active === i.id ? "text-ink" : "text-mute hover:text-ink"}`}
              >
                {i.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
