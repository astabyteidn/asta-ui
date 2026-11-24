"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface CitationSource {
  title: string;
  /** Shown under the title and used for the letter tile, e.g. "fieldnotes.dev". */
  domain: string;
  /** The passage the answer leans on. */
  snippet: string;
  /** The exact part of `snippet` that was cited. It is highlighted in the preview. */
  quote?: string;
  /** Opens the source. Without it the source card is not a link. */
  url?: string;
  /** e.g. "Oct 2026". */
  date?: string;
}

export interface CitationsProps {
  /**
   * The answer. Mark a citation with its source number in brackets: "Revenue grew 18% [1]." Several at once:
   * "[1, 3]" or "[1][3]". A blank line starts a new paragraph.
   */
  text: string;
  /** Source 1 is `sources[0]`. */
  sources: CitationSource[];
  /** Keeps the layout with placeholder lines while the answer loads. */
  loading?: boolean;
  /** How many source cards show before "Show all". Default 3. */
  visible?: number;
  className?: string;
}

const KEYFRAMES = `@keyframes asta-cite-in { from { opacity: 0; transform: translateY(4px) scale(.98) } }
@keyframes asta-cite-rise { from { opacity: 0; transform: translateY(6px) } }
@keyframes asta-cite-pulse { 50% { opacity: .45 } }
@media (prefers-reduced-motion: reduce) { .asta-cite, .asta-cite * { animation: none !important; transition-duration: 0s !important } }`;

const TILES = ["bg-ink text-paper", "bg-brand text-white", "bg-paper-2 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]"];

function Tile({ domain, i, size = "sm" }: { domain: string; i: number; size?: "sm" | "md" }) {
  return (
    <span aria-hidden className={cx("grid shrink-0 place-items-center font-semibold uppercase", size === "md" ? "h-7 w-7 rounded-md text-[12px]" : "h-[18px] w-[18px] rounded-[5px] text-[10px]", TILES[i % TILES.length])}>
      {domain.replace(/^www\./, "").charAt(0)}
    </span>
  );
}

/** The snippet with the cited part highlighted. */
function Quote({ s }: { s: CitationSource }) {
  const at = s.quote ? s.snippet.indexOf(s.quote) : -1;
  if (at < 0) return <>{s.snippet}</>;
  return (
    <>
      {s.snippet.slice(0, at)}
      <mark className="rounded-[3px] bg-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] px-0.5 text-ink [box-decoration-break:clone]">{s.quote}</mark>
      {s.snippet.slice(at + s.quote!.length)}
    </>
  );
}

type Part = string | number[];
const parse = (p: string): Part[] => {
  const out: Part[] = [];
  const re = /(?:\s*\[(\d+(?:\s*,\s*\d+)*)\])+/g;
  let last = 0;
  for (let m; (m = re.exec(p)); ) {
    out.push(p.slice(last, m.index));
    out.push([...m[0].matchAll(/\d+/g)].map((d) => Number(d[0])));
    last = re.lastIndex;
  }
  out.push(p.slice(last));
  return out;
};

const arrow = (
  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5.5 10.5 10.5 5.5M6 5.5h4.5V10" />
  </svg>
);

/**
 * An answer with numbered citation pills. Hover or focus a pill to preview its source: title, domain and
 * the quoted passage with the cited part highlighted. The Sources row below expands into a full list, and
 * hovering a source lights up its pills in the text. Tap a pill on touch screens.
 */
export function Citations({ text, sources, loading, visible = 3, className }: CitationsProps) {
  const [card, setCard] = useState<{ key: string; src: number; x: number; below: boolean; pinned: boolean } | null>(null);
  const [lit, setLit] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const uid = useId();

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!card) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setCard(null);
    const onDown = (e: PointerEvent) => !(e.target as Element).closest?.("[data-asta-cite-pill]") && setCard(null);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [card]);

  // Place the card above the pill, or below near the top of the screen, and keep it inside the viewport.
  const openCard = (el: HTMLElement, key: string, src: number, pinned = false) => {
    clearTimeout(timer.current);
    const r = el.getBoundingClientRect();
    const w = Math.min(304, window.innerWidth - 32);
    const left = Math.max(16, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - 16 - w));
    setCard({ key, src, x: left - r.left, below: r.top < 220, pinned });
  };
  const later = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const closeSoon = () => later(() => setCard((c) => (c?.pinned ? c : null)), 140);

  const paragraphs = text.split(/\n\s*\n/);
  const shown = all ? sources : sources.slice(0, visible);
  const more = sources.length - visible;

  const pill = (n: number, key: string): ReactNode => {
    const i = n - 1;
    const s = sources[i];
    if (!s) return <span key={key} className="text-mute">[{n}]</span>;
    const open = card?.key === key;
    const on = lit === i || (card?.src === i && !open);
    return (
      <span key={key} className="relative inline-block">
        <button
          type="button"
          data-asta-cite-pill
          aria-label={`Source ${n}: ${s.title}`}
          aria-describedby={open ? `${uid}-card` : undefined}
          aria-expanded={open}
          onPointerEnter={(e) => {
            const el = e.currentTarget;
            if (e.pointerType === "mouse") later(() => openCard(el, key, i), 90);
          }}
          onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
          onFocus={(e) => e.currentTarget.matches(":focus-visible") && openCard(e.currentTarget, key, i)}
          onBlur={() => setCard((c) => (c?.key === key ? null : c))}
          onClick={(e) => (open && card?.pinned ? setCard(null) : openCard(e.currentTarget, key, i, true))}
          className={cx(
            "mx-px inline-grid h-[18px] min-w-[18px] -translate-y-px place-items-center rounded-[5px] px-1 align-middle text-[11px] font-semibold leading-none tabular-nums outline-none",
            "transition-[background-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-95",
            open || on ? "bg-brand text-white" : "bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] text-ink-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:text-ink",
          )}
        >
          {n}
        </button>
        {open && (
          <span
            id={`${uid}-card`}
            role="tooltip"
            onPointerEnter={() => clearTimeout(timer.current)}
            onPointerLeave={closeSoon}
            style={{ left: card.x }}
            className={cx(
              "absolute z-50 block w-[304px] max-w-[calc(100vw-32px)] whitespace-normal rounded-xl bg-paper p-3.5 text-left leading-normal",
              "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_16px_36px_-12px_rgb(0_0_0/0.28),0_4px_10px_-6px_rgb(0_0_0/0.1)]",
              "animate-[asta-cite-in_.18s_cubic-bezier(.16,1,.3,1)_both]",
              card.below ? "top-full mt-2 origin-top" : "bottom-full mb-2 origin-bottom",
            )}
          >
            <span className="flex items-center gap-2">
              <Tile domain={s.domain} i={i} />
              <span className="min-w-0 flex-1 truncate text-[12px] text-mute">
                {s.domain}
                {s.date && ` · ${s.date}`}
              </span>
              <span className="font-mono text-[11px] text-mute">[{n}]</span>
            </span>
            <span className="mt-2 line-clamp-2 text-[13.5px] font-medium leading-snug text-ink">{s.title}</span>
            <span className="mt-1.5 line-clamp-4 text-[12.5px] leading-relaxed text-ink-2">
              <Quote s={s} />
            </span>
          </span>
        )}
      </span>
    );
  };

  if (loading)
    return (
      <div className={cx("asta-cite flex w-full flex-col gap-5", className)} aria-busy="true" aria-label="Loading answer">
        <style href="asta-citations" precedence="asta">{KEYFRAMES}</style>
        <div className="flex flex-col gap-2.5 pt-1">
          {["w-full", "w-[94%]", "w-[86%]", "w-[60%]"].map((w, i) => (
            <span key={w} className={cx("h-3 rounded-full bg-paper-2", w)} style={{ animation: `asta-cite-pulse 1.4s cubic-bezier(.16,1,.3,1) ${i * 120}ms infinite` }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cx("h-[58px] rounded-[10px] bg-paper-2", i > 1 && "hidden sm:block")} style={{ animation: `asta-cite-pulse 1.4s cubic-bezier(.16,1,.3,1) ${i * 120}ms infinite` }} />
          ))}
        </div>
      </div>
    );

  return (
    <div ref={root} className={cx("asta-cite flex w-full flex-col gap-5", className)}>
      <style href="asta-citations" precedence="asta">{KEYFRAMES}</style>
      <div className="flex flex-col gap-3 text-[15px] leading-[1.7] text-ink">
        {paragraphs.map((p, pi) => (
          <p key={pi}>
            {parse(p).map((part, k) => (typeof part === "string" ? part : <span key={k} className="whitespace-nowrap">{part.map((n, j) => pill(n, `${pi}-${k}-${j}`))}</span>))}
          </p>
        ))}
      </div>

      {sources.length === 0 ? (
        <p className="flex items-center gap-2 text-[12.5px] text-mute">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5M8 11h.01" />
          </svg>
          No sources were used for this answer. Check it before you rely on it.
        </p>
      ) : (
        <section aria-labelledby={`${uid}-h`} className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <h4 id={`${uid}-h`} className="flex items-center gap-2 text-[12.5px] font-medium text-ink-2">
              Sources
              <span className="rounded-[5px] bg-paper-2 px-1.5 text-[11px] tabular-nums text-mute">{sources.length}</span>
            </h4>
            {more > 0 && (
              <button
                type="button"
                aria-expanded={all}
                aria-controls={`${uid}-list`}
                onClick={() => setAll((a) => !a)}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-[12.5px] font-medium text-ink-2 outline-none transition-colors duration-150 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                {all ? "Show less" : `Show all ${sources.length}`}
                <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", all && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </button>
            )}
          </div>
          <ol id={`${uid}-list`} className={cx(all ? "flex flex-col gap-1" : "grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:grid-cols-4")}>
            {shown.map((s, i) => {
              const lightUp = { onPointerEnter: () => setLit(i), onPointerLeave: () => setLit(null), onFocus: () => setLit(i), onBlur: () => setLit(null) };
              const hot = lit === i || card?.src === i;
              const body = all ? (
                <>
                  <span className="w-5 shrink-0 pt-1 text-right font-mono text-[11px] tabular-nums text-mute">{i + 1}</span>
                  <Tile domain={s.domain} i={i} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-medium text-ink">{s.title}</span>
                      {s.url && <span className="shrink-0 text-mute">{arrow}</span>}
                    </span>
                    <span className="block text-[12px] text-mute">
                      {s.domain}
                      {s.date && ` · ${s.date}`}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">
                      <Quote s={s} />
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5">
                    <Tile domain={s.domain} i={i} />
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-mute">{s.domain}</span>
                    <span className="font-mono text-[11px] tabular-nums text-mute">{i + 1}</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[12.5px] font-medium leading-snug text-ink">{s.title}</span>
                </>
              );
              const cls = cx(
                "block w-full rounded-[10px] text-left outline-none transition-[background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-brand/50",
                all ? "flex gap-3 p-2.5" : "p-2.5",
                hot ? "bg-[color-mix(in_srgb,var(--color-brand)_7%,var(--color-paper))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_35%,transparent)]" : "bg-paper-2 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,var(--color-paper-2))]",
                all && !hot && "bg-transparent",
              );
              return (
                <li key={i} style={{ animation: `asta-cite-rise .35s cubic-bezier(.16,1,.3,1) ${all ? i * 35 : 0}ms both` }}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" {...lightUp} className={cx(cls, all && "flex")} aria-label={`${i + 1}. ${s.title}, ${s.domain}. Opens in a new tab`}>
                      {body}
                    </a>
                  ) : (
                    <div tabIndex={0} {...lightUp} className={cls} aria-label={`${i + 1}. ${s.title}, ${s.domain}`}>
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
            {!all && more > 0 && (
              <li className="hidden sm:block">
                <button
                  type="button"
                  onClick={() => setAll(true)}
                  className="flex h-full w-full flex-col justify-between rounded-[10px] bg-paper-2 p-2.5 text-left outline-none transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,var(--color-paper-2))] focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <span className="line-clamp-1 text-[11.5px] text-mute">{sources.slice(visible).map((s) => s.domain).join(", ")}</span>
                  <span className="mt-1.5 text-[12.5px] font-medium text-ink">+{more} more</span>
                </button>
              </li>
            )}
          </ol>
        </section>
      )}
    </div>
  );
}

export default Citations;
