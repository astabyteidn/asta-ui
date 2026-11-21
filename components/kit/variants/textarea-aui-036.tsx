"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const LINE = 28;
const CSS = `
@keyframes aui036-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui036-swap { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes aui036-dot { 0%, 100% { opacity: .35; transform: scale(.8) } 50% { opacity: 1; transform: scale(1) } }
@keyframes aui036-tick { from { opacity: 0; transform: scale(.4) rotate(-20deg) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui036 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui036-rise .6s ${EASE} ${i * 55}ms both` });

type Status = "idle" | "saving" | "saved" | "error";

function ago(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} h ago`;
}

export interface NotesTextareaProps {
  title?: string;
  /** Small mono line above the title, e.g. a date. */
  eyebrow?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called after you stop typing. Resolve when saved, reject to show "Not saved". Defaults to a fake 600ms save. */
  onSave?: (value: string) => Promise<void>;
  /** Pause before an autosave, in ms. */
  delay?: number;
  /** When the note was last saved. Shows "Saved · …" from the start. */
  savedAt?: number;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * aui-036 · A notes card that saves itself. Signature: ruled lines that scroll with the text behind a blue margin rule,
 * and a status chip that morphs from a pulsing "Saving" into "Saved · just now" with a tick, then keeps its age fresh.
 */
export function NotesTextarea({
  title = "Kickoff notes",
  eyebrow = "Thu · 19 Nov",
  value,
  defaultValue = "",
  onChange,
  onSave,
  delay = 800,
  savedAt,
  placeholder = "Start writing…",
  rows = 6,
  className,
}: NotesTextareaProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const [status, setStatus] = useState<Status>(savedAt ? "saved" : "idle");
  const [stamp, setStamp] = useState(savedAt ?? 0);
  const [now, setNow] = useState(() => savedAt ?? 0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const run = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Refresh "x min ago" every 20s, only while the card is on screen and the tab is visible.
  useEffect(() => {
    const el = root.current;
    if (!el || status !== "saved") return;
    let seen = false;
    let iv: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(iv);
      iv = undefined;
      if (seen && !document.hidden) {
        setNow(Date.now());
        iv = setInterval(() => setNow(Date.now()), 20000);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      clearInterval(iv);
    };
  }, [status]);

  const change = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const mine = ++run.current;
      setStatus("saving");
      try {
        await (onSave ? onSave(v) : new Promise<void>((r) => setTimeout(r, 600)));
        if (mine !== run.current) return;
        const t = Date.now();
        setStamp(t);
        setNow(t);
        setStatus("saved");
      } catch {
        if (mine === run.current) setStatus("error");
      }
    }, delay);
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const label = status === "saving" ? "Saving" : status === "error" ? "Not saved" : status === "saved" ? `Saved · ${ago(Math.max(0, now - stamp))}` : "Draft";

  return (
    <div
      ref={root}
      className={cx(
        "aui036 w-full max-w-[440px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-textarea-aui-036" precedence="asta">{CSS}</style>
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0" style={rise(0)}>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">{eyebrow}</p>
          <label htmlFor={id} className="mt-1 block truncate text-[20px] font-medium tracking-[-0.02em] text-ink">
            {title}
          </label>
        </div>
        <span
          role="status"
          aria-live="polite"
          className={cx(
            "mt-0.5 flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] transition-colors duration-300",
            status === "saved" ? "bg-[color-mix(in_srgb,var(--color-brand)_9%,transparent)] text-brand" : "bg-paper-2 text-mute",
            status === "error" && "!text-ink",
          )}
          style={rise(1)}
        >
          {status === "saved" ? (
            <svg key={stamp} viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: `aui036-tick .45s ${EASE} both` }} aria-hidden>
              <path d="m3.5 8.5 3 3 6-7" />
            </svg>
          ) : (
            <span
              className={cx("h-1.5 w-1.5 rounded-full", status === "error" ? "bg-ink" : status === "saving" ? "bg-brand" : "bg-mute")}
              style={status === "saving" ? { animation: "aui036-dot 1s ease-in-out infinite" } : undefined}
            />
          )}
          <span key={status} style={{ animation: `aui036-swap .35s ${EASE} both` }}>
            {label}
          </span>
        </span>
      </div>
      <div className="relative" style={rise(2)}>
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[38px] w-px bg-[color-mix(in_srgb,var(--color-brand)_45%,transparent)]" />
        <textarea
          id={id}
          rows={rows}
          value={text}
          placeholder={placeholder}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
              e.preventDefault();
              clearTimeout(timer.current);
              change(text);
            }
          }}
          spellCheck
          className="block w-full resize-none bg-transparent pb-2 pl-[52px] pr-5 text-[16px] sm:text-[14.5px] text-ink outline-none placeholder:text-mute"
          style={{
            lineHeight: `${LINE}px`,
            paddingTop: 2,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${LINE - 1}px, color-mix(in srgb, var(--color-ink) 9%, transparent) ${LINE - 1}px ${LINE}px)`,
            backgroundAttachment: "local",
            backgroundPositionY: 2,
          }}
        />
      </div>
      <div className="flex items-center justify-between bg-paper-2 px-5 py-2.5 text-[12px] text-mute" style={rise(3)}>
        <span className="tabular-nums">
          {words} {words === 1 ? "word" : "words"}
        </span>
        <span>
          <kbd className="font-sans">⌘S</kbd> saves now
        </span>
      </div>
    </div>
  );
}

export default NotesTextarea;
