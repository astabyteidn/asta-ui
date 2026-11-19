"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

export interface DockTool {
  id: string;
  label: string;
  icon: ReactNode;
  /** A single key such as "V" or "R". Shown in the tooltip, and pressed anywhere to pick the tool when `hotkeys` is on. */
  shortcut?: string;
  disabled?: boolean;
}

export interface ToolDockProps {
  /** Tools in order. Put the string "separator" between groups. */
  tools: (DockTool | "separator")[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Pick a tool by pressing its shortcut, unless the user is typing in a field. Default true. */
  hotkeys?: boolean;
  /** Where the tooltips open. */
  tooltip?: "top" | "bottom";
  label?: string;
  className?: string;
}

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * The floating tool bar of a design editor. A highlight slides to the active tool, each tool shows its name and
 * shortcut on hover, ← → move between tools, and single-key shortcuts work from anywhere on the page.
 */
export function ToolDock({ tools, value, defaultValue, onChange, hotkeys = true, tooltip = "top", label = "Tools", className }: ToolDockProps) {
  const list = tools.filter((t): t is DockTool => t !== "separator");
  const [inner, setInner] = useState(defaultValue ?? list[0]?.id);
  const current = value ?? inner;
  const [hover, setHover] = useState<string | null>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const box = useRef<HTMLDivElement>(null);

  const pick = (id: string) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
  };
  const pickRef = useRef(pick);
  useLayoutEffect(() => {
    pickRef.current = pick;
  });

  // Measure the active button once per change or resize, never per frame.
  useLayoutEffect(() => {
    const measure = () => {
      // The button sits in a positioned wrapper (for its tooltip), so measure the wrapper against the bar.
      const el = current ? refs.current.get(current)?.parentElement : null;
      if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [current]);

  useEffect(() => {
    if (!hotkeys) return;
    const keys = new Map(list.filter((t) => t.shortcut && !t.disabled).map((t) => [t.shortcut!.toLowerCase(), t.id]));
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      const id = keys.get(e.key.toLowerCase());
      if (id) pickRef.current(id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkeys, list.map((t) => `${t.id}:${t.shortcut}:${t.disabled}`).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = list.filter((t) => !t.disabled);
    const i = enabled.findIndex((t) => t.id === (document.activeElement as HTMLElement | null)?.dataset.tool);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % enabled.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled.length - 1;
    if (next < 0) return;
    e.preventDefault();
    refs.current.get(enabled[next].id)?.focus();
  };

  return (
    <div
      ref={box}
      role="toolbar"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx(
        "relative inline-flex items-center gap-0.5 rounded-[12px] bg-paper p-1",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-14px_rgb(0_0_0/0.3),0_2px_6px_-3px_rgb(0_0_0/0.12)]",
        className,
      )}
    >
      {pill && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 h-[calc(100%-8px)] rounded-[8px] bg-brand motion-reduce:transition-none"
          style={{ width: pill.w, transform: `translateX(${pill.x}px)`, transition: `transform .32s ${EASE}, width .32s ${EASE}` /* perf-ok: width follows the active tool once per change */ }}
        />
      )}
      {tools.map((t, i) =>
        t === "separator" ? (
          <span key={`sep-${i}`} aria-hidden className="mx-1 h-5 w-px bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]" />
        ) : (
          <span key={t.id} className="relative">
            <button
              ref={(el) => {
                if (el) refs.current.set(t.id, el);
                else refs.current.delete(t.id);
              }}
              type="button"
              data-tool={t.id}
              aria-label={t.label}
              aria-pressed={current === t.id}
              aria-keyshortcuts={t.shortcut}
              disabled={t.disabled}
              tabIndex={current === t.id ? 0 : -1}
              onClick={() => pick(t.id)}
              onPointerEnter={() => setHover(t.id)}
              onPointerLeave={() => setHover((h) => (h === t.id ? null : h))}
              onFocus={() => setHover(t.id)}
              onBlur={() => setHover((h) => (h === t.id ? null : h))}
              className={cx(
                "relative grid h-9 w-9 cursor-pointer place-items-center rounded-[8px] outline-none transition-colors duration-150",
                "focus-visible:shadow-[0_0_0_2px_var(--color-paper),0_0_0_4px_var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-35",
                current === t.id ? "text-white" : "text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] hover:text-ink",
              )}
            >
              <span className="h-[18px] w-[18px] [&>svg]:h-full [&>svg]:w-full">{t.icon}</span>
            </button>
            <span
              role="tooltip"
              className={cx(
                "pointer-events-none absolute left-1/2 z-10 flex items-center gap-2 whitespace-nowrap rounded-[7px] bg-ink px-2 py-1 text-[12px] text-paper",
                "transition-[opacity,transform] duration-150",
                tooltip === "top" ? "bottom-full mb-2" : "top-full mt-2",
                hover === t.id ? "-translate-x-1/2 translate-y-0 opacity-100" : cx("-translate-x-1/2 opacity-0", tooltip === "top" ? "translate-y-1" : "-translate-y-1"),
              )}
            >
              {t.label}
              {t.shortcut && <span className="rounded-[4px] bg-[color-mix(in_srgb,var(--color-paper)_18%,transparent)] px-1 font-mono text-[10.5px]">{t.shortcut}</span>}
            </span>
          </span>
        ),
      )}
    </div>
  );
}
