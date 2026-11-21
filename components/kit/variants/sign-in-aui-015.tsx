"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CARD =
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]";
const FOCUS = "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

const CSS = `
@keyframes aui015-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui015-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes aui015-drop { 0% { opacity: 0; transform: translateY(-18px) scale(.96) } 100% { opacity: 1; transform: none } }
@keyframes aui015-fly { 0% { transform: none; opacity: 1 } 35% { transform: translate(-3px, 2px) rotate(-8deg) } 100% { transform: translate(40px, -34px) rotate(12deg) scale(.6); opacity: 0 } }
@keyframes aui015-land { from { opacity: 0; transform: translate(-22px, 18px) rotate(-10deg) scale(.7) } to { opacity: 1; transform: none } }
@keyframes aui015-ping { 0% { opacity: .55; transform: scale(1) } 100% { opacity: 0; transform: scale(2.6) } }
@keyframes aui015-drain { from { transform: scaleX(1) } to { transform: scaleX(0) } }
@media (prefers-reduced-motion: reduce) { .aui015 * { animation: none !important; transition: none !important } }
`;

const rise = (i: number): CSSProperties => ({ animation: `aui015-rise .6s ${EASE} ${100 + i * 55}ms both` });
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const Spinner = () => <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;

function useShake<T extends HTMLElement>(active: boolean, key: number) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 420, easing: EASE },
    );
  }, [active, key]);
  return ref;
}

const Plane = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg viewBox="0 0 16 16" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14.5 1.5 7 9M14.5 1.5 10 14.5 7 9 1.5 6l13-4.5Z" />
  </svg>
);

export interface MagicLinkSignInProps {
  brand?: string;
  title?: string;
  subtitle?: string;
  defaultEmail?: string;
  /** Sends the link. Resolve when it's sent, reject (with a message) to show an error. */
  onSend?: (email: string) => Promise<void>;
  /** Sends the link again. Defaults to `onSend`. */
  onResend?: (email: string) => Promise<void>;
  /** Seconds before Resend unlocks. */
  resendAfter?: number;
  /** Link for the Open mail button. */
  mailHref?: string;
  className?: string;
}

/**
 * aui-015 · Magic link sign-in. Signature: the send arrow flies off as a paper plane, the email itself drops
 * into a mini inbox preview, and the Resend button carries a timer bar that drains over the countdown.
 */
export function MagicLinkSignIn({
  brand = "Astabyte",
  title = "Sign in with email",
  subtitle = "No password. We'll send a link that signs you in.",
  defaultEmail = "",
  onSend,
  onResend,
  resendAfter = 30,
  mailHref = "mailto:",
  className,
}: MagicLinkSignInProps) {
  const id = useId();
  const [email, setEmail] = useState(defaultEmail);
  const [touched, setTouched] = useState(false);
  const [stage, setStage] = useState<"form" | "flying" | "sent">("form");
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [sends, setSends] = useState(0);
  const [left, setLeft] = useState(0);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [shake, setShake] = useState(0);
  const alive = useRef(true);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const error = !email.trim() ? "Enter your email." : !validEmail(email) ? "Enter an email like name@company.com." : "";
  const shown = (touched && error) || formError;
  const box = useShake<HTMLDivElement>(!!shown, shake);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  // Let the plane leave before the card swaps.
  useEffect(() => {
    if (stage !== "flying") return;
    const quick = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setStage("sent"), quick ? 0 : 440);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage === "sent") heading.current?.focus({ preventScroll: true });
  }, [stage]);

  const send = (to: string) => (onSend ? onSend(to) : wait(1100));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending || stage !== "form") return;
    setTouched(true);
    setFormError("");
    if (error) {
      setShake((n) => n + 1);
      input.current?.focus();
      return;
    }
    setPending(true);
    try {
      await send(email.trim());
      if (!alive.current) return;
      setStage("flying");
      setLeft(resendAfter);
      setSends((n) => n + 1);
      setNote("");
    } catch (err) {
      if (!alive.current) return;
      setFormError(err instanceof Error ? err.message : "We couldn't send the link. Try again.");
      setShake((n) => n + 1);
    } finally {
      if (alive.current) setPending(false);
    }
  };

  const resend = async () => {
    if (left > 0 || resending) return;
    setResending(true);
    setNote("");
    try {
      await (onResend ? onResend(email.trim()) : send(email.trim()));
      if (!alive.current) return;
      setNote("Sent again. Give it a minute.");
      setLeft(resendAfter);
      setSends((n) => n + 1);
    } catch (err) {
      if (alive.current) setNote(err instanceof Error ? err.message : "We couldn't resend it. Try again.");
    } finally {
      if (alive.current) setResending(false);
    }
  };

  const back = () => {
    setStage("form");
    setLeft(0);
    setNote("");
    requestAnimationFrame(() => input.current?.focus());
  };

  return (
    <div className={cx("aui015 relative w-full max-w-[400px] overflow-hidden rounded-[14px] bg-paper", CARD, className)}>
      <style href="asta-sign-in-aui-015" precedence="asta">{CSS}</style>
      {stage !== "sent" ? (
        <form noValidate onSubmit={submit} className="flex flex-col p-6 sm:p-7">
          <div className="flex items-center justify-between" style={rise(0)}>
            <span className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.02em] text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-ink text-paper" aria-hidden>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M3 13V3h2.2l5.6 6.6V3H13v10h-2.2L5.2 6.4V13H3Z" />
                </svg>
              </span>
              {brand}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Passwordless</span>
          </div>

          <h3 className="mt-8 text-[20px] font-medium tracking-[-0.02em] text-ink" style={rise(1)}>
            {title}
          </h3>
          <p className="mt-1 text-[14px] leading-snug text-mute" style={rise(2)}>
            {subtitle}
          </p>

          <div className="mt-6" style={rise(3)}>
            <label htmlFor={`${id}-email`} className="text-[13px] font-medium text-ink">
              Work email
            </label>
            <div ref={box} className="relative mt-1.5">
              <svg viewBox="0 0 16 16" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
                <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.75" />
                <path d="m2.5 4.5 5.5 4 5.5-4" />
              </svg>
              <input
                ref={input}
                id={`${id}-email`}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError("");
                  // A fix clears the error while typing; a new one waits for blur.
                  if (touched && validEmail(e.target.value)) setTouched(false);
                }}
                onBlur={() => email && setTouched(true)}
                aria-invalid={!!shown || undefined}
                aria-describedby={shown ? `${id}-err` : `${id}-hint`}
                className={cx(
                  "h-11 w-full rounded-[9px] bg-paper pl-9 pr-3 text-[16px] sm:text-[14.5px] text-ink outline-none transition-shadow duration-200 placeholder:text-mute focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
                  shown ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]" : RING,
                )}
              />
            </div>
            {shown ? (
              <p id={`${id}-err`} role="alert" className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink" style={{ animation: `aui015-in .3s ${EASE} both` }}>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <circle cx="8" cy="8" r="6.25" />
                  <path d="M8 4.8v3.6M8 11h.01" />
                </svg>
                {shown}
              </p>
            ) : (
              <p id={`${id}-hint`} className="mt-2 text-[12.5px] text-mute">
                Use the address your team invited.
              </p>
            )}
          </div>

          <div style={rise(4)}>
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending || undefined}
              className={cx(
                "group mt-5 inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-[9px] bg-ink px-4 text-[14px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.985] disabled:cursor-progress",
                FOCUS,
              )}
            >
              {pending ? <Spinner /> : null}
              <span>{pending ? "Sending your link" : stage === "flying" ? "Sent" : "Email me a link"}</span>
              {!pending && (
                <Plane
                  className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  style={stage === "flying" ? { animation: `aui015-fly .45s ${EASE} both` } : { transitionTimingFunction: EASE }}
                />
              )}
            </button>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-mute" style={rise(5)}>
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            Links work once and expire in 15 minutes.
          </p>
        </form>
      ) : (
        <div className="flex flex-col p-6 sm:p-7">
          <div className="flex items-center justify-between" style={rise(0)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand text-paper" aria-hidden>
              <Plane className="h-[18px] w-[18px]" style={{ animation: `aui015-land .6s ${EASE} both` }} />
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">Link sent</span>
          </div>
          <h3 ref={heading} tabIndex={-1} className="mt-5 text-[20px] font-medium tracking-[-0.02em] text-ink outline-none" style={rise(1)}>
            Check your inbox
          </h3>
          <p className="mt-1 text-[14px] leading-snug text-mute" style={rise(2)}>
            We sent a sign-in link to <span className="break-all font-medium text-ink">{email.trim()}</span>.
          </p>

          {/* Signature: the email itself, landing in a tiny inbox. */}
          <div key={sends} className={cx("relative mt-5 rounded-[11px] bg-paper p-3.5", RING)} style={{ animation: `aui015-drop .7s ${EASE} 260ms both` }} aria-hidden>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-paper">{brand[0]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink">{brand}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-mute">
                    now
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 rounded-full bg-brand" style={{ animation: `aui015-ping 1.2s ${EASE} 900ms 2 both` }} />
                      <span className="relative h-2 w-2 rounded-full bg-brand" />
                    </span>
                  </span>
                </div>
                <p className="truncate text-[13px] text-ink">Your sign-in link for {brand}</p>
                <p className="truncate text-[12.5px] text-mute">Tap the button to finish signing in. It expires in 15 minutes.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-2" style={rise(4)}>
            <a
              href={mailHref}
              className={cx(
                "group inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-ink px-4 text-[14px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.985]",
                FOCUS,
              )}
            >
              Open mail
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 11 11 5M6 5h5v5" />
              </svg>
            </a>
            <button
              type="button"
              onClick={resend}
              disabled={left > 0 || resending}
              aria-busy={resending || undefined}
              className={cx(
                "relative inline-flex h-11 min-w-[116px] items-center justify-center gap-2 overflow-hidden rounded-[9px] bg-paper px-4 text-[13.5px] font-medium text-ink outline-none transition-[background-color,transform] duration-200 hover:bg-paper-2 active:scale-[.985] disabled:cursor-not-allowed disabled:hover:bg-paper",
                RING,
                FOCUS,
              )}
            >
              {resending ? <Spinner /> : null}
              <span className={cx("tabular-nums", left > 0 && "text-mute")}>{resending ? "Sending" : left > 0 ? `Resend in ${left}s` : "Resend"}</span>
              {left > 0 && (
                <span key={sends} aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brand" style={{ animation: `aui015-drain ${resendAfter}s linear both` }} />
              )}
            </button>
          </div>
          <p role="status" className="mt-3 min-h-[18px] text-center text-[12.5px] text-ink">
            {note && (
              <span key={note} className="inline-block" style={{ animation: `aui015-in .3s ${EASE} both` }}>
                {note}
              </span>
            )}
          </p>
          <div className="mt-1 flex items-center justify-center gap-1 text-[13px] text-mute" style={rise(5)}>
            Wrong address?
            <button type="button" onClick={back} className="rounded font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
              Change it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MagicLinkSignIn;
