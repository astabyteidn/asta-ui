"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui032-in { from { opacity: 0; transform: translateY(100%) } to { opacity: 1; transform: none } }
@keyframes aui032-out { from { opacity: 1; transform: none } to { opacity: 0; transform: translateY(-100%) } }
@keyframes aui032-pop { 0% { opacity: 0; transform: scale(.4) } 60% { opacity: 1; transform: scale(1.08) } 100% { opacity: 1; transform: none } }
@keyframes aui032-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@media (prefers-reduced-motion: reduce) { .aui032 * { animation-duration: 1ms !important; animation-delay: 0ms !important; transition: none !important } }
`;

export type ValidatedInputStatus =
  | { kind: "idle"; text: string }
  | { kind: "invalid"; text: string }
  | { kind: "suggest"; text: string; suggestion: string }
  | { kind: "valid"; text: string };

const DOMAINS = ["astabyte.com", "gmail.com", "outlook.com", "icloud.com", "yahoo.com", "proton.me", "hotmail.com"];

function distance(a: string, b: string) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[b.length];
}

/** The default check: an email address, with a nudge when the domain looks like a typo of a common one. */
export function checkWorkEmail(raw: string): ValidatedInputStatus {
  const v = raw.trim();
  if (!v) return { kind: "idle", text: "We'll send the invite here." };
  if (!v.includes("@")) return { kind: "invalid", text: "Add an @ and the company domain." };
  const [user, domain = ""] = v.split("@");
  if (!user) return { kind: "invalid", text: "Add the part before the @." };
  if (!/^[^\s@]+\.[a-z]{2,}$/i.test(domain)) return { kind: "invalid", text: "Finish the domain, like name@company.com." };
  const d = domain.toLowerCase();
  if (!DOMAINS.includes(d)) {
    const near = DOMAINS.find((x) => distance(d, x) <= 2);
    if (near) return { kind: "suggest", text: "Did you mean", suggestion: `${user}@${near}` };
  }
  return { kind: "valid", text: "Looks good." };
}

export interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "children" | "onChange"> {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Returns a status for the current text. Defaults to an email check with typo suggestions. */
  validate?: (value: string) => ValidatedInputStatus;
  /** Quiet time after the last key before the message updates. */
  delay?: number;
  /** Called whenever the shown status changes. */
  onStatus?: (status: ValidatedInputStatus) => void;
  className?: string;
}

/**
 * aui-032 · Live validation. Signature: a calm ink message that rolls up to the next one as you type,
 * a one-tap fix for typos and a check that draws itself in once the value is good.
 */
export function ValidatedInput({
  label = "Work email",
  value: valueProp,
  defaultValue = "",
  onChange,
  validate = checkWorkEmail,
  delay = 380,
  onStatus,
  className,
  id: idProp,
  placeholder = "name@company.com",
  ...rest
}: ValidatedInputProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const ref = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [status, setStatus] = useState<ValidatedInputStatus>(() => validate(value));
  const [prev, setPrev] = useState<{ s: ValidatedInputStatus; n: number } | null>(null);
  const statusRef = useRef(status);
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  });

  // Validate once typing pauses, so the message stays calm under your fingers.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = validate(value);
      const cur = statusRef.current;
      const same = cur.kind === next.kind && cur.text === next.text && (cur.kind !== "suggest" || (next.kind === "suggest" && cur.suggestion === next.suggestion));
      if (same) return;
      setPrev((p) => ({ s: cur, n: (p?.n ?? 0) + 1 }));
      statusRef.current = next;
      setStatus(next);
      onStatusRef.current?.(next);
    }, value ? delay : 0);
    return () => clearTimeout(t);
  }, [value, validate, delay]);

  const set = (v: string) => {
    if (valueProp === undefined) setInner(v);
    onChange?.(v);
  };

  const valid = status.kind === "valid";
  const message = (s: ValidatedInputStatus, live: boolean) => (
    <span className="flex min-w-0 items-center gap-1.5">
      {s.kind === "invalid" && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 4.8v3.6M8 11h.01" />
        </svg>
      )}
      <span className="truncate">{s.text}</span>
      {s.kind === "suggest" && (
        <button
          type="button"
          tabIndex={live ? 0 : -1}
          onClick={() => {
            set(s.suggestion);
            ref.current?.focus();
          }}
          className="group/s inline-flex min-w-0 items-center gap-1 rounded-[6px] bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-1.5 py-px font-medium text-brand outline-none transition-transform duration-200 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <span className="truncate">{s.suggestion}</span>
          <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 transition-transform duration-300 group-hover/s:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2.5 6h7M6.5 3l3 3-3 3" />
          </svg>
        </button>
      )}
    </span>
  );

  return (
    <div className={cx("aui032 w-full", className)}>
      <style href="asta-input-aui-032" precedence="asta">
        {CSS}
      </style>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium tracking-[-0.01em] text-ink">
        {label}
      </label>
      <div
        className={cx(
          "relative flex h-11 items-center rounded-[10px] bg-paper pl-3.5 pr-2 transition-shadow duration-300",
          status.kind === "invalid" && value
            ? "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_70%,transparent)]"
            : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_26%,transparent)]",
          "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]",
        )}
      >
        <input
          ref={ref}
          id={id}
          type="email"
          autoComplete="email"
          spellCheck={false}
          {...rest}
          value={value}
          placeholder={placeholder}
          aria-invalid={status.kind === "invalid" || undefined}
          aria-describedby={`${id}-msg`}
          onChange={(e) => set(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-[14.5px] tracking-[-0.01em] text-ink outline-none placeholder:text-mute"
        />
        <span className="grid h-6 w-6 shrink-0 place-items-center" aria-hidden>
          {valid && (
            <span key={value} className="grid h-5 w-5 place-items-center rounded-full bg-brand text-paper" style={{ animation: `aui032-pop .5s ${EASE} both` }}>
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 8.5l3 3 6-7" pathLength={1} strokeDasharray="1" style={{ animation: `aui032-draw .45s ${EASE} .18s both` }} />
              </svg>
            </span>
          )}
        </span>
      </div>
      {/* The message rolls: the old line leaves upward as the new one rises in. */}
      <div id={`${id}-msg`} aria-live="polite" className="relative mt-1.5 h-5 overflow-hidden pl-1 text-[12.5px] leading-5">
        {prev && (
          <div key={`p${prev.n}`} aria-hidden className={cx("absolute inset-x-1 top-0", prev.s.kind === "idle" ? "text-mute" : "text-ink")} style={{ animation: `aui032-out .4s ${EASE} both` }}>
            {message(prev.s, false)}
          </div>
        )}
        <div key={`c${prev?.n ?? 0}`} className={cx(status.kind === "idle" ? "text-mute" : "text-ink", valid && "font-medium")} style={prev ? { animation: `aui032-in .45s ${EASE} both` } : undefined}>
          {message(status, true)}
        </div>
      </div>
    </div>
  );
}

export default ValidatedInput;
