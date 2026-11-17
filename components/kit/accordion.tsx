"use client";

import { useId, useState, type ReactNode } from "react";

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

/**
 * Questions that open with a smooth height animation (a 0fr → 1fr grid row, so no measuring).
 * The plus turns into a minus; arrow keys, Home and End move between headers.
 */
export function Accordion({ items, type = "single", defaultOpen = [], className }: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const base = useId();

  const toggle = (id: string) =>
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : type === "single" ? [id] : [...cur, id]));

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const all = [...(e.currentTarget.closest("[data-accordion]")?.querySelectorAll<HTMLButtonElement>("[data-accordion-trigger]") ?? [])];
    const i = all.indexOf(e.currentTarget);
    const to = e.key === "ArrowDown" ? all[(i + 1) % all.length] : e.key === "ArrowUp" ? all[(i - 1 + all.length) % all.length] : e.key === "Home" ? all[0] : e.key === "End" ? all[all.length - 1] : null;
    if (to) {
      e.preventDefault();
      to.focus();
    }
  };

  return (
    <div data-accordion className={cx("flex w-full flex-col gap-1.5", className)}>
      {items.map((it) => {
        const on = open.includes(it.id);
        const head = `${base}-${it.id}-h`;
        const panel = `${base}-${it.id}-p`;
        return (
          <div
            key={it.id}
            className={cx(
              "rounded-xl transition-[background-color,box-shadow] duration-300",
              on ? "bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_8px_24px_-14px_rgb(0_0_0/0.25)]" : "bg-paper-2",
            )}
          >
            <h3>
              <button
                id={head}
                type="button"
                data-accordion-trigger
                aria-expanded={on}
                aria-controls={panel}
                onClick={() => toggle(it.id)}
                onKeyDown={onKey}
                className="group flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left text-[14.5px] font-medium tracking-[-0.01em] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                {it.title}
                <span
                  aria-hidden
                  className={cx(
                    "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                    on ? "bg-ink text-paper" : "bg-paper text-ink-2 group-hover:text-ink",
                  )}
                >
                  <span className="absolute h-[1.5px] w-2.5 rounded-full bg-current" />
                  <span
                    className={cx(
                      "absolute h-2.5 w-[1.5px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
                      on && "rotate-90 scale-y-0",
                    )}
                  />
                </span>
              </button>
            </h3>
            <div
              id={panel}
              role="region"
              aria-labelledby={head}
              className={cx(
                "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
                on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden" inert={!on}>
                <div className="px-4 pb-4 text-[14px] leading-relaxed text-ink-2">{it.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Accordion;
