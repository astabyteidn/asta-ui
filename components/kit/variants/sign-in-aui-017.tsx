"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]";
const CARD =
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const FOCUS = "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const ROW = 44;
const GAP = 8;

const CSS = `
@keyframes aui017-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui017-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes aui017-pop { from { opacity: 0; transform: scale(.94) translateY(6px) } to { opacity: 1; transform: none } }
@keyframes aui017-draw { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
@keyframes aui017-sweep { from { transform: translateX(-100%) } to { transform: translateX(100%) } }
@media (prefers-reduced-motion: reduce) { .aui017 * { animation: none !important; transition: none !important } }
`;

const rise = (i: number): CSSProperties => ({ animation: `aui017-rise .6s ${EASE} ${100 + i * 55}ms both` });
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const Spinner = () => <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;

export type SocialSignInProvider = "google" | "github" | "apple";

const GLYPHS: Record<SocialSignInProvider, { label: string; icon: ReactNode }> = {
  google: {
    label: "Google",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <path fill="currentColor" d="M8 6.6v2.9h4.1A4.3 4.3 0 0 1 8 12.4a4.4 4.4 0 0 1 0-8.8c1.1 0 2.1.4 2.9 1.1l2-2A7.3 7.3 0 0 0 8 .7a7.3 7.3 0 1 0 0 14.6c4.2 0 7-3 7-7.1 0-.5 0-1-.1-1.5H8Z" />
      </svg>
    ),
  },
  github: {
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M8 .5a7.5 7.5 0 0 0-2.4 14.6c.4.1.5-.2.5-.4v-1.4c-2.1.5-2.5-.9-2.5-.9-.4-.9-.9-1.1-.9-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.2.6.1-.5.3-.8.5-1-1.7-.2-3.4-.8-3.4-3.7 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2 0 0 .6-.2 2.1.8a7 7 0 0 1 3.8 0c1.4-1 2.1-.8 2.1-.8.4 1 .2 1.8.1 2 .5.5.8 1.2.8 2 0 2.9-1.8 3.5-3.4 3.7.3.2.5.7.5 1.4v2.1c0 .2.1.5.5.4A7.5 7.5 0 0 0 8 .5Z"
        />
      </svg>
    ),
  },
  apple: {
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.2 3.09 3.79 3.04 1.52-.07 2.09-.99 3.93-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.15-1.69 1.63-3.32 1.66-3.41-.04-.02-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.15-3.68 1.09-4.61 1.09Zm3.38-3.07c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.67.8-3.54 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.72-.69 3.56-1.7Z"
        />
      </svg>
    ),
  },
};

export interface SocialSignInProps {
  title?: string;
  subtitle?: string;
  providers?: SocialSignInProvider[];
  /** Marks one provider with a "Last used" tag. */
  lastUsed?: SocialSignInProvider;
  /** Resolve when the provider flow finishes, reject (with a message) to show an error. */
  onProvider?: (provider: SocialSignInProvider) => Promise<void>;
  /** Called with the email. Resolve when the link is sent. */
  onEmail?: (email: string) => Promise<void>;
  /** Glide the highlight across the providers once after mount, to show it off. */
  hint?: boolean;
  className?: string;
}

/**
 * aui-017 · Social-first sign-in. Signature: one soft highlight glides between the provider buttons as you
 * hover or tab, the chosen one sweeps while it connects, and "Continue with email" fades the field in.
 */
export function SocialSignIn({
  title = "Sign in to Astabyte",
  subtitle = "Pick up where your team left off.",
  providers = ["google", "github", "apple"],
  lastUsed = "github",
  onProvider,
  onEmail,
  hint = false,
  className,
}: SocialSignInProps) {
  const id = useId();
  const [busy, setBusy] = useState<SocialSignInProvider | "email" | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [done, setDone] = useState<{ title: string; detail: ReactNode } | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState("");
  const [shake, setShake] = useState(0);
  const alive = useRef(true);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  const error = !email.trim() ? "Enter your email." : !validEmail(email) ? "That doesn't look like an email address." : "";
  const shown = (touched && error) || formError;
  const hasError = !!shown;
  const count = providers.length;
  const busyIndex = providers.findIndex((p) => p === busy);
  const lit = busyIndex >= 0 ? busyIndex : hover;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hasError || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    box.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 420, easing: EASE },
    );
  }, [hasError, shake]);

  useEffect(() => {
    if (!hint || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const steps = [...Array.from({ length: count }, (_, i) => i), null];
    const timers = steps.map((v, k) => setTimeout(() => setHover(v), 900 + k * 420));
    return () => timers.forEach(clearTimeout);
  }, [hint, count]);

  useEffect(() => {
    if (emailOpen) input.current?.focus({ preventScroll: true });
  }, [emailOpen]);

  const provider = async (p: SocialSignInProvider) => {
    if (busy) return;
    setBusy(p);
    setFormError("");
    try {
      await (onProvider ? onProvider(p) : wait(1400));
      if (alive.current) setDone({ title: "You're in", detail: <>Signed in with {GLYPHS[p].label}.</> });
    } catch (err) {
      if (alive.current) setFormError(err instanceof Error ? err.message : `${GLYPHS[p].label} sign-in didn't finish. Try again.`);
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setTouched(true);
    setFormError("");
    if (error) {
      setShake((n) => n + 1);
      input.current?.focus();
      return;
    }
    setBusy("email");
    try {
      await (onEmail ? onEmail(email.trim()) : wait(1100));
      if (alive.current)
        setDone({
          title: "Check your inbox",
          detail: (
            <>
              We sent a link to <span className="break-all text-ink">{email.trim()}</span>.
            </>
          ),
        });
    } catch (err) {
      if (!alive.current) return;
      setFormError(err instanceof Error ? err.message : "We couldn't send the link. Try again.");
      setShake((n) => n + 1);
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  const reset = () => {
    setDone(null);
    setEmailOpen(false);
    setEmail("");
    setTouched(false);
  };

  return (
    <div className={cx("aui017 @container relative w-full max-w-[380px] overflow-hidden rounded-[14px] bg-paper", CARD, className)}>
      <style href="asta-sign-in-aui-017" precedence="asta">{CSS}</style>
      {done ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center p-7 text-center" role="status" style={{ animation: `aui017-pop .5s ${EASE} both` }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" style={{ animation: `aui017-draw .5s .15s ${EASE} both` }} />
            </svg>
          </span>
          <h3 className="mt-5 text-[20px] font-medium tracking-[-0.02em] text-ink">{done.title}</h3>
          <p className="mt-1.5 max-w-[28ch] text-[14px] leading-snug text-mute">{done.detail}</p>
          <button type="button" onClick={reset} className={cx("mt-6 h-9 rounded-[8px] px-3.5 text-[13.5px] font-medium text-ink outline-none transition-colors hover:bg-paper-2", RING, FOCUS)}>
            Start over
          </button>
        </div>
      ) : (
        <div className="flex flex-col p-6 sm:p-7">
          <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-ink text-paper" style={rise(0)} aria-hidden>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
              <path d="M8 1.5 14.5 14h-3L8 7.2 4.5 14h-3L8 1.5Z" />
            </svg>
          </span>
          <h3 className="mt-5 text-[20px] font-medium tracking-[-0.02em] text-ink" style={rise(1)}>
            {title}
          </h3>
          <p className="mt-1 text-[14px] leading-snug text-mute" style={rise(2)}>
            {subtitle}
          </p>

          {/* Signature: one highlight that glides between rows. */}
          <div className="relative mt-6" style={rise(3)} onPointerLeave={() => setHover(null)}>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 rounded-[10px] bg-paper-2 transition-[transform,opacity] duration-500"
              style={{ height: ROW, transform: `translateY(${(lit ?? 0) * (ROW + GAP)}px)`, opacity: lit === null ? 0 : 1, transitionTimingFunction: EASE }}
            />
            <ul className="relative flex flex-col" style={{ gap: GAP }}>
              {providers.map((p, i) => {
                const isBusy = busy === p;
                return (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => provider(p)}
                      onPointerEnter={() => setHover(i)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      disabled={!!busy && !isBusy}
                      aria-busy={isBusy || undefined}
                      className={cx(
                        "group relative flex w-full items-center gap-3 overflow-hidden rounded-[10px] px-3.5 text-left text-[14px] font-medium text-ink outline-none transition-[opacity,transform] duration-300 active:scale-[.985] focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-40",
                        RING,
                      )}
                      style={{ height: ROW }}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-paper text-ink shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
                        {isBusy ? <Spinner /> : GLYPHS[p].icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{isBusy ? `Opening ${GLYPHS[p].label}` : `Continue with ${GLYPHS[p].label}`}</span>
                      {p === lastUsed && !isBusy && (
                        <>
                          <span className="hidden shrink-0 whitespace-nowrap rounded-[5px] bg-brand/10 px-1.5 py-0.5 text-[10.5px] font-medium text-brand @min-[340px]:inline">Last used</span>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand @min-[340px]:hidden">
                            <span className="sr-only">Last used</span>
                          </span>
                        </>
                      )}
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5 -translate-x-1 text-mute opacity-0 transition-[transform,opacity] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                        style={{ transitionTimingFunction: EASE }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                      {isBusy && (
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-brand),transparent)]"
                          style={{ animation: `aui017-sweep 1.1s ${EASE} infinite` }}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="my-5 flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute" style={rise(4)} aria-hidden>
            <span className="h-px flex-1 bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]" />
            or
            <span className="h-px flex-1 bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]" />
          </div>

          {!emailOpen ? (
            <button
              ref={opener}
              type="button"
              onClick={() => setEmailOpen(true)}
              aria-expanded={false}
              disabled={!!busy}
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-[10px] text-[14px] font-medium text-ink outline-none transition-[background-color,transform] duration-200 hover:bg-paper-2 active:scale-[.985] focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-40"
              style={rise(5)}
            >
              Continue with email
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
          ) : (
            <form id={`${id}-form`} noValidate onSubmit={submit} className="flex flex-col">
              <label htmlFor={`${id}-email`} className="text-[13px] font-medium text-ink" style={{ animation: `aui017-rise .5s ${EASE} both` }}>
                Work email
              </label>
              <div ref={box} className="mt-1.5" style={{ animation: `aui017-rise .5s ${EASE} 50ms both` }}>
                <input
                  ref={input}
                  id={`${id}-email`}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError("");
                  }}
                  onBlur={() => email && setTouched(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && !email) {
                      setEmailOpen(false);
                      requestAnimationFrame(() => opener.current?.focus());
                    }
                  }}
                  aria-invalid={hasError || undefined}
                  aria-describedby={hasError ? `${id}-err` : undefined}
                  className={cx(
                    "h-11 w-full rounded-[10px] bg-paper px-3.5 text-[14px] text-ink outline-none transition-shadow duration-200 placeholder:text-mute focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
                    hasError ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]" : RING,
                  )}
                />
              </div>
              {hasError && (
                <p id={`${id}-err`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-ink" style={{ animation: `aui017-in .3s ${EASE} both` }}>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                    <circle cx="8" cy="8" r="6.25" />
                    <path d="M8 4.8v3.6M8 11h.01" />
                  </svg>
                  {shown}
                </p>
              )}
              <button
                type="submit"
                disabled={!!busy}
                aria-busy={busy === "email" || undefined}
                className={cx(
                  "mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-ink px-4 text-[14px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.985] disabled:opacity-70",
                  FOCUS,
                )}
                style={{ animation: `aui017-rise .5s ${EASE} 100ms both` }}
              >
                {busy === "email" && <Spinner />}
                {busy === "email" ? "Sending link" : "Send sign-in link"}
              </button>
            </form>
          )}

          {formError && !emailOpen && (
            <p role="alert" className="mt-4 flex items-center gap-1.5 text-[12.5px] text-ink" style={{ animation: `aui017-in .3s ${EASE} both` }}>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <circle cx="8" cy="8" r="6.25" />
                <path d="M8 4.8v3.6M8 11h.01" />
              </svg>
              {formError}
            </p>
          )}

          <p className="mt-5 text-center text-[12px] leading-snug text-mute" style={rise(6)}>
            By continuing you agree to our{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="rounded text-ink underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="rounded text-ink underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}

export default SocialSignIn;
