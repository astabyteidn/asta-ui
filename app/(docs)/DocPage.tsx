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
      <article className="min-w-0 max-w-[680px] flex-1 pb-10 pt-6 lg:pt-8">
        <p className="ui-enter text-[14px] text-mute">Get started</p>
        <h1 className="doc-h1 ui-enter mt-3 [--i:1]">{title}</h1>
        <p className="doc-lead ui-enter mt-4 [--i:2]">
          {lead}
        </p>
        <div className="doc-body ui-enter mt-8 border-t border-line pt-8 [--i:3]">{children}</div>
        {next && (
          <Link href={next.href} className="group mt-16 flex flex-col items-end rounded-[10px] bg-paper-2 p-5 text-right surface-hover">
            <span className="flex items-center gap-2 text-[14px] text-mute">
              Next <span className="btn-arrow" />
            </span>
            <span className="mt-2 text-[18px] font-medium tracking-[-0.015em] transition-colors group-hover:text-accent">{next.title}</span>
          </Link>
        )}
      </article>
      <aside className="sticky top-14 ml-auto hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 pt-8 xl:block">
        <Toc items={toc} />
      </aside>
    </div>
  );
}
