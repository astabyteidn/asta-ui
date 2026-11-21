"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]";
const CARD =
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const FOCUS = "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const LINE = 16;

const CSS = `
@keyframes aui020-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui020-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes aui020-letter { from { opacity: 0; transform: translateY(6px) scale(.8) } to { opacity: 1; transform: none } }
@keyframes aui020-pop { from { opacity: 0; transform: scale(.6) } 70% { transform: scale(1.06) } to { opacity: 1; transform: none } }
@keyframes aui020-draw { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { .aui020 * { animation: none !important; transition: none !important } }
`;

const rise = (i: number): CSSProperties => ({ animation: `aui020-rise .6s ${EASE} ${100 + i * 55}ms both` });
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const Spinner = () => <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;

const RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Upper and lower case", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
  { label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const LEVELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];

function useShake(active: boolean, key: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 420, easing: EASE },
    );
  }, [active, key]);
  return ref;
}

const ErrorText = ({ id, children }: { id: string; children: ReactNode }) => (
  <p id={id} role="alert" className="flex items-center gap-1.5 text-[12.5px] text-ink" style={{ animation: `aui020-in .3s ${EASE} both` }}>
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.8v3.6M8 11h.01" />
    </svg>
    {children}
  </p>
);

interface FieldProps {
  label: string;
  name: string;
  type: string;
  inputMode?: "email" | "text";
  /** Off for names, so autocorrect doesn't fight them. */
  plain?: boolean;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  shake: number;
  autoComplete: string;
  placeholder?: string;
  describedBy?: string;
  start?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
}

function Field({ label, name, type, inputMode, plain, value, onChange, onBlur, error, shake, autoComplete, placeholder, describedBy, start, end, children }: FieldProps) {
  const id = useId();
  const box = useShake(!!error, shake);
  const described = [error ? `${id}-err` : "", describedBy ?? ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <div ref={box} className="relative">
        {start && <div className="pointer-events-none absolute inset-y-0 left-1.5 flex items-center">{start}</div>}
        <input
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          value={value}
          autoComplete={autoComplete}
          autoCapitalize={plain ? undefined : "none"}
          spellCheck={false}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error || undefined}
          aria-describedby={described}
          className={cx(
            "h-11 w-full rounded-[9px] bg-paper px-3.5 text-[16px] sm:text-[14.5px] text-ink outline-none transition-shadow duration-200 placeholder:text-mute focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
            !!start && "pl-11",
            !!end && "pr-11",
            error ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]" : RING,
          )}
        />
        {end && <div className="absolute inset-y-0 right-1 flex items-center">{end}</div>}
      </div>
      {children}
      {error && <ErrorText id={`${id}-err`}>{error}</ErrorText>}
    </div>
  );
}

/** Initials that pop in letter by letter as the name is typed. */
function LiveAvatar({ name }: { name: string }) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase());
  return (
    <span
      className={cx(
        "flex h-8 w-8 items-center justify-center rounded-full text-[11.5px] font-semibold transition-colors duration-300",
        letters.length ? "bg-brand text-paper" : "bg-paper-2 text-mute",
      )}
      aria-hidden
    >
      {letters.length ? (
        letters.map((l, i) => (
          <span key={`${i}-${l}`} className="inline-block" style={{ animation: `aui020-letter .35s ${EASE} both` }}>
            {l}
          </span>
        ))
      ) : (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <circle cx="8" cy="5.5" r="2.5" />
          <path d="M3 13.5c.8-2.3 2.7-3.5 5-3.5s4.2 1.2 5 3.5" />
        </svg>
      )}
    </span>
  );
}

export interface SignUpCardProps {
  brand?: string;
  title?: string;
  subtitle?: string;
  /** How many of the four password rules must pass. */
  minStrength?: 1 | 2 | 3 | 4;
  termsHref?: string;
  /** Prefilled values, handy for demos. */
  defaults?: { name?: string; email?: string; password?: string };
  /** Resolve when the account exists, reject (with a message) to show an error. */
  onSubmit?: (data: { name: string; email: string; password: string }) => Promise<void>;
  className?: string;
}

/**
 * aui-020 · Sign-up card. Signature: a live avatar builds your initials as you type, the four strength
 * segments fill in sequence while the strength word rolls like a ticker, and each rule ticks off with a pop.
 */
export function SignUpCard({
  brand = "Astabyte",
  title = "Create your account",
  subtitle = "14 days free. No card needed.",
  minStrength = 3,
  termsHref = "#",
  defaults,
  onSubmit,
  className,
}: SignUpCardProps) {
  const id = useId();
  const [name, setName] = useState(defaults?.name ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [password, setPassword] = useState(defaults?.password ?? "");
  const [terms, setTerms] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false, terms: false });
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [formError, setFormError] = useState("");
  const [shake, setShake] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const passed = RULES.map((r) => r.test(password));
  const score = passed.filter(Boolean).length;
  const level = password ? score : 0;

  const errors = {
    name: !name.trim() ? "Enter your name." : "",
    email: !email.trim() ? "Enter your email." : !validEmail(email) ? "Enter an email like name@company.com." : "",
    password: !password
      ? "Choose a password."
      : !passed[0]
        ? "Use at least 8 characters."
        : score < minStrength
          ? "Add a number, a symbol or mixed case."
          : "",
    terms: terms ? "" : "Accept the terms to continue.",
  };
  type Key = keyof typeof errors;
  const show = (k: Key) => (touched[k] ? errors[k] : "");
  // A fix clears the error while typing; a new one waits for blur or submit.
  const untouchIf = (k: Key, fixed: boolean) => touched[k] && fixed && setTouched((t) => ({ ...t, [k]: false }));
  const termsBox = useShake(!!show("terms"), shake);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setTouched({ name: true, email: true, password: true, terms: true });
    setFormError("");
    if (errors.name || errors.email || errors.password || errors.terms) {
      setShake((n) => n + 1);
      const key = (["name", "email", "password", "terms"] as const).find((k) => errors[k]);
      const first = key && (e.currentTarget as HTMLFormElement).elements.namedItem(key);
      if (first instanceof HTMLElement) first.focus();
      return;
    }
    setState("loading");
    try {
      await (onSubmit ? onSubmit({ name: name.trim(), email: email.trim(), password }) : wait(1300));
      if (alive.current) setState("done");
    } catch (err) {
      if (!alive.current) return;
      setState("idle");
      setFormError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setTerms(false);
    setTouched({ name: false, email: false, password: false, terms: false });
    setState("idle");
  };

  return (
    <div className={cx("aui020 relative w-full max-w-[420px] overflow-hidden rounded-[14px] bg-paper", CARD, className)}>
      <style href="asta-sign-in-aui-020" precedence="asta">{CSS}</style>
      {state === "done" ? (
        <div className="flex min-h-[520px] flex-col items-center justify-center p-7 text-center" role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper" style={{ animation: `aui020-pop .55s ${EASE} both` }}>
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" style={{ animation: `aui020-draw .5s .2s ${EASE} both` }} />
            </svg>
          </span>
          <h3 className="mt-5 text-[20px] font-medium tracking-[-0.02em] text-ink" style={rise(1)}>
            Welcome to {brand}, {name.trim().split(" ")[0]}
          </h3>
          <p className="mt-1.5 max-w-[30ch] text-[14px] leading-snug text-mute" style={rise(2)}>
            Confirm your email to finish. We sent a link to <span className="break-all text-ink">{email.trim()}</span>.
          </p>
          <button type="button" onClick={reset} className={cx("mt-6 h-9 rounded-[8px] px-3.5 text-[13.5px] font-medium text-ink outline-none transition-colors hover:bg-paper-2", RING, FOCUS)} style={rise(3)}>
            Start over
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="flex flex-col p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[20px] font-medium tracking-[-0.02em] text-ink" style={rise(0)}>
                {title}
              </h3>
              <p className="mt-1 text-[14px] leading-snug text-mute" style={rise(1)}>
                {subtitle}
              </p>
            </div>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute" style={rise(0)}>
              {brand}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div style={rise(2)}>
              <Field
                label="Full name"
                name="name"
                type="text"
                plain
                autoComplete="name"
                placeholder="Maya Lindqvist"
                value={name}
                onChange={(v) => {
                  setName(v);
                  untouchIf("name", !!v.trim());
                }}
                onBlur={() => name && setTouched((t) => ({ ...t, name: true }))}
                error={show("name")}
                shake={shake}
                start={<LiveAvatar name={name} />}
              />
            </div>
            <div style={rise(3)}>
              <Field
                label="Work email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  untouchIf("email", validEmail(v));
                }}
                onBlur={() => email && setTouched((t) => ({ ...t, email: true }))}
                error={show("email")}
                shake={shake}
              />
            </div>
            <div style={rise(4)}>
              <Field
                label="Password"
                name="password"
                type={reveal ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Make it hard to guess…"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  const ok = RULES.map((r) => r.test(v));
                  untouchIf("password", ok[0] && ok.filter(Boolean).length >= minStrength);
                }}
                onBlur={() => password && setTouched((t) => ({ ...t, password: true }))}
                error={show("password")}
                shake={shake}
                describedBy={`${id}-rules`}
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
              >
                <div className="mt-1 flex items-center gap-3">
                  <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="relative h-[5px] overflow-hidden rounded-full bg-paper-2">
                        <span
                          className={cx("absolute inset-0 origin-left rounded-full transition-[transform,opacity,background-color] duration-500", score === 4 ? "bg-brand" : "bg-ink")}
                          style={{ transform: `scaleX(${i < level ? 1 : 0})`, opacity: i < level ? 1 : 0, transitionTimingFunction: EASE, transitionDelay: `${(i < level ? i : 3 - i) * 50}ms` }}
                        />
                      </span>
                    ))}
                  </div>
                  {/* Strength word rolls like a ticker. */}
                  <span className="relative w-[64px] overflow-hidden text-right text-[12px] font-medium" style={{ height: LINE }} aria-live="polite">
                    <span className="sr-only">{password ? `Password strength: ${LEVELS[score]}` : ""}</span>
                    <span
                      aria-hidden
                      className={cx("absolute inset-x-0 top-0 flex flex-col transition-[transform,opacity] duration-500", password ? "opacity-100" : "opacity-0", score === 4 ? "text-brand" : "text-ink")}
                      style={{ transform: `translateY(${-level * LINE}px)`, transitionTimingFunction: EASE }}
                    >
                      {LEVELS.map((l) => (
                        <span key={l} className="block" style={{ height: LINE, lineHeight: `${LINE}px` }}>
                          {l}
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
                <ul id={`${id}-rules`} className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Password rules">
                  {RULES.map((r, i) => (
                    <li key={r.label} className={cx("flex items-center gap-2 text-[12.5px] transition-colors duration-300", passed[i] ? "text-ink" : "text-mute")}>
                      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_20%,transparent)]" aria-hidden>
                        <span
                          className="absolute inset-0 flex items-center justify-center rounded-full bg-ink text-paper transition-[transform,opacity] duration-300"
                          style={{ transform: `scale(${passed[i] ? 1 : 0.3})`, opacity: passed[i] ? 1 : 0, transitionTimingFunction: EASE }}
                        >
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 6.2 2 2L9 4" />
                          </svg>
                        </span>
                      </span>
                      {r.label}
                      <span className="sr-only">{passed[i] ? "(done)" : "(missing)"}</span>
                    </li>
                  ))}
                </ul>
              </Field>
            </div>
          </div>

          <div ref={termsBox} className="mt-5" style={rise(5)}>
            <label className="group flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-mute">
              <span className="relative mt-px flex h-[18px] w-[18px] shrink-0">
                <input
                  type="checkbox"
                  name="terms"
                  checked={terms}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    untouchIf("terms", e.target.checked);
                  }}
                  aria-invalid={!!show("terms") || undefined}
                  aria-describedby={show("terms") ? `${id}-terms-err` : undefined}
                  className={cx(
                    "peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] bg-paper outline-none transition-[background-color,box-shadow,transform] duration-200 checked:bg-ink active:scale-90 focus-visible:ring-2 focus-visible:ring-brand/50",
                    show("terms") ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]" : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_28%,transparent)] group-hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_50%,transparent)]",
                  )}
                />
                <svg
                  viewBox="0 0 12 12"
                  className="pointer-events-none absolute inset-0 m-auto h-3 w-3 scale-50 text-paper opacity-0 transition-[transform,opacity] duration-300 peer-checked:scale-100 peer-checked:opacity-100"
                  style={{ transitionTimingFunction: EASE }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m3 6.2 2 2L9 4" />
                </svg>
              </span>
              <span>
                I agree to the{" "}
                <a href={termsHref} onClick={(e) => termsHref === "#" && e.preventDefault()} className="rounded font-medium text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
                  Terms
                </a>{" "}
                and{" "}
                <a href={termsHref} onClick={(e) => termsHref === "#" && e.preventDefault()} className="rounded font-medium text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {show("terms") && (
              <div className="mt-1.5 pl-[28px]">
                <ErrorText id={`${id}-terms-err`}>{show("terms")}</ErrorText>
              </div>
            )}
          </div>

          {formError && (
            <div className="mt-4">
              <ErrorText id={`${id}-form-err`}>{formError}</ErrorText>
            </div>
          )}

          <div style={rise(6)}>
            <button
              type="submit"
              disabled={state === "loading"}
              aria-busy={state === "loading" || undefined}
              className={cx(
                "group mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-ink px-4 text-[14px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.985] disabled:cursor-progress",
                FOCUS,
              )}
            >
              {state === "loading" && <Spinner />}
              {state === "loading" ? "Creating your account" : "Create account"}
              {state !== "loading" && (
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-4 text-center text-[13px] text-mute" style={rise(7)}>
            Already have an account?{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="rounded font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
              Sign in
            </a>
          </p>
        </form>
      )}
    </div>
  );
}

export default SignUpCard;
