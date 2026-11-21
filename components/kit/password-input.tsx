"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export const DEFAULT_PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const WORDS = ["Weak", "Weak", "Fair", "Good", "Strong"];

/** How many rules a password passes, and the matching word. */
export function passwordStrength(value: string, rules: PasswordRule[] = DEFAULT_PASSWORD_RULES) {
  const passed = rules.map((r) => r.test(value));
  const score = passed.filter(Boolean).length;
  const ratio = rules.length ? score / rules.length : 0;
  const word = !value ? "" : WORDS[Math.round(ratio * 4)];
  return { score, max: rules.length, passed, word, strong: score === rules.length };
}

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "size"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, strength: ReturnType<typeof passwordStrength>) => void;
  label?: string;
  rules?: PasswordRule[];
  /** Show the segmented strength meter. */
  meter?: boolean;
  /** Show the rule checklist under the meter. */
  checklist?: boolean;
  className?: string;
}

function Eye({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5Z" />
      <circle
        cx="10"
        cy="10"
        r="2.2"
        className="origin-center transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] [transform-box:fill-box] motion-reduce:transition-none"
        style={{ transform: hidden ? "scale(.55)" : "scale(1)" }}
      />
      <path
        d="M4 3.5 16 16.5"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={hidden ? 0 : 1}
        className="transition-[stroke-dashoffset] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
      />
    </svg>
  );
}

function Tick({ on }: { on: boolean }) {
  return (
    <span
      className={cx(
        "relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-300",
        on ? "bg-brand text-white" : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_20%,transparent)]",
      )}
    >
      <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path
          d="m3.5 8.5 3 3 6-7"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={on ? 0 : 1}
          className="transition-[stroke-dashoffset] delay-100 duration-[400ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
        />
      </svg>
    </span>
  );
}

/**
 * A new-password field. The eye morphs when you reveal the text, the meter segments fill as more rules pass
 * (they turn blue once every rule passes) and each rule ticks itself off. Rules are plain `{ label, test }`.
 */
export function PasswordField({
  value,
  defaultValue = "",
  onChange,
  label = "Password",
  rules = DEFAULT_PASSWORD_RULES,
  meter = true,
  checklist = true,
  className,
  id,
  autoComplete = "new-password",
  ...rest
}: PasswordFieldProps) {
  const uid = useId();
  const inputId = id ?? `${uid}-input`;
  const [inner, setInner] = useState(defaultValue);
  const [shown, setShown] = useState(false);
  const current = value ?? inner;
  const s = passwordStrength(current, rules);

  return (
    <div className={cx("flex w-full flex-col gap-2", className)}>
      <label htmlFor={inputId} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <div
        className={cx(
          "flex h-10 items-center gap-2 rounded-lg bg-paper pl-3 pr-1 transition-shadow duration-200",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)]",
          "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]",
        )}
      >
        <input
          name="password"
          {...rest}
          id={inputId}
          type={shown ? "text" : "password"}
          value={current}
          autoComplete={autoComplete}
          spellCheck={false}
          autoCapitalize="off"
          aria-describedby={checklist || meter ? `${uid}-help` : undefined}
          onChange={(e) => {
            const v = e.target.value;
            if (value === undefined) setInner(v);
            onChange?.(v, passwordStrength(v, rules));
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] sm:text-[14px] tracking-[0.01em] text-ink outline-none placeholder:text-mute"
        />
        <button
          type="button"
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          aria-controls={inputId}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setShown((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-mute outline-none transition-colors duration-200 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Eye hidden={!shown} />
        </button>
      </div>

      {(meter || checklist) && (
        <div id={`${uid}-help`} className="flex flex-col gap-3 pt-1">
          {meter && (
            <div className="flex items-center gap-3">
              <div aria-hidden className="flex flex-1 gap-1.5">
                {rules.map((r, i) => (
                  <span key={r.label} className="relative h-1 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
                    <span
                      className={cx(
                        "absolute inset-0 origin-left rounded-full transition-[transform,background-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
                        s.strong ? "bg-brand" : "bg-ink",
                      )}
                      style={{ transform: `scaleX(${i < s.score ? 1 : 0})`, transitionDelay: `${i * 40}ms` }}
                    />
                  </span>
                ))}
              </div>
              <span aria-live="polite" className={cx("w-12 text-right text-[12px] tabular-nums transition-colors duration-300", s.strong ? "text-brand" : "text-mute")}>
                {s.word && <span className="sr-only">Strength: </span>}
                {s.word}
              </span>
            </div>
          )}
          {checklist && (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {rules.map((r, i) => (
                <li key={r.label} className={cx("flex items-center gap-2 text-[12.5px] transition-colors duration-300", s.passed[i] ? "text-ink" : "text-mute")}>
                  <Tick on={s.passed[i]} />
                  {r.label}
                  <span className="sr-only">{s.passed[i] ? ", done" : ", not yet"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default PasswordField;
