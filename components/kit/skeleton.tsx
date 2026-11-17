"use client";

import type { CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const SHIMMER = `
@keyframes kit-shimmer { from { background-position: 150% 0 } to { background-position: -50% 0 } }
@media (prefers-reduced-motion: reduce) { .kit-skel { animation: none !important } }
`;

export interface SkeletonProps {
  /** `line` (text), `circle` (avatar) or `block` (image, card). */
  shape?: "line" | "circle" | "block";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  className?: string;
}

/** A placeholder with a soft light sweeping across it. Hidden from screen readers. */
export function Skeleton({ shape = "line", width, height, className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cx(
        "kit-skel block",
        shape === "line" && "h-3 rounded-full",
        shape === "circle" && "aspect-square shrink-0 self-start rounded-full",
        shape === "block" && "rounded-[10px]",
        className,
      )}
      style={{
        width,
        height: height ?? (shape === "circle" ? width : undefined),
        backgroundColor: "color-mix(in srgb, var(--color-ink) 7%, transparent)",
        backgroundImage: "linear-gradient(100deg, transparent 30%, color-mix(in srgb, var(--color-paper) 70%, transparent) 50%, transparent 70%)",
        backgroundSize: "250% 100%",
        animation: "kit-shimmer 1.6s cubic-bezier(.4,0,.2,1) infinite",
      }}
    >
      <style href="asta-skeleton" precedence="asta">{SHIMMER}</style>
    </span>
  );
}

/** Several lines of text; the last one is shorter, like a real paragraph. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span className={cx("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "62%" : "100%"} />
      ))}
    </span>
  );
}

/** A ready-made card placeholder: image, avatar, title and two lines. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cx("flex w-full flex-col gap-4 rounded-xl bg-paper p-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]", className)}>
      <Skeleton shape="block" className="aspect-[16/9] w-full" />
      <div className="flex items-center gap-3 px-1">
        <Skeleton shape="circle" width={36} />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton width="55%" />
          <Skeleton width="35%" className="!h-2.5" />
        </div>
      </div>
      <SkeletonText lines={2} className="px-1 pb-1" />
    </div>
  );
}

export default Skeleton;
