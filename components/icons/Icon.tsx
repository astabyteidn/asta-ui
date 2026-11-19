import { CORE_ICONS, type CoreIconName } from "./core";

/** One core Astabyte icon (the full set renders on /icons through IconGrid). Sized by font-size (1em) unless you pass a class, coloured by currentColor.
 * Put `icon-hover` on any parent and the icon plays its own small motion on hover (see globals.css). */
export default function Icon({ name, className = "h-[1em] w-[1em]", strokeWidth = 1.75, label }: { name: CoreIconName; className?: string; strokeWidth?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-icon={name}
      className={`shrink-0 ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: CORE_ICONS[name] }}
    />
  );
}
