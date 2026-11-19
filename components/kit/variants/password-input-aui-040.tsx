"use client";

import { useId, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui040-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui040-tick { 0% { opacity: 0; transform: scale(.3) } 60% { opacity: 1; transform: scale(1.15) } 100% { opacity: 1; transform: none } }
@keyframes aui040-num { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui040 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui040-rise .6s ${EASE} ${i * 55}ms both` });

export interface ChecklistRule {
  /** Short sample shown big on the tile, e.g. "8+". */
  glyph: string;
  label: string;
  test: (value: string) => boolean;
}

export const CHECKLIST_RULES: ChecklistRule[] = [
  { glyph: "8+", label: "characters", test: (v) => v.length >= 8 },
  { glyph: "Aa", label: "both cases", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { glyph: "123", label: "a number", test: (v) => /\d/.test(v) },
  { glyph: "#!", label: "a symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export interface ChecklistPasswordProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, valid: boolean) => void;
  rules?: ChecklistRule[];
  /** Ask for the password twice. */
  confirm?: boolean;
  label?: string;
  name?: string;
  className?: string;
}

function Eye({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5Z" />
      <circle cx="10" cy="10" r="2.2" className="origin-center transition-transform duration-300 [transform-box:fill-box]" style={{ transform: open ? "none" : "scale(0)", transitionTimingFunction: EASE }} />
      <path d="M4 16 16 4" className="origin-center transition-[opacity,transform] duration-300 [transform-box:fill-box]" style={{ opacity: open ? 0 : 1, transform: open ? "scale(.4)" : "none", transitionTimingFunction: EASE }} />
    </svg>
  );
}

/**
 * aui-040 · A new-password field with rule tiles. Signature: each rule is a small tile with a big sample like "8+" or "Aa"
 * that flips to blue with a popping tick as you meet it, a rolling "3 of 4" counter, one eye that reveals both fields and a confirm match.
 */
export function ChecklistPassword({
  value,
  defaultValue = "",
  onChange,
  rules = CHECKLIST_RULES,
  confirm = true,
  label = "New password",
  name,
  className,
}: ChecklistPasswordProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const [again, setAgain] = useState("");
  const [shown, setShown] = useState(false);
  const v = value ?? inner;
  const passed = rules.map((r) => r.test(v));
  const count = passed.filter(Boolean).length;
  const all = count === rules.length;
  const match = !!again && again === v;

  const field =
    "flex h-11 items-center gap-2 rounded-[10px] bg-paper pl-3.5 pr-1.5 transition-shadow duration-200 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]";
  const input = "h-full min-w-0 flex-1 bg-transparent text-[14.5px] tracking-[0.02em] text-ink outline-none placeholder:tracking-normal placeholder:text-mute";

  return (
    <div className={cx("aui040 w-full max-w-[420px]", className)}>
      <style href="asta-password-input-aui-040" precedence="asta">{CSS}</style>
      <div className="mb-2 flex items-baseline justify-between" style={rise(0)}>
        <label htmlFor={`${id}-pw`} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        <span className="flex items-baseline gap-1 text-[12px] text-mute" aria-live="polite">
          <span className="relative inline-block h-4 overflow-hidden">
            <span key={count} className={cx("block font-medium tabular-nums", all ? "text-brand" : "text-ink")} style={{ animation: `aui040-num .3s ${EASE} both` }}>
              {count}
            </span>
          </span>
          of {rules.length} rules
        </span>
      </div>
      <div className={field} style={rise(1)}>
        <input
          id={`${id}-pw`}
          name={name}
          type={shown ? "text" : "password"}
          value={v}
          placeholder="Choose a password"
          autoComplete="new-password"
          spellCheck={false}
          autoCapitalize="off"
          aria-describedby={`${id}-rules`}
          onChange={(e) => {
            const next = e.target.value;
            if (value === undefined) setInner(next);
            onChange?.(next, rules.every((r) => r.test(next)));
          }}
          className={input}
        />
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide passwords" : "Show passwords"}
          aria-pressed={shown}
          className="grid h-8 w-8 place-items-center rounded-[7px] text-mute outline-none transition-[background-color,color,transform] duration-200 hover:bg-paper-2 hover:text-ink active:scale-90 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Eye open={shown} />
        </button>
      </div>

      <ul id={`${id}-rules`} className="mt-2.5 grid grid-cols-2 gap-1.5 min-[400px]:grid-cols-4" style={rise(2)}>
        {rules.map((r, i) => (
          <li
            key={r.label}
            className={cx(
              "relative flex flex-col gap-0.5 rounded-[9px] px-2.5 pb-2 pt-2.5 transition-[background-color,box-shadow] duration-300",
              passed[i] ? "bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_30%,transparent)]" : "bg-paper-2",
            )}
          >
            <span className={cx("text-[17px] font-semibold leading-none tracking-[-0.03em] transition-colors duration-300", passed[i] ? "text-brand" : "text-ink")}>{r.glyph}</span>
            <span className="truncate text-[11.5px] text-mute">{r.label}</span>
            <span className="sr-only">{passed[i] ? ", done" : ", not yet"}</span>
            {passed[i] && (
              <span aria-hidden className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-brand text-white" style={{ animation: `aui040-tick .4s ${EASE} both` }}>
                <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3.5 8.5 3 3 6-7" />
                </svg>
              </span>
            )}
          </li>
        ))}
      </ul>

      {confirm && (
        <>
          <label htmlFor={`${id}-again`} className="mb-2 mt-4 block text-[13px] font-medium text-ink" style={rise(3)}>
            Confirm password
          </label>
          <div className={field} style={rise(3)}>
            <input
              id={`${id}-again`}
              type={shown ? "text" : "password"}
              value={again}
              placeholder="Type it again"
              autoComplete="new-password"
              spellCheck={false}
              autoCapitalize="off"
              aria-invalid={!!again && !match && again.length >= v.length ? true : undefined}
              onChange={(e) => setAgain(e.target.value)}
              className={input}
            />
            <span
              aria-live="polite"
              className={cx(
                "mr-1 flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-medium transition-[opacity,transform] duration-300",
                again ? "opacity-100" : "translate-x-1 opacity-0",
                match ? "bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] text-brand" : "bg-paper-2 text-mute",
              )}
              style={{ transitionTimingFunction: EASE }}
            >
              {match ? "Matches" : again ? "No match yet" : ""}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default ChecklistPassword;
