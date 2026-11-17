"use client";

import { Dialog as D } from "radix-ui";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface Command {
  id: string;
  label: string;
  group: string;
  icon?: ReactNode;
  /** Shortcut hint shown on the right, e.g. "⌘N". */
  shortcut?: string;
  /** Extra words that should match, e.g. synonyms. */
  keywords?: string;
  onSelect?: () => void;
}

/**
 * Fuzzy match: every query letter must appear in order. Returns the matched indexes (for highlighting)
 * and a score that prefers consecutive letters and word starts, or null when it doesn't match.
 */
export function fuzzy(text: string, query: string): { score: number; hits: number[] } | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return { score: 0, hits: [] };
  const hits: number[] = [];
  let score = 0;
  let from = 0;
  for (const ch of q) {
    const at = t.indexOf(ch, from);
    if (at < 0) return null;
    if (hits.length && at === hits[hits.length - 1] + 1) score += 3;
    if (at === 0 || t[at - 1] === " ") score += 2;
    score -= (at - from) * 0.1;
    hits.push(at);
    from = at + 1;
  }
  return { score, hits };
}

function Highlight({ text, hits }: { text: string; hits: number[] }) {
  if (!hits.length) return <>{text}</>;
  const set = new Set(hits);
  return (
    <>
      {[...text].map((c, i) =>
        set.has(i) ? (
          <mark key={i} className="bg-transparent font-semibold text-ink">
            {c}
          </mark>
        ) : (
          <span key={i}>{c}</span>
        ),
      )}
    </>
  );
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  /** Order of groups; groups not listed follow in the order they appear. */
  groups?: string[];
  placeholder?: string;
  /** `contained` positions it inside the nearest relative parent instead of over the whole page. */
  contained?: boolean;
  className?: string;
}

/**
 * A command palette: grouped results, fuzzy filtering with matched letters highlighted, arrow keys and Enter.
 * The modal part is Radix Dialog: focus is trapped, Escape or a click outside closes it, the page behind is
 * hidden from screen readers and stops scrolling, and focus returns to whatever opened it.
 */
export function CommandPalette({ open, onOpenChange, commands, groups, placeholder = "Type a command or search…", contained = false, className }: CommandPaletteProps) {
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);
  const listId = useId();

  // Filtered, scored and grouped. Without a query, keep the given order.
  const sections = useMemo(() => {
    const scored = commands
      .map((c) => {
        const m = fuzzy(c.label, q) ?? (c.keywords && fuzzy(c.keywords, q) ? { score: -5, hits: [] } : null);
        return m && { c, ...m };
      })
      .filter((x): x is { c: Command; score: number; hits: number[] } => !!x);
    if (q) scored.sort((a, b) => b.score - a.score);
    const order = [...(groups ?? []), ...commands.map((c) => c.group)].filter((g, i, a) => a.indexOf(g) === i);
    return order.map((g) => ({ group: g, items: scored.filter((s) => s.c.group === g) })).filter((s) => s.items.length);
  }, [commands, groups, q]);
  const flat = sections.flatMap((s) => s.items);
  const active = Math.min(at, Math.max(0, flat.length - 1));

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const close = () => onOpenChange(false);
  const run = (c?: Command) => {
    if (!c) return;
    c.onSelect?.();
    close();
  };

  let n = -1;
  const pos = contained ? "absolute" : "fixed";
  const overlay = (
    <D.Overlay
      className={cx(
        pos,
        "inset-0 z-50 bg-[color-mix(in_srgb,var(--color-ink)_18%,transparent)] backdrop-blur-[2px]",
        "data-[state=open]:animate-[kit-cmd-fade_.2s_ease_both] data-[state=closed]:animate-[kit-cmd-fade-out_.15s_ease_both] motion-reduce:!animate-none",
        contained && "rounded-[inherit]",
      )}
    />
  );
  const content = (
    <D.Content
      aria-describedby={undefined}
      onOpenAutoFocus={(e) => {
        // Focus hasn't moved yet: remember the opener, start fresh, focus the search box.
        e.preventDefault();
        back.current = document.activeElement as HTMLElement | null;
        setQ("");
        setAt(0);
        input.current?.focus();
      }}
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        back.current?.focus?.({ preventScroll: true });
      }}
      className={cx(
        pos,
        "left-1/2 top-[10%] z-50 flex max-h-[min(440px,calc(100%-2rem))] w-[calc(100%-1.5rem)] max-w-[560px] -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-paper outline-none",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_24px_60px_-20px_rgb(0_0_0/0.4)]",
        "data-[state=open]:animate-[kit-cmd-in_.35s_cubic-bezier(.16,1,.3,1)_both] data-[state=closed]:animate-[kit-cmd-out_.15s_ease-in_both] motion-reduce:!animate-none",
        className,
      )}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") setAt((active + 1) % Math.max(1, flat.length));
        else if (e.key === "ArrowUp") setAt((active - 1 + flat.length) % Math.max(1, flat.length));
        else if (e.key === "Home") setAt(0);
        else if (e.key === "End") setAt(flat.length - 1);
        else if (e.key === "Enter") run(flat[active]?.c);
        else return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <D.Title className="sr-only">Command palette</D.Title>
      <style>{`
          @keyframes kit-cmd-fade { from { opacity: 0 } }
          @keyframes kit-cmd-fade-out { to { opacity: 0 } }
          @keyframes kit-cmd-in { from { opacity: 0; transform: translateY(-8px) scale(.97) } }
          @keyframes kit-cmd-out { to { opacity: 0; transform: translateY(-4px) scale(.98) } }
        `}</style>
      <div className="flex items-center gap-2.5 px-4 shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" strokeLinecap="round" />
        </svg>
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAt(0);
          }}
          placeholder={placeholder}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={flat[active] ? `${listId}-${flat[active].c.id}` : undefined}
          aria-autocomplete="list"
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute"
        />
        <kbd className="rounded-md bg-paper-2 px-1.5 font-sans text-[11px] leading-5 text-mute">Esc</kbd>
      </div>

      <div ref={list} id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
        {sections.map((s) => (
          <div key={s.group} role="group" aria-label={s.group} className="mb-1 last:mb-0">
            <p className="px-2.5 pb-1 pt-2 text-[11.5px] font-medium text-mute">{s.group}</p>
            {s.items.map(({ c, hits }) => {
              n += 1;
              const i = n;
              const on = i === active;
              return (
                <div
                  key={c.id}
                  id={`${listId}-${c.id}`}
                  role="option"
                  aria-selected={on}
                  data-index={i}
                  onPointerMove={() => at !== i && setAt(i)}
                  onClick={() => run(c)}
                  className={cx(
                    "relative flex h-10 cursor-pointer items-center gap-3 rounded-[10px] px-2.5 text-[14px] transition-colors duration-150",
                    on ? "bg-paper-2 text-ink" : "text-ink-2",
                  )}
                >
                  {on && <span aria-hidden className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-brand" />}
                  {c.icon && (
                    <span
                      className={cx(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5",
                        on ? "bg-paper text-ink" : "bg-paper-2 text-mute",
                      )}
                    >
                      {c.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    <Highlight text={c.label} hits={hits} />
                  </span>
                  {c.shortcut && <kbd className="font-sans text-[11.5px] text-mute">{c.shortcut}</kbd>}
                  {on && (
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5 text-mute"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M13 4v4.5a1.5 1.5 0 0 1-1.5 1.5H3.5M6 7l-2.5 3L6 13" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {flat.length === 0 && (
          <div className="flex flex-col items-center px-4 py-10 text-center" role="status">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-2 text-mute">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3M5.5 7h3" />
              </svg>
            </span>
            <p className="mt-3 text-[14px] text-ink">No results for &ldquo;{q}&rdquo;</p>
            <p className="mt-1 text-[13px] text-mute">Try a shorter word, or fewer letters.</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-4 py-2.5 text-[12px] text-mute shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
        {[
          ["↑↓", "Navigate"],
          ["↵", "Open"],
          ["Esc", "Close"],
        ].map(([k, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <kbd className="min-w-5 rounded-md bg-paper-2 px-1 text-center font-sans text-[11px] leading-5 text-ink-2">{k}</kbd>
            {l}
          </span>
        ))}
        <span className="ml-auto hidden tabular-nums sm:inline">
          {flat.length} {flat.length === 1 ? "result" : "results"}
        </span>
      </div>
    </D.Content>
  );

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {contained ? (
        <>
          {overlay}
          {content}
        </>
      ) : (
        <D.Portal>
          {overlay}
          {content}
        </D.Portal>
      )}
    </D.Root>
  );
}

export default CommandPalette;
