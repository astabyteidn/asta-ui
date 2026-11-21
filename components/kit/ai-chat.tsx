"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** The reply was stopped before it finished. */
  stopped?: boolean;
  /** The reply failed. `content` holds whatever arrived before the error. */
  failed?: boolean;
}

export interface AiChatProps {
  /**
   * Produces the reply to the latest prompt. Return an async iterable of text chunks to stream it, or a
   * promise of the whole text. Stop the work when `signal` aborts.
   */
  onSend: (input: { prompt: string; messages: AiChatMessage[]; signal: AbortSignal }) => AsyncIterable<string> | Promise<string>;
  defaultMessages?: AiChatMessage[];
  /** Called whenever a message is added or a reply finishes. */
  onMessagesChange?: (messages: AiChatMessage[]) => void;
  /** Prompt chips shown while the conversation is empty. */
  suggestions?: string[];
  title?: string;
  /** Shown above the suggestions while the conversation is empty. */
  greeting?: string;
  placeholder?: string;
  className?: string;
}

const KEYFRAMES = `@keyframes kit-ac-tok { from { opacity: 0 } }
@keyframes kit-ac-in { from { opacity: 0; transform: translateY(8px) } }
@keyframes kit-ac-dot { 0%, 80%, 100% { opacity: .25; transform: translateY(0) } 40% { opacity: 1; transform: translateY(-2px) } }
@keyframes kit-ac-pop { from { opacity: 0; transform: scale(.6) } }
@media (prefers-reduced-motion: reduce) { .kit-ac, .kit-ac * { animation: none !important; transition-duration: 0s !important; } }`;

let seq = 0;
const uid = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

function Mark() {
  return (
    <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] text-brand">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M8 1.5c.4 2.9 1.6 4.1 4.5 4.5-2.9.4-4.1 1.6-4.5 4.5-.4-2.9-1.6-4.1-4.5-4.5C6.4 5.6 7.6 4.4 8 1.5Z" />
        <path d="M12.5 10c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z" opacity=".55" />
      </svg>
    </span>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-mute outline-none transition-colors duration-200 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      {children}
    </button>
  );
}

const svg = { viewBox: "0 0 16 16", className: "h-3.5 w-3.5", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/**
 * An assistant chat panel. Replies stream in token by token and each token fades in. Suggested prompts
 * fill the empty state. Enter sends, Shift + Enter adds a line, and the send button turns into Stop
 * while a reply streams. Assistant messages can be copied, and the last one regenerated.
 */
export function AiChat({
  onSend,
  defaultMessages = [],
  onMessagesChange,
  suggestions = [],
  title = "Assistant",
  greeting = "How can I help?",
  placeholder = "Ask anything…",
  className,
}: AiChatProps) {
  const [messages, setMessages] = useState(defaultMessages);
  // Chunks of the latest streamed reply, so each token can fade in on its own. The next run drops them.
  const [chunks, setChunks] = useState<Record<string, string[]>>({});
  const [streaming, setStreaming] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const inputId = useId();

  const ctrl = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const pinned = useRef(true);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useRef(onMessagesChange);
  useEffect(() => {
    notify.current = onMessagesChange;
  }, [onMessagesChange]);

  // Stop any reply and timers when the panel goes away.
  useEffect(
    () => () => {
      ctrl.current?.abort();
      ctrl.current = null;
      clearTimeout(copyTimer.current);
    },
    [],
  );

  // Follow the reply as it grows, unless the reader scrolled up.
  useLayoutEffect(() => {
    const el = list.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [messages, chunks, waiting]);

  const commit = (next: AiChatMessage[]) => {
    setMessages(next);
    notify.current?.(next);
  };

  const run = async (history: AiChatMessage[]) => {
    const prompt = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    const id = uid();
    let reply = "";
    let failed = false;
    pinned.current = true;
    commit(history);
    setStreaming(id);
    setWaiting(true);
    // Only the newest reply keeps its chunks (its last tokens may still be fading). Older ones render from content.
    setChunks({ [id]: [] });
    setStatus("Assistant is replying.");

    const push = (t: string) => {
      if (!t) return;
      reply += t;
      setWaiting(false);
      setChunks((all) => ({ ...all, [id]: [...(all[id] ?? []), t] }));
    };

    try {
      const out = onSend({ prompt, messages: history, signal: c.signal });
      if (typeof (out as AsyncIterable<string>)[Symbol.asyncIterator] === "function") {
        for await (const t of out as AsyncIterable<string>) {
          if (c.signal.aborted) break;
          push(t);
        }
      } else {
        const whole = await (out as Promise<string>);
        if (!c.signal.aborted) push(whole);
      }
    } catch {
      if (!c.signal.aborted) failed = true;
    }

    // Stopped (stop() already settled), unmounted, or a newer reply took over: leave state alone.
    if (ctrl.current !== c) return;
    ctrl.current = null;
    const msg: AiChatMessage = { id, role: "assistant", content: reply, ...(failed && { failed: true }) };
    commit([...history, msg]);
    setStreaming(null);
    setWaiting(false);
    setStatus(failed ? "The reply failed." : "Reply finished.");
  };

  const send = (raw: string) => {
    const prompt = raw.trim();
    if (!prompt || streaming) return;
    setText("");
    run([...messages, { id: uid(), role: "user", content: prompt }]);
    area.current?.focus();
  };

  const stop = () => {
    const c = ctrl.current;
    if (!c) return;
    c.abort();
    // Settle right away even if the producer ignores the signal.
    ctrl.current = null;
    const id = streaming!;
    const reply = (chunks[id] ?? []).join("");
    commit([...messages, { id, role: "assistant", content: reply, stopped: true }]);
    setStreaming(null);
    setWaiting(false);
    setStatus("Stopped.");
    area.current?.focus();
  };

  const regenerate = () => {
    const last = messages.length - 1;
    if (streaming || last < 0 || messages[last].role !== "assistant") return;
    run(messages.slice(0, last));
  };

  const copy = async (m: AiChatMessage) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopied(m.id);
      setStatus("Copied.");
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1600);
    } catch {
      setStatus("Couldn't copy.");
    }
  };

  const shown: AiChatMessage[] = streaming ? [...messages, { id: streaming, role: "assistant", content: "" }] : messages;
  const empty = shown.length === 0;
  const lastId = shown[shown.length - 1]?.id;

  return (
    <div
      className={cx(
        "kit-ac flex h-[540px] w-full flex-col overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_1px_2px_rgb(0_0_0/0.04)]",
        className,
      )}
    >
      <style href="asta-ai-chat" precedence="asta">{KEYFRAMES}</style>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <header className="flex items-center gap-2.5 px-5 pb-3 pt-4">
        <Mark />
        <h3 className="text-[14px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      </header>

      <div
        ref={list}
        role="log"
        aria-live="off"
        aria-busy={!!streaming}
        aria-label="Conversation"
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-5 [scrollbar-width:thin]"
      >
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center pb-6 text-center" style={{ animation: `kit-ac-in .5s ${CURVE}` }}>
            <p className="text-[22px] font-medium tracking-[-0.03em] text-ink">{greeting}</p>
            {suggestions.length > 0 && (
              <div className="mt-6 flex max-w-[440px] flex-wrap justify-center gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-lg bg-paper-2 px-3 py-2 text-left text-[13px] leading-snug text-ink-2 outline-none transition-[color,background-color,transform] duration-300 hover:-translate-y-px hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
                    style={{ animation: `kit-ac-in .5s ${CURVE} ${80 + i * 50}ms both` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <ol className="flex flex-col gap-6 py-2">
            {shown.map((m) => {
              const live = m.id === streaming;
              const parts = chunks[m.id];
              if (m.role === "user") {
                return (
                  <li key={m.id} className="flex justify-end" style={{ animation: `kit-ac-in .4s ${CURVE}` }}>
                    <p className="max-w-[80%] whitespace-pre-wrap rounded-xl bg-paper-2 px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">{m.content}</p>
                  </li>
                );
              }
              const isLast = m.id === lastId;
              return (
                <li key={m.id} className="group flex gap-3">
                  <Mark />
                  <div className="min-w-0 flex-1 pt-0.5">
                    {live && waiting ? (
                      <span role="img" className="inline-flex h-6 items-center gap-1" aria-label="Thinking">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-mute" style={{ animation: `kit-ac-dot 1.1s ${CURVE} ${i * 140}ms infinite` }} />
                        ))}
                      </span>
                    ) : (
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                        {parts && parts.length
                          ? parts.map((t, i) => (
                              <span key={i} style={{ animation: `kit-ac-tok .5s ${CURVE}` }}>
                                {t}
                              </span>
                            ))
                          : m.content}
                      </p>
                    )}
                    {!live && (m.stopped || m.failed) && (
                      <p className="mt-1.5 text-[12.5px] text-mute">{m.failed ? "Something went wrong. Try again." : "Stopped."}</p>
                    )}
                    {!live && (
                      <div
                        className={cx(
                          "mt-1.5 -ml-1.5 flex items-center gap-0.5 transition-opacity duration-300",
                          isLast ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
                        )}
                      >
                        {m.content && (
                          <IconButton label={copied === m.id ? "Copied" : "Copy"} onClick={() => copy(m)}>
                            {copied === m.id ? (
                              <svg {...svg} key="ok" style={{ animation: `kit-ac-pop .3s ${CURVE}` }}>
                                <path d="m3.5 8.5 3 3 6-7" />
                              </svg>
                            ) : (
                              <svg {...svg} key="copy">
                                <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" />
                                <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
                              </svg>
                            )}
                          </IconButton>
                        )}
                        {isLast && (
                          <IconButton label="Regenerate" onClick={regenerate}>
                            <svg {...svg}>
                              <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v2.5h-2.5" />
                            </svg>
                          </IconButton>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form
        className="px-4 pb-4 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <div className="flex items-end gap-2 rounded-xl bg-paper p-1.5 pl-3.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] transition-shadow duration-200 focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]">
          <label htmlFor={inputId} className="sr-only">
            Message
          </label>
          <textarea
            ref={area}
            id={inputId}
            name="prompt"
            rows={1}
            enterKeyHint="send"
            value={text}
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(text);
              } else if (e.key === "Escape" && streaming) {
                e.preventDefault();
                stop();
              }
            }}
            className="block max-h-36 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[16px] sm:text-[14px] leading-relaxed text-ink outline-none [field-sizing:content] placeholder:text-mute"
          />
          {streaming ? (
            <button
              key="stop"
              type="button"
              onClick={stop}
              aria-label="Stop"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-paper outline-none transition-transform duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50"
              style={{ animation: `kit-ac-pop .3s ${CURVE}` }}
            >
              <span className="h-2.5 w-2.5 rounded-[2px] bg-current" />
            </button>
          ) : (
            <button
              key="send"
              type="submit"
              aria-label="Send"
              disabled={!text.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-white outline-none transition-[opacity,transform] duration-200 active:scale-95 disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              style={{ animation: `kit-ac-pop .3s ${CURVE}` }}
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
              </svg>
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11.5px] text-mute">Replies can be wrong. Check anything important.</p>
      </form>
    </div>
  );
}

export default AiChat;
