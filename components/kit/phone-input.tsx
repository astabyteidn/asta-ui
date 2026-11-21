"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-phone-in { from { opacity: 0; transform: translateY(-4px) scale(.98) } }
@keyframes asta-phone-ok { from { opacity: 0; transform: scale(.4) } }
@media (prefers-reduced-motion: reduce) { .asta-phone-a { animation: none !important } }`;

export interface PhoneCountry {
  /** ISO 3166 code, e.g. "ID". */
  code: string;
  name: string;
  /** Calling code without the plus, e.g. "62". */
  dial: string;
  /** National format, one # per digit, e.g. "###-####-####". */
  mask: string;
}

/** A starter list. Pass your own `countries` for more. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "US", name: "United States", dial: "1", mask: "(###) ###-####" },
  { code: "ID", name: "Indonesia", dial: "62", mask: "###-####-####" },
  { code: "GB", name: "United Kingdom", dial: "44", mask: "#### ######" },
  { code: "DE", name: "Germany", dial: "49", mask: "### ########" },
  { code: "FR", name: "France", dial: "33", mask: "# ## ## ## ##" },
  { code: "NL", name: "Netherlands", dial: "31", mask: "# ########" },
  { code: "SG", name: "Singapore", dial: "65", mask: "#### ####" },
  { code: "MY", name: "Malaysia", dial: "60", mask: "##-### ####" },
  { code: "JP", name: "Japan", dial: "81", mask: "##-####-####" },
  { code: "AU", name: "Australia", dial: "61", mask: "### ### ###" },
  { code: "IN", name: "India", dial: "91", mask: "#####-#####" },
  { code: "BR", name: "Brazil", dial: "55", mask: "(##) #####-####" },
  { code: "CA", name: "Canada", dial: "1", mask: "(###) ###-####" },
  { code: "AE", name: "United Arab Emirates", dial: "971", mask: "## ### ####" },
];

const slots = (mask: string) => mask.split("").filter((c) => c === "#").length;

/** Fits digits into a mask. Stops at the last digit, so a half-typed number has no trailing separators. */
export function formatPhone(digits: string, mask: string) {
  let out = "";
  let i = 0;
  for (const c of mask) {
    if (i >= digits.length) break;
    if (c === "#") out += digits[i++];
    else out += c;
  }
  return out + digits.slice(i);
}

export interface PhoneValue {
  /** E.164, e.g. "+6281234567890". Empty when there are no digits. */
  e164: string;
  country: PhoneCountry;
  /** Every slot of the mask is filled. */
  valid: boolean;
}

export interface PhoneInputProps {
  countries?: PhoneCountry[];
  /** ISO code of the starting country. */
  defaultCountry?: string;
  /** Starting national digits. */
  defaultValue?: string;
  onChange?: (value: PhoneValue) => void;
  label?: string;
  hint?: string;
  /** An error from outside, e.g. on submit. It replaces the hint. Without it, an unfinished number shows an error on blur. */
  error?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A phone number field with a country picker. The number formats itself as you type and the caret stays put.
 * Paste a full number with its +code and the country switches to match. A check pops in once the number is
 * complete. The picker filters as you type and works with the arrow keys.
 */
export function PhoneInput({
  countries = PHONE_COUNTRIES,
  defaultCountry = "US",
  defaultValue = "",
  onChange,
  label = "Phone number",
  hint,
  error,
  name = "phone",
  disabled,
  className,
}: PhoneInputProps) {
  const id = useId();
  const [country, setCountry] = useState(() => countries.find((c) => c.code === defaultCountry) ?? countries[0]);
  const [digits, setDigits] = useState(() => defaultValue.replace(/\D/g, "").slice(0, slots(country.mask)));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  // Set on blur when the number is unfinished, cleared as soon as it is complete (or empty) again.
  const [short, setShort] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const caret = useRef<number | null>(null);
  const listId = `${id}-list`;

  const max = slots(country.mask);
  const valid = digits.length === max;
  const shown = formatPhone(digits, country.mask);
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  const results = q ? countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || c.dial.startsWith(q)) : countries;

  const emit = (d: string, c: PhoneCountry) => {
    if (short && (!d || d.length === slots(c.mask))) setShort(false);
    onChange?.({ e164: d ? `+${c.dial}${d}` : "", country: c, valid: d.length === slots(c.mask) });
  };
  const message = error || (short ? `Enter all ${max} digits, like ${country.mask.replace(/#/g, "0")}.` : "");
  const describedBy = message ? `${id}-err` : hint ? `${id}-hint` : undefined;

  // Put the caret back after the same number of digits it followed before formatting.
  useLayoutEffect(() => {
    const el = input.current;
    if (!el || caret.current === null) return;
    let seen = 0;
    let pos = 0;
    while (pos < shown.length && seen < caret.current) {
      if (/\d/.test(shown[pos])) seen++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
    caret.current = null;
  }, [shown]);

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const down = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // A pasted international number: pick the country from the longest matching calling code.
    if (raw.trim().startsWith("+")) {
      const all = raw.replace(/\D/g, "");
      const match = [...countries].sort((a, b) => b.dial.length - a.dial.length).find((c) => all.startsWith(c.dial));
      if (match) {
        const d = all.slice(match.dial.length).slice(0, slots(match.mask));
        setCountry(match);
        setDigits(d);
        caret.current = d.length;
        emit(d, match);
        return;
      }
    }
    const before = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, "").length;
    const d = raw.replace(/\D/g, "").slice(0, max);
    caret.current = Math.min(before, d.length);
    setDigits(d);
    emit(d, country);
  };

  const pick = (c: PhoneCountry) => {
    const d = digits.slice(0, slots(c.mask));
    setCountry(c);
    setDigits(d);
    setOpen(false);
    setQuery("");
    emit(d, c);
    input.current?.focus();
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = results.length;
      if (n) setHi((h) => (h + (e.key === "ArrowDown" ? 1 : -1) + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[hi]) pick(results[hi]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      input.current?.focus();
    }
  };

  // Keep the highlighted country in view.
  useEffect(() => {
    if (open) document.getElementById(`${id}-opt-${hi}`)?.scrollIntoView({ block: "nearest" });
  }, [hi, open, id]);

  return (
    <div ref={wrap} className={cx("relative flex w-full flex-col gap-1.5", className)}>
      <style href="asta-phone-input" precedence="asta">{KEYFRAMES}</style>
      <label htmlFor={`${id}-num`} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <div className="relative">
      <div
        className={cx(
          "flex h-10 items-center rounded-lg bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-shadow duration-200",
          message && "!shadow-[inset_0_0_0_1.5px_var(--color-ink)]",
          "focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country: ${country.name} +${country.dial}`}
          onClick={() => {
            setHi(Math.max(0, countries.indexOf(country)));
            setOpen((o) => !o);
          }}
          className="flex h-full shrink-0 items-center gap-1.5 rounded-l-lg pl-3 pr-2 text-[13.5px] text-ink outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2"
        >
          <span className="rounded-[4px] bg-paper-2 px-1 font-mono text-[10.5px] font-medium leading-[18px] text-ink-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">{country.code}</span>
          <span className="tabular-nums text-ink-2">+{country.dial}</span>
          <svg viewBox="0 0 16 16" className={cx("h-3 w-3 text-mute transition-transform duration-200", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m4 6 4 4 4-4" />
          </svg>
        </button>
        <span aria-hidden className="h-5 w-px bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]" />
        <input
          ref={input}
          id={`${id}-num`}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          name={name}
          value={shown}
          onChange={onInput}
          onBlur={() => setShort(digits.length > 0 && !valid)}
          disabled={disabled}
          placeholder={country.mask.replace(/#/g, "0")}
          aria-invalid={!!message || undefined}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] sm:text-[14px] tabular-nums text-ink outline-none placeholder:text-mute"
        />
        <span className="flex w-9 shrink-0 justify-center text-brand">
          {valid && (
            <svg viewBox="0 0 16 16" className="asta-phone-a h-4 w-4 animate-[asta-phone-ok_.35s_cubic-bezier(.16,1,.3,1)_both]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Complete number">
              <path d="m3.5 8.5 3 3 6-7" />
            </svg>
          )}
        </span>
      </div>
      {open && (
        <div className="asta-phone-a absolute left-0 top-full z-50 mt-1.5 flex w-full max-w-[320px] origin-top-left animate-[asta-phone-in_.18s_cubic-bezier(.16,1,.3,1)_both] flex-col rounded-[11px] bg-paper p-1 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_14px_34px_-12px_rgb(0_0_0/0.28)]">
          <input
            ref={search}
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHi(0);
            }}
            onKeyDown={onListKey}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[hi] ? `${id}-opt-${hi}` : undefined}
            aria-label="Search countries"
            placeholder="Search country or code…"
            className="mb-1 h-9 w-full rounded-[7px] bg-paper-2 px-2.5 text-[16px] sm:text-[13px] text-ink outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
          />
          <div id={listId} role="listbox" aria-label="Countries" className="max-h-[220px] overflow-y-auto overscroll-contain">
            {results.length === 0 && <p className="px-2.5 py-3 text-[12.5px] text-mute">No country matches “{query}”</p>}
            {results.map((c, i) => (
              <div
                key={c.code}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={c.code === country.code}
                onPointerMove={() => hi !== i && setHi(i)}
                onClick={() => pick(c)}
                className={cx("flex h-8 cursor-default items-center gap-2.5 rounded-[7px] px-2 text-[13px]", hi === i ? "bg-paper-2 text-ink" : "text-ink-2")}
              >
                <span className="w-6 font-mono text-[10.5px] text-mute">{c.code}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="tabular-nums text-mute">+{c.dial}</span>
                {c.code === country.code && (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m3.5 8.5 3 3 6-7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      {message ? (
        <p id={`${id}-err`} role="alert" className="flex items-start gap-1.5 text-[12px] text-ink-2">
          <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5M8 11h0" />
          </svg>
          {message}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[12px] text-mute">
            {hint}
          </p>
        )
      )}
      {name && <input type="hidden" name={`${name}_e164`} value={digits ? `+${country.dial}${digits}` : ""} />}

    </div>
  );
}

export default PhoneInput;
