import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Prose, { Inline } from "@/components/blog/Prose";
import Icon from "@/components/icons/Icon";
import Toc from "@/components/ui-site/Toc";
import { formatDate, getPost, POSTS, readingTime, tocOf } from "@/lib/blog";

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

/** One post: a centred column about 72 characters wide, "On this page" on wide screens. */
export default async function BlogPost({ params }: Props) {
  const p = getPost((await params).slug);
  if (!p) notFound();
  const at = POSTS.indexOf(p);
  const next = POSTS[(at + 1) % POSTS.length];
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
    <div className="px-shell grid gap-x-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)_minmax(0,1fr)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="hidden xl:block">
        <Link href="/blog" className="sticky top-14 inline-flex items-center gap-2 pt-10 text-[14px] text-mute transition-colors hover:text-ink">
          <Icon name="arrow-left" className="h-4 w-4" /> All posts
        </Link>
      </div>

      <article className="mx-auto w-full min-w-0 max-w-[600px] pb-10 pt-6 sm:pt-10">
        <Link href="/blog" className="ui-enter inline-flex items-center gap-2 text-[14px] text-mute transition-colors hover:text-ink xl:hidden">
          <Icon name="arrow-left" className="h-4 w-4" /> Blog
        </Link>
        <p className="label ui-enter mt-6 text-mute [--i:1] xl:mt-0">
          <time dateTime={p.date}>{formatDate(p.date)}</time> · {readingTime(p)} min read
        </p>
        <h1 className="display ui-enter mt-5 text-[clamp(2.2rem,4.4vw,3.25rem)] leading-[1] [--i:2]">{p.title}</h1>
        <p className="ui-enter mt-5 text-[clamp(1.1rem,1.4vw,1.25rem)] leading-normal text-ink-2 [--i:3]">{p.summary}</p>

        <div className="doc-body blog-body ui-enter mt-10 [--i:4]">
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
          <Prose body={p.body} />
        </div>

        <Link href={`/blog/${next.slug}`} className="group mt-20 flex flex-col items-end rounded-[10px] bg-paper-2 p-5 text-right surface-hover">
          <span className="flex items-center gap-2 text-[14px] text-mute">
            Next post <span className="btn-arrow" />
          </span>
          <span className="display mt-3 text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.05] transition-colors group-hover:text-accent">{next.title}</span>
        </Link>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-14 ml-auto w-56 pt-10">
          <Toc items={tocOf(p)} />
        </div>
      </aside>
    </div>
  );
}
