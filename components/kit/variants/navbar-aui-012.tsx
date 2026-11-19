"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface AppNavbarWorkspace {
  id: string;
  name: string;
  /** Small line under the name, e.g. the plan. */
  detail?: string;
}
export interface AppNavbarUser {
  name: string;
  email: string;
}
export interface AppNavbarMenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
}
export interface AppNavbarResult {
  /** Group heading, e.g. "Projects". */
  group: string;
  label: string;
  /** Small text on the right, e.g. a shortcut or a status. */
  hint?: string;
  href?: string;
}

export interface AppNavbarProps {
  /** Listen for ⌘K / Ctrl K. Turn off when the page already has its own shortcut. Default true. */
  shortcut?: boolean;
  workspaces?: AppNavbarWorkspace[];
  defaultWorkspace?: string;
  onWorkspaceChange?: (id: string) => void;
  user?: AppNavbarUser;
  /** Items in the avatar menu. */
  menu?: AppNavbarMenuItem[];
  /** Unread notifications. The bell shows a dot when above 0. */
  unread?: number;
  onNotifications?: () => void;
  /** Suggestions in the palette that drops from the search field. Filtered as you type. */
  results?: AppNavbarResult[];
  /** Called with the picked result, or with `null` and the query when Enter is pressed with no match. */
  onSearch?: (query: string, result: AppNavbarResult | null) => void;
  searchPlaceholder?: string;
  /** Drop the palette open once after mount and step through a few results, to show it is there. */
  tour?: boolean;
  className?: string;
}

const EASE = "cubic-bezier(.16,1,.3,1)";
const TW_EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-brand/50";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const ELEVATED =
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.3)]";
const ITEM = "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13.5px] text-ink outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2";

const CSS = `
@keyframes aui-012-rise { from { opacity: 0; transform: translateY(6px); } }
@keyframes aui-012-pop { from { opacity: 0; transform: translateY(-6px) scale(.97); } }
@keyframes aui-012-ping { 0% { opacity: .6; transform: scale(1); } 80%, 100% { opacity: 0; transform: scale(2.6); } }
.aui-012-in { animation: aui-012-rise .55s ${EASE} both; animation-delay: calc(var(--i, 0) * 50ms); }
.aui-012-pop { animation: aui-012-pop .32s ${EASE} both; transform-origin: top; }
.aui-012-row { animation: aui-012-rise .4s ${EASE} both; animation-delay: calc(40ms + var(--i, 0) * 25ms); }
.aui-012-ping { animation: aui-012-ping 2.4s ${EASE} infinite; }
@media (prefers-reduced-motion: reduce) { .aui-012-m, .aui-012-m * { animation: none !important; transition-duration: 0s !important; } }
`;

const WORKSPACES: AppNavbarWorkspace[] = [
  { id: "ab", name: "Astabyte", detail: "Team · 12 seats" },
  { id: "cw", name: "Client work", detail: "Pro · 4 seats" },
  { id: "pe", name: "Personal", detail: "Free" },
];
const MENU: AppNavbarMenuItem[] = [
  { label: "Profile", href: "#" },
  { label: "Settings", href: "#" },
  { label: "Billing", href: "#" },
  { label: "Sign out" },
];
const RESULTS: AppNavbarResult[] = [
  { group: "Projects", label: "Checkout redesign", hint: "In review" },
  { group: "Projects", label: "Billing v2", hint: "On track" },
  { group: "Projects", label: "Mobile onboarding", hint: "Planned" },
  { group: "People", label: "Jonas Keller", hint: "Design" },
  { group: "People", label: "Ana Sousa", hint: "Engineering" },
  { group: "Actions", label: "Create invoice", hint: "I" },
  { group: "Actions", label: "Invite a teammate", hint: "T" },
];

const isMac = () => typeof navigator === "undefined" || /Mac|iPhone|iPad/.test(navigator.platform);
const at = (n: number) => ({ "--i": n }) as CSSProperties;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Chevrons = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m5 6 3-3 3 3M5 10l3 3 3-3" />
  </svg>
);
const Check = () => (
  <svg viewBox="0 0 16 16" className="ml-auto h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" />
  </svg>
);
const Bell = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1.5H3l1-1.5ZM6.5 14a1.6 1.6 0 0 0 3 0" />
  </svg>
);
const GroupIcon = ({ group }: { group: string }) => (
  <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-[7px] bg-paper text-ink-2", RING)}>
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {group === "People" ? (
        <path d="M8 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 13.5c.6-2.4 2.6-3.8 5-3.8s4.4 1.4 5 3.8" />
      ) : group === "Actions" ? (
        <path d="M8 3v10M3 8h10" />
      ) : (
        <path d="M2.5 4.5h4l1.5 1.5h5.5v6.5h-11Z" />
      )}
    </svg>
  </span>
);

function Mark({ name, size = "h-6 w-6 text-[11px]" }: { name: string; size?: string }) {
  return <span className={cx("grid shrink-0 place-items-center rounded-[6px] bg-ink font-semibold text-paper", size)}>{name[0]?.toUpperCase()}</span>;
}

/** A small menu: outside click and Escape close it, arrow keys move between items, focus goes back to the button. */
function Menu({
  id,
  label,
  buttonLabel,
  buttonClass,
  button,
  popClass,
  className,
  style,
  children,
}: {
  id: string;
  label: string;
  buttonLabel?: string;
  buttonClass: string;
  button: ReactNode;
  popClass: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback((focus: boolean) => {
    setOpen(false);
    if (focus) trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = root.current;
    (el?.querySelector<HTMLElement>('[role^="menuitem"][aria-checked="true"]') ?? el?.querySelector<HTMLElement>('[role^="menuitem"]'))?.focus();
    const down = (e: PointerEvent) => !el?.contains(e.target as Node) && close(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open, close]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]'));
    const i = items.indexOf(document.activeElement as HTMLElement);
    const to =
      e.key === "ArrowDown" ? (i + 1) % items.length : e.key === "ArrowUp" ? (i - 1 + items.length) % items.length : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : -1;
    if (to >= 0) {
      e.preventDefault();
      items[to]?.focus();
    } else if (e.key === "Tab") close(false);
  };

  return (
    <div ref={root} className={cx("relative", className)} style={style}>
      <button ref={trigger} type="button" aria-label={buttonLabel} aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)} className={buttonClass}>
        {button}
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onKeyDown}
          onClick={(e) => {
            // Picking an item closes the menu. Links navigate, so focus only returns for buttons.
            const item = (e.target as HTMLElement).closest('[role^="menuitem"]');
            if (item) close(item.tagName !== "A");
          }}
          className={cx("aui-012-pop absolute top-[calc(100%+6px)] z-40 min-w-[220px] rounded-[12px] bg-paper p-1.5", ELEVATED, popClass)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Results grouped under headings, for the palette and the mobile sheet. */
function ResultList({ id, items, active, onPick, onHover }: { id: string; items: AppNavbarResult[]; active: number; onPick: (r: AppNavbarResult) => void; onHover: (i: number) => void }) {
  if (items.length === 0) return <p className="px-3 py-6 text-center text-[13px] text-mute">No matches. Press Enter to search everything.</p>;
  return (
    <div>
      {items.map((r, i) => (
        <div key={`${r.group}-${r.label}`}>
          {(i === 0 || items[i - 1].group !== r.group) && <p className="px-2.5 pb-1 pt-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">{r.group}</p>}
          <div
            id={`${id}-o${i}`}
            role="option"
            aria-selected={i === active}
            onPointerMove={() => onHover(i)}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => onPick(r)}
            style={at(i)}
            className={cx("aui-012-row relative flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-[13.5px] transition-colors duration-150", i === active ? "bg-paper-2 text-ink" : "text-ink-2")}
          >
            {i === active && <span aria-hidden className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-brand" />}
            <GroupIcon group={r.group} />
            <span className="truncate">{r.label}</span>
            {r.hint && <span className={cx("ml-auto shrink-0 text-[11.5px] text-mute", r.group === "Actions" && cx("rounded-[5px] bg-paper px-1.5 font-mono", RING))}>{r.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * aui-012 · Product app header whose signature is a command palette that drops straight out of the search
 * field, with grouped results and arrow-key picking. Also a workspace switcher, a pinging bell and an avatar menu.
 */
export function AppNavbar({
  shortcut = true,
  workspaces = WORKSPACES,
  defaultWorkspace,
  onWorkspaceChange,
  user = { name: "Mara Lind", email: "mara@astabyte.com" },
  menu = MENU,
  unread = 3,
  onNotifications,
  results = RESULTS,
  onSearch,
  searchPlaceholder = "Search or jump to…",
  tour = false,
  className,
}: AppNavbarProps) {
  const [ws, setWs] = useState(defaultWorkspace ?? workspaces[0]?.id);
  const [query, setQuery] = useState("");
  const [palette, setPalette] = useState(false);
  const [active, setActive] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [mac] = useState(isMac);
  const root = useRef<HTMLElement>(null);
  const searchBox = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const sheetSearch = useRef<HTMLInputElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const ids = useId();
  const current = workspaces.find((w) => w.id === ws) ?? workspaces[0];
  const q = query.trim().toLowerCase();
  const shown = q ? results.filter((r) => r.label.toLowerCase().includes(q) || r.group.toLowerCase().includes(q)) : results;
  const safe = Math.min(active, Math.max(0, shown.length - 1));

  const closeSheet = useCallback((focus: boolean) => {
    setSheet(false);
    if (focus) burger.current?.focus();
  }, []);

  // ⌘K / Ctrl K: open the palette (or the sheet on narrow widths).
  useEffect(() => {
    if (!shortcut) return;
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      const desktop = search.current;
      if (desktop && desktop.offsetParent !== null) {
        e.preventDefault();
        desktop.focus();
        desktop.select();
      } else if (root.current?.offsetParent !== null) {
        e.preventDefault();
        setSheet(true);
        requestAnimationFrame(() => sheetSearch.current?.focus());
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [shortcut]);

  // Optional tour: open, walk down three rows, close. Never steals focus.
  useEffect(() => {
    if (!tour || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const steps: [number, () => void][] = [
      [1100, () => setPalette(true)],
      [1700, () => setActive(1)],
      [2200, () => setActive(2)],
      [2700, () => setActive(3)],
      [3900, () => {
        setPalette(false);
        setActive(0);
      }],
    ];
    const timers = steps.map(([ms, f]) => setTimeout(f, ms));
    return () => timers.forEach(clearTimeout);
  }, [tour]);

  useEffect(() => {
    if (!palette) return;
    const down = (e: PointerEvent) => !searchBox.current?.contains(e.target as Node) && setPalette(false);
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [palette]);

  useEffect(() => {
    if (!sheet) return;
    const down = (e: PointerEvent) => !root.current?.contains(e.target as Node) && closeSheet(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && closeSheet(true);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [sheet, closeSheet]);

  const pick = (r: AppNavbarResult | null) => {
    onSearch?.(query.trim(), r);
    setPalette(false);
    setQuery("");
    setActive(0);
    if (r?.href) window.location.assign(r.href);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    pick(shown[safe] ?? null);
  };
  const keys = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setPalette(true);
      if (shown.length) setActive((safe + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length);
    } else if (e.key === "Escape" && palette) {
      e.preventDefault();
      setPalette(false);
    }
  };
  const bellLabel = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <header ref={root} className={cx("aui-012-m @container sticky top-0 z-30 w-full bg-paper/90 backdrop-blur-xl", className)}>
      <style href="asta-navbar-aui-012" precedence="asta">
        {CSS}
      </style>
      <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-2 px-3 shadow-[0_1px_0_color-mix(in_srgb,var(--color-ink)_8%,transparent)] @min-[640px]:gap-4 @min-[640px]:px-4">
        {/* Workspace switcher */}
        <Menu
          id={`${ids}-ws`}
          label="Switch workspace"
          className="aui-012-in min-w-0"
          style={at(0)}
          buttonClass={cx("flex h-8 min-w-0 items-center gap-2 rounded-lg pl-1 pr-2 transition-colors hover:bg-paper-2 aria-expanded:bg-paper-2", FOCUS)}
          button={
            <>
              {current && <Mark name={current.name} />}
              <span className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink">{current?.name}</span>
              <Chevrons />
            </>
          }
          popClass="left-0 w-[256px]"
        >
          <p className="px-2.5 pb-1 pt-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Workspaces</p>
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              role="menuitemradio"
              aria-checked={w.id === ws}
              onClick={() => {
                setWs(w.id);
                onWorkspaceChange?.(w.id);
              }}
              className={ITEM}
            >
              <Mark name={w.name} size="h-7 w-7 text-[12px]" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{w.name}</span>
                {w.detail && <span className="truncate text-[12px] text-mute">{w.detail}</span>}
              </span>
              {w.id === ws && <Check />}
            </button>
          ))}
        </Menu>

        {/* Search + palette */}
        <div ref={searchBox} className="aui-012-in relative mx-auto hidden w-full max-w-[360px] @min-[640px]:block" style={at(1)}>
          <form role="search" onSubmit={submit}>
            <label
              className={cx(
                "flex h-8 items-center gap-2 rounded-lg px-2.5 text-mute transition-[background-color,box-shadow] duration-300",
                palette ? "bg-paper shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]" : "bg-paper-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,var(--color-paper-2))]",
              )}
            >
              <SearchIcon />
              <span className="sr-only">Search</span>
              <input
                ref={search}
                type="text"
                role="combobox"
                aria-expanded={palette}
                aria-controls={`${ids}-list`}
                aria-autocomplete="list"
                aria-activedescendant={palette && shown.length ? `${ids}-list-o${safe}` : undefined}
                value={query}
                onFocus={() => setPalette(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                  setPalette(true);
                }}
                onKeyDown={keys}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-mute"
              />
              <kbd className={cx("hidden shrink-0 rounded-[5px] bg-paper px-1.5 py-0.5 font-sans text-[11px] text-mute transition-opacity @min-[760px]:inline", RING, palette && "opacity-0")}>
                {mac ? "⌘K" : "Ctrl K"}
              </kbd>
            </label>
          </form>
          {palette && (
            <div className={cx("aui-012-pop absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-[12px] bg-paper", ELEVATED)}>
              <div id={`${ids}-list`} role="listbox" aria-label="Suggestions" className="max-h-[220px] overflow-y-auto p-1.5">
                <ResultList id={`${ids}-list`} items={shown} active={safe} onPick={pick} onHover={setActive} />
              </div>
              <div className="flex items-center gap-3 bg-paper-2 px-3 py-2 text-[11.5px] text-mute">
                <span>
                  <kbd className="font-sans">↑↓</kbd> move
                </span>
                <span>
                  <kbd className="font-sans">↵</kbd> open
                </span>
                <span className="ml-auto">
                  <kbd className="font-sans">esc</kbd> close
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 @min-[640px]:ml-0">
          <button
            type="button"
            aria-label={bellLabel}
            onClick={onNotifications}
            style={at(2)}
            className={cx("aui-012-in group/bell relative hidden h-8 w-8 place-items-center rounded-lg text-ink/70 transition-colors hover:bg-paper-2 hover:text-ink @min-[640px]:grid", FOCUS)}
          >
            <span className={cx("transition-transform duration-500 group-hover/bell:-rotate-12", TW_EASE)}>
              <Bell />
            </span>
            {unread > 0 && (
              <span aria-hidden className="absolute right-[7px] top-[6px] h-2 w-2">
                <span className="aui-012-ping absolute inset-0 rounded-full bg-brand" />
                <span className="absolute inset-0 rounded-full bg-brand shadow-[0_0_0_2px_var(--color-paper)]" />
              </span>
            )}
          </button>

          {/* Avatar menu */}
          <Menu
            id={`${ids}-acct`}
            label="Account"
            className="aui-012-in hidden @min-[640px]:block"
            style={at(3)}
            buttonLabel={`Account menu for ${user.name}`}
            buttonClass={cx(
              "grid h-8 w-8 place-items-center rounded-full bg-ink text-[11.5px] font-semibold text-paper transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              TW_EASE,
              FOCUS,
            )}
            button={initials(user.name)}
            popClass="right-0 w-[240px]"
          >
            <div className="flex items-center gap-2.5 px-2.5 pb-2.5 pt-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[12px] font-semibold text-paper">{initials(user.name)}</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] font-medium text-ink">{user.name}</span>
                <span className="truncate text-[12px] text-mute">{user.email}</span>
              </span>
            </div>
            <div className="mx-1 mb-1 h-px bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]" />
            {menu.map((m) =>
              m.href ? (
                <a key={m.label} href={m.href} role="menuitem" className={ITEM}>
                  {m.label}
                </a>
              ) : (
                <button key={m.label} type="button" role="menuitem" onClick={m.onSelect} className={cx(ITEM, "text-mute")}>
                  {m.label}
                </button>
              ),
            )}
          </Menu>

          <button
            ref={burger}
            type="button"
            aria-label={sheet ? "Close menu" : "Open menu"}
            aria-expanded={sheet}
            aria-controls={`${ids}-sheet`}
            onClick={() => setSheet((v) => !v)}
            className={cx("relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-paper-2 @min-[640px]:hidden", FOCUS)}
          >
            <span className={cx("absolute h-[1.5px] w-[18px] rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "rotate-45" : "-translate-y-1")} />
            <span className={cx("absolute h-[1.5px] w-[18px] rounded-full bg-ink transition-transform duration-500", TW_EASE, sheet ? "-rotate-45" : "translate-y-1")} />
            {unread > 0 && !sheet && <span aria-hidden className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {sheet && (
        <div id={`${ids}-sheet`} className="aui-012-pop absolute inset-x-0 top-full bg-paper px-3 pb-4 pt-3 shadow-[0_24px_40px_-24px_rgb(0_0_0/0.35)] @min-[640px]:hidden">
          <form role="search" onSubmit={submit}>
            <label className="flex h-11 items-center gap-2 rounded-[10px] bg-paper-2 px-3 text-mute focus-within:shadow-[inset_0_0_0_1px_var(--color-brand)]">
              <SearchIcon />
              <span className="sr-only">Search</span>
              <input
                ref={sheetSearch}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute"
              />
            </label>
          </form>
          {q && (
            <div role="listbox" aria-label="Suggestions" className="mt-1">
              <ResultList id={`${ids}-m`} items={shown.slice(0, 4)} active={safe} onPick={pick} onHover={setActive} />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              onNotifications?.();
              closeSheet(false);
            }}
            className={cx(ITEM, "mt-2 h-12 text-[15px]")}
          >
            <Bell />
            Notifications
            {unread > 0 && <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[11.5px] font-medium text-white">{unread} new</span>}
          </button>
          <div className="mt-1 flex items-center gap-3 rounded-[10px] bg-paper-2 px-3 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[12px] font-semibold text-paper">{initials(user.name)}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-medium text-ink">{user.name}</span>
              <span className="truncate text-[12px] text-mute">{user.email}</span>
            </span>
          </div>
          <ul className="mt-1 flex flex-col">
            {menu.map((m, n) => (
              <li key={m.label} className="aui-012-in" style={at(n)}>
                {m.href ? (
                  <a href={m.href} onClick={() => closeSheet(false)} className={cx(ITEM, "h-11 text-[15px]")}>
                    {m.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      m.onSelect?.();
                      closeSheet(false);
                    }}
                    className={cx(ITEM, "h-11 text-[15px] text-mute")}
                  >
                    {m.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

export default AppNavbar;
