import Link from "next/link";
import { parse } from "@/lib/blog";

/** Inline Markdown: **bold**, `code` and [links](href). Links that start with "/" stay on this site. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g);
  return (
    <>
      {parts.map((s, i) => {
        if (s.startsWith("**") && s.endsWith("**")) return <strong key={i}>{s.slice(2, -2)}</strong>;
        if (s.startsWith("`") && s.endsWith("`")) return <code key={i}>{s.slice(1, -1)}</code>;
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

/** A post body as `.doc-body` blocks, so posts read like the guide pages. */
export default function Prose({ body }: { body: string }) {
  return (
    <>
      {parse(body).map((b, i) => {
        if (b.t === "h2")
          return (
            <h2 key={i} id={b.id}>
              {b.text}
            </h2>
          );
        if (b.t === "p")
          return (
            <p key={i}>
              <Inline text={b.text} />
            </p>
          );
        const Tag = b.t;
        return (
          <Tag key={i}>
            {b.items.map((it, j) => (
              <li key={j}>
                <Inline text={it} />
              </li>
            ))}
          </Tag>
        );
      })}
    </>
  );
}
