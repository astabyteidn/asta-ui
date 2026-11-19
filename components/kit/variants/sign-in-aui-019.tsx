"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_12%,transparent)]";
const FOCUS = "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink";
const LINK = "rounded text-[13px] font-medium text-paper/70 outline-none transition-colors hover:text-paper focus-visible:ring-2 focus-visible:ring-brand";

const CSS = `
@keyframes aui019-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui019-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes aui019-ridge { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: none } }
@keyframes aui019-scan { 0% { transform: translateY(-34px); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translateY(34px); opacity: 0 } }
@keyframes aui019-ripple { 0% { opacity: .45; transform: scale(1) } 100% { opacity: 0; transform: scale(1.75) } }
@keyframes aui019-pop { from { opacity: 0; transform: scale(.6) } 70% { transform: scale(1.06) } to { opacity: 1; transform: none } }
@keyframes aui019-draw { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { .aui019 * { animation: none !important; transition: none !important } }
`;

const rise = (i: number): CSSProperties => ({ animation: `aui019-rise .6s ${EASE} ${100 + i * 55}ms both` });
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const Spinner = () => <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;

const RIDGES = [
  "M6.2 5.4A8.5 8.5 0 0 1 20.5 11.5",
  "M3.6 9.2a8.5 8.5 0 0 0-.1 1.3v1.8",
  "M7.2 19.4c-.5-1.5-.7-3.1-.7-4.9v-3.9a5.5 5.5 0 0 1 11 0v1.6",
  "M9.3 21c-.6-1.9-.8-4-.8-6.3v-4a3.5 3.5 0 0 1 7 0",
  "M12 10.4v4.2c0 2.4.5 4.6 1.4 6.6",
  "M17.5 15.8c0 1.8-.2 3.4-.6 4.8",
  "M20.5 14.4v.6",
];

/** Ridges fade in one by one on mount. */
const Fingerprint = ({ className, stagger = false }: { className?: string; stagger?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
    {RIDGES.map((d, i) => (
      <path key={d} d={d} style={stagger ? { animation: `aui019-ridge .6s ${EASE} ${260 + i * 70}ms both`, transformOrigin: "12px 13px" } : undefined} />
    ))}
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 4.8v3.6M8 11h.01" />
  </svg>
);

function shakeEl(el: HTMLElement | null) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
    { duration: 420, easing: EASE },
  );
}

export interface PasskeySignInProps {
  brand?: string;
  title?: string;
  subtitle?: string;
  /** The saved passkey shown under the button, e.g. "MacBook Pro · iCloud Keychain". Empty hides it. */
  device?: string;
  deviceMeta?: string;
  /** Run the WebAuthn ceremony here. Resolve to finish, reject (with a message) to show an error. */
  onPasskey?: () => Promise<void>;
  /** The password fallback. Resolve to finish, reject (with a message) to show an error. */
  onPassword?: (data: { email: string; password: string }) => Promise<void>;
  className?: string;
}

/**
 * aui-019 · Passkey sign-in on a dark card. Signature: the fingerprint draws in ridge by ridge, then a scan
 * line sweeps it with brand ripples while it waits for your device, and a password fallback slides in.
 */
export function PasskeySignIn({
  brand = "Astabyte",
  title = "Sign in to Astabyte",
  subtitle = "One touch. No password to remember.",
  device = "MacBook Pro · iCloud Keychain",
  deviceMeta = "Last used 2 days ago",
  onPasskey,
  onPassword,
  className,
}: PasskeySignInProps) {
  const id = useId();
  const [mode, setMode] = useState<"passkey" | "password">("passkey");
  const [waiting, setWaiting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [passkeyError, setPasskeyError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "", form: "" });
  const alive = useRef(true);
  const passkeyBtn = useRef<HTMLButtonElement>(null);
  const emailBox = useRef<HTMLDivElement>(null);
  const passBox = useRef<HTMLDivElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const prevMode = useRef(mode);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (prevMode.current === mode) return;
    prevMode.current = mode;
    if (mode === "password") emailInput.current?.focus({ preventScroll: true });
    else passkeyBtn.current?.focus({ preventScroll: true });
  }, [mode]);

  const passkey = async () => {
    if (waiting) return;
    setWaiting(true);
    setPasskeyError("");
    try {
      await (onPasskey ? onPasskey() : wait(2000));
      if (alive.current) setDone("with your passkey");
    } catch (err) {
      if (!alive.current) return;
      setPasskeyError(err instanceof Error ? err.message : "That didn't work. Try again or use your password.");
      shakeEl(passkeyBtn.current);
    } finally {
      if (alive.current) setWaiting(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (waiting) return;
    const next = {
      email: !email.trim() ? "Enter your email." : !validEmail(email) ? "That doesn't look like an email address." : "",
      password: !password ? "Enter your password." : password.length < 8 ? "Use at least 8 characters." : "",
      form: "",
    };
    setErrors(next);
    if (next.email) shakeEl(emailBox.current);
    if (next.password) shakeEl(passBox.current);
    if (next.email || next.password) return;
    setWaiting(true);
    try {
      await (onPassword ? onPassword({ email: email.trim(), password }) : wait(1200));
      if (alive.current) setDone(`as ${email.trim()}`);
    } catch (err) {
      if (!alive.current) return;
      setErrors((x) => ({ ...x, form: err instanceof Error ? err.message : "Something went wrong. Try again." }));
      shakeEl(passBox.current);
    } finally {
      if (alive.current) setWaiting(false);
    }
  };

  const reset = () => {
    setDone(null);
    setPassword("");
    setMode("passkey");
  };

  const inputCls = (err: string) =>
    cx(
      "h-11 w-full rounded-[9px] bg-paper/[0.06] px-3.5 text-[14.5px] text-paper outline-none transition-shadow duration-200 placeholder:text-paper/35 focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_25%,transparent)]",
      err ? "shadow-[inset_0_0_0_1.5px_var(--color-paper)]" : RING,
    );
  const errLine = (key: string, msg: string) =>
    msg ? (
      <p id={key} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-paper" style={{ animation: `aui019-in .3s ${EASE} both` }}>
        <ErrorIcon />
        {msg}
      </p>
    ) : null;

  return (
    <div
      className={cx(
        "aui019 relative isolate w-full max-w-[380px] overflow-hidden rounded-[14px] bg-ink p-6 text-paper shadow-[0_1px_2px_rgb(0_0_0/0.1),0_30px_60px_-28px_rgb(0_0_0/0.6)] sm:p-7",
        className,
      )}
    >
      <style href="asta-sign-in-aui-019" precedence="asta">{CSS}</style>
      <div
        aria-hidden
        className={cx("pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700", waiting ? "opacity-100" : "opacity-60")}
        style={{ background: "radial-gradient(80% 55% at 50% 0%, color-mix(in srgb, var(--color-brand) 38%, transparent), transparent 70%)" }}
      />

      <div className="flex items-center justify-between" style={rise(0)}>
        <span className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.02em]">
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-paper text-ink" aria-hidden>
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M8 1.5 14.5 14h-3L8 7.2 4.5 14h-3L8 1.5Z" />
            </svg>
          </span>
          {brand}
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-paper/50">{mode === "passkey" ? "Passkey" : "Password"}</span>
      </div>

      {done ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center text-center" role="status">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-paper" style={{ animation: `aui019-pop .55s ${EASE} both` }}>
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" style={{ animation: `aui019-draw .5s .2s ${EASE} both` }} />
            </svg>
          </span>
          <h3 className="mt-5 text-[20px] font-medium tracking-[-0.02em]" style={rise(1)}>
            You&apos;re in
          </h3>
          <p className="mt-1.5 max-w-[28ch] break-words text-[14px] leading-snug text-paper/60" style={rise(2)}>
            Signed in {done}.
          </p>
          <button type="button" onClick={reset} className={cx("mt-6 h-9 rounded-[8px] px-3.5 text-[13.5px] font-medium outline-none transition-colors hover:bg-paper/10", RING, FOCUS)} style={rise(3)}>
            Sign out
          </button>
        </div>
      ) : mode === "passkey" ? (
        <div key="passkey" className="flex flex-col">
          <h3 className="mt-8 text-[20px] font-medium tracking-[-0.02em]" style={rise(1)}>
            {title}
          </h3>
          <p className="mt-1 text-[14px] leading-snug text-paper/60" style={rise(2)}>
            {subtitle}
          </p>

          <div style={rise(3)}>
            <button
              ref={passkeyBtn}
              type="button"
              onClick={passkey}
              aria-busy={waiting || undefined}
              aria-describedby={passkeyError ? `${id}-pk-err` : undefined}
              className={cx(
                "group mt-6 flex w-full flex-col items-center gap-5 rounded-[12px] bg-paper/[0.05] px-5 pb-5 pt-8 outline-none transition-[background-color,transform] duration-300 hover:bg-paper/[0.08] active:scale-[.985]",
                RING,
                FOCUS,
              )}
            >
              <span className="relative flex h-[76px] w-[76px] items-center justify-center">
                {waiting && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-brand/40" style={{ animation: `aui019-ripple 1.8s ${EASE} infinite` }} aria-hidden />
                    <span className="absolute inset-0 rounded-full bg-brand/40" style={{ animation: `aui019-ripple 1.8s ${EASE} .9s infinite` }} aria-hidden />
                  </>
                )}
                <span
                  className={cx(
                    "relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full transition-[background-color,color,transform] duration-500 group-hover:scale-[1.04]",
                    waiting ? "bg-brand text-paper" : "bg-paper text-ink",
                  )}
                  style={{ transitionTimingFunction: EASE }}
                >
                  <Fingerprint className="h-10 w-10" stagger />
                  {waiting && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 top-1/2 h-[2px] rounded-full bg-paper shadow-[0_0_12px_2px_color-mix(in_srgb,var(--color-paper)_70%,transparent)]"
                      style={{ animation: `aui019-scan 1.4s ${EASE} infinite alternate` }}
                    />
                  )}
                </span>
              </span>
              <span className="flex flex-col items-center">
                <span className="text-[15.5px] font-medium tracking-[-0.01em]">{waiting ? "Waiting for your device" : "Sign in with a passkey"}</span>
                <span className="mt-0.5 text-[12.5px] text-paper/55">{waiting ? "Follow the prompt on your screen" : "Face ID, Touch ID or a security key"}</span>
              </span>
            </button>
          </div>
          <span className="sr-only" role="status">
            {waiting ? "Waiting for your passkey" : ""}
          </span>
          {passkeyError && (
            <p id={`${id}-pk-err`} role="alert" className="mt-3 flex items-center gap-1.5 text-[12.5px] text-paper" style={{ animation: `aui019-in .3s ${EASE} both` }}>
              <ErrorIcon />
              {passkeyError}
            </p>
          )}

          {device && (
            <div className={cx("mt-3 flex items-center gap-3 rounded-[10px] px-3 py-2.5", RING)} style={rise(4)}>
              <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-paper/10" aria-hidden>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
                  <rect x="2.5" y="3" width="11" height="7.5" rx="1" />
                  <path d="M1 13h14" strokeLinecap="round" />
                </svg>
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13px]">{device}</span>
                <span className="text-[11.5px] text-paper/50">{deviceMeta}</span>
              </span>
              <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
            </div>
          )}

          <button type="button" onClick={() => setMode("password")} disabled={waiting} className={cx(LINK, "group mt-6 inline-flex items-center gap-1.5 self-center disabled:opacity-40")} style={rise(5)}>
            Use password instead
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      ) : (
        <form key="password" noValidate onSubmit={submit} className="flex flex-col">
          <h3 className="mt-8 text-[20px] font-medium tracking-[-0.02em]" style={rise(0)}>
            Use your password
          </h3>
          <p className="mt-1 text-[14px] leading-snug text-paper/60" style={rise(1)}>
            You can add a passkey after you sign in.
          </p>

          <div style={rise(2)}>
            <label htmlFor={`${id}-email`} className="mt-6 block text-[13px] font-medium">
              Email
            </label>
            <div ref={emailBox} className="mt-1.5">
              <input
                ref={emailInput}
                id={`${id}-email`}
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email || undefined}
                aria-describedby={errors.email ? `${id}-email-err` : undefined}
                className={inputCls(errors.email)}
              />
            </div>
            {errLine(`${id}-email-err`, errors.email)}
          </div>

          <div style={rise(3)}>
            <label htmlFor={`${id}-pass`} className="mt-4 block text-[13px] font-medium">
              Password
            </label>
            <div ref={passBox} className="mt-1.5">
              <input
                id={`${id}-pass`}
                type="password"
                autoComplete="current-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!(errors.password || errors.form) || undefined}
                aria-describedby={errors.password || errors.form ? `${id}-pass-err` : undefined}
                className={inputCls(errors.password || errors.form)}
              />
            </div>
            {errLine(`${id}-pass-err`, errors.password || errors.form)}
          </div>

          <div style={rise(4)}>
            <button
              type="submit"
              disabled={waiting}
              aria-busy={waiting || undefined}
              className={cx("mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-brand px-4 text-[14px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.985] disabled:opacity-70", FOCUS)}
            >
              {waiting && <Spinner />}
              {waiting ? "Signing in" : "Sign in"}
            </button>
          </div>
          <button type="button" onClick={() => setMode("passkey")} disabled={waiting} className={cx(LINK, "mt-5 inline-flex items-center justify-center gap-1.5 self-center disabled:opacity-40")} style={rise(5)}>
            <Fingerprint className="h-4 w-4" />
            Use a passkey instead
          </button>
        </form>
      )}
    </div>
  );
}

export default PasskeySignIn;
