"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

const KEYFRAMES = `@keyframes asta-ta-in { from { opacity: 0; transform: translateY(6px) scale(.98) } }
@keyframes asta-ta-row { from { opacity: 0; transform: translateY(-4px) } }
@keyframes asta-ta-menu { from { opacity: 0; transform: translateY(-4px) scale(.96) } }
@keyframes asta-ta-spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .asta-ta-a, .asta-ta-a * { animation: none !important; transition-duration: 0s !important } }`;

export type ToolDecision = "deny" | "once" | "always";
/** `read` only looks, `write` changes data you can change back, `destructive` can't be undone or reaches people. */
export type ToolRisk = "read" | "write" | "destructive";
export type ToolKind = "sql" | "shell" | "file" | "web" | "mail";

export interface ToolCallRequest {
  id: string;
  /** The tool's name as the agent calls it, e.g. `run_sql`. */
  tool: string;
  /** What the call will do, in one plain sentence. */
  summary?: string;
  /** Where it runs, e.g. "Postgres · billing-prod". */
  source?: string;
  kind?: ToolKind;
  /** Arguments as a key/value list. */
  args?: Record<string, string | number | boolean>;
  /** A query or command, shown as code. Long ones fold after six lines. */
  code?: string;
  /** A file change. Lines start with "+", "-" or a space. */
  diff?: { file: string; lines: string[] };
  risk?: ToolRisk;
  /** Overrides the risk hint text, e.g. "Sends to 214 customers". */
  note?: string;
}

export interface ToolApprovalProps {
  /** Calls waiting for a decision, oldest first. Add to the array as the agent asks for more. */
  calls: ToolCallRequest[];
  /** Runs the tool once allowed (or is told it was denied). Return a promise and its time shows on the receipt. Throw to mark it failed. */
  onDecide?: (call: ToolCallRequest, decision: ToolDecision) => void | Promise<unknown>;
  /** Tools that never ask, e.g. remembered from an earlier session. */
  defaultAllowed?: string[];
  className?: string;
}

type Result = { decision: ToolDecision | "auto"; state: "running" | "ok" | "error"; ms?: number };

const svg = { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const KIND: Record<ToolKind, ReactNode> = {
  sql: <path d="M3 4c0-1.1 2.2-2 5-2s5 .9 5 2-2.2 2-5 2-5-.9-5-2Zm0 0v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" />,
  shell: <path d="M2.5 3.5h11v9h-11zM5 7l1.8 1.5L5 10M8.5 10.5h2.5" />,
  file: <path d="M9 2H4.5v12h7V4.5zM9 2v2.5h2.5M6.5 8.5h3M6.5 11h3" />,
  web: <path d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM2 8h12M8 2c1.6 1.7 2.4 3.7 2.4 6S9.6 12.3 8 14c-1.6-1.7-2.4-3.7-2.4-6S6.4 3.7 8 2Z" />,
  mail: <path d="M2 4h12v8.5H2zM2.5 4.5 8 9l5.5-4.5" />,
};

const RISK: Record<ToolRisk, { word: string; icon: ReactNode }> = {
  read: { word: "Read only", icon: <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /> },
  write: { word: "Changes data", icon: <path d="M10.5 2.5 13.5 5.5 6 13H3v-3zM9 4l3 3" /> },
  destructive: { word: "Can't be undone", icon: <path d="M8 2.5 14 13H2zM8 6.5v3M8 11.2h.01" /> },
};

const fmt = (ms: number) => (ms < 1000 ? `${Math.max(1, Math.round(ms / 100)) / 10}s` : `${(ms / 1000).toFixed(1)}s`);

function Kbd({ children }: { children: ReactNode }) {
  return <kbd aria-hidden className="ml-1 hidden rounded bg-[color-mix(in_srgb,currentColor_14%,transparent)] px-1 font-sans text-[10.5px] leading-[1.5] sm:inline">{children}</kbd>;
}

function Preview({ call }: { call: ToolCallRequest }) {
  const [all, setAll] = useState(false);
  const lines = call.code?.split("\n") ?? [];
  const long = lines.length > 6;
  const args = Object.entries(call.args ?? {});
  return (
    <div className="flex flex-col gap-2">
      {call.code && (
        <div className="overflow-hidden rounded-lg bg-paper-2">
          <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[12px] leading-[1.6] text-ink [scrollbar-width:thin]">{(long && !all ? lines.slice(0, 6) : lines).join("\n")}</pre>
          {long && (
            <button
              type="button"
              onClick={() => setAll(!all)}
              aria-expanded={all}
              className="w-full px-3 pb-2 text-left text-[12px] font-medium text-brand outline-none hover:underline focus-visible:underline"
            >
              {all ? "Show less" : `Show all ${lines.length} lines`}
            </button>
          )}
        </div>
      )}
      {call.diff && (
        <div className="overflow-hidden rounded-lg bg-paper-2 text-[12px]">
          <p className="flex items-center justify-between gap-3 px-3 pb-1 pt-2 font-mono text-ink-2">
            <span className="truncate">{call.diff.file}</span>
            <span className="shrink-0 tabular-nums text-mute">
              +{call.diff.lines.filter((l) => l[0] === "+").length} −{call.diff.lines.filter((l) => l[0] === "-").length}
            </span>
          </p>
          <div className="overflow-x-auto pb-1.5 font-mono leading-[1.6] [scrollbar-width:thin]">
            {call.diff.lines.map((l, i) => {
              const sign = l[0] === "+" ? "+" : l[0] === "-" ? "−" : " ";
              return (
                <div key={i} className={cx("flex min-w-max pr-3", sign === "+" && "bg-[color-mix(in_srgb,var(--color-brand)_9%,transparent)]")}>
                  <span aria-hidden className={cx("w-6 shrink-0 select-none text-center", sign === "+" ? "text-brand" : "text-mute")}>
                    {sign}
                  </span>
                  <span className={cx("whitespace-pre", sign === "−" ? "text-mute line-through decoration-[color-mix(in_srgb,var(--color-ink)_25%,transparent)]" : "text-ink")}>
                    <span className="sr-only">{sign === "+" ? "Added: " : sign === "−" ? "Removed: " : ""}</span>
                    {l.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {args.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-paper-2 px-3 py-2.5 text-[12.5px]">
          {args.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-mute">{k}</dt>
              <dd className="min-w-0 break-words font-mono text-[12px] text-ink">{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function Card({ call, index, count, onDecide }: { call: ToolCallRequest; index: number; count: number; onDecide: (d: ToolDecision, refocus: boolean) => void }) {
  const [menu, setMenu] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLButtonElement>(null);
  const risk = call.risk ? RISK[call.risk] : null;

  useEffect(() => {
    if (!menu) return;
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const away = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.("[data-ta-menu]")) setMenu(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [menu]);

  const decide = (d: ToolDecision) => onDecide(d, !!root.current?.contains(document.activeElement));

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.nativeEvent.isComposing) return;
    const t = e.target as HTMLElement;
    if (e.key === "Escape") {
      e.preventDefault();
      decide("deny");
    } else if (e.key === "Enter" && !t.closest("button,a,input,textarea,select,summary")) {
      e.preventDefault();
      decide("once");
    }
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      e.stopPropagation();
      setMenu(false);
      caret.current?.focus();
    }
  };

  return (
    <div
      ref={root}
      role="group"
      tabIndex={0}
      aria-label={`Approve ${call.tool}${count > 1 ? `, ${index + 1} of ${count}` : ""}`}
      aria-describedby={`${menuId}-sum`}
      onKeyDown={onKey}
      className="asta-ta-a relative flex flex-col gap-3 rounded-[14px] bg-paper p-4 outline-none shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_10px_28px_-16px_rgb(0_0_0/0.25),0_1px_2px_rgb(0_0_0/0.04)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_16%,transparent)] animate-[asta-ta-in_.35s_cubic-bezier(.16,1,.3,1)_both]"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink">
          <svg {...svg} className="h-4 w-4">
            {KIND[call.kind ?? "shell"]}
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-mute">Wants to use a tool{call.source ? ` · ${call.source}` : ""}</p>
          <p className="truncate font-mono text-[13.5px] font-medium text-ink">{call.tool}</p>
        </div>
        {count > 1 && (
          <span className="shrink-0 rounded-md bg-paper-2 px-1.5 py-0.5 text-[11.5px] tabular-nums text-mute">
            {index + 1} of {count}
          </span>
        )}
      </div>
      {call.summary && (
        <p id={`${menuId}-sum`} className="text-[13.5px] leading-snug text-ink-2">
          {call.summary}
        </p>
      )}
      <Preview call={call} />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 pt-0.5">
        {risk ? (
          <p className={cx("flex items-center gap-1.5 text-[12.5px]", call.risk === "destructive" ? "font-medium text-ink" : "text-mute")}>
            <svg {...svg} className="h-3.5 w-3.5 shrink-0">
              {risk.icon}
            </svg>
            {call.note ?? risk.word}
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => decide("deny")}
            aria-keyshortcuts="Escape"
            className="inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-ink-2 outline-none shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-[background-color,color,transform] duration-150 hover:bg-paper-2 hover:text-ink active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            Deny<Kbd>Esc</Kbd>
          </button>
          <div className="relative flex" data-ta-menu>
            <button
              type="button"
              onClick={() => decide("once")}
              aria-keyshortcuts="Enter"
              className="inline-flex h-8 items-center rounded-l-md bg-ink pl-3 pr-2.5 text-[13px] font-medium text-paper outline-none transition-[background-color,transform] duration-150 hover:bg-[color-mix(in_srgb,var(--color-ink)_86%,var(--color-paper))] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Allow once<Kbd>↵</Kbd>
            </button>
            <button
              ref={caret}
              type="button"
              aria-label="More ways to allow"
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-controls={menu ? menuId : undefined}
              onClick={() => setMenu(!menu)}
              className="grid h-8 w-7 place-items-center rounded-r-md bg-ink text-paper shadow-[inset_1px_0_0_color-mix(in_srgb,var(--color-paper)_22%,transparent)] outline-none transition-[background-color,transform] duration-150 hover:bg-[color-mix(in_srgb,var(--color-ink)_86%,var(--color-paper))] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <svg {...svg} strokeWidth={1.7} className={cx("h-3.5 w-3.5 transition-transform duration-300", menu && "rotate-180")} style={{ transitionTimingFunction: CURVE }}>
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
            {menu && (
              <div
                id={menuId}
                role="menu"
                aria-label={`Allow ${call.tool}`}
                onKeyDown={onMenuKey}
                className="asta-ta-a absolute right-0 top-full z-20 mt-1.5 w-[248px] origin-top-right rounded-xl bg-paper p-1.5 text-left shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-12px_rgb(0_0_0/0.28),0_4px_10px_-6px_rgb(0_0_0/0.12)] animate-[asta-ta-menu_.18s_cubic-bezier(.16,1,.3,1)_both]"
              >
                {(
                  [
                    ["once", "Allow once", "Ask again next time"],
                    ["always", `Always allow ${call.tool}`, "Won't ask again in this chat"],
                  ] as const
                ).map(([d, label, hint]) => (
                  <button
                    key={d}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => {
                      setMenu(false);
                      decide(d);
                    }}
                    className="flex w-full flex-col items-start rounded-[9px] px-2.5 py-2 text-left outline-none transition-colors duration-150 hover:bg-paper-2 focus:bg-paper-2"
                  >
                    <span className="max-w-full truncate text-[13px] font-medium text-ink">{label}</span>
                    <span className="text-[12px] text-mute">{hint}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const WORD = { once: "Allowed", always: "Always allowed", auto: "Auto-allowed", deny: "Denied" } as const;

function Receipt({ call, r }: { call: ToolCallRequest; r: Result }) {
  const denied = r.decision === "deny";
  const word = r.state === "running" ? "Running" : r.state === "error" ? "Failed" : WORD[r.decision];
  return (
    <li className="asta-ta-a flex min-h-8 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] animate-[asta-ta-row_.35s_cubic-bezier(.16,1,.3,1)_both]">
      <span className={cx("grid h-4 w-4 shrink-0 place-items-center", denied || r.state === "error" ? "text-ink" : "text-brand")}>
        {r.state === "running" ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-[asta-ta-spin_.8s_linear_infinite]" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
            <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg {...svg} strokeWidth={1.8} className="h-3.5 w-3.5">
            {denied ? <path d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM3.8 12.2l8.4-8.4" /> : r.state === "error" ? <path d="M8 2.5 14 13H2zM8 6.5v3M8 11.2h.01" /> : <path d="m3.5 8.5 3 3 6-7" />}
          </svg>
        )}
      </span>
      <span className="font-medium text-ink">{word}</span>
      <span aria-hidden className="text-mute">·</span>
      <span className="min-w-0 truncate font-mono text-[12px] text-ink-2">{call.tool}</span>
      {call.summary && <span className="hidden min-w-0 flex-1 truncate text-mute sm:block">{call.summary}</span>}
      {r.ms !== undefined && r.state !== "running" && !denied && <span className="ml-auto shrink-0 tabular-nums text-mute">{fmt(r.ms)}</span>}
    </li>
  );
}

/**
 * A permission card for an agent's tool call. It shows the tool, the arguments as key/value pairs, a query or a
 * diff, and a risk hint in words. Deny, Allow once, or Always allow from the split menu, and the card folds into a
 * one-line receipt with the run time. Enter allows and Esc denies while the card has focus. Queued calls stack
 * behind it, and "Always allow" clears the queued calls to the same tool.
 */
export function ToolApproval({ calls, onDecide, defaultAllowed = [], className }: ToolApprovalProps) {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [allowed, setAllowed] = useState<string[]>(defaultAllowed);
  const [refocus, setRefocus] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const started = useRef(new Set<string>());
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const pending = calls.filter((c) => !results[c.id] && !allowed.includes(c.tool));
  const active = pending[0];

  const run = (call: ToolCallRequest, decision: ToolDecision | "auto") => {
    if (started.current.has(call.id)) return;
    started.current.add(call.id);
    const t0 = performance.now();
    const done = (state: Result["state"]) => alive.current && setResults((r) => ({ ...r, [call.id]: { decision, state, ms: performance.now() - t0 } }));
    setResults((r) => ({ ...r, [call.id]: { decision, state: decision === "deny" ? "ok" : "running" } }));
    let out: void | Promise<unknown> = undefined;
    try {
      out = onDecide?.(call, decision === "auto" ? "always" : decision);
    } catch {
      return done("error");
    }
    if (decision === "deny") return;
    if (out && typeof (out as Promise<unknown>).then === "function") (out as Promise<unknown>).then(() => done("ok"), () => done("error"));
    else done("ok");
  };

  // Calls to a tool that's always allowed run without asking, including ones that arrive later.
  useEffect(() => {
    const auto = calls.filter((c) => !started.current.has(c.id) && allowed.includes(c.tool));
    if (!auto.length) return;
    const t = setTimeout(() => auto.forEach((c) => run(c, "auto")), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calls, allowed]);

  // After a decision made from the keyboard, keep focus in the widget: the next card, or the receipts.
  useEffect(() => {
    if (!refocus) return;
    const t = setTimeout(() => {
      list.current?.querySelector<HTMLElement>('[role="group"]')?.focus({ preventScroll: true });
      if (!list.current?.contains(document.activeElement)) list.current?.focus({ preventScroll: true });
      setRefocus(false);
    }, 0);
    return () => clearTimeout(t);
  }, [refocus, active?.id]);

  const decide = (call: ToolCallRequest, d: ToolDecision, keepFocus: boolean) => {
    if (d === "always") setAllowed((a) => (a.includes(call.tool) ? a : [...a, call.tool]));
    run(call, d);
    if (keepFocus) setRefocus(true);
  };

  const done = calls.filter((c) => results[c.id]);
  const status = active ? `${pending.length} tool call${pending.length > 1 ? "s" : ""} waiting for approval.` : done.length ? "No tool calls waiting." : "";

  return (
    <div ref={list} tabIndex={-1} className={cx("asta-ta-a flex w-full flex-col gap-3 text-ink outline-none", className)}>
      <style href="asta-tool-approval" precedence="asta">{KEYFRAMES}</style>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {done.length > 0 && (
        <ul aria-label="Tool calls" className="-mx-2.5 flex flex-col">
          {done.map((c) => (
            <Receipt key={c.id} call={c} r={results[c.id]} />
          ))}
        </ul>
      )}
      {active ? (
        <div className={cx("relative isolate", pending.length > 1 && "pb-3")}>
          {pending.slice(1, 3).map((c, i) => (
            <div
              key={c.id}
              aria-hidden
              className="absolute inset-x-0 bottom-3 top-0 rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent)] transition-transform duration-500"
              style={{ transform: `translateY(${(i + 1) * 7}px) scaleX(${1 - (i + 1) * 0.04})`, opacity: 1 - (i + 1) * 0.25, zIndex: -1 - i, transitionTimingFunction: CURVE }}
            />
          ))}
          <div className="relative">
            <Card key={active.id} call={active} index={calls.length - pending.length} count={calls.length} onDecide={(d, f) => decide(active, d, f)} />
          </div>
        </div>
      ) : (
        done.length === 0 && <p className="rounded-lg bg-paper-2 px-3 py-2.5 text-[12.5px] text-mute">No tool calls waiting. Requests from the agent show up here.</p>
      )}
    </div>
  );
}

export default ToolApproval;
