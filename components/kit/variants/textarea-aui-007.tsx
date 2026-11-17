"use client";

import { useEffect, useId, useRef, useState, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface Rule {
  label: string;
  test: (value: string) => boolean;
}

export interface ValidatedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value" | "defaultValue"> {
  label: string;
  rules: Rule[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, valid: boolean) => void;
  /** Message shown once every rule passes. */
  success?: string;
}

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * aui-007 · Checks the text against a list of rules. It stays quiet while you type, shows what's missing when you
 * leave the field (with one small shake), and ticks rules off live after that.
 */
export function ValidatedTextarea({ label, rules, value: valueProp, defaultValue = "", onChange, success = "Looks good.", className, rows = 4, id, ...rest }: ValidatedTextareaProps) {
  const auto = useId();
  const fid = id ?? auto;
  const box = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [touched, setTouched] = useState(false);
  const results = rules.map((r) => r.test(value));
  const valid = results.every(Boolean);
  const state = !touched ? "idle" : valid ? "success" : "error";
  const prev = useRef(state);

  useEffect(() => {
    if (state === "error" && prev.current !== "error" && !reduced()) {
      box.current?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "translateX(0)" }], { duration: 360, easing: "cubic-bezier(.16,1,.3,1)" });
    }
    prev.current = state;
  }, [state]);

  const ring =
    state === "error"
      ? "shadow-[inset_0_0_0_1px_#e5484d] focus-within:shadow-[inset_0_0_0_1px_#e5484d,0_0_0_4px_rgb(229_72_77/0.14)]"
      : state === "success"
        ? "shadow-[inset_0_0_0_1px_#30a46c] focus-within:shadow-[inset_0_0_0_1px_#30a46c,0_0_0_4px_rgb(48_164_108/0.14)]"
        : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]";

  return (
    <div className={cx("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={fid} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <div ref={box} className={cx("rounded-xl bg-paper transition-shadow duration-300 motion-reduce:transition-none", ring)}>
        <textarea
          id={fid}
          rows={rows}
          {...rest}
          value={value}
          aria-invalid={state === "error" || undefined}
          aria-describedby={`${fid}-rules`}
          onChange={(e) => {
            const next = e.target.value;
            if (valueProp === undefined) setInner(next);
            onChange?.(next, rules.every((r) => r.test(next)));
          }}
          onBlur={(e) => {
            if (value) setTouched(true);
            rest.onBlur?.(e);
          }}
          className="block w-full resize-none bg-transparent px-3.5 py-3 text-[14px] leading-[1.55] text-ink outline-none placeholder:text-mute"
        />
      </div>

      <div className={cx("grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none", state === "idle" ? "grid-rows-[0fr]" : "grid-rows-[1fr]")}>
        <div className="overflow-hidden">
          <ul id={`${fid}-rules`} className="flex flex-col gap-1 pt-1" aria-live="polite">
            {state === "success" ? (
              <li className="flex items-center gap-2 text-[12.5px] text-[#30a46c]">
                <Check on /> {success}
              </li>
            ) : (
              rules.map((r, i) => (
                <li key={r.label} className={cx("flex items-center gap-2 text-[12.5px] transition-colors duration-300", results[i] ? "text-mute" : "text-[#e5484d]")}>
                  <Check on={results[i]} />
                  <span className={cx("transition-[text-decoration-color] duration-300", results[i] && "line-through decoration-mute/50")}>{r.label}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="8" r="6.2" className={cx("transition-opacity duration-300", on ? "opacity-0" : "opacity-100")} />
      <path d="m5 8.2 2 2 4-4.2" strokeDasharray="10" strokeDashoffset={on ? 0 : 10} className="transition-[stroke-dashoffset] duration-300 ease-[cubic-bezier(.16,1,.3,1)]" />
    </svg>
  );
}

export default ValidatedTextarea;
