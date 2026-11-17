"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type ButtonVariant = "solid" | "accent" | "outline" | "soft" | "ghost" | "link" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const BASE =
  "group/btn relative inline-flex shrink-0 select-none items-center [&_svg]:shrink-0 justify-center whitespace-nowrap font-medium tracking-[-0.01em] outline-none " +
  "transition-[background-color,color,box-shadow,transform,opacity] duration-200 ease-out active:scale-[0.97] " +
  "focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper " +
  "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

// A light top edge and a soft drop give the filled buttons a little body without a gradient.
const LIFT = "shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.16),0_6px_14px_-8px_rgb(0_0_0/0.45)]";

const VARIANT: Record<ButtonVariant, string> = {
  solid: `bg-ink text-paper ${LIFT} hover:bg-[color-mix(in_srgb,var(--color-ink)_84%,var(--color-paper))]`,
  accent: `bg-accent text-white ${LIFT} hover:bg-[color-mix(in_srgb,var(--color-accent)_88%,black)]`,
  danger: `bg-[#e5484d] text-white ${LIFT} hover:bg-[#d13d42]`,
  outline:
    "bg-paper text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent),0_1px_2px_rgb(0_0_0/0.05)] " +
    "hover:bg-paper-2 hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent),0_1px_2px_rgb(0_0_0/0.05)]",
  soft: "bg-paper-2 text-ink hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,var(--color-paper-2))]",
  ghost: "text-ink-2 hover:bg-paper-2 hover:text-ink",
  // Underline grows from the left on hover.
  link:
    "!h-auto !px-0 text-ink bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat " +
    "transition-[background-size,color] duration-300 hover:bg-[length:100%_1px] active:scale-100",
};

const SIZE: Record<ButtonSize, string> = {
  xs: "h-7 gap-1.5 rounded-md px-2.5 text-[12px]",
  sm: "h-8 gap-1.5 rounded-md px-3 text-[13px]",
  md: "h-10 gap-2 rounded-lg px-4 text-[14px]",
  lg: "h-12 gap-2.5 rounded-[9px] px-5 text-[15px]",
};
const ICON_ONLY: Record<ButtonSize, string> = { xs: "w-7 !px-0", sm: "w-8 !px-0", md: "w-10 !px-0", lg: "w-12 !px-0" };

interface Own {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `pill` rounds fully; `rounded` (default) keeps soft corners. */
  shape?: "rounded" | "pill";
  /** Shows a spinner over the label and keeps the button's width. */
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Slide the trailing icon a little on hover. */
  nudge?: boolean;
  /** A square button holding only an icon (give it an `aria-label`). */
  iconOnly?: boolean;
  /** A keyboard hint at the end, e.g. "⌘K". */
  kbd?: string;
  className?: string;
  children?: ReactNode;
}

export type ButtonProps = Own &
  ((Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Own> & { href?: undefined }) | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Own> & { href: string }));

export function buttonClass({ variant = "solid", size = "md", shape = "rounded", iconOnly = false }: Pick<Own, "variant" | "size" | "shape" | "iconOnly"> = {}) {
  return cx(BASE, SIZE[size], VARIANT[variant], iconOnly && ICON_ONLY[size], shape === "pill" && "!rounded-full");
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cx("h-4 w-4 animate-spin", className)} fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Renders an `<a>` when `href` is given, otherwise a `<button type="button">`. */
export function Button(props: ButtonProps) {
  const { variant = "solid", size = "md", shape, loading, iconLeft, iconRight, nudge, iconOnly, kbd, className, children, ...rest } = props;
  const filled = variant === "solid" || variant === "accent" || variant === "danger";
  const content = (
    <>
      <span className={cx("inline-flex items-center gap-[inherit] transition-opacity duration-200 [&>svg]:h-[1.15em] [&>svg]:w-[1.15em]", loading && "opacity-0")}>
        {iconLeft && <span className="-ml-0.5 inline-flex shrink-0 [&_svg]:h-[1.1em] [&_svg]:w-[1.1em]">{iconLeft}</span>}
        {children}
        {iconRight && (
          <span
            className={cx(
              "-mr-0.5 inline-flex shrink-0 [&_svg]:h-[1.1em] [&_svg]:w-[1.1em]",
              nudge && "transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover/btn:translate-x-0.5",
            )}
          >
            {iconRight}
          </span>
        )}
        {kbd && (
          <kbd
            className={cx(
              "-mr-1.5 ml-1 rounded-md px-1.5 font-sans text-[0.8em] leading-[1.6]",
              filled ? "bg-white/15 text-current" : "bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] text-mute",
            )}
          >
            {kbd}
          </kbd>
        )}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </>
  );
  const cls = cx(buttonClass({ variant, size, shape, iconOnly }), className);

  if (rest.href !== undefined) {
    const a = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a {...a} className={cls} aria-disabled={loading || undefined} aria-busy={loading || undefined}>
        {content}
      </a>
    );
  }
  const b = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" {...b} className={cls} disabled={b.disabled || loading} aria-busy={loading || undefined}>
      {content}
    </button>
  );
}

export default Button;
