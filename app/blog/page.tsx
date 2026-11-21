import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/icons/Icon";
import { formatDate, POSTS, readingTime } from "@/lib/blog";
import { DESIGN_URL } from "@/lib/design";

const TITLE = "Blog";
const DESCRIPTION = "Practical interface design tips from building the Astabyte UI kit and motion lab. Short posts with numbers you can use.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", siteName: "Astabyte UI", url: "/blog", title: `${TITLE} — Astabyte UI`, description: DESCRIPTION },
};

/** Blog index: newest first, one row per post. */
export default function Blog() {
  return (
    <div className="px-shell pt-10 sm:pt-16">
      <p className="label ui-enter text-accent">Blog · {POSTS.length} posts</p>
      <h1 className="display ui-enter mt-4 max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] [--i:1]">Notes on interface design.</h1>
      <p className="ui-enter mt-6 max-w-xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-normal text-ink-2 [--i:2]">
        What we learned building the kit and the motion lab. Short posts, with numbers you can put straight into your own UI.
      </p>

      <ul className="ui-enter mt-14 flex max-w-[1080px] flex-col gap-2 [--i:3]">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group -mx-4 grid gap-2 rounded-[12px] px-4 py-5 transition-colors duration-300 hover:bg-paper-2 sm:-mx-5 sm:px-5 md:grid-cols-[11rem_1fr] md:gap-8"
            >
              <span className="label pt-1.5 text-mute">
                <time dateTime={p.date}>{formatDate(p.date)}</time> · {readingTime(p)} min
              </span>
              <span>
                <span className="display block text-[clamp(1.45rem,2.4vw,2rem)] leading-[1.05] transition-colors group-hover:text-accent">{p.title}</span>
                <span className="mt-2 block max-w-[60ch] text-[16px] leading-relaxed text-mute">{p.summary}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <a
        href={`${DESIGN_URL}&utm_campaign=blog-index`}
        className="icon-hover group mt-16 flex max-w-[1080px] flex-col gap-4 rounded-[14px] bg-paper-2 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <span>
          <span className="label text-accent">New · Design by Astabyte</span>
          <span className="mt-3 block text-[clamp(1.2rem,1.8vw,1.5rem)] font-medium tracking-[-0.02em]">Try a layout before you build it.</span>
          <span className="mt-1.5 block max-w-[52ch] text-[15px] leading-relaxed text-mute">
            A design editor in the browser. AI agents work on the same canvas as you, over MCP.
          </span>
        </span>
        <span className="btn btn-quiet btn-lg shrink-0 self-start sm:self-auto">
          Open Design <Icon name="arrow-up-right" className="h-4 w-4" />
        </span>
      </a>
    </div>
  );
}
