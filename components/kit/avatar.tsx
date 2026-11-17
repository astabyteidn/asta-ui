"use client";

import { useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "away" | "busy" | "offline";

const SIZE: Record<AvatarSize, { box: string; text: string; dot: string }> = {
  xs: { box: "h-6 w-6", text: "text-[10px]", dot: "h-1.5 w-1.5" },
  sm: { box: "h-8 w-8", text: "text-[12px]", dot: "h-2 w-2" },
  md: { box: "h-10 w-10", text: "text-[14px]", dot: "h-2.5 w-2.5" },
  lg: { box: "h-12 w-12", text: "text-[16px]", dot: "h-3 w-3" },
  xl: { box: "h-16 w-16", text: "text-[20px]", dot: "h-3.5 w-3.5" },
};
const STATUS: Record<AvatarStatus, string> = { online: "#30a46c", away: "#f5a524", busy: "#e5484d", offline: "var(--color-mute)" };

// Fallback fills: the name picks one, so the same person always gets the same colour.
const FILLS = [
  "bg-ink text-paper",
  "bg-accent text-white",
  "bg-paper-2 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]",
  "bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-paper))] text-accent",
  "bg-[color-mix(in_srgb,var(--color-ink)_70%,var(--color-paper))] text-paper",
];

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

const fillFor = (name: string) => FILLS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % FILLS.length];

export interface AvatarProps {
  name: string;
  /** Image URL. Falls back to initials if missing or it fails to load. */
  src?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  /** `circle` (default) or a soft `square` for teams and workspaces. */
  shape?: "circle" | "square";
  className?: string;
}

export function Avatar({ name, src, size = "md", status, shape = "circle", className }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const s = SIZE[size];
  const round = shape === "circle" ? "rounded-full" : "rounded-[30%]";
  return (
    <span className={cx("relative inline-flex shrink-0", s.box, className)} role="img" aria-label={status ? `${name} (${status})` : name}>
      <span className={cx("flex h-full w-full select-none items-center justify-center overflow-hidden font-medium tracking-[-0.02em]", round, s.text, !src || broken ? fillFor(name) : "bg-paper-2")}>
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" onError={() => setBroken(true)} className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
      </span>
      {status && (
        <span
          aria-hidden
          className={cx("absolute bottom-0 right-0 rounded-full shadow-[0_0_0_2px_var(--color-paper)]", s.dot, shape === "square" && "-bottom-0.5 -right-0.5")}
          style={{ background: STATUS[status] }}
        />
      )}
    </span>
  );
}

/**
 * Overlapping avatars that fan out on hover. Anything past `max` collapses into a "+N" chip.
 */
export function AvatarGroup({ people, max = 4, size = "md", children }: { people: { name: string; src?: string }[]; max?: number; size?: AvatarSize; children?: ReactNode }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  const s = SIZE[size];
  return (
    <div className="group/av flex items-center" aria-label={`${people.length} people`}>
      {shown.map((p, i) => (
        <span
          key={p.name}
          title={p.name}
          className={cx(
            "relative rounded-full shadow-[0_0_0_2px_var(--color-paper)] transition-[margin,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:z-10 hover:-translate-y-1",
            i > 0 && "-ml-2.5 group-hover/av:ml-1",
          )}
        >
          <Avatar name={p.name} src={p.src} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className={cx(
            "relative -ml-2.5 inline-flex items-center justify-center rounded-full bg-paper-2 font-medium tabular-nums text-ink-2 shadow-[0_0_0_2px_var(--color-paper)] transition-[margin] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover/av:ml-1",
            s.box,
            s.text,
          )}
        >
          +{rest}
        </span>
      )}
      {children}
    </div>
  );
}

export default Avatar;
