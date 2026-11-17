"use client";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type SpinnerVariant = "ring" | "dots" | "bars" | "orbit";

const KEYFRAMES = `
@keyframes kit-spin { to { transform: rotate(360deg) } }
@keyframes kit-dot { 0%, 80%, 100% { transform: scale(.55); opacity: .35 } 40% { transform: scale(1); opacity: 1 } }
@keyframes kit-bar { 0%, 100% { transform: scaleY(.35) } 50% { transform: scaleY(1) } }
@keyframes kit-indet { 0% { left: -40%; width: 40% } 60% { width: 55% } 100% { left: 100%; width: 40% } }
@media (prefers-reduced-motion: reduce) { .kit-spinner * { animation-duration: 2.4s !important } }
`;

/** Loaders in currentColor, sized by font-size (1em) unless you pass a class. */
export function Spinner({ variant = "ring", label = "Loading", className }: { variant?: SpinnerVariant; label?: string; className?: string }) {
  return (
    <span role="status" aria-label={label} className={cx("kit-spinner relative inline-flex h-[1em] w-[1em] shrink-0 items-center justify-center", className)}>
      <style>{KEYFRAMES}</style>
      {variant === "ring" && (
        <svg viewBox="0 0 24 24" className="h-full w-full animate-[kit-spin_.8s_linear_infinite]" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity=".18" strokeWidth="2.5" />
          <path d="M21.5 12A9.5 9.5 0 0 0 12 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      {variant === "dots" && (
        <span className="flex h-full w-full items-center justify-between" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[26%] w-[26%] rounded-full bg-current" style={{ animation: `kit-dot 1.1s ${i * 0.16}s cubic-bezier(.16,1,.3,1) infinite` }} />
          ))}
        </span>
      )}
      {variant === "bars" && (
        <span className="flex h-[80%] w-full items-center justify-between" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-full w-[16%] rounded-full bg-current" style={{ animation: `kit-bar .9s ${i * 0.12}s ease-in-out infinite` }} />
          ))}
        </span>
      )}
      {variant === "orbit" && (
        <span className="relative h-full w-full" aria-hidden>
          <span className="absolute inset-[30%] rounded-full bg-current opacity-25" />
          <span className="absolute inset-0 animate-[kit-spin_1.2s_cubic-bezier(.6,.1,.4,.9)_infinite]">
            <span className="absolute left-1/2 top-0 h-[24%] w-[24%] -translate-x-1/2 rounded-full bg-current" />
          </span>
          <span className="absolute inset-0 animate-[kit-spin_1.8s_linear_infinite_reverse]">
            <span className="absolute bottom-[6%] left-1/2 h-[16%] w-[16%] -translate-x-1/2 rounded-full bg-current opacity-60" />
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * A progress bar. Pass `value` (0–100) for determinate progress; leave it out for an indeterminate
 * sweep.
 */
export function Progress({ value, label, showValue, className }: { value?: number; label?: string; showValue?: boolean; className?: string }) {
  const v = value === undefined ? undefined : Math.max(0, Math.min(100, value));
  return (
    <div className={cx("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <span className="text-ink-2">{label}</span>
          {showValue && v !== undefined && <span className="tabular-nums text-mute">{Math.round(v)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        className="kit-spinner relative h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)]"
      >
        <style>{KEYFRAMES}</style>
        {v === undefined ? (
          <span className="absolute inset-y-0 rounded-full bg-accent" style={{ animation: "kit-indet 1.3s cubic-bezier(.65,0,.35,1) infinite" }} />
        ) : (
          <span className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-700 ease-[cubic-bezier(.16,1,.3,1)]" style={{ width: `${v}%` }} />
        )}
      </div>
    </div>
  );
}

export default Spinner;
