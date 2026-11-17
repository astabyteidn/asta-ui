"use client";

import type { HTMLAttributes, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type BadgeVariant = "solid" | "soft" | "outline";
export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

// One colour per tone; the variants mix it into fill, text and ring.
const TONE: Record<BadgeTone, string> = {
  neutral: "var(--color-ink)",
  accent: "var(--color-accent)",
  success: "#30a46c",
  warning: "#f5a524",
  danger: "#e5484d",
};

const VARIANT: Record<BadgeVariant, string> = {
  solid: "bg-[var(--kit-badge)] text-[var(--kit-badge-on)]",
  soft: "bg-[color-mix(in_srgb,var(--kit-badge)_12%,transparent)] text-[color-mix(in_srgb,var(--kit-badge)_80%,var(--color-ink))]",
  outline:
    "text-[color-mix(in_srgb,var(--kit-badge)_80%,var(--color-ink))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--kit-badge)_35%,transparent)]",
};

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: BadgeVariant;
  tone?: BadgeTone;
  /** A small dot before the label. */
  dot?: boolean;
  /** The dot breathes, for live states ("Online", "Deploying"). */
  pulse?: boolean;
  /** Shows a remove button and calls this when it's pressed. */
  onRemove?: () => void;
  size?: "sm" | "md";
  children?: ReactNode;
}

export function Badge({ variant = "soft", tone = "neutral", dot, pulse, onRemove, size = "md", className, style, children, ...rest }: BadgeProps) {
  const on = tone === "neutral" ? "var(--color-paper)" : tone === "warning" ? "#1a1300" : "#fff";
  return (
    <span
      {...rest}
      style={{ ["--kit-badge" as string]: TONE[tone], ["--kit-badge-on" as string]: on, ...style }}
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md font-medium tracking-[-0.005em]",
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-[12px]",
        onRemove && (size === "sm" ? "pr-0.5" : "pr-1"),
        VARIANT[variant],
        className,
      )}
    >
      {(dot || pulse) && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && <span className="absolute inset-0 animate-[kit-badge-ping_1.6s_cubic-bezier(.16,1,.3,1)_infinite] rounded-full bg-current motion-reduce:hidden" />}
          <span className={cx("relative h-1.5 w-1.5 rounded-full", variant === "solid" ? "bg-current" : "bg-[var(--kit-badge)]")} />
        </span>
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={typeof children === "string" ? `Remove ${children}` : "Remove"}
          className={cx(
            "inline-flex items-center justify-center rounded-full opacity-60 outline-none transition-[opacity,background-color] hover:bg-[color-mix(in_srgb,currentColor_15%,transparent)] hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent/50",
            size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]",
          )}
        >
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
      <style>{`@keyframes kit-badge-ping { 0% { transform: scale(1); opacity: .7 } 100% { transform: scale(3); opacity: 0 } }`}</style>
    </span>
  );
}

/** A count bubble for icons and tabs. Caps at `max` ("99+"). */
export function CountBadge({ count, max = 99, className }: { count: number; max?: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      key={count}
      className={cx(
        "inline-flex h-[18px] min-w-[18px] animate-[kit-badge-pop_.4s_cubic-bezier(.16,1,.3,1)] items-center justify-center rounded-[5px] bg-[#e5484d] px-1 text-[10.5px] font-semibold tabular-nums leading-none text-white shadow-[0_0_0_2px_var(--color-paper)] motion-reduce:animate-none",
        className,
      )}
    >
      {count > max ? `${max}+` : count}
      <style>{`@keyframes kit-badge-pop { 0% { transform: scale(.4) } 60% { transform: scale(1.15) } 100% { transform: scale(1) } }`}</style>
    </span>
  );
}

export default Badge;
