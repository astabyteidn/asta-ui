import Link from "next/link";
import Toc from "@/components/ui-site/Toc";

/** Shared frame for guide pages: title, body, a prev/next pair and an "On this page" column. */
export default function DocPage({
  title,
  lead,
  toc,
  next,
  children,
}: {
  title: string;
  lead: string;
  toc: { id: string; title: string }[];
  next?: { href: string; title: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-12">
      <article className="min-w-0 max-w-3xl flex-1 pb-10 pt-6 lg:pt-8">
        <p className="text-[13px] text-mute">Get started</p>
        <h1 className="display ui-rise mt-6 text-[clamp(2.4rem,5vw,4.2rem)]">{title}</h1>
        <p className="ui-rise mt-4 text-[clamp(1.05rem,1.4vw,1.2rem)] leading-snug text-ink-2" style={{ animationDelay: "80ms" }}>
          {lead}
        </p>
        <div className="doc-body mt-12">{children}</div>
        {next && (
          <Link href={next.href} className="group mt-20 flex flex-col items-end rounded-[10px] bg-paper-2 p-5 text-right surface-hover">
            <span className="flex items-center gap-2 text-[13px] text-mute">
              Next <span className="btn-arrow" />
            </span>
            <span className="display mt-3 text-[clamp(1.4rem,2.4vw,2rem)] transition-colors group-hover:text-accent">{next.title}</span>
          </Link>
        )}
      </article>
      <aside className="sticky top-0 hidden h-svh w-56 shrink-0 pt-8 xl:block">
        <Toc items={toc} />
      </aside>
    </div>
  );
}
