"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/kit/button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]";
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

export interface Settings {
  name: string;
  email: string;
  notify: { product: boolean; mentions: boolean; digest: boolean };
  theme: "light" | "dark" | "system";
  language: string;
}

/* ---------- small private pieces ---------- */

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[14px] text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[12.5px] leading-snug text-mute">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "group relative h-6 w-10 shrink-0 rounded-full outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          checked ? "bg-brand" : "bg-[color-mix(in_srgb,var(--color-ink)_16%,transparent)]",
        )}
      >
        <span
          className={cx(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-[transform,width] duration-300 group-active:w-6",
            EASE,
            checked ? "translate-x-4 group-active:translate-x-3" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

const THEMES: { value: Settings["theme"]; label: string; swatch: string }[] = [
  { value: "light", label: "Light", swatch: "bg-[#fcfcfb]" },
  { value: "dark", label: "Dark", swatch: "bg-[#151516]" },
  { value: "system", label: "System", swatch: "bg-[linear-gradient(135deg,#fcfcfb_50%,#151516_50%)]" },
];

function ThemePicker({ value, onChange }: { value: Settings["theme"]; onChange: (v: Settings["theme"]) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (d: number) => {
    const i = (THEMES.findIndex((t) => t.value === value) + d + THEMES.length) % THEMES.length;
    onChange(THEMES[i].value);
    refs.current[i]?.focus();
  };
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
      {THEMES.map((t, i) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") move(1);
              else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(-1);
              else return;
              e.preventDefault();
            }}
            className={cx(
              "flex flex-col items-start gap-2 rounded-[10px] p-2 text-left outline-none transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-brand/50",
              on ? "shadow-[inset_0_0_0_2px_var(--color-brand)]" : `${RING} hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_26%,transparent)]`,
            )}
          >
            <span className={cx("h-10 w-full rounded-lg shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]", t.swatch)} />
            <span className="flex w-full items-center justify-between px-0.5 text-[13px] text-ink">
              {t.label}
              <span className={cx("h-3.5 w-3.5 rounded-full transition-all duration-300", on ? "bg-brand shadow-[inset_0_0_0_3.5px_var(--color-brand),inset_0_0_0_6px_white]" : RING)} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-5 first:pt-0">
      <h4 className="mb-3 text-[12px] font-medium uppercase tracking-[0.06em] text-mute">{title}</h4>
      {children}
    </section>
  );
}

const inputCls = cx("h-10 w-full rounded-lg bg-paper px-3 text-[14px] text-ink outline-none transition-shadow placeholder:text-mute focus-visible:ring-2 focus-visible:ring-brand/50", RING);

/* ---------- the panel ---------- */

export interface SettingsPanelHandle {
  /** Returns false (and nudges the save bar) when there are unsaved changes. */
  requestLeave: () => boolean;
}

export interface SettingsPanelProps {
  initial: Settings;
  /** Persist the settings; the bar shows a spinner until it resolves. */
  onSave?: (s: Settings) => Promise<void>;
  languages?: string[];
  className?: string;
}

/**
 * A settings form whose save bar slides up as soon as anything differs from the saved values. Reset puts
 * everything back; Save shows progress, then "Saved", then the bar slides away. `requestLeave()` (via ref)
 * shakes the bar when there are unsaved changes.
 */
export const SettingsPanel = forwardRef<SettingsPanelHandle, SettingsPanelProps>(function SettingsPanel(
  { initial, onSave, languages = ["English", "Bahasa Indonesia", "Deutsch", "日本語"], className },
  ref,
) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const bar = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const emailId = useId();
  const langId = useId();

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const showBar = dirty || status !== "idle";
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const nudge = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    bar.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
      { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" },
    );
  };
  useImperativeHandle(ref, () => ({
    requestLeave: () => {
      if (dirtyRef.current) nudge();
      return !dirtyRef.current;
    },
  }));

  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 1400);
    return () => clearTimeout(t);
  }, [status]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    if (status === "saved") setStatus("idle");
  };

  const save = async () => {
    setStatus("saving");
    await (onSave?.(draft) ?? new Promise((r) => setTimeout(r, 900)));
    setSaved(draft);
    setStatus("saved");
  };

  return (
    <div
      className={cx(
        "relative w-full max-w-[520px] overflow-hidden rounded-xl bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_18px_40px_-24px_rgb(0_0_0/0.3)]",
        className,
      )}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) save();
        }}
      >
        <div className="max-h-[440px] overflow-y-auto px-5 pb-24 pt-5 sm:px-6 [&>section+section]:shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-ink)_7%,transparent)]">
          <Section title="Profile">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={nameId} className="text-[13px] font-medium text-ink">
                  Display name
                </label>
                <input id={nameId} value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputCls} autoComplete="name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={emailId} className="text-[13px] font-medium text-ink">
                  Email
                </label>
                <input id={emailId} type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} className={inputCls} autoComplete="email" />
              </div>
            </div>
          </Section>
          <Section title="Notifications">
            <Toggle label="Product updates" hint="New features, once a month." checked={draft.notify.product} onChange={(v) => set("notify", { ...draft.notify, product: v })} />
            <Toggle label="Mentions" hint="When someone tags you in a comment." checked={draft.notify.mentions} onChange={(v) => set("notify", { ...draft.notify, mentions: v })} />
            <Toggle label="Weekly digest" checked={draft.notify.digest} onChange={(v) => set("notify", { ...draft.notify, digest: v })} />
          </Section>
          <Section title="Appearance">
            <ThemePicker value={draft.theme} onChange={(v) => set("theme", v)} />
            <div className="mt-4 flex items-center justify-between gap-4">
              <label htmlFor={langId} className="text-[14px] text-ink">
                Language
              </label>
              <div className="relative">
                <select
                  id={langId}
                  value={draft.language}
                  onChange={(e) => set("language", e.target.value)}
                  className={cx(inputCls, "w-auto cursor-pointer appearance-none pr-9")}
                >
                  {languages.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <svg viewBox="0 0 16 16" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                  <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
                </svg>
              </div>
            </div>
          </Section>
        </div>

        {/* Save bar: slides up while there are changes. */}
        <div
          className={cx(
            "pointer-events-none absolute inset-x-3 bottom-3 transition-[transform,opacity] duration-500",
            EASE,
            showBar ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+16px)] opacity-0",
          )}
          aria-hidden={!showBar}
        >
          <div
            ref={bar}
            role="region"
            aria-label="Unsaved changes"
            className="pointer-events-auto flex items-center gap-2 rounded-[10px] bg-ink py-2 pl-4 pr-2 text-paper shadow-[0_12px_30px_-10px_rgb(0_0_0/0.5)]"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px]" aria-live="polite">
              {status === "saved" ? (
                <>
                  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#30a46c]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                  Saved
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="truncate">Unsaved changes</span>
                </>
              )}
            </span>
            {status !== "saved" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  tabIndex={showBar ? 0 : -1}
                  disabled={status === "saving"}
                  onClick={() => setDraft(saved)}
                  className="text-paper/70 hover:bg-paper/10 hover:text-paper"
                >
                  Reset
                </Button>
                <Button type="submit" variant="accent" size="sm" tabIndex={showBar ? 0 : -1} loading={status === "saving"}>
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
});

export default SettingsPanel;
