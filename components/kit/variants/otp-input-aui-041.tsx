"use client";

import { useId, useRef, useState, type ClipboardEvent, type CSSProperties, type SyntheticEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const W = 42;
const H = 50;
const GAP = 7;
const MID = 18;
const CSS = `
@keyframes aui041-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui041-drop { from { opacity: 0; transform: translateY(-8px) scale(.85) } to { opacity: 1; transform: none } }
@keyframes aui041-caret { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
@keyframes aui041-shake { 0%, 100% { transform: none } 20% { transform: translateX(-7px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(2px) } }
@media (prefers-reduced-motion: reduce) { .aui041 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui041-rise .6s ${EASE} ${i * 55}ms both` });

export interface SplitOtpProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once all six digits are in. */
  onComplete?: (code: string) => void;
  /** Mark the code as wrong. The halves shake each time this turns true. */
  error?: boolean;
  /** Show the "Paste code" button. */
  pasteButton?: boolean;
  label?: string;
  autoFocus?: boolean;
  className?: string;
}

const x = (i: number) => i * (W + GAP) + (i >= 3 ? MID : 0);

/**
 * aui-041 · A six-digit code split 3 + 3. Signature: one focus frame with a caret glides from box to box as digits drop in,
 * and when the code is complete the two halves slide together into one block. Paste works anywhere or from the button.
 */
export function SplitOtp({ value, defaultValue = "", onChange, onComplete, error, pasteButton = true, label = "Verification code", autoFocus, className }: SplitOtpProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const code = (value ?? inner).replace(/\D/g, "").slice(0, 6);
  const [focused, setFocused] = useState(false);
  const [shake, setShake] = useState(0);
  const [prevError, setPrevError] = useState(Boolean(error));
  if (Boolean(error) !== prevError) {
    setPrevError(Boolean(error));
    if (error) setShake((s) => s + 1);
  }
  const full = code.length === 6;
  const active = Math.min(code.length, 5);
  const total = x(5) + W;

  const update = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, 6);
    if (next === code) return;
    if (value === undefined) setInner(next);
    onChange?.(next);
    if (next.length === 6 && code.length < 6) onComplete?.(next);
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    update(e.clipboardData.getData("text"));
  };
  const toEnd = (e: SyntheticEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const n = el.value.length;
    if (el.selectionStart !== n || el.selectionEnd !== n) el.setSelectionRange(n, n);
  };
  const paste = async () => {
    try {
      update(await navigator.clipboard.readText());
    } catch {
      /* Clipboard blocked: the field still takes a normal paste. */
    }
    input.current?.focus();
  };

  // Close the gap between the halves once complete: left half moves right, right half moves left.
  const shift = (i: number) => (full ? (i < 3 ? MID / 2 - 1 : -(MID / 2 - 1)) : 0);

  return (
    <div className={cx("aui041 inline-flex flex-col items-center", className)}>
      <style href="asta-otp-input-aui-041" precedence="asta">{CSS}</style>
      <div className="relative" style={{ width: total, height: H, ...rise(0) }}>
        <div
          key={shake}
          aria-hidden
          className="absolute inset-0"
          style={shake ? { animation: `aui041-shake .42s ${EASE} both` } : undefined}
        >
          {Array.from({ length: 6 }, (_, i) => {
            const d = code[i];
            return (
              <div
                key={i}
                className={cx(
                  "absolute top-0 grid place-items-center rounded-[10px] transition-[transform,background-color,box-shadow] duration-500",
                  full
                    ? "bg-[color-mix(in_srgb,var(--color-brand)_7%,var(--color-paper))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_35%,transparent)]"
                    : d
                      ? "bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]"
                      : "bg-paper-2",
                  error && !focused && "shadow-[inset_0_0_0_1.5px_var(--color-ink)]",
                )}
                style={{ width: W, height: H, transform: `translateX(${x(i) + shift(i)}px)`, transitionTimingFunction: EASE, transitionDelay: full ? `${Math.abs(i - 2.5) * 20}ms` : "0ms" }}
              >
                {d && (
                  <span key={`${i}-${d}`} className={cx("text-[22px] font-medium tabular-nums tracking-[-0.02em] transition-colors duration-300", full ? "text-brand" : "text-ink")} style={{ animation: `aui041-drop .32s ${EASE} both` }}>
                    {d}
                  </span>
                )}
              </div>
            );
          })}
          <span
            className="pointer-events-none absolute top-[24px] h-[2px] w-2 rounded-full bg-mute transition-opacity duration-300"
            style={{ left: x(3) - MID / 2 - GAP / 2 - 4, opacity: full ? 0 : 0.6 }}
          />
          {/* The gliding frame: one element, moved with transform. */}
          <div
            className="pointer-events-none absolute left-0 top-0 rounded-[10px] shadow-[inset_0_0_0_1.5px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)] transition-[transform,opacity] duration-300"
            style={{ width: W, height: H, transform: `translateX(${x(active)}px)`, opacity: full ? 0 : focused ? 1 : code.length ? 0.55 : 0, transitionTimingFunction: EASE }}
          >
            {focused && !code[active] && <span className="absolute left-1/2 top-1/2 h-5 w-[1.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" style={{ animation: "aui041-caret 1.05s steps(1) infinite" }} />}
          </div>
        </div>
        <input
          ref={input}
          id={id}
          aria-label={label}
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          autoFocus={autoFocus}
          aria-invalid={error || undefined}
          onChange={(e) => update(e.target.value)}
          onPaste={onPaste}
          onFocus={(e) => {
            setFocused(true);
            toEnd(e);
          }}
          onBlur={() => setFocused(false)}
          onSelect={toEnd}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
        />
      </div>
      <div className="mt-4 flex h-7 items-center gap-3 text-[12.5px]" style={rise(1)}>
        <span className="text-mute" aria-live="polite">
          {full ? "Code complete" : `${6 - code.length} digit${6 - code.length === 1 ? "" : "s"} to go`}
        </span>
        {pasteButton && (
          <button
            type="button"
            onClick={paste}
            className="flex h-7 items-center gap-1.5 rounded-[7px] px-2 font-medium text-ink outline-none transition-[background-color,transform] duration-200 hover:bg-paper-2 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-mute" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="2.5" width="10" height="11.5" rx="2" />
              <path d="M6 2.5V2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v.5" strokeLinecap="round" />
            </svg>
            Paste code
          </button>
        )}
      </div>
    </div>
  );
}

export default SplitOtp;
