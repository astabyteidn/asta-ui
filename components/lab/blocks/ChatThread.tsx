"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";

type Msg = { id: number; me: boolean; text: string };

const START: Msg[] = [
  { id: 1, me: false, text: "Morning. Did the samples arrive?" },
  { id: 2, me: true, text: "They did. The oak one is lovely." },
];
/** The idle conversation. It ends on a sent message, then the thread fades and starts over. */
const SCRIPT: Omit<Msg, "id">[] = [
  { me: false, text: "Great. Shall I hold it for Friday?" },
  { me: true, text: "Yes please, Friday works." },
  { me: false, text: "Done. Invoice comes tonight." },
  { me: true, text: "Perfect, thank you." },
];
const REPLIES = ["Got it.", "Sounds good to me.", "Noted. I'll get back to you soon."];
const KEEP = 8;

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Tick = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2.5 6.4l2.2 2.1L9.5 3.6" />
  </svg>
);

/** One focused moment: dots turn into a reply, your message lifts out of the composer and the receipt ticks to Read. */
export default function ChatThread() {
  const [msgs, setMsgs] = useState<Msg[]>(START);
  const [typing, setTyping] = useState(false);
  const [read, setRead] = useState(2);
  const [draft, setDraft] = useState("");
  const [fade, setFade] = useState(false);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(3);
  const pos = useRef(0);
  const reply = useRef(0);
  const list = useRef<HTMLDivElement>(null);
  const tops = useRef(new Map<string, number>());
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const own = useRef<ReturnType<typeof setTimeout>[]>([]);

  const add = (m: Omit<Msg, "id">) => {
    const id = nextId.current++;
    setMsgs((s) => [...s, { ...m, id }].slice(-KEEP));
    return id;
  };

  // FLIP: anything that moved since the last render glides from where it was.
  useLayoutEffect(() => {
    const move = !instant && !still();
    const next = new Map<string, number>();
    list.current?.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const key = el.dataset.flip ?? "";
      const top = el.getBoundingClientRect().top;
      next.set(key, top);
      const before = tops.current.get(key);
      if (move && before !== undefined && Math.abs(before - top) > 0.5) {
        el.animate([{ transform: `translateY(${before - top}px)` }, { transform: "none" }], { duration: 560, easing: EASE });
      }
    });
    tops.current = next;
  });

  const takeOver = () => {
    setPaused(true);
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 9000);
  };
  useEffect(
    () => () => {
      if (idle.current) clearTimeout(idle.current);
      own.current.forEach(clearTimeout);
    },
    [],
  );

  // Demo loop: walk the script, then fade, reset unseen and go again.
  useEffect(() => {
    if (paused || still()) return;
    let alive = true;
    // Live timers only: each one drops out of the set when it fires, so the loop doesn't pile up ids.
    const t = new Set<ReturnType<typeof setTimeout>>();
    const later = (ms: number, f: () => void) => {
      const id = setTimeout(() => {
        t.delete(id);
        if (alive) f();
      }, ms);
      t.add(id);
    };
    const run = () => {
      if (pos.current >= SCRIPT.length) {
        setFade(true);
        later(500, () => {
          pos.current = 0;
          nextId.current = 3;
          setInstant(true);
          setMsgs(START);
          setRead(2);
        });
        later(620, () => setInstant(false));
        later(680, () => setFade(false));
        later(1700, run);
        return;
      }
      const m = SCRIPT[pos.current++];
      if (!m.me) {
        setTyping(true);
        later(1500, () => {
          setTyping(false);
          add(m);
          later(1500, run);
        });
        return;
      }
      // Type it into the composer, then send.
      m.text.split("").forEach((_, i) => later(i * 32, () => setDraft(m.text.slice(0, i + 1))));
      later(m.text.length * 32 + 380, () => {
        setDraft("");
        const id = add(m);
        later(1000, () => setRead(id));
        later(2300, run);
      });
    };
    later(1100, run);
    return () => {
      alive = false;
      t.forEach(clearTimeout);
      setTyping(false);
      setFade(false);
    };
  }, [paused]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    takeOver();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    const id = add({ me: true, text });
    own.current.forEach(clearTimeout);
    own.current = [
      setTimeout(() => setRead(id), 900),
      setTimeout(() => setTyping(true), 1400),
      setTimeout(() => {
        setTyping(false);
        add({ me: false, text: REPLIES[reply.current++ % REPLIES.length] });
      }, 2900),
    ];
  };

  const lastMe = [...msgs].reverse().find((m) => m.me)?.id;

  return (
    <div className="flex h-full w-full items-center justify-center px-5 pb-5 pt-11" style={{ containerType: "size" }}>
      <style href="asta-chatthread" precedence="asta">{`
        @keyframes lab-ct-grow { from { transform: scale(.55); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-ct-fly { from { transform: translateY(28px) scale(.97); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes lab-ct-dot { 0%, 60%, 100% { transform: none; opacity: .35 } 30% { transform: translateY(-2.5px); opacity: 1 } }
        @keyframes lab-ct-tick { from { transform: translateX(-3px) scale(.6); opacity: 0 } to { transform: none; opacity: 1 } }
        .lab-ct-grow { transform-origin: 0 100%; animation: lab-ct-grow .5s ${EASE} both }
        .lab-ct-fly { transform-origin: 100% 100%; animation: lab-ct-fly .6s ${EASE} both }
        .lab-ct-dot { animation: lab-ct-dot 1.2s ${EASE} infinite }
        .lab-ct-tick { animation: lab-ct-tick .45s ${EASE} both }
        @media (prefers-reduced-motion: reduce) { .lab-ct-grow, .lab-ct-fly, .lab-ct-dot, .lab-ct-tick { animation: none } .lab-ct-dot { opacity: .6 } }
      `}</style>

      <div className="flex h-full w-full max-w-[400px] flex-col">
        {/* Contact */}
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-2 text-[11px] font-medium text-ink-2 ${RING}`}>NL</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium text-ink">Nora Lind</span>
            <span className="block truncate text-[11.5px] text-mute">{typing ? "Typing…" : "Lindqvist Studio"}</span>
          </span>
        </div>

        {/* Thread */}
        <div
          className="relative mt-3 min-h-0 flex-1 overflow-hidden"
          style={{ maskImage: "linear-gradient(to bottom, transparent, #000 28px)", WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 28px)" }}
        >
          <div
            ref={list}
            role="log"
            aria-live="polite"
            aria-label="Conversation with Nora Lind"
            className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 pb-1"
            style={{ opacity: fade ? 0 : 1, transition: `opacity .5s ${EASE}` }}
          >
            {msgs.map((m) => (
              <div key={m.id} data-flip={m.id} className={`flex flex-col ${m.me ? "items-end" : "items-start"}`}>
                <span
                  className={`max-w-[78%] px-3 py-[7px] text-[13px] leading-snug ${
                    m.me ? "rounded-[14px] rounded-br-[5px] bg-brand text-paper" : "rounded-[14px] rounded-bl-[5px] bg-paper-2 text-ink"
                  } ${m.id > 2 && !instant ? (m.me ? "lab-ct-fly" : "lab-ct-grow") : ""}`}
                >
                  {m.text}
                </span>
                {m.id === lastMe && (
                  <span className="mt-1 flex items-center gap-1 pr-0.5 text-[10.5px] text-mute">
                    {read >= m.id ? "Read" : "Delivered"}
                    <span className="relative flex h-3 w-[15px]">
                      <Tick className={`absolute left-0 top-0 h-3 w-3 ${read >= m.id ? "text-brand" : ""}`} />
                      {read >= m.id && (
                        <span key={`r${m.id}`} className="lab-ct-tick absolute left-[4px] top-0 h-3 w-3 text-brand">
                          <Tick className="h-3 w-3" />
                        </span>
                      )}
                    </span>
                  </span>
                )}
              </div>
            ))}
            {typing && (
              <div data-flip="typing" className="flex">
                <span aria-label="Nora is typing" className="lab-ct-grow flex h-[31px] items-center gap-[4px] rounded-[14px] rounded-bl-[5px] bg-paper-2 px-3">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="lab-ct-dot h-[5px] w-[5px] rounded-full bg-mute" style={{ animationDelay: `${d * 0.16}s` }} />
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <form onSubmit={send} className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            onFocus={() => {
              takeOver();
              if (!paused) setDraft("");
            }}
            onChange={(e) => {
              takeOver();
              setDraft(e.target.value);
            }}
            placeholder="Message"
            aria-label="Message"
            className={`h-9 min-w-0 flex-1 rounded-[9px] bg-paper px-3 text-[13px] text-ink outline-none placeholder:text-mute focus-visible:ring-2 focus-visible:ring-brand/50 ${RING}`}
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-brand text-paper outline-none transition-[opacity,transform] duration-300 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            style={{ opacity: draft.trim() ? 1 : 0.35, transitionTimingFunction: EASE }}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 13V3.5M4 7.5l4-4 4 4" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
