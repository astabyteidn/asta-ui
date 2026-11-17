import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/logo";

/** The Astabyte mark as an inline SVG; takes the current text colour. */
export default function Mark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} aria-hidden>
      <path d={LOGO_PATH} fill="currentColor" />
    </svg>
  );
}
