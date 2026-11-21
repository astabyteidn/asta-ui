import Link from "next/link";

/** Inline Markdown: **bold**, `code` and [links](href). Links that start with "/" stay on this site. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g);
  return (
    <>
      {parts.map((s, i) => {
        if (s.startsWith("**") && s.endsWith("**")) return <strong key={i}>{s.slice(2, -2)}</strong>;
        if (s.startsWith("`") && s.endsWith("`") && s.length > 1) return <code key={i}>{s.slice(1, -1)}</code>;
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(s);
        if (link) {
          const [, label, href] = link;
          return href.startsWith("/") ? (
            <Link key={i} href={href}>
              {label}
            </Link>
          ) : (
            <a key={i} href={href}>
              {label}
            </a>
          );
        }
        return s;
      })}
    </>
  );
}
