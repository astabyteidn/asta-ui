import Link from "next/link";
import CodeTabs from "@/components/ui-site/CodeTabs";
import { Live } from "@/components/ui-site/Live";
import type { Post } from "@/lib/blog";
import { highlight } from "@/lib/ui-highlight";
import { uiItems } from "@/lib/ui-catalog";
import { DEMOS } from "./demos";
import DemoFrame from "./DemoFrame";
import { Inline } from "./Inline";

const fileOf = async (name: string, code: string) => ({ name, path: name, code, html: await highlight(code, name) });

/** `::demo <id>`: a live demo, the code that drives it and a caption. Code is highlighted at build time. */
export async function DemoBlock({ post, id }: { post: Post; id: string }) {
  const meta = post.demos?.[id];
  const C = DEMOS[post.slug]?.[id];
  if (!meta || !C) throw new Error(`blog: no demo "${id}" in ${post.slug}`);
  const files = await Promise.all(meta.code.map((f) => fileOf(f.name, f.code.trim())));
  return (
    <DemoFrame title={meta.title} height={meta.height} code={<CodeTabs files={files} peek={260} />} caption={<Inline text={meta.caption} />}>
      <C />
    </DemoFrame>
  );
}

/** `::live <slug>`: a real kit component or lab block from this site. */
export function LiveBlock({ slug }: { slug: string }) {
  const item = uiItems.find((i) => i.slug === slug);
  if (!item) throw new Error(`blog: no kit or lab item "${slug}"`);
  const lab = item.source === "lab";
  return (
    <DemoFrame
      title={`${lab ? "Motion lab" : "Kit"} · ${item.title}`}
      height={lab ? 420 : 300}
      tone={lab ? "dark" : "light"}
      slot={false}
      aside={
        <Link href={`/${slug}`} className="btn btn-quiet btn-sm">
          Open <span className="btn-arrow" />
        </Link>
      }
      caption={item.description}
    >
      <div className="grid h-full place-items-center" style={{ minHeight: lab ? 420 : 300 }}>
        <Live slug={slug} />
      </div>
    </DemoFrame>
  );
}
