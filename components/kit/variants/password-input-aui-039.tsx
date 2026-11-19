"use client";

import { useId, useState, type CSSProperties, type InputHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui039-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui039-word { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui039-glow { 0% { opacity: 0; transform: scale(.7) } 40% { opacity: 1 } 100% { opacity: 0; transform: scale(1.35) } }
@media (prefers-reduced-motion: reduce) { .aui039 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui039-rise .6s ${EASE} ${i * 55}ms both` });

const CHECKS: ((v: string) => boolean)[] = [(v) => v.length >= 8, (v) => /[A-Z]/.test(v) && /[a-z]/.test(v), (v) => /\d/.test(v), (v) => /[^A-Za-z0-9]/.test(v) || v.length >= 14];
const WORDS = ["Empty", "Weak", "Fair", "Good", "Strong"];

/** Rough offline guessing time at ten billion guesses a second. */
function crackTime(v: string) {
  if (!v) return "";
  const pool = (/[a-z]/.test(v) ? 26 : 0) + (/[A-Z]/.test(v) ? 26 : 0) + (/\d/.test(v) ? 10 : 0) + (/[^A-Za-z0-9]/.test(v) ? 33 : 0);
  const secs = Math.pow(pool || 1, v.length) / 2 / 1e10;
  const units: [number, string][] = [
    [3.15e9, "century"],
    [3.15e7, "year"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  if (secs < 1) return "instantly";
  if (secs > 3.15e11) return "centuries";
  for (const [s, name] of units) if (secs >= s) {
    const n = Math.round(secs / s);
    return `${n} ${name === "century" ? (n > 1 ? "centuries" : "century") : name + (n > 1 ? "s" : "")}`;
  }
  return "seconds";
}

/** One quarter arc of the dial, with a small gap at each end. */
function arc(i: number, r: number) {
  const a0 = ((i * 90 + 6 - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * 90 - 6 - 90) * Math.PI) / 180;
  const p = (a: number) => `${(32 + r * Math.cos(a)).toFixed(2)} ${(32 + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
}

export interface StrengthPasswordProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "size"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, score: number) => void;
  label?: string;
  /** Show the rough time-to-crack line. */
  estimate?: boolean;
  className?: string;
}

/**
 * aui-039 · A password field with a strength dial. Signature: four arcs around a padlock light up one by one as the
 * password gets stronger, the lock clicks shut and pulses blue at full strength, next to a rolling verdict and a crack-time estimate.
 */
export function StrengthPassword({
  value,
  defaultValue = "",
  onChange,
  label = "Password",
  estimate = true,
  placeholder = "At least 8 characters",
  autoComplete = "new-password",
  className,
  id,
  ...rest
}: StrengthPasswordProps) {
  const uid = useId();
  const inputId = id ?? uid;
  const [inner, setInner] = useState(defaultValue);
  const [shown, setShown] = useState(false);
  const v = value ?? inner;
  const score = v ? CHECKS.filter((c) => c(v)).length : 0;
  const strong = score === 4;
  const time = crackTime(v);

  return (
    <div className={cx("aui039 w-full max-w-[400px]", className)}>
      <style href="asta-password-input-aui-039" precedence="asta">{CSS}</style>
      <div className="flex items-center gap-4" style={rise(0)}>
        <div className="relative h-16 w-16 shrink-0" aria-hidden>
          {strong && <span key="glow" className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-brand)_22%,transparent)]" style={{ animation: `aui039-glow .9s ${EASE} both` }} />}
          <svg viewBox="0 0 64 64" className="relative h-16 w-16">
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <path d={arc(i, 27)} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-[color-mix(in_srgb,var(--color-ink)_9%,transparent)]" />
                <path
                  d={arc(i, 27)}
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className={cx("origin-center transition-[opacity,transform] duration-500", strong ? "stroke-brand" : "stroke-ink")}
                  style={{
                    opacity: i < score ? 1 : 0,
                    transform: i < score ? "scale(1)" : "scale(.86)",
                    transitionDelay: `${i * 50}ms`,
                    transitionTimingFunction: EASE,
                    transformBox: "view-box",
                  }}
                />
              </g>
            ))}
            <g className={cx("transition-colors duration-300", strong ? "text-brand" : "text-ink")}>
              <path
                d="M27 31v-4a5 5 0 0 1 10 0v4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="transition-transform duration-500"
                style={{ transform: strong ? "none" : "translateY(-3px)", transitionTimingFunction: EASE }}
              />
              <rect x="24.5" y="30" width="15" height="11.5" rx="2.6" fill="currentColor" />
            </g>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Strength</p>
          <p className="relative h-7 overflow-hidden" aria-live="polite">
            <span key={score} className={cx("block text-[20px] font-medium leading-7 tracking-[-0.02em]", strong ? "text-brand" : v ? "text-ink" : "text-mute")} style={{ animation: `aui039-word .35s ${EASE} both` }}>
              {WORDS[score]}
            </span>
          </p>
          {estimate && (
            <p className="truncate text-[12.5px] text-mute">
              {v ? (
                <>
                  Cracked <span className="text-ink">{time}</span>
                  {time === "instantly" ? "" : " by a fast rig"}
                </>
              ) : (
                "Mix cases, numbers and a symbol"
              )}
            </p>
          )}
        </div>
      </div>

      <label htmlFor={inputId} className="mb-2 mt-5 block text-[13px] font-medium text-ink" style={rise(1)}>
        {label}
      </label>
      <div
        className={cx(
          "flex h-11 items-center gap-2 rounded-[10px] bg-paper pl-3.5 pr-1.5 transition-shadow duration-200",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)]",
          "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        )}
        style={rise(2)}
      >
        <input
          {...rest}
          id={inputId}
          type={shown ? "text" : "password"}
          value={v}
          placeholder={placeholder}
          autoComplete={autoComplete}
          spellCheck={false}
          autoCapitalize="off"
          onChange={(e) => {
            const next = e.target.value;
            if (value === undefined) setInner(next);
            onChange?.(next, next ? CHECKS.filter((c) => c(next)).length : 0);
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] tracking-[0.02em] text-ink outline-none placeholder:tracking-normal placeholder:text-mute"
        />
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-controls={inputId}
          className="h-8 rounded-[7px] px-2.5 text-[12.5px] font-medium text-mute outline-none transition-[background-color,color,transform] duration-200 hover:bg-paper-2 hover:text-ink active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export default StrengthPassword;
