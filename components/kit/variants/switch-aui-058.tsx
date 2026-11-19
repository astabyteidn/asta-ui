"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui058-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui058-spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .aui058 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui058-rise .6s ${EASE} ${80 + i * 55}ms both` });

export interface SettingItem {
  id: string;
  label: string;
  description?: string;
  /** Locked settings show a note instead of saving. */
  locked?: string;
}

const SETTINGS: SettingItem[] = [
  { id: "mentions", label: "Mentions and replies", description: "When someone tags you or answers a thread" },
  { id: "digest", label: "Weekly digest", description: "A Monday summary of what moved" },
  { id: "product", label: "Product news", description: "New features, about once a month" },
  { id: "security", label: "Security alerts", description: "New sign-ins and password changes", locked: "Always on" },
];

type Status = "idle" | "saving" | "saved";

export interface SettingSwitchProps {
  settings?: SettingItem[];
  value?: Record<string, boolean>;
  defaultValue?: Record<string, boolean>;
  onChange?: (value: Record<string, boolean>) => void;
  /** Persist one change. Resolve when saved. Defaults to a short fake delay. */
  onSave?: (id: string, on: boolean) => Promise<void>;
  eyebrow?: string;
  title?: string;
  className?: string;
}

const fakeSave = () => new Promise<void>((r) => setTimeout(r, 650));

/**
 * aui-058 · A settings card where every switch saves itself. Signature: a small spinner turns into a tick that
 * draws in and reads Saved next to the row, then fades away.
 */
export function SettingSwitch({
  settings = SETTINGS,
  value,
  defaultValue = { mentions: true, digest: false, product: false, security: true },
  onChange,
  onSave = fakeSave,
  eyebrow = "Astabyte · Settings",
  title = "Email notifications",
  className,
}: SettingSwitchProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const state = value ?? inner;
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [announce, setAnnounce] = useState("");
  const alive = useRef(true);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const runs = useRef(new Map<string, number>());

  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    return () => {
      alive.current = false;
      t.forEach(clearTimeout);
    };
  }, []);

  const flip = async (s: SettingItem) => {
    if (s.locked) return;
    const on = !state[s.id];
    const next = { ...state, [s.id]: on };
    if (value === undefined) setInner(next);
    onChange?.(next);
    const run = (runs.current.get(s.id) ?? 0) + 1;
    runs.current.set(s.id, run);
    clearTimeout(timers.current.get(s.id));
    setStatus((st) => ({ ...st, [s.id]: "saving" }));
    try {
      await onSave(s.id, on);
    } catch {
      /* A real app would show the error. Here the row just settles. */
    }
    if (!alive.current || runs.current.get(s.id) !== run) return;
    setStatus((st) => ({ ...st, [s.id]: "saved" }));
    setAnnounce(`${s.label} ${on ? "on" : "off"}. Saved.`);
    timers.current.set(
      s.id,
      setTimeout(() => alive.current && setStatus((st) => ({ ...st, [s.id]: "idle" })), 1800),
    );
  };

  return (
    <section
      aria-labelledby={`${uid}-t`}
      className={cx(
        "aui058 w-full max-w-[460px] rounded-[14px] bg-paper p-5 sm:p-6",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-aui058" precedence="asta">
        {CSS}
      </style>
      <div style={rise(0)}>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">{eyebrow}</p>
        <h3 id={`${uid}-t`} className="mt-1.5 text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink">
          {title}
        </h3>
        <p className="mt-1 text-[13px] text-mute">Changes save as you go.</p>
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <ul className="mt-4 -mx-2">
        {settings.map((s, i) => {
          const on = !!state[s.id];
          const st = status[s.id] ?? "idle";
          const id = `${uid}-${s.id}`;
          return (
            <li key={s.id} style={rise(i + 1)} className="group/set relative flex items-center gap-4 rounded-[10px] px-2 py-3">
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[10px] bg-paper-2 opacity-0 transition-opacity duration-300 group-hover/set:opacity-60" />
              <span className="relative min-w-0 flex-1">
                <label htmlFor={id} className={cx("block text-[14px] font-medium tracking-[-0.01em] text-ink", !s.locked && "cursor-pointer")}>
                  {s.label}
                </label>
                {s.description && (
                  <span id={`${id}-d`} className="mt-0.5 block text-[12.5px] leading-snug text-mute">
                    {s.description}
                  </span>
                )}
              </span>
              <span className="relative flex shrink-0 items-center gap-3">
                {s.locked ? <span className="text-[11.5px] text-mute">{s.locked}</span> : <SaveState status={st} />}
                <button
                  id={id}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-describedby={s.description ? `${id}-d` : undefined}
                  disabled={!!s.locked}
                  onClick={() => flip(s)}
                  className="group/sw relative h-[22px] w-[38px] shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_14%,var(--color-paper))] shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)]" />
                  <span aria-hidden className="absolute inset-0 rounded-full bg-brand shadow-[inset_0_1px_2px_rgb(0_0_0/0.15)] transition-opacity duration-300" style={{ opacity: on ? 1 : 0 }} />
                  <span aria-hidden className="absolute left-[2px] top-[2px] block h-[18px] w-[18px] transition-transform duration-[450ms]" style={{ transform: `translateX(${on ? 16 : 0}px)`, transitionTimingFunction: SPRING }}>
                    <span className={cx("block h-full w-full rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2),0_2px_6px_-1px_rgb(0_0_0/0.18)] transition-transform duration-200 group-active/sw:scale-x-[1.18]", on ? "origin-right" : "origin-left")} />
                  </span>
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Saving spinner → drawn tick + "Saved", then it fades out. Fixed width so nothing shifts. */
function SaveState({ status }: { status: Status }) {
  const saving = status === "saving";
  const saved = status === "saved";
  return (
    <span aria-hidden className="relative block h-5 w-[58px]">
      <span className="absolute inset-0 flex items-center justify-end transition-[transform,opacity] duration-300" style={{ opacity: saving ? 1 : 0, transform: saving ? "none" : "translateY(-4px)", transitionTimingFunction: EASE }}>
        <span className="h-3 w-3 rounded-full border-[1.5px] border-[color-mix(in_srgb,var(--color-ink)_25%,transparent)] border-t-ink" style={{ animation: saving ? "aui058-spin .7s linear infinite" : "none" }} />
      </span>
      <span className="absolute inset-0 flex items-center justify-end gap-1 text-[12px] font-medium text-brand transition-[transform,opacity] duration-500" style={{ opacity: saved ? 1 : 0, transform: saved ? "none" : "translateY(4px)", transitionTimingFunction: EASE }}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 8.5l3 3 6-7" pathLength={1} strokeDasharray="1" className="transition-[stroke-dashoffset]" style={{ strokeDashoffset: saved ? 0 : 1, transitionDuration: saved ? "420ms" : "0ms", transitionDelay: saved ? "80ms" : "0ms", transitionTimingFunction: EASE }} />
        </svg>
        Saved
      </span>
    </span>
  );
}

export default SettingSwitch;
