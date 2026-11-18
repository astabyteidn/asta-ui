"use client";

import { Fragment, useId, useState, type ClipboardEvent, type SyntheticEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-otp-drop { from { opacity: 0; transform: translateY(-7px) scale(.9) } }
@keyframes asta-otp-caret { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
@keyframes asta-otp-wave-0 { 0%, 100% { transform: translateY(0) } 35% { transform: translateY(-7px) } }
@keyframes asta-otp-wave-1 { 0%, 100% { transform: translateY(0) } 35% { transform: translateY(-7px) } }
@keyframes asta-otp-shake-0 { 0%, 100% { transform: translateX(0) } 20% { transform: translateX(-7px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(2px) } }
@keyframes asta-otp-shake-1 { 0%, 100% { transform: translateX(0) } 20% { transform: translateX(-7px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(2px) } }`;

// Two copies of each keyframe: switching the name restarts the animation without remounting the boxes
// (a remount would replay every digit's drop-in too).
const EASE = "cubic-bezier(.16,1,.3,1)";

export interface OtpInputProps {
  /** Number of boxes. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once every box is filled. */
  onComplete?: (code: string) => void;
  /** Accept digits only (default). Off allows letters too, upper-cased. */
  digitsOnly?: boolean;
  /** Mark the code as wrong. The boxes shake each time this turns true. */
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Put a small dash after every N boxes, e.g. 3 for "123–456". */
  groupSize?: number;
  /** Accessible name. */
  label?: string;
  name?: string;
  className?: string;
}

/**
 * A one-time code input. One real input sits over the boxes, so typing, Backspace, paste and the phone's
 * SMS autofill all just work. Digits drop in, the active box blinks a caret, a full code makes the boxes
 * wave, and `error` shakes them once.
 */
export function OtpInput({
  length = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  digitsOnly = true,
  error,
  disabled,
  autoFocus,
  groupSize,
  label = "One-time code",
  name,
  className,
}: OtpInputProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const code = (value ?? inner).slice(0, length);
  const [focused, setFocused] = useState(false);
  const [wave, setWave] = useState(0);
  const [shake, setShake] = useState(0);
  const [prevError, setPrevError] = useState(Boolean(error));

  if (Boolean(error) !== prevError) {
    setPrevError(Boolean(error));
    if (error) setShake((s) => s + 1);
  }

  const clean = (s: string) => (digitsOnly ? s.replace(/\D/g, "") : s.replace(/[^a-z0-9]/gi, "").toUpperCase()).slice(0, length);

  const update = (raw: string) => {
    const next = clean(raw);
    if (next === code) return;
    if (value === undefined) setInner(next);
    onChange?.(next);
    if (next.length === length && code.length < length) {
      setWave((w) => w + 1);
      onComplete?.(next);
    }
  };

  // Paste replaces the whole code, wherever the caret was.
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    update(e.clipboardData.getData("text"));
  };

  // Keep the caret at the end so typing appends and Backspace removes the last box.
  const toEnd = (e: SyntheticEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const n = el.value.length;
    if (el.selectionStart !== n || el.selectionEnd !== n) el.setSelectionRange(n, n);
  };

  const active = focused ? Math.min(code.length, length - 1) : -1;
  const full = code.length === length;

  return (
    <div className={cx("relative inline-flex", disabled && "opacity-45", className)}>
      <style href="asta-otp-input" precedence="asta">{KEYFRAMES}</style>
      <div
        aria-hidden
        className="flex items-center gap-2 motion-reduce:!animate-none"
        style={shake > 0 ? { animation: `asta-otp-shake-${shake % 2} .42s ${EASE} both` } : undefined}
      >
        {Array.from({ length }, (_, i) => {
          const ch = code[i];
          const on = i === active && !error;
          const ring = error
            ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
            : on
              ? "shadow-[inset_0_0_0_1.5px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]"
              : full
                ? "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-brand)_55%,transparent)]"
                : ch
                  ? "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_26%,transparent)]"
                  : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]";
          return (
            <Fragment key={i}>
              {groupSize && i > 0 && i % groupSize === 0 && <span className="mx-0.5 h-[2px] w-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_22%,transparent)]" />}
              <span
                className="block motion-reduce:!animate-none"
                style={wave > 0 ? { animation: `asta-otp-wave-${wave % 2} .55s ${EASE} ${i * 45}ms both` } : undefined}
              >
                <span
                  className={cx(
                    "grid h-12 w-10 place-items-center rounded-[10px] bg-paper text-[22px] font-medium tabular-nums tracking-[-0.02em] transition-shadow duration-200 sm:h-14 sm:w-12 sm:text-[24px]",
                    "text-ink",
                    ring,
                  )}
                >
                  {ch ? (
                    <span key={`${i}-${ch}`} className="animate-[asta-otp-drop_.3s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none">
                      {ch}
                    </span>
                  ) : on ? (
                    <span className="h-6 w-[1.5px] rounded-full bg-ink animate-[asta-otp-caret_1.05s_steps(1)_infinite] motion-reduce:animate-none" />
                  ) : null}
                </span>
              </span>
            </Fragment>
          );
        })}
      </div>
      <input
        id={id}
        name={name}
        value={code}
        onChange={(e) => update(e.target.value)}
        onPaste={onPaste}
        onFocus={(e) => {
          setFocused(true);
          toEnd(e);
        }}
        onBlur={() => setFocused(false)}
        onSelect={toEnd}
        onClick={toEnd}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={length}
        inputMode={digitsOnly ? "numeric" : "text"}
        pattern={digitsOnly ? "[0-9]*" : undefined}
        autoComplete="one-time-code"
        autoCapitalize={digitsOnly ? undefined : "characters"}
        spellCheck={false}
        aria-label={label}
        aria-invalid={error || undefined}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-[16px] text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}

export default OtpInput;
