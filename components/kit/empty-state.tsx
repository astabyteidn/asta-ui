"use client";

import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/kit/button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

export type EmptyStateVariant = "no-data" | "no-results" | "error";
export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
}
export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  /** Overrides the variant's default title. */
  title?: ReactNode;
  description?: ReactNode;
  /** For "no-results": the search, shown in the default title. */
  query?: string;
  primary?: EmptyStateAction;
  secondary?: EmptyStateAction;
  /** Your own drawing instead of the built-in one. */
  illustration?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/* ---------- drawings ---------- */

type Stroke = { d: string; accent?: boolean };

// Each drawing is a few strokes on a 120 × 88 grid. Accent strokes use the brand blue.
const ART: Record<EmptyStateVariant, Stroke[]> = {
  "no-data": [
    { d: "M30 44 60 30l30 14-30 14Z" },
    { d: "M30 44v22l30 14 30-14V44" },
    { d: "M60 58v22" },
    { d: "M30 44l-9 10 30 14 9-10" },
    { d: "M90 44l9 10-30 14-9-10" },
    { d: "M60 8v10M55 13h10", accent: true },
  ],
  "no-results": [
    { d: "M26 14h40a4 4 0 0 1 4 4v46a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4Z" },
    { d: "M31 28h28M31 38h20M31 48h24" },
    { d: "M94 56a14 14 0 1 1-28 0 14 14 0 1 1 28 0Z", accent: true },
    { d: "M90 66l10 10", accent: true },
  ],
  error: [
    { d: "M6 52h26" },
    { d: "M32 42h12v20H32Z" },
    { d: "M44 47h8M44 57h8" },
    { d: "M72 40h12v24H72Z" },
    { d: "M84 52h30" },
    { d: "M66 47h6M66 57h6" },
    { d: "M59 33v6M59 65v6", accent: true },
  ],
};

function Drawing({ variant, size }: { variant: EmptyStateVariant; size: "sm" | "md" }) {
  return (
    <div className={cx("relative flex items-center justify-center", size === "sm" ? "h-20 w-28" : "h-28 w-40")} aria-hidden>
      <span className="kit-es-disc absolute h-[78%] w-[66%] rounded-full bg-paper-2" />
      <svg viewBox="0 0 120 88" className="relative h-full w-full overflow-visible" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {ART[variant].map((s, i) => (
          <path
            key={i}
            d={s.d}
            pathLength={1}
            className="kit-es-draw"
            stroke={s.accent ? "var(--color-brand)" : "color-mix(in srgb, var(--color-ink) 34%, transparent)"}
            style={{ "--d": `${120 + i * 90}ms` } as CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}

/* ---------- copy ---------- */

const COPY: Record<EmptyStateVariant, { title: (q?: string) => string; description: string }> = {
  "no-data": { title: () => "Nothing here yet", description: "Create your first item and it will show up here." },
  "no-results": { title: (q) => (q ? `No results for “${q}”` : "No results"), description: "Try a shorter search or check the spelling." },
  error: { title: () => "This didn’t load", description: "Something went wrong on our side. Try again in a moment." },
};

const enter = (ms: number): CSSProperties => ({ animation: `kit-es-in .6s ${CURVE} ${ms}ms both` });

/**
 * What a list shows when it has nothing to show. A small line drawing draws itself in, then the title,
 * the text and up to two actions rise in. Three variants: no data yet, no search results and a neutral
 * error. Re-mount it (change its `key`) to play it again.
 */
export function EmptyState({ variant = "no-data", title, description, query, primary, secondary, illustration, size = "md", className }: EmptyStateProps) {
  const copy = COPY[variant];
  const sm = size === "sm";
  const action = (a: EmptyStateAction, kind: "primary" | "secondary") => {
    const look = { variant: kind === "primary" ? ("solid" as const) : ("ghost" as const), size: sm ? ("xs" as const) : ("sm" as const), iconLeft: a.icon };
    return a.href ? (
      <Button {...look} href={a.href} onClick={a.onClick}>
        {a.label}
      </Button>
    ) : (
      <Button {...look} onClick={a.onClick}>
        {a.label}
      </Button>
    );
  };

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cx("kit-es flex flex-col items-center text-center", sm ? "px-4 py-8" : "px-6 py-12", className)}
    >
      <style href="asta-empty-state" precedence="asta">{`
        .kit-es-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: kit-es-draw 1s ${CURVE} var(--d, 0ms) forwards; }
        .kit-es-disc { animation: kit-es-disc .8s ${CURVE} both; }
        @keyframes kit-es-draw { to { stroke-dashoffset: 0; } }
        @keyframes kit-es-disc { from { opacity: 0; transform: scale(.85); } }
        @keyframes kit-es-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
          .kit-es, .kit-es * { animation: none !important; }
          .kit-es-draw { stroke-dashoffset: 0; }
        }
      `}</style>

      {illustration ?? <Drawing variant={variant} size={size} />}

      <h3 className={cx("font-medium tracking-[-0.02em] text-ink", sm ? "mt-3 text-[14.5px]" : "mt-5 text-[17px]")} style={enter(380)}>
        {title ?? copy.title(query)}
      </h3>
      <p className={cx("max-w-[34ch] leading-relaxed text-mute", sm ? "mt-1 text-[12.5px]" : "mt-1.5 text-[13.5px]")} style={enter(460)}>
        {description ?? copy.description}
      </p>
      {(primary || secondary) && (
        <div className={cx("flex flex-wrap items-center justify-center gap-2", sm ? "mt-4" : "mt-6")} style={enter(540)}>
          {primary && action(primary, "primary")}
          {secondary && action(secondary, "secondary")}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
