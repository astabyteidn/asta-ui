"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-ws-in { from { opacity: 0; transform: translateY(-4px) scale(.97) } }
@media (prefers-reduced-motion: reduce) { .asta-ws-pop { animation: none !important } }`;

export interface Workspace {
  id: string;
  name: string;
  /** A short tag after the name, e.g. "Pro" or "Free". */
  plan?: string;
  /** A logo URL. Falls back to the first letter. */
  logo?: string;
  /** Muted text under the name in the list, e.g. "4 members". */
  meta?: string;
}

export interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string, workspace: Workspace) => void;
  /** Shows a "New workspace" row at the bottom. */
  onCreate?: () => void;
  createLabel?: string;
  /** Who is signed in, shown at the top of the menu. */
  account?: { name: string; email?: string };
  /** Extra rows under the list, e.g. settings or sign out. */
  footer?: ReactNode;
  className?: string;
}

function Logo({ ws, size }: { ws: Workspace; size: "sm" | "md" }) {
  const box = size === "sm" ? "h-6 w-6 rounded-[6px] text-[11.5px]" : "h-8 w-8 rounded-[8px] text-[13px]";
  if (ws.logo) return <img src={ws.logo} alt="" width={32} height={32} loading="lazy" className={cx(box, "shrink-0 object-cover")} />;
  return <span className={cx(box, "grid shrink-0 place-items-center bg-brand font-semibold text-white")}>{ws.name.slice(0, 1).toUpperCase()}</span>;
}

const Check = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/**
 * The account and workspace picker at the top of an app sidebar. The menu drops in from the trigger, ↑ ↓ move,
 * Enter picks, Escape or a click outside closes it, and the current workspace carries a check.
 */
export function WorkspaceSwitcher({ workspaces, value, defaultValue, onChange, onCreate, createLabel = "New workspace", account, footer, className }: WorkspaceSwitcherProps) {
  const [inner, setInner] = useState(defaultValue ?? workspaces[0]?.id);
  const current = workspaces.find((w) => w.id === (value ?? inner)) ?? workspaces[0];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const count = workspaces.length + (onCreate ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const show = () => {
    setActive(Math.max(0, workspaces.findIndex((w) => w.id === current?.id)));
    setOpen(true);
  };
  const choose = (i: number) => {
    if (i === workspaces.length) onCreate?.();
    else {
      const ws = workspaces[i];
      if (value === undefined) setInner(ws.id);
      onChange?.(ws.id, ws);
    }
    setOpen(false);
    trigger.current?.focus();
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => (a + 1) % count);
    else if (e.key === "ArrowUp") setActive((a) => (a - 1 + count) % count);
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(count - 1);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") trigger.current?.focus();
      return;
    } else return;
    e.preventDefault();
  };

  if (!current) return null;

  return (
    <div ref={root} className={cx("relative", className)}>
      <style href="asta-workspace-switcher" precedence="asta">{KEYFRAMES}</style>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        className={cx(
          "group/ws flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left outline-none transition-colors duration-150",
          "hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] focus-visible:shadow-[0_0_0_2px_var(--color-brand)]",
          open && "bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]",
        )}
      >
        <Logo ws={current} size="sm" />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{current.name}</span>
        {current.plan && <span className="shrink-0 rounded-[5px] bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] px-1.5 py-0.5 text-[11px] font-medium text-brand">{current.plan}</span>}
        <svg viewBox="0 0 24 24" className={cx("h-3.5 w-3.5 shrink-0 text-mute transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className={cx(
            "asta-ws-pop absolute left-0 right-0 top-full z-30 mt-1.5 min-w-[240px] origin-top rounded-[12px] bg-paper p-1.5",
            "animate-[asta-ws-in_.2s_cubic-bezier(.16,1,.3,1)_both]",
            "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-12px_rgb(0_0_0/0.28),0_4px_10px_-6px_rgb(0_0_0/0.12)]",
          )}
        >
          {account && (
            <div className="px-2.5 pb-2 pt-1.5">
              <p className="truncate text-[13px] font-medium text-ink">{account.name}</p>
              {account.email && <p className="truncate text-[12px] text-mute">{account.email}</p>}
            </div>
          )}
          <div
            ref={listRef}
            id={id}
            role="listbox"
            tabIndex={-1}
            aria-label="Workspaces"
            aria-activedescendant={`${id}-${active}`}
            onKeyDown={onListKey}
            className="outline-none"
          >
            {workspaces.map((w, i) => (
              <div
                key={w.id}
                id={`${id}-${i}`}
                role="option"
                aria-selected={w.id === current.id}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={cx("flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-1.5 transition-colors duration-100", active === i && "bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]")}
              >
                <Logo ws={w} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium text-ink">{w.name}</span>
                    {w.plan && <span className="shrink-0 text-[11px] text-mute">{w.plan}</span>}
                  </span>
                  {w.meta && <span className="block truncate text-[12px] text-mute">{w.meta}</span>}
                </span>
                {w.id === current.id && <Check />}
              </div>
            ))}
            {onCreate && (
              <div
                id={`${id}-${workspaces.length}`}
                role="option"
                aria-selected={false}
                onPointerMove={() => setActive(workspaces.length)}
                onClick={() => choose(workspaces.length)}
                className={cx("mt-1 flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-[13px] text-ink-2 transition-colors duration-100", active === workspaces.length && "bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] text-ink")}
              >
                <span className="grid h-8 w-8 place-items-center rounded-[8px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                {createLabel}
              </div>
            )}
          </div>
          {footer && <div className="mt-1 pt-1">{footer}</div>}
        </div>
      )}
    </div>
  );
}
