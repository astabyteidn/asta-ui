"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

const CSS = `
@keyframes aui016-rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
@keyframes aui016-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes aui016-art { from { opacity: 0; transform: scale(1.06) } to { opacity: 1; transform: none } }
@keyframes aui016-plate { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui016-draw { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { .aui016 * { animation: none !important; transition: none !important } }
`;

const rise = (i: number): CSSProperties => ({
  animation: `aui016-rise .7s ${EASE} ${180 + i * 60}ms both`,
});
const validEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const Spinner = () => (
  <span
    aria-hidden
    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
  />
);

interface FieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  shake: number;
  autoComplete: string;
  placeholder: string;
  end?: ReactNode;
}

/** Soft filled field: the label is for screen readers, the placeholder does the talking. */
function Field({
  label,
  type,
  value,
  onChange,
  onBlur,
  error,
  shake,
  autoComplete,
  placeholder,
  end,
}: FieldProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const hasError = !!error;
  useEffect(() => {
    if (
      !hasError ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    box.current?.animate(
      [
        { transform: "none" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(2px)" },
        { transform: "none" },
      ],
      { duration: 420, easing: EASE },
    );
  }, [hasError, shake]);
  return (
    <div>
      <label htmlFor={id} className="sr-only">
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
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-err` : undefined}
          className={cx(
            "h-11 w-full rounded-[10px] bg-paper-2 px-4 text-[14px] text-ink outline-none transition-[box-shadow,background-color] duration-300 placeholder:text-mute hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,var(--color-paper-2))] focus-visible:bg-paper focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]",
            !!end && "pr-12",
            hasError && "shadow-[inset_0_0_0_1.5px_var(--color-ink)]",
          )}
        />
        {end && (
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            {end}
          </div>
        )}
      </div>
      {hasError && (
        <p
          id={`${id}-err`}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 pl-1 text-[12.5px] text-ink"
          style={{ animation: `aui016-in .3s ${EASE} both` }}
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.8v3.6M8 11h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export interface SplitSignInProps {
  brand?: string;
  /** Small sans line above the headline. */
  eyebrow?: string;
  /** Serif headline. Use "\n" for the line break. */
  title?: string;
  /** Two short lines in serif next to the brand. */
  tagline?: string;
  image?: string;
  imageAlt?: string;
  /** Museum-plate caption on the painting. Empty hides it. */
  caption?: string;
  backHref?: string;
  onBack?: () => void;
  signUpHref?: string;
  /** Resolve to finish, reject (with a message) to show an error. */
  onSubmit?: (data: { email: string; password: string }) => Promise<void>;
  className?: string;
}

/**
 * aui-016 · An editorial sign-in. Signature: a painting fills the left panel, settles in from a slow zoom,
 * drifts with the pointer and carries a museum-plate caption, next to a big serif headline and soft filled fields.
 */
export function SplitSignIn({
  brand = "Astabyte",
  eyebrow = "Sign in to",
  title = "Where good\nwork begins",
  tagline = "Shared notes for\nteams that think slowly.",
  image = "/lab/art/grande-jatte.webp",
  imageAlt = "A pointillist painting of people resting in a sunny park by the river",
  caption = "Georges Seurat · A Sunday on La Grande Jatte, 1884",
  backHref = "#",
  onBack,
  signUpHref = "#",
  onSubmit,
  className,
}: SplitSignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [formError, setFormError] = useState("");
  const [shake, setShake] = useState(0);
  const alive = useRef(true);
  const art = useRef<HTMLImageElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const drift = (e: PointerEvent<HTMLDivElement> | null) => {
    const img = art.current;
    if (!img || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    if (!e) {
      img.style.transform = "scale(1.06)";
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    img.style.transform = `scale(1.06) translate(${(-x * 14).toFixed(1)}px, ${(-y * 10).toFixed(1)}px)`;
  };

  const errors = {
    email: !email.trim()
      ? "Enter your email."
      : !validEmail(email)
        ? "That doesn't look like an email address."
        : "",
    password: !password
      ? "Enter your password."
      : password.length < 8
        ? "Use at least 8 characters."
        : "",
  };
  const show = (k: "email" | "password") => (touched[k] ? errors[k] : "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setTouched({ email: true, password: true });
    setFormError("");
    if (errors.email || errors.password) {
      setShake((n) => n + 1);
      return;
    }
    setState("loading");
    try {
      await (onSubmit
        ? onSubmit({ email: email.trim(), password })
        : wait(1200));
      if (alive.current) setState("done");
    } catch (err) {
      if (!alive.current) return;
      setState("idle");
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
      setShake((n) => n + 1);
    }
  };

  const reset = () => {
    setPassword("");
    setTouched({ email: false, password: false });
    setState("idle");
  };

  const [line1, line2] = title.split("\n");
  const name = email.trim().split("@")[0].split(/[._-]/)[0];
  const first = name ? name[0].toUpperCase() + name.slice(1) : "";

  return (
    <div className={cx("aui016 @container w-full max-w-[900px]", className)}>
      <style href="asta-sign-in-aui-016" precedence="asta">
        {CSS}
      </style>
      <div
        onPointerMove={drift}
        onPointerLeave={() => drift(null)}
        className="grid gap-2 rounded-[20px] bg-paper p-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent),0_2px_4px_rgb(0_0_0/0.04),0_40px_80px_-32px_rgb(0_0_0/0.45)] @min-[660px]:grid-cols-[1fr_1.08fr]"
      >
        <div className="relative h-[200px] overflow-hidden rounded-[14px] bg-paper-2 @min-[660px]:h-auto @min-[660px]:min-h-[520px]">
          <div
            className="absolute inset-0"
            style={{ animation: `aui016-art 1.4s ${EASE} both` }}
          >
            <img
              ref={art}
              src={image}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] will-change-transform"
              style={{
                transform: "scale(1.06)",
                transitionTimingFunction: EASE,
              }}
            />
          </div>
          {caption && (
            <span
              className="absolute bottom-3 left-3 max-w-[calc(100%-24px)] truncate rounded-[7px] bg-paper/85 px-2.5 py-1.5 font-serif text-[11.5px] italic text-ink backdrop-blur-sm"
              style={{ animation: `aui016-plate .7s ${EASE} 900ms both` }}
            >
              {caption}
            </span>
          )}
        </div>

        <div className="flex flex-col px-5 pb-6 pt-5 @min-[660px]:px-10 @min-[660px]:pb-8 @min-[660px]:pt-8">
          <a
            href={backHref}
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              } else if (backHref === "#") e.preventDefault();
            }}
            className="group inline-flex items-center gap-1.5 self-start rounded-md text-[13.5px] font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            style={rise(0)}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              style={{ transitionTimingFunction: EASE }}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M13 8H3M7 4 3 8l4 4" />
            </svg>
            Back
          </a>

          {state === "done" ? (
            <div
              className="flex flex-1 flex-col justify-center py-10"
              role="status"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-paper"
                style={{ animation: `aui016-rise .6s ${EASE} both` }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    strokeDasharray="24"
                    style={{ animation: `aui016-draw .5s .2s ${EASE} both` }}
                  />
                </svg>
              </span>
              <h3
                className="mt-6 font-serif text-[clamp(2.25rem,6.4cqw,3rem)] font-normal leading-[1.02] tracking-[-0.02em] text-ink"
                style={rise(0)}
              >
                Welcome back{first ? `, ${first}` : ""}.
              </h3>
              <p className="mt-3 text-[14px] text-mute" style={rise(1)}>
                Your notes are where you left them.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-6 self-start rounded-md text-[13.5px] font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50"
                style={rise(2)}
              >
                Sign out
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={submit}
              className="flex flex-1 flex-col justify-center py-8 @min-[660px]:py-10"
            >
              <p className="text-[15px] font-medium text-ink" style={rise(1)}>
                {eyebrow}
              </p>
              <h3
                className="mt-2 font-serif text-[clamp(2.25rem,6.4cqw,3rem)] font-normal leading-[1.02] tracking-[-0.02em] text-ink"
                style={rise(2)}
              >
                {line1}
                {line2 && (
                  <>
                    <br />
                    {line2}
                  </>
                )}
              </h3>

              <div className="mt-8 flex flex-col gap-2.5" style={rise(3)}>
                <Field
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={setEmail}
                  onBlur={() =>
                    email && setTouched((t) => ({ ...t, email: true }))
                  }
                  error={show("email")}
                  shake={shake}
                />
                <Field
                  label="Password"
                  type={reveal ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={setPassword}
                  onBlur={() =>
                    password && setTouched((t) => ({ ...t, password: true }))
                  }
                  error={show("password") || formError}
                  shake={shake}
                  end={
                    <button
                      type="button"
                      onClick={() => setReveal((v) => !v)}
                      aria-label={reveal ? "Hide password" : "Show password"}
                      aria-pressed={reveal}
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] text-mute outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
                        <circle cx="8" cy="8" r="2" />
                        {!reveal && <path d="M2.5 13.5l11-11" />}
                      </svg>
                    </button>
                  }
                />
              </div>

              <div
                className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3"
                style={rise(4)}
              >
                <button
                  type="submit"
                  disabled={state === "loading"}
                  aria-busy={state === "loading" || undefined}
                  className={cx(
                    "group inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-ink px-5 text-[14px] font-medium text-paper outline-none transition-transform duration-200 active:scale-[.98] disabled:cursor-progress",
                    FOCUS,
                  )}
                >
                  {state === "loading" && <Spinner />}
                  {state === "loading" ? "Signing in" : "Sign in"}
                  {state !== "loading" && (
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
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
                  )}
                </button>
                <p className="text-[13.5px] text-mute">
                  Don&apos;t have an account?{" "}
                  <a
                    href={signUpHref}
                    onClick={(e) => signUpHref === "#" && e.preventDefault()}
                    className="rounded font-medium text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    Sign up
                  </a>
                </p>
              </div>
            </form>
          )}

          <div className="flex items-center gap-3" style={rise(5)}>
            <span className="flex items-center gap-2 text-[22px] font-semibold tracking-[-0.045em] text-ink">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="currentColor"
                aria-hidden
              >
                <path d="M3 4h7a4 4 0 0 1 4 4v12H7a4 4 0 0 1-4-4V4Z" />
                <circle cx="18.5" cy="15.5" r="4.5" />
              </svg>
              {brand.toLowerCase()}
            </span>
            {tagline && (
              <span className="whitespace-pre-line font-serif text-[12px] leading-[1.25] text-ink/80">
                {tagline}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SplitSignIn;
