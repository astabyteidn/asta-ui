"use client";

import { useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-file-star { 0% { transform: scale(.6) } 55% { transform: scale(1.25) } 100% { transform: scale(1) } }
@media (prefers-reduced-motion: reduce) { .asta-file-star { animation: none !important } }`;

export interface FileCardProps {
  title: string;
  /** A short line under the title, e.g. "Edited 2 h ago". */
  meta?: ReactNode;
  /** An image URL, or any node (a rendered preview, an illustration). */
  thumbnail?: string | ReactNode;
  /** Small icon in front of the title that says what kind of file it is. */
  icon?: ReactNode;
  /** Makes the card a link. Use `onOpen` instead for client-side routing. */
  href?: string;
  onOpen?: () => void;
  starred?: boolean;
  defaultStarred?: boolean;
  /** Shows the star button. Omit it to hide starring. */
  onStarChange?: (starred: boolean) => void;
  /** A menu or buttons shown on the right of the footer (grid) or the row (list), e.g. a dropdown trigger. */
  actions?: ReactNode;
  /** Grid card or a compact list row. */
  view?: "grid" | "list";
  selected?: boolean;
  className?: string;
}

function Star({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cx("h-4 w-4", on && "asta-file-star animate-[asta-file-star_.42s_cubic-bezier(.16,1,.3,1)]")} fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" aria-hidden>
      <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
    </svg>
  );
}

function Thumb({ thumbnail, title }: { thumbnail: FileCardProps["thumbnail"]; title: string }) {
  if (typeof thumbnail === "string")
    return (
      <img src={thumbnail} alt="" width={640} height={400} loading="lazy" decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover/file:scale-[1.03]"
      />
    );
  if (thumbnail) return <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover/file:scale-[1.03]">{thumbnail}</div>;
  return <span className="absolute inset-0 grid place-items-center text-[28px] font-semibold tracking-[-0.04em] text-mute">{title.slice(0, 1).toUpperCase()}</span>;
}

/**
 * A file in a file browser: a big thumbnail with the name, a kind icon and when it was last edited. The preview
 * zooms a little on hover, the star pops when you star it, and the same data renders as a compact list row.
 */
export function FileCard({ title, meta, thumbnail, icon, href, onOpen, starred, defaultStarred = false, onStarChange, actions, view = "grid", selected, className }: FileCardProps) {
  const [innerStar, setInnerStar] = useState(defaultStarred);
  const on = starred ?? innerStar;
  const toggle = () => {
    if (starred === undefined) setInnerStar(!on);
    onStarChange?.(!on);
  };

  // One link covers the card. Buttons sit above it so they stay clickable and focusable on their own.
  const open = href ? (
    <a href={href} className="absolute inset-0 z-[1] rounded-[inherit] outline-none" aria-label={`Open ${title}`} />
  ) : onOpen ? (
    <button type="button" onClick={onOpen} className="absolute inset-0 z-[1] cursor-pointer rounded-[inherit] outline-none" aria-label={`Open ${title}`} />
  ) : null;

  const star = onStarChange && (
    <button
      type="button"
      aria-label={on ? `Unstar ${title}` : `Star ${title}`}
      aria-pressed={on}
      onClick={toggle}
      className={cx(
        "relative z-[2] grid h-7 w-7 cursor-pointer place-items-center rounded-[7px] outline-none transition-[opacity,color,background-color] duration-150",
        "focus-visible:opacity-100 focus-visible:shadow-[0_0_0_2px_var(--color-brand)]",
        on ? "text-brand opacity-100" : "text-ink-2 opacity-0 hover:text-ink group-hover/file:opacity-100",
        view === "grid" && "bg-paper shadow-[0_1px_3px_rgb(0_0_0/0.12)]",
      )}
    >
      <Star on={on} />
    </button>
  );

  const ring = selected
    ? "shadow-[inset_0_0_0_2px_var(--color-brand)]"
    : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent)] has-[:focus-visible]:shadow-[inset_0_0_0_2px_var(--color-brand)]";

  const style = <style href="asta-file-card" precedence="asta">{KEYFRAMES}</style>;

  if (view === "list")
    return (
      <div className={cx("group/file relative flex h-14 items-center gap-3 rounded-[10px] px-2 transition-[box-shadow,background-color] duration-150 hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]", selected && "bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)]", className)}>
        {style}
        {open}
        <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-[6px] bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
          <Thumb thumbnail={thumbnail} title={title} />
        </span>
        {icon && <span className="h-4 w-4 shrink-0 text-mute [&>svg]:h-full [&>svg]:w-full">{icon}</span>}
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{title}</span>
        {meta && <span className="hidden shrink-0 text-[12.5px] text-mute sm:block">{meta}</span>}
        <span className="relative z-[2] flex shrink-0 items-center gap-1">
          {star}
          {actions}
        </span>
      </div>
    );

  return (
    <div className={cx("group/file relative overflow-hidden rounded-[12px] bg-paper transition-shadow duration-150", ring, className)}>
      {style}
      {open}
      <div className="relative aspect-[16/10] overflow-hidden bg-paper-2">
        <Thumb thumbnail={thumbnail} title={title} />
        {star && <span className="absolute right-2.5 top-2.5 z-[2]">{star}</span>}
      </div>
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        {icon && <span className="h-4 w-4 shrink-0 text-mute [&>svg]:h-full [&>svg]:w-full">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-ink">{title}</span>
          {meta && <span className="mt-0.5 block truncate text-[12px] text-mute">{meta}</span>}
        </span>
        {actions && <span className="relative z-[2] shrink-0">{actions}</span>}
      </div>
    </div>
  );
}
