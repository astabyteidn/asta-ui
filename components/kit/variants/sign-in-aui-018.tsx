"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]";
const CARD =
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const FOCUS = "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const PRIMARY = cx(
  "group inline-flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-ink px-4 text-[14px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.985] disabled:cursor-progress",
  FOCUS,
);

const CSS = `
@keyframes aui018-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui018-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes aui018-pop { from { opacity: 0; transform: scale(.6) } 70% { transform: scale(1.06) } to { opacity: 1; transform: none } }
@keyframes aui018-halo { from { opacity: .5; transform: scale(1) } to { opacity: 0; transform: scale(1.7) } }
@keyframes aui018-draw { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { .aui018 * { animation: none !important; transition: none !important } }
`;

const rise = (i: number, on = true): CSSProperties | undefined => (on ? { animation: `aui018-rise .6s ${EASE} ${80 + i * 55}ms both` } : undefined);
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const Spinner = () => <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;
const Arrow = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

interface FieldProps {
  label: string;
  name: string;
  type: string;
  inputMode?: "email" | "text";
  value: string;
  onChange: (v: string) => void;
  error?: string;
  shake: number;
  autoComplete: string;
  placeholder?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onKeyUp?: (e: KeyboardEvent<HTMLInputElement>) => void;
  hint?: ReactNode;
  end?: ReactNode;
}

function Field({ label, name, type, inputMode, value, onChange, error, shake, autoComplete, placeholder, inputRef, onKeyUp, hint, end }: FieldProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const hasError = !!error;
  useEffect(() => {
    if (!hasError || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    box.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 420, easing: EASE },
    );
  }, [hasError, shake]);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        {hint}
      </div>
      <div ref={box} className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          value={value}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={onKeyUp}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-err` : undefined}
          className={cx(
            "h-11 w-full rounded-[9px] bg-paper px-3.5 text-[16px] sm:text-[14.5px] text-ink outline-none transition-shadow duration-200 placeholder:text-mute focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
            !!end && "pr-11",
            hasError ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]" : RING,
          )}
        />
        {end && <div className="absolute inset-y-0 right-1 flex items-center">{end}</div>}
      </div>
      {hasError && (
        <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 text-[12.5px] text-ink" style={{ animation: `aui018-in .3s ${EASE} both` }}>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.8v3.6M8 11h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export interface StepSignInProps {
  brand?: string;
  title?: string;
  subtitle?: string;
  defaultEmail?: string;
  /** Step 1. Resolve to move on (optionally with the account's display name), reject (with a message) to show an error. */
  onEmail?: (email: string) => Promise<void | { name?: string }>;
  /** Step 2. Resolve to finish, reject (with a message) to show an error. */
  onSubmit?: (data: { email: string; password: string }) => Promise<void>;
  className?: string;
}

const nameFrom = (email: string) =>
  email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");

/**
 * aui-018 · Two-step sign-in. Signature: after the email, the card slides sideways to an account chip whose
 * avatar pops in with a halo, a segmented progress rail fills, and a Caps Lock hint appears while you type.
 */
export function StepSignIn({ brand = "Astabyte", title = "Sign in to Astabyte", subtitle = "Enter your work email to continue.", defaultEmail = "", onEmail, onSubmit, className }: StepSignInProps) {
  const [step, setStep] = useState<0 | 1>(0);
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [caps, setCaps] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [shake, setShake] = useState(0);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const alive = useRef(true);
  const track = useRef<HTMLDivElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const passInput = useRef<HTMLInputElement>(null);
  const prev = useRef(step);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Focus the new step without letting the browser scroll the clipped track.
  useEffect(() => {
    if (prev.current === step) return;
    prev.current = step;
    const el = step === 0 ? emailInput.current : passInput.current;
    el?.focus({ preventScroll: true });
    if (track.current) track.current.scrollLeft = 0;
  }, [step]);

  const fail = (k: "email" | "password", msg: string) => {
    setErrors((e) => ({ ...e, [k]: msg }));
    setShake((n) => n + 1);
  };

  const next = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const msg = !email.trim() ? "Enter your email." : !validEmail(email) ? "Enter an email like name@company.com." : "";
    if (msg) return fail("email", msg);
    setPending(true);
    try {
      const res = await (onEmail ? onEmail(email.trim()) : wait(700));
      if (!alive.current) return;
      setName((res && res.name) || nameFrom(email.trim()));
      setErrors({ email: "", password: "" });
      setStep(1);
    } catch (err) {
      if (alive.current) fail("email", err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      if (alive.current) setPending(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const msg = !password ? "Enter your password." : password.length < 8 ? "Use at least 8 characters." : "";
    if (msg) return fail("password", msg);
    setPending(true);
    try {
      await (onSubmit ? onSubmit({ email: email.trim(), password }) : wait(1200));
      if (alive.current) setDone(true);
    } catch (err) {
      if (alive.current) fail("password", err instanceof Error ? err.message : "That password doesn't match. Try again.");
    } finally {
      if (alive.current) setPending(false);
    }
  };

  const back = () => {
    setStep(0);
    setPassword("");
    setCaps(false);
    setErrors({ email: "", password: "" });
  };

  const reset = () => {
    setDone(false);
    setStep(0);
    setPassword("");
  };

  const initials =
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2) || "?";

  return (
    <div className={cx("aui018 relative w-full max-w-[400px] overflow-hidden rounded-[14px] bg-paper", CARD, className)}>
      <style href="asta-sign-in-aui-018" precedence="asta">{CSS}</style>
      {done ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center p-7 text-center" role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper" style={{ animation: `aui018-pop .55s ${EASE} both` }}>
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" style={{ animation: `aui018-draw .5s .2s ${EASE} both` }} />
            </svg>
          </span>
          <h3 className="mt-5 text-[20px] font-medium tracking-[-0.02em] text-ink" style={rise(1)}>
            Welcome back, {name.split(" ")[0]}
          </h3>
          <p className="mt-1.5 max-w-[28ch] text-[14px] leading-snug text-mute" style={rise(2)}>
            Opening your {brand} workspace.
          </p>
          <button type="button" onClick={reset} className={cx("mt-6 h-9 rounded-[8px] px-3.5 text-[13.5px] font-medium text-ink outline-none transition-colors hover:bg-paper-2", RING, FOCUS)} style={rise(3)}>
            Sign out
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-6 pt-6 sm:px-7 sm:pt-7" style={rise(0)}>
            <span className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.02em] text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-ink text-paper" aria-hidden>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M3 13V3h2.2l5.6 6.6V3H13v10h-2.2L5.2 6.4V13H3Z" />
                </svg>
              </span>
              {brand}
            </span>
            <span className="flex items-center gap-2" aria-label={`Step ${step + 1} of 2`}>
              {[0, 1].map((i) => (
                <span key={i} className="relative h-[3px] w-7 overflow-hidden rounded-full bg-paper-2" aria-hidden>
                  <span className="absolute inset-0 origin-left rounded-full bg-brand transition-transform duration-700" style={{ transform: `scaleX(${step >= i ? 1 : 0})`, transitionTimingFunction: EASE }} />
                </span>
              ))}
              <span className="ml-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute tabular-nums">{step + 1}/2</span>
            </span>
          </div>
          <div ref={track} className="overflow-hidden">
            <div className="flex transition-transform duration-[650ms]" style={{ transform: `translateX(${step * -100}%)`, transitionTimingFunction: EASE }}>
              <form noValidate onSubmit={next} inert={step !== 0} aria-hidden={step !== 0} className="flex w-full shrink-0 flex-col px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
                <h3 className="text-[20px] font-medium tracking-[-0.02em] text-ink" style={rise(1)}>
                  {title}
                </h3>
                <p className="mt-1 text-[14px] leading-snug text-mute" style={rise(2)}>
                  {subtitle}
                </p>
                <div className="mt-6" style={rise(3)}>
                  <Field
                    label="Work email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(v) => {
                      setEmail(v);
                      if (errors.email) setErrors((e) => ({ ...e, email: "" }));
                    }}
                    error={errors.email}
                    shake={shake}
                    inputRef={emailInput}
                  />
                </div>
                <div style={rise(4)}>
                  <button type="submit" disabled={pending} aria-busy={(pending && step === 0) || undefined} className={cx(PRIMARY, "mt-5")}>
                    {pending && step === 0 ? <Spinner /> : null}
                    {pending && step === 0 ? "Finding your account" : "Continue"}
                    {!(pending && step === 0) && <Arrow />}
                  </button>
                </div>
                <p className="mt-5 text-center text-[13px] text-mute" style={rise(5)}>
                  New to {brand}?{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} className="rounded font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
                    Create an account
                  </a>
                </p>
              </form>

              <form noValidate onSubmit={submit} inert={step !== 1} aria-hidden={step !== 1} className="flex w-full shrink-0 flex-col px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
                <button
                  type="button"
                  onClick={back}
                  aria-label={`Back. Signed in as ${email.trim()}, change email`}
                  className={cx(
                    "group flex items-center gap-3 rounded-[11px] p-2 pr-3 text-left outline-none transition-[background-color,transform] duration-200 hover:bg-paper-2 active:scale-[.99] focus-visible:ring-2 focus-visible:ring-brand/50",
                    RING,
                  )}
                >
                  <svg viewBox="0 0 16 16" className="ml-1 h-4 w-4 shrink-0 text-mute transition-transform duration-300 group-hover:-translate-x-0.5" style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M10 3.5 5.5 8l4.5 4.5" />
                  </svg>
                  <span className="relative flex h-9 w-9 shrink-0" aria-hidden>
                    {step === 1 && <span className="absolute inset-0 rounded-full bg-brand" style={{ animation: `aui018-halo .9s ${EASE} 350ms both` }} />}
                    <span
                      key={step}
                      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[12.5px] font-semibold text-paper"
                      style={step === 1 ? { animation: `aui018-pop .55s ${EASE} 250ms both` } : undefined}
                    >
                      {initials}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13.5px] font-medium text-ink">{name}</span>
                    <span className="truncate text-[12.5px] text-mute">{email.trim()}</span>
                  </span>
                  <span className="text-[12px] font-medium text-mute transition-colors group-hover:text-ink">Change</span>
                </button>
                <h3 className="mt-6 text-[20px] font-medium tracking-[-0.02em] text-ink">Enter your password</h3>
                <div className="mt-4">
                  <Field
                    label="Password"
                    name="password"
                    type={reveal ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="At least 8 characters…"
                    value={password}
                    onChange={(v) => {
                      setPassword(v);
                      if (errors.password) setErrors((e) => ({ ...e, password: "" }));
                    }}
                    onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
                    error={errors.password}
                    shake={shake}
                    inputRef={passInput}
                    hint={
                      caps ? (
                        <span className="flex items-center gap-1 text-[11.5px] font-medium text-ink" style={{ animation: `aui018-in .25s ${EASE} both` }} role="status">
                          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
                            <path d="M8 2.5 13 8h-2.5v3h-5V8H3l5-5.5ZM5.5 13.5h5" />
                          </svg>
                          Caps Lock is on
                        </span>
                      ) : (
                        <a href="#" onClick={(e) => e.preventDefault()} className="rounded text-[12.5px] text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
                          Forgot?
                        </a>
                      )
                    }
                    end={
                      <button
                        type="button"
                        onClick={() => setReveal((v) => !v)}
                        aria-label={reveal ? "Hide password" : "Show password"}
                        aria-pressed={reveal}
                        className="flex h-9 w-9 items-center justify-center rounded-[8px] text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
                      >
                        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                          <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
                          <circle cx="8" cy="8" r="2" />
                          {!reveal && <path d="M2.5 13.5l11-11" />}
                        </svg>
                      </button>
                    }
                  />
                </div>
                <button type="submit" disabled={pending} aria-busy={(pending && step === 1) || undefined} className={cx(PRIMARY, "mt-5")}>
                  {pending && step === 1 ? <Spinner /> : null}
                  {pending && step === 1 ? "Signing in" : "Sign in"}
                  {!(pending && step === 1) && <Arrow />}
                </button>
                <p className="mt-5 text-center text-[13px] text-mute">
                  Prefer a link?{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} className="rounded font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
                    Email me one
                  </a>
                </p>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default StepSignIn;
