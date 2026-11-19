"use client";

import { useId, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui059-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui059-ring { 0% { transform: rotate(0) } 15% { transform: rotate(18deg) } 30% { transform: rotate(-14deg) } 45% { transform: rotate(10deg) } 60% { transform: rotate(-6deg) } 75% { transform: rotate(3deg) } 100% { transform: rotate(0) } }
@media (prefers-reduced-motion: reduce) { .aui059 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui059-rise .6s ${EASE} ${80 + i * 55}ms both` });

export interface IconSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (on: boolean) => void;
  title?: string;
  /** Line shown while on. */
  onText?: string;
  /** Line shown while off. */
  offText?: string;
  /** Devices that dim when paused. */
  devices?: string[];
  name?: string;
  className?: string;
}

/**
 * aui-059 · A dark do-not-disturb card. Signature: the thumb carries a bell that rings when you turn it on and
 * gets a slash drawn through it when you turn it off, while the preview swaps from a live alert to a held count.
 */
export function IconSwitch({
  checked,
  defaultChecked = true,
  onCheckedChange,
  title = "Notifications",
  onText = "Delivering to 3 devices",
  offText = "Paused until 9:00 AM",
  devices = ["MacBook", "iPhone", "Email"],
  name,
  className,
}: IconSwitchProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultChecked);
  const [rings, setRings] = useState(0);
  const on = checked ?? inner;
  const toggle = () => {
    const next = !on;
    if (checked === undefined) setInner(next);
    if (next) setRings((r) => r + 1);
    onCheckedChange?.(next);
  };

  return (
    <div className={cx("aui059 relative w-full max-w-[400px] overflow-hidden rounded-[14px] bg-ink p-5 text-paper shadow-[0_1px_2px_rgb(0_0_0/0.1),0_24px_48px_-24px_rgb(0_0_0/0.55)] sm:p-6", className)}>
      <style href="asta-aui059" precedence="asta">
        {CSS}
      </style>
      <span aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_50%,transparent),transparent)] transition-opacity duration-700" style={{ opacity: on ? 0.55 : 0 }} />

      <div className="relative flex items-center justify-between gap-4" style={rise(0)}>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/45">Astabyte · Focus</p>
          <label htmlFor={uid} className="mt-1.5 block cursor-pointer text-[20px] font-medium leading-tight tracking-[-0.02em]">
            {title}
          </label>
          <span id={`${uid}-d`} className="relative mt-1 block h-5 overflow-hidden text-[13px] text-paper/55">
            <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500" style={{ transform: `translateY(${on ? 0 : -20}px)`, transitionTimingFunction: EASE }}>
              <span className="block h-5 truncate leading-5" aria-hidden={!on}>
                {onText}
              </span>
              <span className="block h-5 truncate leading-5" aria-hidden={on}>
                {offText}
              </span>
            </span>
          </span>
        </div>

        <button
          id={uid}
          type="button"
          role="switch"
          aria-checked={on}
          aria-describedby={`${uid}-d`}
          name={name}
          value={on ? "on" : "off"}
          onClick={toggle}
          className="group/sw relative h-9 w-[64px] shrink-0 rounded-full outline-none transition-transform duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-brand)_70%,var(--color-paper))] focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <span aria-hidden className="absolute inset-0 rounded-full bg-paper/[0.12] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_10%,transparent)]" />
          <span aria-hidden className="absolute inset-0 rounded-full bg-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_0_18px_-2px_color-mix(in_srgb,var(--color-brand)_70%,transparent)] transition-opacity duration-300" style={{ opacity: on ? 1 : 0 }} />
          <span aria-hidden className="absolute left-[3px] top-[3px] grid h-[30px] w-[30px] place-items-center rounded-full bg-paper text-ink shadow-[0_1px_2px_rgb(0_0_0/0.3),0_4px_10px_-2px_rgb(0_0_0/0.35)] transition-transform duration-500" style={{ transform: `translateX(${on ? 28 : 0}px)`, transitionTimingFunction: SPRING }}>
            <svg viewBox="0 0 20 20" className="h-[15px] w-[15px] overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <g key={rings} style={{ transformOrigin: "10px 3px", animation: rings ? `aui059-ring .8s ${EASE} 120ms both` : undefined }}>
                <path d="M5 13.5V9a5 5 0 0110 0v4.5l1.5 1.5h-13z" className="transition-opacity duration-300" style={{ opacity: on ? 1 : 0.55 }} />
                <path d="M8.2 17a2 2 0 003.6 0" className="transition-opacity duration-300" style={{ opacity: on ? 1 : 0.55 }} />
              </g>
              {/* The slash draws in when notifications are off. */}
              <path d="M3 3l14 14" pathLength={1} strokeDasharray="1" className="transition-[stroke-dashoffset]" style={{ strokeDashoffset: on ? 1 : 0, transitionDuration: on ? "160ms" : "420ms", transitionDelay: on ? "0ms" : "140ms", transitionTimingFunction: EASE }} />
            </svg>
          </span>
        </button>
      </div>

      {/* Preview: a live alert while on, the held count while off. */}
      <div className="relative mt-5 h-[58px]" style={rise(1)}>
        <div className="absolute inset-0 flex items-center gap-3 rounded-[10px] bg-paper/[0.06] px-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_8%,transparent)] transition-[transform,opacity] duration-500" style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(-6px) scale(.98)", transitionTimingFunction: EASE }} aria-hidden={!on}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper/10 text-[11px] font-medium">RA</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px]">
              <span className="font-medium">Rina Arif</span> <span className="text-paper/55">commented on</span> Launch plan
            </span>
            <span className="block truncate text-[12px] text-paper/45">“Looks good, ship it after the copy pass.”</span>
          </span>
          <span className="shrink-0 text-[11px] text-paper/40">2m</span>
        </div>
        <div className="absolute inset-0 flex items-center gap-3 rounded-[10px] px-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_10%,transparent)] transition-[transform,opacity] duration-500" style={{ opacity: on ? 0 : 1, transform: on ? "translateY(6px) scale(.98)" : "none", transitionTimingFunction: EASE }} aria-hidden={on}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper/[0.06] text-[13px] font-medium tabular-nums">3</span>
          <span className="min-w-0 flex-1 text-[13px]">
            <span className="block">Holding 3 notifications</span>
            <span className="block text-[12px] text-paper/45">We’ll deliver them when focus ends.</span>
          </span>
        </div>
      </div>

      <ul className="relative mt-4 flex flex-wrap gap-1.5" aria-label="Devices" style={rise(2)}>
        {devices.map((d, i) => (
          <li key={d} className="flex h-7 items-center gap-1.5 rounded-[7px] bg-paper/[0.06] px-2.5 text-[12px] transition-opacity duration-500" style={{ opacity: on ? 1 : 0.4, transitionDelay: `${i * 60}ms` }}>
            <span aria-hidden className="relative h-1.5 w-1.5 rounded-full bg-paper/30">
              <span className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-brand)_60%,var(--color-paper))] transition-[transform,opacity] duration-500" style={{ opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(.3)", transitionDelay: `${i * 60}ms`, transitionTimingFunction: SPRING }} />
            </span>
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default IconSwitch;
