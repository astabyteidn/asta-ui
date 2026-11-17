"use client";

import { Accordion as A } from "radix-ui";
import type { ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

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

const KEYFRAMES = `@keyframes kit-acc-down { from { height: 0; opacity: 0 } to { height: var(--radix-accordion-content-height); opacity: 1 } }
@keyframes kit-acc-up { from { height: var(--radix-accordion-content-height); opacity: 1 } to { height: 0; opacity: 0 } }`;

/**
 * Questions on Radix Accordion (arrows, Home/End, ARIA wiring). Panels open to their measured height with
 * a smooth ease, and the plus turns into a minus.
 */
export function Accordion({ items, type = "single", defaultOpen = [], className }: AccordionProps) {
  const body = items.map((it) => (
    <A.Item
      key={it.id}
      value={it.id}
      className={cx(
        "group/acc rounded-xl bg-paper-2 transition-[background-color,box-shadow] duration-300",
        "data-[state=open]:bg-paper data-[state=open]:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_8px_24px_-14px_rgb(0_0_0/0.25)]",
      )}
    >
      <A.Header>
        <A.Trigger className="group flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left text-[14.5px] font-medium tracking-[-0.01em] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          {it.title}
          <span
            aria-hidden
            className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-ink-2 transition-colors duration-300 group-hover:text-ink group-data-[state=open]/acc:bg-ink group-data-[state=open]/acc:text-paper"
          >
            <span className="absolute h-[1.5px] w-2.5 rounded-full bg-current" />
            <span className="absolute h-2.5 w-[1.5px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-data-[state=open]/acc:rotate-90 group-data-[state=open]/acc:scale-y-0 motion-reduce:transition-none" />
          </span>
        </A.Trigger>
      </A.Header>
      <A.Content className="overflow-hidden data-[state=open]:animate-[kit-acc-down_.45s_cubic-bezier(.16,1,.3,1)] data-[state=closed]:animate-[kit-acc-up_.3s_cubic-bezier(.16,1,.3,1)] motion-reduce:!animate-none">
        <div className="px-4 pb-4 text-[14px] leading-relaxed text-ink-2">{it.content}</div>
      </A.Content>
    </A.Item>
  ));

  const cls = cx("flex w-full flex-col gap-1.5", className);
  const style = <style>{KEYFRAMES}</style>;
  return type === "single" ? (
    <A.Root type="single" collapsible defaultValue={defaultOpen[0]} className={cls}>
      {style}
      {body}
    </A.Root>
  ) : (
    <A.Root type="multiple" defaultValue={defaultOpen} className={cls}>
      {style}
      {body}
    </A.Root>
  );
}

export default Accordion;
