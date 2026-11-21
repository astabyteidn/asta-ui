import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Prose, { Inline } from "@/components/blog/Prose";
import Icon from "@/components/icons/Icon";
import Toc from "@/components/ui-site/Toc";
import { formatDate, getPost, GROUPS, POSTS, postId, postsIn, readingTime, tocOf } from "@/lib/blog";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPost((await params).slug);
  if (!p) return {};
  const url = `/blog/${p.slug}`;
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: url },
    openGraph: { type: "article", siteName: "Astabyte UI", url, title: p.title, description: p.summary, publishedTime: p.date, authors: ["Astabyte"] },
    twitter: { card: "summary_large_image", title: p.title, description: p.summary },
  };
}

/** One post: a home-style section header, then a readable column with "On this page" and the group's path on the left. */
export default async function BlogPost({ params }: Props) {
  const p = getPost((await params).slug);
  if (!p) notFound();
  const at = POSTS.indexOf(p);
  const next = POSTS[(at + 1) % POSTS.length];
  const group = GROUPS.find((g) => g.id === p.group);
  const demos = Object.keys(p.demos ?? {}).length;
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.summary,
    datePublished: p.date,
    url: `https://ui.astabyte.com/blog/${p.slug}`,
    author: { "@type": "Organization", name: "Astabyte", url: "https://astabyte.com" },
  };

  return (
    <div className="px-shell pt-10 sm:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/blog" className="ui-enter inline-flex items-center gap-2 text-[14px] text-mute transition-colors hover:text-ink">
        <Icon name="arrow-left" className="h-4 w-4" /> All posts
      </Link>

      <header className="ui-enter mt-8 flex flex-col gap-5 [--i:1] lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="min-w-0">
          <p className="label text-accent">
            § {postId(p)} · {group?.title}
          </p>
          <h1 className="display mt-3 max-w-[20ch] text-balance text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.02]">
            {/* Keep code-like words such as @starting-style on one line instead of breaking at the hyphen. */}
            {p.title.split(" ").map((w, i) => (
              <span key={i}>
                {i > 0 && " "}
                {w.includes("-") ? <span className="whitespace-nowrap">{w}</span> : w}
              </span>
            ))}
          </h1>
        </div>
        <div className="shrink-0 lg:max-w-sm lg:text-right">
          <p className="text-[15px] leading-relaxed text-mute">{p.summary}</p>
          <p className="label mt-3 text-mute">
            <time dateTime={p.date}>{formatDate(p.date)}</time> · {readingTime(p)} min read{demos ? ` · ${demos} demos` : ""}
          </p>
        </div>
      </header>

      <div className="mt-12 grid gap-x-16 sm:mt-16 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-20 flex flex-col gap-10 pb-10">
            <Toc items={tocOf(p)} />
            {group && (
              <nav aria-label={group.title}>
                <p className="label mb-3 text-mute">{group.title}</p>
                <ol className="flex flex-col">
                  {postsIn(group.id).map((q) => (
                    <li key={q.slug}>
                      <Link
                        href={`/blog/${q.slug}`}
                        aria-current={q.slug === p.slug ? "page" : undefined}
                        className={`flex gap-3 rounded-[7px] py-1.5 text-[14px] leading-snug transition-colors ${q.slug === p.slug ? "text-ink" : "text-mute hover:text-ink"}`}
                      >
                        <span className={`w-[52px] shrink-0 font-mono text-[11px] leading-5 tabular-nums ${q.slug === p.slug ? "text-accent" : "text-mute/70"}`}>{postId(q)}</span>
                        <span>{q.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>
        </aside>

        <article className="ui-enter mx-auto w-full min-w-0 max-w-[680px] pb-10 [--i:2]">
          <div className="doc-body blog-body">
            <section id="tldr" aria-label="TL;DR" className="scroll-mt-28 rounded-[12px] bg-paper-2 p-5 sm:p-6">
              <span className="label block text-accent">TL;DR</span>
              <ul>
                {p.tldr.map((t) => (
                  <li key={t}>
                    <Inline text={t} />
                  </li>
                ))}
              </ul>
            </section>
            <Prose post={p} />
          </div>

          <Link href={`/blog/${next.slug}`} className="group mt-20 flex flex-col items-end rounded-xl bg-paper-2 p-5 text-right surface-hover sm:p-6">
            <span className="label flex items-center gap-2 text-mute">
              Next · {postId(next)} <span className="btn-arrow" />
            </span>
            <span className="display mt-3 text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.05] transition-colors group-hover:text-accent">{next.title}</span>
          </Link>
        </article>
      </div>
    </div>
  );
}
