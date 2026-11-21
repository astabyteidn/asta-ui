"use client";

import { useEffect, useId, useRef, useState, type ClipboardEvent, type CSSProperties, type RefObject, type SyntheticEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui042-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui042-drop { from { opacity: 0; transform: translateY(-8px) scale(.85) } to { opacity: 1; transform: none } }
@keyframes aui042-caret { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
@keyframes aui042-wait { 0%, 100% { opacity: 1; transform: none } 50% { opacity: .45; transform: translateY(-3px) } }
@keyframes aui042-shake { 0%, 100% { transform: none } 20% { transform: translateX(-8px) } 40% { transform: translateX(7px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(2px) } }
@keyframes aui042-badge { 0% { opacity: 0; transform: scale(.3) } 60% { opacity: 1; transform: scale(1.08) } 100% { opacity: 1; transform: none } }
@keyframes aui042-ring { from { opacity: .7; transform: scale(1) } to { opacity: 0; transform: scale(1.9) } }
@keyframes aui042-sec { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui042 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui042-rise .65s ${EASE} ${120 + i * 60}ms both` });

type State = "idle" | "checking" | "error" | "done";

export interface VerifyOtpProps {
  length?: number;
  /** Who the code was sent to, shown in the copy. */
  destination?: string;
  title?: string;
  /** Resolve if the code is right, reject (optionally with a message) if not. Defaults to accepting `demoCode`. */
  onVerify?: (code: string) => Promise<void>;
  /** Used when no onVerify is given. */
  demoCode?: string;
  /** Seconds before "Resend" unlocks. */
  resendAfter?: number;
  onResend?: () => void;
  onContinue?: () => void;
  /** Code to start with, e.g. from a magic link. Verifies once it is complete. */
  defaultValue?: string;
  className?: string;
}

/** Re-render once a second while counting, only when on screen and the tab is visible. */
function useCountdown(deadline: number, root: RefObject<HTMLElement | null>) {
  const [now, setNow] = useState(() => deadline);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = false;
    let iv: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(iv);
      iv = undefined;
      if (seen && !document.hidden && Date.now() < deadline) {
        setNow(Date.now());
        iv = setInterval(() => {
          const t = Date.now();
          setNow(t);
          if (t >= deadline) clearInterval(iv);
        }, 1000);
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
  }, [deadline, root]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

/**
 * aui-042 · A dark two-step verification card. Signature: the boxes ripple while the code is checked, then fold into the
 * centre and morph into a blue badge with a ring pulse, while the resend timer counts down second by second.
 */
export function VerifyOtp({
  length = 6,
  destination = "rani@astabyte.com",
  title = "Two-step verification",
  onVerify,
  demoCode = "424242",
  resendAfter = 30,
  onResend,
  onContinue,
  defaultValue = "",
  className,
}: VerifyOtpProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const [code, setCode] = useState(defaultValue.replace(/\D/g, "").slice(0, length));
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");
  const [shake, setShake] = useState(0);
  const [focused, setFocused] = useState(false);
  const [deadline, setDeadline] = useState(() => (resendAfter > 0 ? Date.now() + resendAfter * 1000 : 0));
  const left = useCountdown(deadline, root);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const verify = async (c: string) => {
    setState("checking");
    setMsg("");
    try {
      await (onVerify
        ? onVerify(c)
        : new Promise<void>((res, rej) => setTimeout(() => (c === demoCode ? res() : rej(new Error("That code didn't work. Check it and try again."))), 900)));
      if (alive.current) setState("done");
    } catch (err) {
      if (!alive.current) return;
      setState("error");
      setMsg(err instanceof Error && err.message ? err.message : "That code didn't work.");
      setShake((s) => s + 1);
      setCode("");
      input.current?.focus();
    }
  };

  // Verify a complete code handed in up front.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || code.length !== length) return;
    started.current = true;
    void verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (raw: string) => {
    if (state === "checking" || state === "done") return;
    const next = raw.replace(/\D/g, "").slice(0, length);
    if (next === code) return;
    setCode(next);
    if (state === "error") setState("idle");
    if (next.length === length) void verify(next);
  };
  const toEnd = (e: SyntheticEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const n = el.value.length;
    if (el.selectionStart !== n || el.selectionEnd !== n) el.setSelectionRange(n, n);
  };

  const resend = () => {
    setDeadline(Date.now() + resendAfter * 1000);
    setCode("");
    setState("idle");
    setMsg("");
    onResend?.();
    input.current?.focus();
  };

  const done = state === "done";
  const mid = (length - 1) / 2;
  const active = focused ? Math.min(code.length, length - 1) : -1;

  return (
    <div
      ref={root}
      className={cx(
        "aui042 relative w-full max-w-[400px] overflow-hidden rounded-[16px] bg-ink px-6 pb-6 pt-7 text-paper shadow-[0_2px_4px_rgb(0_0_0/0.08),0_30px_60px_-28px_rgb(0_0_0/0.6)]",
        className,
      )}
    >
      <style href="asta-otp-input-aui-042" precedence="asta">{CSS}</style>
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_45%,transparent),transparent)]" />
      <div className="relative flex flex-col items-center text-center">
        <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-paper text-[15px] font-semibold text-ink" style={rise(0)}>
          A
        </span>
        <h3 className="relative mt-4 h-7 w-full overflow-hidden text-[20px] font-medium tracking-[-0.02em]" style={rise(1)}>
          <span key={done ? "done" : "t"} className="block" style={{ animation: `aui042-sec .4s ${EASE} both` }}>
            {done ? "You're verified" : title}
          </span>
        </h3>
        <p className="mt-1.5 text-[13.5px] text-paper/60" style={rise(2)}>
          {done ? "Signing you in to Astabyte." : (
            <>
              Enter the {length}-digit code sent to <span className="text-paper">{destination}</span>
            </>
          )}
        </p>

        <div className="relative mt-6 h-14" style={rise(3)}>
          <div
            key={shake}
            aria-hidden
            className="flex h-14 items-center gap-2"
            style={shake ? { animation: `aui042-shake .42s ${EASE} both` } : undefined}
          >
            {Array.from({ length }, (_, i) => {
              const d = code[i];
              const fold = done ? `translateX(${(mid - i) * 50}px) scale(.4)` : "none";
              return (
                <div
                  key={i}
                  className={cx(
                    "relative grid h-14 w-11 place-items-center rounded-[10px] transition-[transform,opacity,background-color,box-shadow] duration-500",
                    i === active && state !== "checking"
                      ? "bg-paper/[0.1] shadow-[inset_0_0_0_1.5px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_25%,transparent)]"
                      : state === "error"
                        ? "bg-paper/[0.06] shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-paper)_70%,transparent)]"
                        : "bg-paper/[0.06] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_12%,transparent)]",
                  )}
                  style={{
                    transform: fold,
                    opacity: done ? 0 : 1,
                    transitionTimingFunction: EASE,
                    transitionDelay: done ? `${Math.abs(i - mid) * 30}ms` : "0ms",
                    animation: state === "checking" ? `aui042-wait .9s ease-in-out ${i * 70}ms infinite` : undefined,
                  }}
                >
                  {d && (
                    <span key={`${i}-${d}`} className="text-[22px] font-medium tabular-nums" style={{ animation: `aui042-drop .3s ${EASE} both` }}>
                      {d}
                    </span>
                  )}
                  {i === active && !d && state !== "checking" && <span className="absolute h-5 w-[1.5px] rounded-full bg-paper" style={{ animation: "aui042-caret 1.05s steps(1) infinite" }} />}
                </div>
              );
            })}
          </div>
          {done && (
            <span className="absolute inset-0 grid place-items-center" aria-hidden>
              <span className="absolute h-14 w-14 rounded-full bg-brand" style={{ animation: `aui042-ring 1s ${EASE} .35s both` }} />
              <span className="relative grid h-14 w-14 place-items-center rounded-full bg-brand text-white" style={{ animation: `aui042-badge .55s ${EASE} .2s both` }}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
            </span>
          )}
          <input
            ref={input}
            id={id}
            name="code"
            aria-label={`${length}-digit verification code`}
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length}
            disabled={done}
            aria-invalid={state === "error" || undefined}
            aria-describedby={`${id}-msg`}
            onChange={(e) => update(e.target.value)}
            onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
              e.preventDefault();
              update(e.clipboardData.getData("text"));
            }}
            onFocus={(e) => {
              setFocused(true);
              toEnd(e);
            }}
            onBlur={() => setFocused(false)}
            onSelect={toEnd}
            className="absolute inset-0 h-full w-full cursor-text bg-transparent text-[16px] text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-default"
          />
        </div>

        <p id={`${id}-msg`} role="status" aria-live="polite" className="mt-3 min-h-[20px] text-[13px] text-paper/80">
          {state === "checking" ? "Checking…" : msg}
        </p>

        <div className="mt-1 flex h-10 w-full items-center justify-center" style={rise(4)}>
          {done ? (
            <button
              type="button"
              onClick={onContinue}
              className="group inline-flex h-10 items-center gap-2 rounded-[9px] bg-paper px-5 text-[13.5px] font-medium text-ink outline-none transition-transform duration-200 active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              style={{ animation: `aui042-rise .5s ${EASE} .45s both` }}
            >
              Continue
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          ) : left > 0 ? (
            <p className="flex items-center gap-1 text-[13px] text-paper/50">
              Resend code in
              <span className="inline-flex h-5 overflow-hidden font-medium tabular-nums text-paper">
                0:
                <span key={left} className="block" style={{ animation: `aui042-sec .3s ${EASE} both` }}>
                  {String(left).padStart(2, "0")}
                </span>
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={resend}
              className="h-9 rounded-[8px] px-3 text-[13px] font-medium text-paper outline-none transition-[background-color,transform] duration-200 hover:bg-paper/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand"
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
