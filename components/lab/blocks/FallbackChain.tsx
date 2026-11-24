"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const FAINT = "bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]";

type Status = "idle" | "trying" | "failed" | "ok" | "skipped";

const MODELS = [
  { name: "Astra 2 Pro", note: "Primary · 200k context", error: "Timed out", detail: "10 s", tryMs: 1900, okMs: 1240 },
  { name: "Astra 2", note: "Fallback · 128k context", error: "Rate limited", detail: "429", tryMs: 800, okMs: 960 },
  { name: "Astra Fast", note: "Last resort · 32k context", error: "Overloaded", detail: "503", tryMs: 900, okMs: 842 },
];
/** The scripted run: the first two fail, the last one answers. */
const DEFAULT = [true, true, false];
const PROMPT = "Summarise this week’s support tickets";
const REPLY = "14 tickets this week, down from 22. Most are about invoice exports, and 3 still need a reply.".split(" ");
const LABEL: Record<Status, string> = { idle: "Waiting", trying: "Trying", failed: "Failed", ok: "Answered", skipped: "Not needed" };

const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${Math.round(n)} ms`);

/** A request falls through models in order: one times out, one is rate limited, the last answers and the reply streams in. */
export default function FallbackChain() {
  const [status, setStatus] = useState<Status[]>(MODELS.map(() => "idle"));
  const [elapsed, setElapsed] = useState(0);
  const [words, setWords] = useState(0);
  const [fade, setFade] = useState(false);
  const [run, setRun] = useState(0);
  const [armed, setArmed] = useState<boolean[] | null>(null);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const plan = useRef(DEFAULT);

  useEffect(() => {
    plan.current = armed ?? DEFAULT;
  }, [armed]);

  // Rest while off screen or in a hidden tab.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = true;
    const sync = () => setVisible(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  // One run of the chain. It starts over from the top when it comes back into view.
  useEffect(() => {
    if (!visible) return;
    const t: ReturnType<typeof setTimeout>[] = [];
    let tick: ReturnType<typeof setInterval> | undefined;
    let alive = true;
    const later = (at: number, f: () => void) => t.push(setTimeout(() => alive && f(), at));
    const fails = plan.current;
    const set = (i: number, s: Status) => setStatus((v) => v.map((x, k) => (k === i ? s : x)));
    const clock = (scale: number) => {
      clearInterval(tick);
      const start = performance.now();
      setElapsed(0);
      tick = setInterval(() => setElapsed((performance.now() - start) * scale), 90);
    };

    later(0, () => {
      setStatus(MODELS.map(() => "idle"));
      setWords(0);
      setElapsed(0);
      setFade(false);
    });

    let at = 650;
    let answered = -1;
    for (let i = 0; i < MODELS.length && answered < 0; i++) {
      const m = MODELS[i];
      const dur = fails[i] ? m.tryMs : 1100;
      // The shown clock is scaled, so a timeout reads 10 s and an answer lands on its real latency.
      const scale = fails[i] ? (i === 0 ? 10000 / dur : 1) : m.okMs / dur;
      later(at, () => {
        set(i, "trying");
        clock(scale);
      });
      at += dur;
      if (fails[i]) {
        later(at, () => {
          clearInterval(tick);
          set(i, "failed");
        });
        at += 520;
      } else {
        answered = i;
        later(at, () => {
          clearInterval(tick);
          setElapsed(m.okMs);
          setStatus((v) => v.map((x, k) => (k === i ? "ok" : k > i ? "skipped" : x)));
        });
        at += 280;
        REPLY.forEach((_, w) => later(at + w * 55, () => setWords(w + 1)));
        at += REPLY.length * 55;
      }
    }
    at += answered < 0 ? 4200 : 3000;
    later(at, () => setFade(true));
    later(at + 480, () => setRun((r) => r + 1));
    return () => {
      alive = false;
      t.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, [visible, run]);

  const toggle = (i: number) => setArmed((a) => (a ?? DEFAULT).map((f, k) => (k === i ? !f : f)));
  const retry = () => setRun((r) => r + 1);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      retry();
      return;
    }
    const i = rows.current.findIndex((b) => b === document.activeElement);
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!d || i < 0) return;
    e.preventDefault();
    rows.current[(i + d + MODELS.length) % MODELS.length]?.focus();
  };

  const okAt = status.indexOf("ok");
  const trying = status.indexOf("trying");
  const allFailed = status.every((s) => s === "failed");
  const falls = status.filter((s) => s === "failed").length;
  const attempt = trying >= 0 ? trying + 1 : okAt >= 0 ? okAt + 1 : Math.max(1, falls);
  const winner = okAt >= 0 ? MODELS[okAt] : null;
  const next = armed ?? DEFAULT;

  return (
    <div
      ref={root}
      role="group"
      aria-label="Model fallback chain. Press a model to make it fail or recover on the next run. Press R to retry"
      onKeyDown={onKey}
      className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11"
      style={{ containerType: "size" }}
    >
      <style href="asta-fallbackchain" precedence="asta">{`
        @keyframes lab-fc-spin { to { transform: rotate(360deg) } }
        @keyframes lab-fc-pop { from { transform: scale(.92); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-fc-word { from { transform: translateY(3px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-fc-pulse { from { transform: scale(1); opacity: .45 } to { transform: scale(2.4); opacity: 0 } }
        .lab-fc-spin { animation: lab-fc-spin .85s ${EASE} infinite }
        .lab-fc-pop { animation: lab-fc-pop .45s ${EASE} both }
        .lab-fc-word { animation: lab-fc-word .4s ${EASE} both }
        .lab-fc-pulse { animation: lab-fc-pulse 1.3s ${EASE} infinite }
        .lab-fc-note { display: none }
        @container (min-height: 330px) and (min-width: 280px) { .lab-fc-note { display: block } }
        @container (max-height: 250px) { .lab-fc-head { display: none } }
        @container (min-height: 400px) { .lab-fc-reply { -webkit-line-clamp: 3 } }
        @media (prefers-reduced-motion: reduce) { .lab-fc-spin, .lab-fc-pop, .lab-fc-word, .lab-fc-pulse { animation: none } }
      `}</style>

      <div
        className={`flex w-full max-w-[460px] flex-col gap-[max(6px,2.2cqh)] rounded-[14px] bg-paper p-[clamp(10px,3.4cqmin,16px)] ${RING} shadow-[0_18px_40px_-28px_rgb(0_0_0/0.35)]`}
        style={{ opacity: fade ? 0 : 1, transition: `opacity .45s ${EASE}` }}
      >
        <div className="lab-fc-head flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-brand">Request</p>
            <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-ink">{PROMPT}</p>
          </div>
          <span className="shrink-0 rounded-md bg-paper-2 px-2 py-1 text-[11px] tabular-nums text-ink-2">
            Attempt {attempt} of {MODELS.length}
          </span>
        </div>

        <ol className="relative flex flex-col" aria-label="Models in fallback order">
          {/* The rail the request falls down. */}
          <span aria-hidden className="absolute bottom-[17%] left-[19px] top-[17%] w-px bg-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]" />
          {MODELS.map((m, i) => {
            const s = status[i];
            const dim = s === "failed" || s === "skipped";
            return (
              <li key={m.name}>
                <button
                  ref={(el) => {
                    rows.current[i] = el;
                  }}
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={next[i]}
                  aria-label={`${m.name}: ${s === "failed" ? `${m.error} ${m.detail}` : s === "ok" ? `Answered in ${ms(m.okMs)}` : LABEL[s]}. ${next[i] ? "Fails" : "Healthy"} on the next run, press to switch`}
                  className={`relative flex h-[clamp(34px,12cqh,48px)] w-full items-center gap-3 rounded-[10px] px-[11px] text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/60 ${s === "trying" ? "bg-paper-2" : ""}`}
                  style={{ transition: `background-color .35s ${EASE}` }}
                >
                  <span className="relative grid h-[17px] w-[17px] shrink-0 place-items-center">
                    {s === "trying" && <span aria-hidden className="lab-fc-pulse absolute inset-0 rounded-full bg-brand" />}
                    <span
                      aria-hidden
                      className={`relative grid h-full w-full place-items-center rounded-full ${s === "ok" || s === "trying" ? "bg-brand text-paper" : s === "failed" ? "bg-ink text-paper" : `bg-paper ${RING}`}`}
                      style={{ transition: `background-color .3s ${EASE}` }}
                    >
                      {s === "ok" && (
                        <svg viewBox="0 0 16 16" className="lab-fc-pop h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3.5 8.5l3 3 6-7" />
                        </svg>
                      )}
                      {s === "failed" && (
                        <svg viewBox="0 0 16 16" className="lab-fc-pop h-2 w-2" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                          <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 leading-tight" style={{ opacity: dim ? 0.45 : 1, transition: `opacity .45s ${EASE}` }}>
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium text-ink">{m.name}</span>
                      {armed && next[i] && (
                        <span className="lab-fc-pop shrink-0 rounded bg-paper-2 px-1 py-px font-mono text-[9.5px] uppercase tracking-wide text-ink-2">Fails next</span>
                      )}
                    </span>
                    <span className="lab-fc-note truncate text-[11px] text-mute">{m.note}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] tabular-nums">
                    {s === "trying" && (
                      <>
                        <span aria-hidden className="lab-fc-spin h-3 w-3 rounded-full border-[1.5px] border-brand border-r-transparent" />
                        <span className="w-[40px] text-right text-ink-2">{ms(elapsed)}</span>
                      </>
                    )}
                    {s === "failed" && (
                      <span className="lab-fc-pop">
                        <span className="font-medium text-ink">{m.error}</span> <span className="text-mute">{m.detail}</span>
                      </span>
                    )}
                    {s === "ok" && <span className="lab-fc-pop font-medium text-brand">Answered</span>}
                    {(s === "idle" || s === "skipped") && <span className="text-mute">{LABEL[s]}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* The reply keeps its size from the first frame, so nothing shifts when it lands. */}
        <div className="relative h-[clamp(74px,21cqh,90px)] overflow-hidden rounded-[11px] bg-paper-2 px-3 py-2.5" aria-live="polite">
          {winner ? (
            <div key={`w${run}`} className="lab-fc-pop flex h-full flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-mute">
                  <span className="font-medium text-ink">{winner.name}</span>
                  {falls ? ` · fell back ${falls === 1 ? "once" : "twice"}` : " · first try"}
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-md bg-ink px-1.5 py-0.5 font-mono text-[10.5px] text-paper">
                  <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="currentColor" aria-hidden>
                    <path d="M9.2 1.5 3.5 9h4l-1 5.5L12.5 7h-4z" />
                  </svg>
                  <span className="sr-only">Latency</span>
                  {ms(winner.okMs)}
                </span>
              </div>
              <p className="lab-fc-reply line-clamp-2 text-[12.5px] leading-snug text-ink">
                {REPLY.slice(0, words).map((w, k) => (
                  <span key={k} className="lab-fc-word inline-block whitespace-pre">
                    {w}{" "}
                  </span>
                ))}
              </p>
            </div>
          ) : allFailed ? (
            <div className="lab-fc-pop flex h-full items-center justify-between gap-3">
              <p className="min-w-0 text-[12px] leading-snug text-ink">
                <span className="font-medium">All 3 models failed.</span> <span className="text-mute">Let one recover, then retry.</span>
              </p>
              <button
                type="button"
                onClick={retry}
                className="shrink-0 rounded-[8px] bg-ink px-2.5 py-1.5 text-[11.5px] font-medium text-paper outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                Retry request
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-center gap-2">
              <span className="sr-only">Waiting for a reply</span>
              <span className={`h-2 w-[72%] rounded-full ${FAINT}`} />
              <span className={`h-2 w-[46%] rounded-full ${FAINT}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
