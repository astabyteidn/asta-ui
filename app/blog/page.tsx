import type { Metadata } from "next";
import BlogGrid, { type BlogCard, type BlogTab } from "@/components/blog/BlogGrid";
import { thumbOf } from "@/components/blog/Thumb";
import Icon from "@/components/icons/Icon";
import { GROUPS, POSTS, postId, readingTime } from "@/lib/blog";
import { DESIGN_URL } from "@/lib/design";

const TITLE = "Motion and web techniques, with live demos";
const DESCRIPTION =
  "Learn easing, timing, springs, FLIP, scroll-driven animation, View Transitions, @starting-style, container queries and :has(). Every post has live demos and code to copy.";
const DEMOS = POSTS.reduce((n, p) => n + Object.keys(p.demos ?? {}).length, 0);

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", siteName: "Astabyte UI", url: "/blog", title: `${TITLE} — Astabyte UI`, description: DESCRIPTION },
};

const SHORT: Record<string, string> = { motion: "Motion", web: "Web", basics: "Basics" };

/** Blog index: laid out like a home section. Topic tabs, then cards in the kit and motion lab style. */
export default function Blog() {
  const tabs: BlogTab[] = [
    { id: "all", label: "All", lead: "A learning path. Start at B01 and go in order, or jump to a topic." },
    ...GROUPS.map((g) => ({ id: g.id, label: SHORT[g.id], lead: g.lead })),
  ];
  const cards: BlogCard[] = POSTS.map((p) => {
    const demos = Object.keys(p.demos ?? {}).length;
    return {
      slug: p.slug,
      group: p.group,
      id: postId(p),
      title: p.title,
      summary: p.summary,
      meta: [SHORT[p.group], `${readingTime(p)} min`, demos ? `${demos} demos` : ""].filter(Boolean).join(" · "),
      ...thumbOf(p),
    };
  });

  return (
    <>
      <section className="px-shell pb-4 pt-12 sm:pt-20" aria-labelledby="blog-title">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label text-accent">
              § Blog · {POSTS.length} posts · {DEMOS} live demos
            </p>
            <h1 id="blog-title" className="display mt-3 text-[clamp(2rem,4.4vw,3.6rem)]">
              Motion and web techniques
            </h1>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-mute sm:text-right">
            Every post has live demos you can replay and tweak, and the code that runs them.
          </p>
        </div>
        <BlogGrid cards={cards} tabs={tabs} />
      </section>

      <section className="px-shell mt-24" aria-label="Design by Astabyte">
        <a
          href={`${DESIGN_URL}&utm_campaign=blog-index`}
          className="icon-hover group flex flex-col gap-6 rounded-2xl bg-paper-2 px-6 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-12"
        >
          <span>
            <span className="label text-accent">New · Design by Astabyte</span>
            <span className="display mt-4 block text-[clamp(1.8rem,3.4vw,2.8rem)]">Try a layout before you build it.</span>
            <span className="mt-3 block max-w-[52ch] text-[16px] leading-relaxed text-ink-2">
              A design editor in the browser. AI agents work on the same canvas as you, over MCP.
            </span>
          </span>
          <span className="btn btn-primary btn-lg shrink-0 self-start sm:self-auto">
            Open Design <Icon name="arrow-up-right" className="h-4 w-4" />
          </span>
        </a>
      </section>
    </>
  );
}
