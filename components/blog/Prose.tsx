import CodeTabs from "@/components/ui-site/CodeTabs";
import { parse, type Post } from "@/lib/blog";
import { highlight } from "@/lib/ui-highlight";
import { DemoBlock, LiveBlock } from "./Demo";
import { Inline } from "./Inline";

export { Inline };

/** A post body as `.doc-body` blocks, so posts read like the guide pages. Demos and code are rendered in place. */
export default async function Prose({ post }: { post: Post }) {
  const blocks = parse(post.body);
  const code = await Promise.all(
    blocks.map(async (b) => {
      if (b.t !== "code") return null;
      const path = `example.${b.lang}`;
      return { name: b.lang, path, code: b.code, html: await highlight(b.code, path) };
    }),
  );
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === "h2" || b.t === "h3") {
          const H = b.t;
          return (
            <H key={i} id={b.id}>
              {b.text}
            </H>
          );
        }
        if (b.t === "p")
          return (
            <p key={i}>
              <Inline text={b.text} />
            </p>
          );
        if (b.t === "code")
          return (
            <div key={i} className="blog-code xl:-mx-16">
              <CodeTabs files={[code[i]!]} peek={300} />
            </div>
          );
        if (b.t === "demo") return <DemoBlock key={i} post={post} id={b.id} />;
        if (b.t === "live") return <LiveBlock key={i} slug={b.slug} />;
        if (b.t !== "ul" && b.t !== "ol") return null;
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
