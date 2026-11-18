"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Avatar } from "@/components/kit/avatar";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";

export interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  /** Small count on the right. In the icon rail it becomes a dot. */
  badge?: number;
}
export interface SidebarGroup {
  label?: string;
  items: SidebarItem[];
}
export interface SidebarWorkspace {
  id: string;
  name: string;
  plan?: string;
}
export interface SidebarProps {
  workspaces: SidebarWorkspace[];
  defaultWorkspace?: string;
  onWorkspaceChange?: (id: string) => void;
  groups: SidebarGroup[];
  /** Controlled active item. Leave it out and the sidebar tracks clicks itself. */
  active?: string;
  defaultActive?: string;
  onNavigate?: (id: string) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  user: { name: string; email: string; src?: string };
  className?: string;
}

const Icon = ({ d, className = "" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 16 16" className={cx("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

function Tile({ name, on }: { name: string; on?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[12.5px] font-semibold tracking-[-0.02em]",
        on ? "bg-ink text-paper" : cx("bg-paper text-ink", RING),
      )}
    >
      {name.charAt(0)}
    </span>
  );
}

/** Label that fades and slides a touch when the sidebar folds to the rail. */
function Label({ hidden, children, className }: { hidden: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left transition-[opacity,transform] duration-300",
        EASE,
        hidden ? "pointer-events-none -translate-x-1 opacity-0" : "translate-x-0 opacity-100 delay-75",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Tooltip shown next to rail items, on hover and keyboard focus. */
function Tip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-20 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[12px] text-paper opacity-0 transition-[opacity,translate] duration-200",
        "group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100",
        EASE,
      )}
    >
      {children}
    </span>
  );
}

const itemCls =
  "group/item relative flex h-9 w-full items-center rounded-lg text-[13.5px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/50";

/**
 * App sidebar: a workspace switcher, grouped navigation with a sliding active indicator, and the
 * signed-in user at the bottom. It folds to a 64px icon rail where labels fade out and tooltips take
 * over. Arrow keys move between items.
 */
export function Sidebar({
  workspaces,
  defaultWorkspace,
  onWorkspaceChange,
  groups,
  active: activeProp,
  defaultActive,
  onNavigate,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  user,
  className,
}: SidebarProps) {
  const [activeState, setActive] = useState(defaultActive ?? groups[0]?.items[0]?.id ?? "");
  const [collapsedState, setCollapsed] = useState(defaultCollapsed);
  const [workspace, setWorkspace] = useState(defaultWorkspace ?? workspaces[0]?.id);
  const [menu, setMenu] = useState(false);
  const active = activeProp ?? activeState;
  const collapsed = collapsedProp ?? collapsedState;
  const current = workspaces.find((w) => w.id === workspace) ?? workspaces[0];

  const nav = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  const switcher = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // Slide the indicator under the active item. Rows keep their height when folded, so only `active` matters.
  useLayoutEffect(() => {
    const ind = indicator.current;
    const el = nav.current?.querySelector<HTMLElement>(`[data-sb-id="${CSS.escape(active)}"]`);
    if (!ind) return;
    if (!el) {
      ind.style.opacity = "0";
      return;
    }
    if (!placed.current) ind.style.transition = "none";
    ind.style.transform = `translateY(${el.offsetTop}px)`;
    ind.style.opacity = "1";
    if (!placed.current) {
      void ind.offsetHeight;
      ind.style.transition = "";
      placed.current = true;
    }
  }, [active]);

  // Workspace menu: focus the current workspace on open, close on outside click.
  useEffect(() => {
    if (!menu) return;
    switcher.current?.querySelector<HTMLElement>("[role=menuitemradio][aria-checked=true]")?.focus();
    const down = (e: PointerEvent) => {
      if (!switcher.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [menu]);

  const navigate = (id: string) => {
    setActive(id);
    onNavigate?.(id);
  };
  const toggle = () => {
    setCollapsed(!collapsed);
    onCollapsedChange?.(!collapsed);
  };
  const pick = (id: string) => {
    setWorkspace(id);
    onWorkspaceChange?.(id);
    setMenu(false);
    trigger.current?.focus();
  };

  // Roving focus with arrows inside a list of elements.
  const rove = (e: KeyboardEvent, selector: string, root: HTMLElement | null) => {
    const els = [...(root?.querySelectorAll<HTMLElement>(selector) ?? [])];
    const i = els.indexOf(document.activeElement as HTMLElement);
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: els.length - 1 }[e.key];
    if (next === undefined || !els.length) return;
    e.preventDefault();
    els[(next + els.length) % els.length]?.focus();
  };

  return (
    <aside
      aria-label="Sidebar"
      data-collapsed={collapsed || undefined}
      className={cx(
        "relative flex h-full shrink-0 flex-col bg-paper-2 px-3 py-3 transition-[width] duration-500",
        EASE,
        collapsed ? "w-16" : "w-[248px]",
        className,
      )}
    >
      <style href="asta-sidebar" precedence="asta">{`
        @keyframes kit-sb-pop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .kit-sb, .kit-sb * { animation: none !important; transition-duration: 0s !important; } }
      `}</style>

      <div className="kit-sb flex min-h-0 flex-1 flex-col">
        {/* Workspace switcher */}
        <div ref={switcher} className="relative">
          <button
            ref={trigger}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menu}
            aria-label={collapsed ? `Workspace: ${current?.name}` : undefined}
            onClick={() => setMenu((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && !menu) {
                e.preventDefault();
                setMenu(true);
              }
            }}
            className={cx(itemCls, "h-11 hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] aria-expanded:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]")}
          >
            <span className="flex w-10 shrink-0 justify-center">{current && <Tile name={current.name} on />}</span>
            <Label hidden={collapsed} className="flex flex-col leading-tight">
              <span className="truncate text-[13.5px] font-medium text-ink">{current?.name}</span>
              {current?.plan && <span className="truncate text-[11.5px] text-mute">{current.plan}</span>}
            </Label>
            <Icon
              d="m5.5 6 2.5-2.5L10.5 6M5.5 10l2.5 2.5 2.5-2.5"
              className={cx("mr-2 shrink-0 text-mute transition-opacity duration-300", collapsed ? "opacity-0" : "opacity-100")}
            />
            {collapsed && <Tip>{current?.name}</Tip>}
          </button>

          {menu && (
            <div
              role="menu"
              aria-label="Switch workspace"
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Tab") {
                  if (e.key === "Escape") e.preventDefault();
                  setMenu(false);
                  trigger.current?.focus();
                } else rove(e, "[role=menuitemradio]", e.currentTarget);
              }}
              className="absolute left-0 top-[calc(100%+6px)] z-30 w-[232px] origin-top-left rounded-xl bg-paper p-1.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_16px_36px_-14px_rgb(0_0_0/0.3)]"
              style={{ animation: "kit-sb-pop .32s cubic-bezier(.16,1,.3,1) both" }}
            >
              <p className="px-2 pb-1.5 pt-1 text-[11.5px] text-mute">Workspaces</p>
              {workspaces.map((w) => {
                const on = w.id === current?.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={on}
                    onClick={() => pick(w.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2"
                  >
                    <Tile name={w.name} on={on} />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-[13.5px] text-ink">{w.name}</span>
                      {w.plan && <span className="truncate text-[11.5px] text-mute">{w.plan}</span>}
                    </span>
                    {on && <Icon d="M3.5 8.5l3 3 6-7" className="shrink-0 text-brand" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav aria-label="Main" className="mt-4 min-h-0 flex-1" onKeyDown={(e) => rove(e, "[data-sb-id]", nav.current)}>
          <div ref={nav} className="relative">
            <span
              ref={indicator}
              aria-hidden
              className={cx(
                "absolute inset-x-0 top-0 h-9 rounded-lg bg-paper opacity-0 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent),0_1px_2px_rgb(0_0_0/0.06)] transition-[transform,opacity] duration-500",
                EASE,
              )}
            />
            {groups.map((g, gi) => (
              <div key={g.label ?? gi} className={cx(gi > 0 && "mt-3")}>
                {g.label && (
                  <div className="relative flex h-7 items-center px-3" aria-hidden={collapsed || undefined}>
                    <span className={cx("text-[11.5px] text-mute transition-opacity duration-300", collapsed ? "opacity-0" : "opacity-100")}>{g.label}</span>
                    <span
                      className={cx(
                        "absolute left-1/2 h-px w-3 -translate-x-1/2 bg-[color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-opacity duration-300",
                        collapsed ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </div>
                )}
                <ul className="flex flex-col gap-0.5">
                  {g.items.map((it) => {
                    const on = it.id === active;
                    return (
                      <li key={it.id}>
                        <button
                          type="button"
                          data-sb-id={it.id}
                          aria-current={on ? "page" : undefined}
                          aria-label={collapsed ? it.label : undefined}
                          onClick={() => navigate(it.id)}
                          className={cx(itemCls, on ? "text-ink" : "text-ink-2 hover:text-ink hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]")}
                        >
                          <span className={cx("relative flex w-10 shrink-0 justify-center transition-colors duration-300", on ? "text-brand" : "text-mute group-hover/item:text-ink")}>
                            {it.icon}
                            {!!it.badge && (
                              <span
                                className={cx(
                                  "absolute right-2 top-0 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_0_2px_var(--color-paper-2)] transition-[opacity,transform] duration-300",
                                  EASE,
                                  collapsed ? "scale-100 opacity-100" : "scale-50 opacity-0",
                                )}
                              />
                            )}
                          </span>
                          <Label hidden={collapsed} className="relative">
                            {it.label}
                          </Label>
                          {!!it.badge && (
                            <span
                              className={cx(
                                "relative mr-2 rounded-md bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] px-1.5 text-[11.5px] tabular-nums leading-5 text-mute transition-opacity duration-300",
                                collapsed ? "opacity-0" : "opacity-100",
                              )}
                            >
                              {it.badge}
                            </span>
                          )}
                          {collapsed && <Tip>{it.label}</Tip>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Fold + user */}
        <button
          type="button"
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggle}
          className={cx(itemCls, "text-mute hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)] hover:text-ink")}
        >
          <span className="flex w-10 shrink-0 justify-center">
            <Icon d="M2.5 3.5h11v9h-11zM6 3.5v9M10.5 6.5 9 8l1.5 1.5" className={cx("transition-transform duration-500", EASE, collapsed && "-scale-x-100")} />
          </span>
          <Label hidden={collapsed}>Collapse</Label>
          {collapsed && <Tip>Expand</Tip>}
        </button>
        <div className="mt-2 flex h-12 items-center rounded-lg">
          <span className="flex w-10 shrink-0 justify-center">
            <Avatar name={user.name} src={user.src} size="sm" />
          </span>
          <Label hidden={collapsed} className="flex flex-col pl-1 leading-tight">
            <span className="truncate text-[13px] font-medium text-ink">{user.name}</span>
            <span className="truncate text-[11.5px] text-mute">{user.email}</span>
          </Label>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
