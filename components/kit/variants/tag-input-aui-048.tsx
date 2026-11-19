"use client";

import { useId, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";

const CSS = `
@keyframes aui048-in { 0% { opacity: 0; transform: scale(.7) } 60% { opacity: 1; transform: scale(1.04) } 100% { transform: none } }
@keyframes aui048-shake { 0%,100% { transform: none } 20% { transform: translateX(-5px) } 40% { transform: translateX(4px) } 60% { transform: translateX(-3px) } 80% { transform: translateX(2px) } }
@keyframes aui048-bad { 0% { opacity: 0; transform: scale(.7) } 30% { opacity: 1; transform: none } 45% { transform: translateX(-5px) } 60% { transform: translateX(4px) } 75% { transform: translateX(-2px) } 100% { transform: none } }
@keyframes aui048-line { from { opacity: 0; transform: translateY(5px) } }
@media (prefers-reduced-motion: reduce) { .aui048 *, .aui048 { animation: none !important; transition: none !important } }
`;

export interface EmailTagInputProps {
  value?: string[];
  defaultValue?: string[];
  /** Every entry, valid or not. Only valid ones are submitted with `name`. */
  onChange?: (emails: string[]) => void;
  /** Your team's domain. Matching addresses get a teammate chip, others are marked guest. */
  domain?: string;
  max?: number;
  label?: string;
  placeholder?: string;
  name?: string;
  className?: string;
}

const isEmailAddress = (v: string) => /^[^\s@,;<>]+@[^\s@,;<>]+\.[a-z]{2,}$/i.test(v);

/** "Lena Marsh <lena@x.com>" → "lena@x.com". */
const clean = (raw: string) => {
  const m = raw.match(/<([^>]+)>/);
  return (m ? m[1] : raw).trim().replace(/^mailto:/i, "").toLowerCase();
};

/** aui-048 · Email chips: addresses split on comma, space or paste, teammates and guests are told apart and bad ones shake and wait in a dashed chip. */
export function EmailTagInput({
  value,
  defaultValue = [],
  onChange,
  domain = "astabyte.com",
  max = 20,
  label = "To",
  placeholder = "Add people by email",
  name,
  className,
}: EmailTagInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const list = value ?? inner;
  const [text, setText] = useState("");
  const [shake, setShake] = useState<{ email: string; n: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  const set = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const add = (parts: string[]) => {
    const next = [...list];
    for (const p of parts) {
      const e = clean(p);
      if (!e) continue;
      if (next.includes(e)) {
        setShake((s) => ({ email: e, n: (s?.n ?? 0) + 1 }));
        continue;
      }
      if (next.length >= max) break;
      next.push(e);
    }
    if (next.length !== list.length) set(next);
    setText("");
  };
  const remove = (e: string) => {
    set(list.filter((x) => x !== e));
    input.current?.focus();
  };
  const edit = (e: string) => {
    set(list.filter((x) => x !== e));
    setText(e);
    input.current?.focus();
  };

  const bad = list.filter((e) => !isEmailAddress(e));
  const mates = list.filter((e) => isEmailAddress(e) && e.endsWith(`@${domain}`)).length;
  const guests = list.length - bad.length - mates;
  const status = bad.length
    ? `${bad.length} ${bad.length === 1 ? "address needs" : "addresses need"} a fix. Click to edit.`
    : list.length
      ? [mates && `${mates} ${mates === 1 ? "teammate" : "teammates"}`, guests && `${guests} ${guests === 1 ? "guest" : "guests"}`].filter(Boolean).join(" · ")
      : "Separate with a comma, a space or paste a list";

  return (
    <div className={cx("aui048 w-full", className)}>
      <style href="asta-aui048" precedence="asta">{CSS}</style>
      <div
        onClick={() => input.current?.focus()}
        className={cx(
          "flex min-h-12 w-full cursor-text flex-wrap items-center gap-1.5 rounded-[11px] bg-paper py-1.5 pl-3 pr-1.5 transition-shadow duration-300",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]",
          "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        )}
      >
        <label htmlFor={id} className="mr-1 font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
          {label}
        </label>
        <ul className="contents" aria-label="Recipients">
          {list.map((e) => {
            const ok = isEmailAddress(e);
            const mate = ok && e.endsWith(`@${domain}`);
            const shaking = shake?.email === e;
            const [local, host] = e.split("@");
            return (
              <li
                key={shaking ? `${e}-${shake.n}` : e}
                className={cx(
                  "flex h-8 max-w-full items-center gap-1.5 rounded-[8px] pl-1 pr-0.5 text-[13px] transition-colors duration-200",
                  ok ? "bg-paper-2 text-ink" : "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-ink)] [background-image:repeating-linear-gradient(135deg,color-mix(in_srgb,var(--color-ink)_6%,transparent)_0_4px,transparent_4px_8px)]",
                )}
                style={{ animation: shaking ? `aui048-shake .42s ${EASE}` : ok ? `aui048-in .45s ${EASE} both` : `aui048-bad .7s ${EASE} both` }}
              >
                {ok ? (
                  <span aria-hidden className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold uppercase", mate ? "bg-brand text-white" : "bg-paper text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_16%,transparent)]")}>
                    {local[0]}
                  </span>
                ) : (
                  <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-paper">
                    !
                  </span>
                )}
                <button
                  type="button"
                  tabIndex={ok ? -1 : 0}
                  disabled={ok}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    edit(e);
                  }}
                  aria-label={ok ? e : `Fix ${e}, not a valid email`}
                  aria-invalid={!ok || undefined}
                  className="min-w-0 truncate rounded-[4px] text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-text"
                >
                  <span className="font-medium">{local}</span>
                  {host !== undefined && <span className="text-mute">@{host}</span>}
                </button>
                {ok && !mate && <span className="rounded-[4px] bg-paper px-1 font-mono text-[9.5px] uppercase tracking-[0.06em] text-mute">Guest</span>}
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    remove(e);
                  }}
                  aria-label={`Remove ${e}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-mute outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
        <input
          ref={input}
          id={id}
          type="text"
          value={text}
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          placeholder={list.length ? "" : placeholder}
          aria-describedby={`${id}-status`}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,;\s]/.test(v)) add(v.split(/[,;\s]+/));
            else setText(v);
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData("text");
            if (/[,;\s]/.test(v.trim())) {
              e.preventDefault();
              add(v.split(/[,;\n]+|\s+(?![^<]*>)/));
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || (e.key === "Tab" && text.trim())) && text.trim()) {
              e.preventDefault();
              add([text]);
            } else if (e.key === "Backspace" && !text && list.length) {
              e.preventDefault();
              edit(list[list.length - 1]);
            }
          }}
          onBlur={() => text.trim() && add([text])}
          className="h-8 min-w-[5rem] flex-1 bg-transparent px-1 text-[14px] text-ink outline-none placeholder:text-mute"
        />
      </div>
      {name && list.filter(isEmailAddress).map((e) => <input key={e} type="hidden" name={name} value={e} />)}
      <p id={`${id}-status`} aria-live="polite" className="mt-2 flex h-5 items-center gap-1.5 overflow-hidden pl-1 text-[12px] text-mute">
        <span key={status} className={cx("flex items-center gap-1.5", bad.length > 0 && "text-ink")} style={{ animation: `aui048-line .4s ${EASE} both` }}>
          {bad.length > 0 && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <circle cx="8" cy="8" r="6.25" />
              <path d="M8 4.8v3.6M8 11h.01" />
            </svg>
          )}
          {status}
        </span>
      </p>
    </div>
  );
}

export default EmailTagInput;
