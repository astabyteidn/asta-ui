"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/kit/button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]";
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

const CSS = `
@keyframes kit-signin-pop { from { opacity: 0; transform: scale(.92) translateY(6px) } to { opacity: 1; transform: none } }
@keyframes kit-signin-draw { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { .kit-signin * { animation: none !important } }
`;

const GoogleGlyph = () => (
  <svg viewBox="0 0 16 16" aria-hidden>
    <path fill="currentColor" d="M8 6.6v2.9h4.1A4.3 4.3 0 0 1 8 12.4a4.4 4.4 0 0 1 0-8.8c1.1 0 2.1.4 2.9 1.1l2-2A7.3 7.3 0 0 0 8 .7a7.3 7.3 0 1 0 0 14.6c4.2 0 7-3 7-7.1 0-.5 0-1-.1-1.5H8Z" />
  </svg>
);
const GitHubGlyph = () => (
  <svg viewBox="0 0 16 16" aria-hidden>
    <path
      fill="currentColor"
      d="M8 .5a7.5 7.5 0 0 0-2.4 14.6c.4.1.5-.2.5-.4v-1.4c-2.1.5-2.5-.9-2.5-.9-.4-.9-.9-1.1-.9-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.2.6.1-.5.3-.8.5-1-1.7-.2-3.4-.8-3.4-3.7 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2 0 0 .6-.2 2.1.8a7 7 0 0 1 3.8 0c1.4-1 2.1-.8 2.1-.8.4 1 .2 1.8.1 2 .5.5.8 1.2.8 2 0 2.9-1.8 3.5-3.4 3.7.3.2.5.7.5 1.4v2.1c0 .2.1.5.5.4A7.5 7.5 0 0 0 8 .5Z"
    />
  </svg>
);

interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  /** Bumped on every failed submit so the field shakes again. */
  shake: number;
  autoComplete: string;
  placeholder?: string;
  end?: ReactNode;
}

function Field({ label, type, value, onChange, onBlur, error, shake, autoComplete, placeholder, end }: FieldProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const hasError = !!error;
  // Shake once when an error shows up, and again on every failed submit.
  useEffect(() => {
    if (!hasError || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    box.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" },
    );
  }, [hasError, shake]);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <div ref={box} className="relative">
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={cx(
            "h-10 w-full rounded-lg bg-paper px-3 text-[14px] text-ink outline-none transition-shadow duration-200 placeholder:text-mute",
            !!end && "pr-11",
            error
              ? "shadow-[inset_0_0_0_1px_#e5484d] focus-visible:ring-2 focus-visible:ring-[#e5484d]/30"
              : `${RING} focus-visible:ring-2 focus-visible:ring-brand/50`,
          )}
        />
        {end && <div className="absolute inset-y-0 right-1 flex items-center">{end}</div>}
      </div>
      <p
        id={`${id}-err`}
        role={error ? "alert" : undefined}
        className={cx("grid text-[12.5px] text-[#e5484d] transition-[grid-template-rows,opacity] duration-300", EASE, error ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
      >
        <span className="overflow-hidden">{error}</span>
      </p>
    </div>
  );
}

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export interface SignInCardProps {
  title?: string;
  subtitle?: string;
  /** Called with the credentials; resolve to finish, reject (with a message) to show an error. */
  onSubmit?: (data: { email: string; password: string }) => Promise<void>;
  onSocial?: (provider: "google" | "github") => void;
  className?: string;
}

/**
 * An email + password card with social sign-in, inline validation (errors appear on blur or submit and the
 * field shakes once), a submit that shows progress and a success state that morphs in.
 */
export function SignInCard({ title = "Welcome back", subtitle = "Sign in to continue to your workspace.", onSubmit, onSocial, className }: SignInCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [reveal, setReveal] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [formError, setFormError] = useState("");
  const [shake, setShake] = useState(0);

  const errors = {
    email: !email.trim() ? "Enter your email." : !validEmail(email) ? "That doesn't look like an email address." : "",
    password: !password ? "Enter your password." : password.length < 8 ? "Use at least 8 characters." : "",
  };
  const show = (k: "email" | "password") => (touched[k] ? errors[k] : "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError("");
    if (errors.email || errors.password) {
      setShake((n) => n + 1);
      return;
    }
    setState("loading");
    try {
      await (onSubmit?.({ email, password }) ?? new Promise((r) => setTimeout(r, 1200)));
      setState("done");
    } catch (err) {
      setState("idle");
      setFormError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  };

  const reset = () => {
    setEmail("");
    setPassword("");
    setTouched({ email: false, password: false });
    setState("idle");
  };

  return (
    <div className={cx("kit-signin relative w-full max-w-[380px] overflow-hidden rounded-xl bg-paper p-6 sm:p-7", "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]", className)}>
      <style href="asta-sign-in" precedence="asta">{CSS}</style>
      {state === "done" ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center text-center" style={{ animation: "kit-signin-pop .5s cubic-bezier(.16,1,.3,1) both" }} role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#30a46c] text-white">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" style={{ animation: "kit-signin-draw .5s .15s cubic-bezier(.16,1,.3,1) both" }} />
            </svg>
          </span>
          <h3 className="mt-5 text-[20px] font-medium tracking-[-0.02em] text-ink">You&apos;re in</h3>
          <p className="mt-1.5 max-w-[26ch] text-[14px] leading-snug text-mute">
            Signed in as <span className="text-ink">{email}</span>.
          </p>
          <Button variant="soft" size="sm" className="mt-6" onClick={reset}>
            Sign out
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="flex flex-col">
          <h3 className="text-[20px] font-medium tracking-[-0.02em] text-ink">{title}</h3>
          <p className="mt-1 text-[14px] leading-snug text-mute">{subtitle}</p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="outline" iconLeft={<GoogleGlyph />} onClick={() => onSocial?.("google")}>
              Google
            </Button>
            <Button variant="outline" iconLeft={<GitHubGlyph />} onClick={() => onSocial?.("github")}>
              GitHub
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3 text-[12px] text-mute" aria-hidden>
            <span className="h-px flex-1 bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]" />
            or
            <span className="h-px flex-1 bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]" />
          </div>

          <div className="flex flex-col gap-3">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={setEmail}
              onBlur={() => email && setTouched((t) => ({ ...t, email: true }))}
              error={show("email")}
              shake={shake}
            />
            <Field
              label="Password"
              type={reveal ? "text" : "password"}
              autoComplete="current-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={setPassword}
              onBlur={() => password && setTouched((t) => ({ ...t, password: true }))}
              error={show("password")}
              shake={shake}
              end={
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  aria-pressed={reveal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                    <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
                    <circle cx="8" cy="8" r="2" />
                    <path d="M2.5 13.5l11-11" className={cx("transition-[stroke-dashoffset] duration-300", EASE)} strokeDasharray="16" strokeDashoffset={reveal ? 16 : 0} />
                  </svg>
                </button>
              }
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[13px]">
            <label className="flex cursor-pointer items-center gap-2 text-ink-2">
              <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-[var(--color-brand)]" />
              Remember me
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} className="text-brand outline-none hover:underline focus-visible:underline">
              Forgot password?
            </a>
          </div>

          {formError && (
            <p role="alert" className="mt-4 rounded-lg bg-[#e5484d]/10 px-3 py-2 text-[13px] text-[#e5484d]">
              {formError}
            </p>
          )}

          <Button type="submit" variant="solid" size="md" loading={state === "loading"} className="mt-5 w-full">
            Sign in
          </Button>
          <p className="mt-4 text-center text-[13px] text-mute">
            New here?{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-ink outline-none hover:underline focus-visible:underline">
              Create an account
            </a>
          </p>
        </form>
      )}
    </div>
  );
}

export default SignInCard;
