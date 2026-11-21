"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface InlineEditProps {
  value?: string;
  defaultValue?: string;
  /** Called with the new text. Return a promise to show a saving state. If it rejects, editing stays open. */
  onSave?: (value: string) => void | Promise<void>;
  /** Called when an edit is dropped with Esc. */
  onCancel?: () => void;
  /** Shown when the value is empty. */
  placeholder?: string;
  /** Accessible name, e.g. "Project name". */
  label: string;
  /** Empty text can't be saved. Esc or blur puts the old text back. */
  required?: boolean;
  maxLength?: number;
  /** Save when focus leaves the field. Off means blur cancels. */
  saveOnBlur?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const KEYFRAMES = `@keyframes asta-inline-edit-tick { 0% { opacity: 0; transform: scale(.6) } 18% { opacity: 1; transform: scale(1) } 80% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1) } }`;

const TEXT = { sm: "text-[16px] sm:text-[13px]", md: "text-[16px] sm:text-[14.5px]", lg: "text-[20px] font-medium tracking-[-0.02em]" };

/**
 * Text that turns into a field when you click it or press Enter. Enter saves, Esc puts the old text back,
 * and a small tick fades in beside the text once it's saved. Async saves keep the field open until they land.
 */
export function InlineEdit({ value, defaultValue = "", onSave, onCancel, placeholder = "Empty", label, required, maxLength, saveOnBlur = true, size = "md", disabled, className }: InlineEditProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(current);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(0);
  const failId = useId();

  const input = useRef<HTMLInputElement>(null);
  const display = useRef<HTMLButtonElement>(null);
  // Enter saves, then the field unmounts and fires blur. This keeps that second close from running.
  const closing = useRef(false);
  const refocus = useRef(false);
  const alive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    } else if (refocus.current) {
      refocus.current = false;
      display.current?.focus();
    }
  }, [editing]);

  const open = () => {
    if (disabled || editing) return;
    closing.current = false;
    setDraft(current);
    setFailed(false);
    setEditing(true);
  };

  const close = (keepFocus: boolean) => {
    refocus.current = keepFocus;
    setEditing(false);
    setSaving(false);
  };

  const cancel = (keepFocus: boolean) => {
    if (closing.current || saving) return;
    closing.current = true;
    close(keepFocus);
    onCancel?.();
  };

  const save = async (keepFocus: boolean) => {
    if (closing.current || saving) return;
    const next = draft.trim();
    // Nothing changed: just close. Empty but required: drop the edit and keep the old text.
    if (next === current.trim()) {
      closing.current = true;
      close(keepFocus);
      return;
    }
    if (required && !next) {
      cancel(keepFocus);
      return;
    }
    closing.current = true;
    try {
      const pending = onSave?.(next);
      if (pending) {
        setSaving(true);
        await pending;
      }
    } catch {
      if (!alive.current) return;
      closing.current = false;
      setSaving(false);
      setFailed(true);
      requestAnimationFrame(() => input.current?.focus());
      return;
    }
    if (!alive.current) return;
    if (value === undefined) setInner(next);
    close(keepFocus);
    setSaved((n) => n + 1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => alive.current && setSaved(0), 1700);
  };

  const box = "-mx-2 rounded-[7px] px-2 py-1";

  return (
    <span className={cx("relative inline-flex max-w-full items-center gap-1.5", TEXT[size], className)}>
      <style href="asta-inline-edit" precedence="asta">{KEYFRAMES}</style>
      {editing ? (
        <span className="inline-grid min-w-[6ch] max-w-full">
          {/* An invisible copy sizes the field to its text, so the row doesn't jump between modes. */}
          <span aria-hidden className={cx("invisible col-start-1 row-start-1 whitespace-pre", box)}>
            {(draft || placeholder) + " "}
          </span>
          <input
            ref={input}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (failed) setFailed(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void save(true);
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                cancel(true);
              }
            }}
            onBlur={() => (saveOnBlur ? void save(false) : cancel(false))}
            aria-label={label}
            aria-invalid={failed || undefined}
            aria-describedby={failed ? failId : undefined}
            autoComplete="off"
            aria-busy={saving || undefined}
            readOnly={saving}
            maxLength={maxLength}
            placeholder={placeholder}
            className={cx(
              "col-start-1 row-start-1 w-full min-w-0 bg-paper text-ink outline-none transition-[box-shadow,opacity] duration-200 placeholder:text-mute",
              "shadow-[inset_0_0_0_1.5px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
              saving && "opacity-60",
              box,
            )}
          />
        </span>
      ) : (
        <button
          ref={display}
          type="button"
          onClick={open}
          disabled={disabled}
          aria-label={`${label}: ${current || placeholder}. Edit`}
          className={cx(
            "group/ie inline-flex min-w-0 max-w-full items-center gap-2 text-left outline-none transition-colors duration-200 hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none",
            current ? "text-ink" : "text-mute",
            box,
          )}
        >
          <span className="truncate">{current || placeholder}</span>
          <svg
            viewBox="0 0 16 16"
            className="h-[0.85em] w-[0.85em] shrink-0 text-mute opacity-0 transition-[opacity,translate] duration-200 ease-[cubic-bezier(.16,1,.3,1)] -translate-x-0.5 group-hover/ie:translate-x-0 group-hover/ie:opacity-100 group-focus-visible/ie:translate-x-0 group-focus-visible/ie:opacity-100 motion-reduce:transition-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" />
          </svg>
        </button>
      )}
      {saved > 0 && !editing && (
        <svg
          key={saved}
          viewBox="0 0 16 16"
          className="h-[0.9em] w-[0.9em] shrink-0 text-brand animate-[asta-inline-edit-tick_1.7s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      )}
      <span role="status" className="sr-only">
        {saved > 0 ? "Saved" : failed ? "Couldn't save. Try again or press Escape." : ""}
      </span>
      {failed && editing && (
        <span id={failId} className="shrink-0 text-[12px] text-mute">
          Couldn&apos;t save. Press Enter to retry.
        </span>
      )}
    </span>
  );
}

export default InlineEdit;
