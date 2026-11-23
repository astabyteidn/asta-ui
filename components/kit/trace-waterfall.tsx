"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type SpanKind = "agent" | "llm" | "tool" | "retrieval";

export interface TraceSpan {
  id: string;
  /** Nests the span under another one. */
  parentId?: string;
  name: string;
  kind: SpanKind;
  /** Milliseconds from the start of the run. */
  start: number;
  /** Milliseconds. Leave it out while the span is still running (live mode). */
  duration?: number;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  /** In US dollars. */
  cost?: number;
  status?: "ok" | "error";
  /** What went wrong, shown in the detail panel. */
  error?: string;
  input?: string;
  output?: string;
}

export interface TraceWaterfallProps {
  spans: TraceSpan[];
  title?: string;
  /** Running spans grow with the clock and new spans animate in as you append them. */
  live?: boolean;
  /** When the run started (epoch ms). Needed for live mode. */
  startedAt?: number;
  selected?: string | null;
  defaultSelected?: string | null;
  onSelect?: (id: string | null) => void;
  /** Keeps the layout with placeholder rows. */
  loading?: boolean;
  className?: string;
}

const KEYFRAMES = `@keyframes asta-tw-grow { from { transform: translateX(var(--x)) scaleX(0) } }
@keyframes asta-tw-run { 50% { opacity: .45 } }
@keyframes asta-tw-in { from { opacity: 0; transform: translateY(6px) } }
@media (prefers-reduced-motion: reduce) { .asta-tw, .asta-tw * { animation: none !important; transition-duration: 0s !important } }`;

const EASE = "cubic-bezier(.16,1,.3,1)";
const KINDS: Record<SpanKind, { label: string; fill: string; path: string }> = {
  agent: { label: "Agent", fill: "bg-[color-mix(in_srgb,var(--color-ink)_22%,var(--color-paper))]", path: "M8 2.5v3M8 10.5v3M3.5 8h-1M13.5 8h-1M5 5l-.8-.8M11.8 11.8 11 11M11 5l.8-.8M4.2 11.8 5 11M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" },
  llm: { label: "LLM call", fill: "bg-brand", path: "M8 2c.4 2.9 1.6 4.1 4.5 4.5-2.9.4-4.1 1.6-4.5 4.5-.4-2.9-1.6-4.1-4.5-4.5C6.4 6.1 7.6 4.9 8 2Z" },
  tool: { label: "Tool call", fill: "bg-ink", path: "M10.2 2.8a3 3 0 0 0-3.6 3.9L2.8 10.5a1.3 1.3 0 0 0 1.8 1.8l3.8-3.8a3 3 0 0 0 3.9-3.6l-1.8 1.8-1.6-.4-.4-1.6Z" },
  retrieval: { label: "Retrieval", fill: "bg-[color-mix(in_srgb,var(--color-brand)_42%,var(--color-paper))]", path: "M3 4.5c0-1.1 2.2-2 5-2s5 .9 5 2-2.2 2-5 2-5-.9-5-2ZM3 4.5v7c0 1.1 2.2 2 5 2s5-.9 5-2v-7M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" },
};
const STEPS = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 30000, 60000];
// On phones the name column scrolls away with the table so the bars stay visible. From sm up it sticks.
const GRID = "grid grid-cols-[minmax(200px,1.3fr)_minmax(240px,2fr)_56px_68px_76px] sm:grid-cols-[minmax(232px,1.3fr)_minmax(240px,2fr)_56px_68px_76px] items-center gap-x-3";

const ms = (n: number) => (n < 1000 ? `${Math.round(n)} ms` : `${(n / 1000).toFixed(n < 10000 ? 2 : 1)} s`);
const tick = (n: number) => (n === 0 ? "0" : n < 1000 ? `${n}ms` : `${+(n / 1000).toFixed(1)}s`);
const usd = (n: number) => `$${n < 0.01 ? n.toFixed(4) : n.toFixed(3)}`;
const num = (n: number) => n.toLocaleString("en-US");

function Glyph({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const WARN = "M8 2.5 14 13H2zM8 6.5v3M8 11.2h.01";

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-mute">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] tabular-nums text-ink">{children}</dd>
    </div>
  );
}

/**
 * An agent run as an APM-style waterfall. Spans nest as a tree you can fold, and their bars sit on a shared
 * time axis with tokens, cost and latency beside them. Bars grow in from the left on first paint, and in live
 * mode running spans stretch with the clock while new ones slide in. Select a span to see its input and output.
 * Failed spans say "Error" with an icon. On phones the table scrolls sideways and the span names stay put.
 */
export function TraceWaterfall({ spans, title = "Agent run", live = false, startedAt, selected, defaultSelected = null, onSelect, loading, className }: TraceWaterfallProps) {
  const [innerSel, setInnerSel] = useState<string | null>(defaultSelected);
  const sel = selected !== undefined ? selected : innerSel;
  const [folded, setFolded] = useState<Set<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [onScreen, setOnScreen] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const uid = useId();

  const running = live && spans.some((s) => s.duration === undefined);

  // The live clock. Ticks only while something runs, the trace is on screen and the tab is visible.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!running || !onScreen || startedAt === undefined) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(id);
      if (!document.hidden) id = setInterval(() => setNow(Date.now() - startedAt), 200);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", start);
    };
  }, [running, onScreen, startedAt]);

  const kids = useMemo(() => {
    const m = new Map<string, TraceSpan[]>();
    const ids = new Set(spans.map((s) => s.id));
    for (const s of spans) {
      const p = s.parentId && ids.has(s.parentId) ? s.parentId : "";
      m.set(p, [...(m.get(p) ?? []), s]);
    }
    m.forEach((list) => list.sort((a, b) => a.start - b.start));
    return m;
  }, [spans]);

  // Visible rows in tree order, skipping folded branches.
  const rows = useMemo(() => {
    const out: { s: TraceSpan; depth: number; parent: string | null; hasKids: boolean }[] = [];
    const walk = (pid: string, depth: number) => {
      for (const s of kids.get(pid) ?? []) {
        const hasKids = (kids.get(s.id)?.length ?? 0) > 0;
        out.push({ s, depth, parent: pid || null, hasKids });
        if (hasKids && !folded.has(s.id)) walk(s.id, depth + 1);
      }
    };
    walk("", 0);
    return out;
  }, [kids, folded]);

  const end = (s: TraceSpan) => s.start + (s.duration ?? Math.max(now - s.start, 0));
  const total = Math.max(1, ...spans.map(end));
  const step = STEPS.find((st) => total / st <= 5) ?? 60000;
  const axis = Math.ceil(total / step) * step;
  const ticks = Array.from({ length: Math.round(axis / step) + 1 }, (_, i) => i * step);
  const tokens = spans.reduce((a, s) => a + (s.tokensIn ?? 0) + (s.tokensOut ?? 0), 0);
  const cost = spans.reduce((a, s) => a + (s.cost ?? 0), 0);
  const errors = spans.filter((s) => s.status === "error").length;
  const current = spans.find((s) => s.id === sel) ?? null;

  // In live mode, follow new rows while the reader is at the bottom.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (live && el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [live, spans.length]);

  const choose = (id: string | null) => {
    if (selected === undefined) setInnerSel(id);
    onSelect?.(id);
  };
  const fold = (id: string, to?: boolean) =>
    setFolded((f) => {
      const n = new Set(f);
      if (to ?? !n.has(id)) n.add(id);
      else n.delete(id);
      return n;
    });
  const focusRow = (id: string | undefined) => {
    if (!id) return;
    setFocusId(id);
    root.current?.querySelector<HTMLElement>(`[data-span="${CSS.escape(id)}"]`)?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>, k: number) => {
    const r = rows[k];
    if (e.key === "ArrowDown") focusRow(rows[k + 1]?.s.id);
    else if (e.key === "ArrowUp") focusRow(rows[k - 1]?.s.id);
    else if (e.key === "Home") focusRow(rows[0]?.s.id);
    else if (e.key === "End") focusRow(rows[rows.length - 1]?.s.id);
    else if (e.key === "ArrowRight") {
      if (r.hasKids && folded.has(r.s.id)) fold(r.s.id, false);
      else if (r.hasKids) focusRow(rows[k + 1]?.s.id);
    } else if (e.key === "ArrowLeft") {
      if (r.hasKids && !folded.has(r.s.id)) fold(r.s.id, true);
      else focusRow(r.parent ?? undefined);
    } else if (e.key === "Enter" || e.key === " ") choose(sel === r.s.id ? null : r.s.id);
    else if (e.key === "Escape" && sel) choose(null);
    else return;
    e.preventDefault();
  };

  const tabbable = focusId && rows.some((r) => r.s.id === focusId) ? focusId : rows[0]?.s.id;
  const head = "sticky top-0 z-20 bg-paper font-mono text-[10.5px] uppercase tracking-wider text-mute";

  return (
    <div ref={root} className={cx("asta-tw flex w-full flex-col overflow-hidden rounded-[14px] bg-paper shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_1px_2px_rgb(0_0_0/0.04)]", className)}>
      <style href="asta-trace-waterfall" precedence="asta">{KEYFRAMES}</style>

      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-[14px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
          {running && (
            <span className="flex items-center gap-1.5 rounded-[5px] bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-1.5 py-0.5 text-[11.5px] font-medium text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" style={{ animation: `asta-tw-run 1.2s ${EASE} infinite ${onScreen ? "running" : "paused"}` }} />
              Live
            </span>
          )}
        </div>
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] tabular-nums text-mute">
          {[
            ["Duration", ms(total)],
            ["Tokens", num(tokens)],
            ["Cost", usd(cost)],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt>{k}</dt>
              <dd className="font-medium text-ink">{v}</dd>
            </div>
          ))}
          {errors > 0 && (
            <div className="flex items-center gap-1 font-medium text-ink">
              <Glyph d={WARN} />
              <dt className="sr-only">Errors</dt>
              <dd>
                {errors} {errors === 1 ? "error" : "errors"}
              </dd>
            </div>
          )}
        </dl>
        <ul className="flex flex-wrap items-center gap-3 text-[11.5px] text-mute sm:ml-auto" aria-label="Legend">
          {(["llm", "tool", "retrieval"] as const).map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span aria-hidden className={cx("h-2 w-2 rounded-[2px]", KINDS[k].fill)} />
              {KINDS[k].label}
            </li>
          ))}
        </ul>
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        className="max-h-[440px] overflow-auto overscroll-contain [scrollbar-width:thin]"
      >
        <div role="treegrid" aria-label={`${title} spans`} aria-busy={loading || running || undefined} aria-rowcount={rows.length + 1} className="min-w-[700px] pb-2 sm:min-w-[740px]">
          <div role="row" className={cx(GRID, head, "h-8")}>
            <span role="columnheader" className="left-0 z-10 bg-paper pl-4 sm:sticky sm:pl-5">
              Span
            </span>
            <span role="columnheader" className="relative h-full">
              <span className="sr-only">Timeline, 0 to {ms(axis)}</span>
              {ticks.map((t) => (
                <span key={t} aria-hidden className={cx("absolute top-1/2 -translate-y-1/2 normal-case tracking-normal", t === 0 ? "" : t === axis ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: `${(t / axis) * 100}%` }}>
                  {tick(t)}
                </span>
              ))}
            </span>
            <span role="columnheader" className="text-right">
              Tokens
            </span>
            <span role="columnheader" className="text-right">
              Cost
            </span>
            <span role="columnheader" className="pr-4 text-right sm:pr-5">
              Latency
            </span>
          </div>

          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <div key={i} role="row" className={cx(GRID, "h-10")}>
                  <span className="pl-4 sm:pl-5">
                    <span className="block h-2.5 rounded-full bg-paper-2" style={{ width: `${70 - i * 6}%`, marginLeft: i ? 16 : 0, animation: `asta-tw-run 1.4s ${EASE} ${i * 100}ms infinite` }} />
                  </span>
                  <span className="relative h-2">
                    <span className="absolute inset-y-0 rounded-[2px] bg-paper-2" style={{ left: `${i * 12}%`, width: `${30 - i * 3}%`, animation: `asta-tw-run 1.4s ${EASE} ${i * 100}ms infinite` }} />
                  </span>
                  <span />
                  <span />
                  <span />
                </div>
              ))
            : rows.map((r, k) => {
                const s = r.s;
                const kind = KINDS[s.kind];
                const run = s.duration === undefined;
                const dur = run ? Math.max(now - s.start, 0) : s.duration!;
                const x = s.start / axis;
                const w = Math.max(dur / axis, 0.004);
                const on = sel === s.id;
                const err = s.status === "error";
                const bg = on ? "bg-[color-mix(in_srgb,var(--color-brand)_7%,var(--color-paper))]" : "bg-paper group-hover/row:bg-paper-2";
                return (
                  <div
                    key={s.id}
                    role="row"
                    data-span={s.id}
                    aria-level={r.depth + 1}
                    aria-expanded={r.hasKids ? !folded.has(s.id) : undefined}
                    aria-selected={on}
                    tabIndex={tabbable === s.id ? 0 : -1}
                    onFocus={() => setFocusId(s.id)}
                    onClick={() => choose(on ? null : s.id)}
                    onKeyDown={(e) => onKey(e, k)}
                    className={cx(GRID, "group/row h-10 cursor-pointer text-[13px] outline-none transition-colors duration-150 focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--color-brand)_55%,transparent)]", bg)}
                    style={{ animation: `asta-tw-in .35s ${EASE} both` }}
                  >
                    <span role="gridcell" className={cx("left-0 z-10 flex h-full min-w-0 sm:sticky items-center gap-1.5 pr-3 transition-colors duration-150", bg)} style={{ paddingLeft: 16 + r.depth * 18 }}>
                      {r.hasKids ? (
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={folded.has(s.id) ? `Expand ${s.name}` : `Collapse ${s.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            fold(s.id);
                          }}
                          className="-ml-1 grid h-5 w-5 shrink-0 place-items-center rounded text-mute hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] hover:text-ink"
                        >
                          <Glyph d="m6 4 4 4-4 4" className={cx("h-3 w-3 transition-transform duration-200 ease-[cubic-bezier(.16,1,.3,1)]", !folded.has(s.id) && "rotate-90")} />
                        </button>
                      ) : (
                        <span className="w-4 shrink-0" />
                      )}
                      <span className={cx("grid h-5 w-5 shrink-0 place-items-center rounded-[5px]", s.kind === "llm" ? "bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-brand" : "bg-paper-2 text-ink-2")} title={kind.label}>
                        <Glyph d={kind.path} className="h-3 w-3" />
                      </span>
                      <span className={cx("min-w-0 truncate", s.kind === "agent" ? "font-medium text-ink" : "text-ink-2")}>{s.name}</span>
                      <span className="sr-only">, {kind.label}</span>
                      {err && (
                        <span title="Error" className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] bg-ink text-paper">
                          <Glyph d={WARN} className="h-3 w-3" />
                          <span className="sr-only">, Error</span>
                        </span>
                      )}
                    </span>
                    <span role="gridcell" className="relative h-full">
                      {ticks.slice(1, -1).map((t) => (
                        <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]" style={{ left: `${(t / axis) * 100}%` }} />
                      ))}
                      <span className="absolute inset-x-0 top-1/2 -mt-[5px] h-2.5">
                        <span
                          className={cx("absolute inset-0 origin-left rounded-[2px]", kind.fill, err && "opacity-60")}
                          style={
                            {
                              "--x": `${x * 100}%`,
                              transform: `translateX(var(--x)) scaleX(${w})`,
                              transition: `transform .45s ${EASE}`,
                              animation: run
                                ? `asta-tw-grow .6s ${EASE} both, asta-tw-run 1.2s ${EASE} .6s infinite ${onScreen ? "running" : "paused"}`
                                : `asta-tw-grow .7s ${EASE} ${Math.round(x * 500)}ms both`,
                            } as CSSProperties
                          }
                        />
                      </span>
                      <span className="sr-only">
                        Starts at {ms(s.start)}, {run ? "running" : `takes ${ms(dur)}`}
                      </span>
                    </span>
                    <span role="gridcell" className="text-right text-[12.5px] tabular-nums text-ink-2" title={s.tokensIn !== undefined ? `${num(s.tokensIn)} in · ${num(s.tokensOut ?? 0)} out` : undefined}>
                      {s.tokensIn !== undefined || s.tokensOut !== undefined ? num((s.tokensIn ?? 0) + (s.tokensOut ?? 0)) : <span className="text-mute">–</span>}
                    </span>
                    <span role="gridcell" className="text-right text-[12.5px] tabular-nums text-ink-2">
                      {s.cost !== undefined ? usd(s.cost) : <span className="text-mute">–</span>}
                    </span>
                    <span role="gridcell" className="pr-4 text-right text-[12.5px] tabular-nums text-ink sm:pr-5">
                      {run ? <span className="font-medium text-brand">Running</span> : ms(dur)}
                    </span>
                  </div>
                );
              })}
          {!loading && rows.length === 0 && (
            <div role="row" className="flex flex-col items-center gap-1 px-4 py-12 text-center">
              <span role="gridcell" className="text-[13px] font-medium text-ink-2">
                No spans yet
              </span>
              <span className="text-[12.5px] text-mute">Start a run and its steps show up here as they happen.</span>
            </div>
          )}
        </div>
      </div>

      {current && (
        <section key={current.id} aria-labelledby={`${uid}-d`} className="flex flex-col gap-4 bg-paper-2 px-4 py-4 sm:px-5" style={{ animation: `asta-tw-in .3s ${EASE}` }}>
          <div className="flex items-start gap-2.5">
            <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-md", current.kind === "llm" ? "bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-brand" : "bg-paper text-ink-2")}>
              <Glyph d={KINDS[current.kind].path} />
            </span>
            <div className="min-w-0 flex-1">
              <h4 id={`${uid}-d`} className="truncate text-[14px] font-medium text-ink">
                {current.name}
              </h4>
              <p className="text-[12px] text-mute">
                {KINDS[current.kind].label}
                {current.model && ` · ${current.model}`}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close span details"
              onClick={() => {
                choose(null);
                focusRow(current.id);
              }}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-mute outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Glyph d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
            <Stat label="Starts at">+{ms(current.start)}</Stat>
            <Stat label="Latency">{current.duration === undefined ? "Running" : ms(current.duration)}</Stat>
            <Stat label="Tokens in / out">{current.tokensIn !== undefined ? `${num(current.tokensIn)} / ${num(current.tokensOut ?? 0)}` : "–"}</Stat>
            <Stat label="Cost">{current.cost !== undefined ? usd(current.cost) : "–"}</Stat>
            <Stat label="Status">
              {current.status === "error" ? (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Glyph d={WARN} className="h-3 w-3" />
                  Error
                </span>
              ) : current.duration === undefined ? (
                "Running"
              ) : (
                "Done"
              )}
            </Stat>
          </dl>
          {current.error && (
            <p className="flex gap-2 rounded-lg bg-paper px-3 py-2.5 text-[12.5px] leading-relaxed text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]">
              <Glyph d={WARN} className="mt-0.5" />
              <span>
                <span className="font-medium">Error: </span>
                {current.error}
              </span>
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {(["input", "output"] as const).map((f) => (
              <div key={f} className="min-w-0">
                <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wider text-mute">{f}</p>
                <pre className="max-h-40 overflow-auto overscroll-contain whitespace-pre-wrap break-words rounded-lg bg-paper p-3 font-mono text-[12px] leading-relaxed text-ink-2 [scrollbar-width:thin]">
                  {current[f] || (f === "output" && current.duration === undefined ? "Waiting for output…" : "Nothing recorded.")}
                </pre>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default TraceWaterfall;
