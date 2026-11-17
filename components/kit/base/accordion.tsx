"use client";

import { Accordion as A } from "@base-ui/react/accordion";
import type { KeyboardEvent, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// Arrow keys, Home and End move between the headers, as in the Radix build (Base UI leaves headers as plain Tab stops).
function roving(e: KeyboardEvent<HTMLDivElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const all = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-acc-trigger]")].filter((b) => !b.disabled);
  const i = all.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0) return;
  e.preventDefault();
  const n = all.length;
  all[e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + n) % n].focus();
}

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** `single` keeps at most one open; `multiple` lets several stay open. */
  type?: "single" | "multiple";
  defaultOpen?: string[];
  className?: string;
}

/**
 * Questions on Base UI Accordion (arrows, Home/End, ARIA wiring). Panels open to their measured height with
 * a smooth ease, and the plus turns into a minus.
 */
export function Accordion({ items, type = "single", defaultOpen = [], className }: AccordionProps) {
  const body = items.map((it) => (
    <A.Item
      key={it.id}
      value={it.id}
      className={cx(
        "group/acc rounded-xl bg-paper-2 transition-[background-color,box-shadow] duration-300",
        "data-[open]:bg-paper data-[open]:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_8px_24px_-14px_rgb(0_0_0/0.25)]",
      )}
    >
      <A.Header>
        <A.Trigger data-acc-trigger="" className="group flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left text-[14.5px] font-medium tracking-[-0.01em] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          {it.title}
          <span
            aria-hidden
            className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-ink-2 transition-colors duration-300 group-hover:text-ink group-data-[open]/acc:bg-ink group-data-[open]/acc:text-paper"
          >
            <span className="absolute h-[1.5px] w-2.5 rounded-full bg-current" />
            <span className="absolute h-2.5 w-[1.5px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-data-[open]/acc:rotate-90 group-data-[open]/acc:scale-y-0 motion-reduce:transition-none" />
          </span>
        </A.Trigger>
      </A.Header>
      <A.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height,opacity] duration-[450ms] ease-[cubic-bezier(.16,1,.3,1)] data-[ending-style]:duration-300 data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[starting-style]:h-0 data-[starting-style]:opacity-0 motion-reduce:!transition-none">
        <div className="px-4 pb-4 text-[14px] leading-relaxed text-ink-2">{it.content}</div>
      </A.Panel>
    </A.Item>
  ));

  return (
    <A.Root multiple={type === "multiple"} defaultValue={type === "single" ? defaultOpen.slice(0, 1) : defaultOpen} className={cx("flex w-full flex-col gap-1.5", className)} onKeyDown={roving}>
      {body}
    </A.Root>
  );
}

export default Accordion;
