import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CodeTabs from "@/components/ui-site/CodeTabs";
import InstallCommand from "@/components/ui-site/InstallCommand";
import { Live } from "@/components/ui-site/Live";
import PreviewTabs from "@/components/ui-site/PreviewTabs";
import Toc from "@/components/ui-site/Toc";
import { kitItems } from "@/lib/kit";
import { labBlocks } from "@/lib/lab";
import { uiItems } from "@/lib/ui-catalog";
import { highlight } from "@/lib/ui-highlight";
import { getDemo, getSource, getTheme } from "@/lib/ui-source";

// Sources are read and highlighted at build time, so every page is fully static.
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return uiItems.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = uiItems.find((x) => x.slug === slug);
  return b ? { title: b.title, description: b.description } : {};
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="break-words rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[12.5px] text-ink">{children}</code>
);

const TOC = [
  { id: "preview", title: "Preview" },
  { id: "installation", title: "Installation" },
  { id: "cli", title: "shadcn CLI", depth: 1 },
  { id: "manual", title: "Manual", depth: 1 },
  { id: "usage", title: "Usage" },
];

export default async function UiComponent({ params }: Props) {
  const { slug } = await params;
  const index = uiItems.findIndex((b) => b.slug === slug);
  const source = await getSource(slug);
  if (index < 0 || !source) notFound();
  const block = uiItems[index];
  const isKit = block.source === "kit";
  const kit = kitItems.find((k) => k.slug === slug);
  const lab = labBlocks.find((b) => b.slug === slug);
  const prev = uiItems[(index - 1 + uiItems.length) % uiItems.length];
  const next = uiItems[(index + 1) % uiItems.length];
  const theme = await getTheme(isKit);
  const files = await Promise.all(
    [...source.files, { name: "app/globals.css", code: theme }].map(async (f) => ({
      name: f.name.split("/").pop()!,
      path: f.name,
      code: f.code,
      html: await highlight(f.code, f.name),
    })),
  );
  const deps = source.packages.filter((p) => p !== "react");
  const lines = source.files.reduce((n, f) => n + f.code.split("\n").length, 0);
  const demo = isKit ? await getDemo(slug) : null;
  const use = demo
    ? { name: "page.tsx", path: "app/page.tsx", code: demo, html: await highlight(demo, "page.tsx") }
    : await usage(block.title, files[0].name, slug);

  return (
    <div className="flex gap-12">
      <article className="min-w-0 flex-1 pb-10 pt-6 lg:pt-8">
        <div className="flex items-center gap-2 text-[13px] text-mute">
          <Link href="/" className="transition-colors hover:text-ink">
            Components
          </Link>
          <span aria-hidden className="text-mute/50">/</span>
          <span>{block.group}</span>
          <span aria-hidden className="text-mute/50">/</span>
          <span className="truncate text-ink">{block.title}</span>
          <div className="ml-auto flex gap-1">
            <Link href={`/${prev.slug}`} className="btn btn-quiet btn-sm btn-icon" aria-label={`Previous: ${prev.title}`} title={prev.title}>
              <span className="btn-arrow back" />
            </Link>
            <Link href={`/${next.slug}`} className="btn btn-quiet btn-sm btn-icon" aria-label={`Next: ${next.title}`} title={next.title}>
              <span className="btn-arrow" />
            </Link>
          </div>
        </div>

        <h1 className="display ui-rise mt-6 text-[clamp(2.4rem,5vw,4.2rem)]">{block.title}</h1>
        <p className="ui-rise mt-4 max-w-2xl text-[clamp(1.05rem,1.4vw,1.2rem)] leading-snug text-ink-2" style={{ animationDelay: "80ms" }}>
          {block.description}
        </p>

        {kit && (
          <ul className="ui-rise mt-6 flex flex-wrap gap-1.5" style={{ animationDelay: "140ms" }} aria-label="Included">
            {kit.parts.map((p) => (
              <li key={p} className="rounded-[5px] bg-paper-2 px-2.5 py-1 font-mono text-[11.5px] text-ink-2">
                {p}
              </li>
            ))}
          </ul>
        )}

        <section id="preview" className="mt-10 scroll-mt-10">
          <PreviewTabs
            id={block.id}
            hint={block.hint}
            tone={isKit ? "light" : "dark"}
            preview={<Live slug={slug} />}
            code={<CodeTabs files={files.slice(0, 1)} tall />}
          />
        </section>

        <h2 id="installation" className="display mt-20 scroll-mt-10 text-[clamp(1.6rem,2.6vw,2.2rem)]">
          Installation
        </h2>

        <ol className="ui-steps mt-8 flex flex-col gap-12">
          <li id="cli" className="scroll-mt-10">
            <h3 className="text-[17px] font-medium tracking-[-0.01em]">Run the shadcn CLI</h3>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-mute">
              Works in any Tailwind v4 project with a <Code>components.json</Code>. It adds the files to <Code>components/astabyte/</Code>
              {deps.length ? (
                <>
                  , installs <Code>{deps.join(", ")}</Code>
                </>
              ) : null}{" "}
              and merges the colour tokens into your CSS.
            </p>
            <div className="mt-4">
              <InstallCommand url={`https://ui.astabyte.com/r/${slug}.json`} />
            </div>
          </li>
          <li id="manual" className="scroll-mt-10">
            <h3 className="text-[17px] font-medium tracking-[-0.01em]">Or copy it by hand</h3>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-mute">
              {deps.length ? (
                <>
                  Install <Code>{deps.join(" ")}</Code>, then copy{" "}
                </>
              ) : (
                "Copy "
              )}
              {files.length > 2 ? "these files" : "this file"}. Keep the paths or fix the <Code>@/</Code> imports, and add the tokens from{" "}
              <Code>globals.css</Code>.
            </p>
            <div className="mt-4">
              <CodeTabs files={files} />
            </div>
          </li>
        </ol>

        <h2 id="usage" className="display mt-20 scroll-mt-10 text-[clamp(1.6rem,2.6vw,2.2rem)]">
          Usage
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mute">
          {isKit ? "The demo above, as code. Import from the CLI path and compose." : "It fills its parent, so give the wrapper a size."}
        </p>
        <div className="mt-5">
          <CodeTabs files={[use]} />
        </div>

        <nav className="mt-24 grid gap-3 sm:grid-cols-2" aria-label="More components">
          {[
            { b: prev, dir: "Previous", back: true },
            { b: next, dir: "Next", back: false },
          ].map(({ b, dir, back }) => (
            <Link
              key={dir}
              href={`/${b.slug}`}
              className={`group flex flex-col rounded-[10px] bg-paper-2 p-5 surface-hover ${back ? "" : "sm:items-end sm:text-right"}`}
            >
              <span className="flex items-center gap-2 text-[13px] text-mute">
                {back && <span className="btn-arrow back" />}
                {dir}
                {!back && <span className="btn-arrow" />}
              </span>
              <span className="display mt-3 block text-[clamp(1.4rem,2.4vw,2rem)] transition-colors group-hover:text-accent">{b.title}</span>
            </Link>
          ))}
        </nav>
      </article>

      <aside className="sticky top-0 hidden h-svh w-56 shrink-0 overflow-y-auto pb-10 pt-8 [scrollbar-width:none] xl:block">
        <Toc items={TOC} />
        <dl className="mt-10 rounded-[10px] bg-paper-2 p-4 text-[13px]">
          <p className="label mb-3 flex justify-between text-mute">
            Spec <span className="tabular-nums">{block.id}</span>
          </p>
          {[
            ...(kit ? [["Layer", kit.layer]] : []),
            ...(lab ? [["Kind", lab.kind.join(", ")], ["Input", lab.input.join(", ")]] : []),
            ["Files", String(source.files.length)],
            ["Lines", String(lines)],
            ["Needs", ["tailwindcss", ...deps].join(", ")],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-1.5">
              <dt className="text-mute">{k}</dt>
              <dd className="text-right text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}

/** A tiny usage snippet: import from the CLI path and render it. */
async function usage(title: string, file: string, slug: string) {
  const name = file.replace(/\.tsx?$/, "");
  const code = `import ${name} from "@/components/astabyte/${slug}";

export default function Page() {
  // ${title}
  return (
    <div className="relative h-96 w-full">
      <${name} />
    </div>
  );
}
`;
  return { name: "page.tsx", path: "app/page.tsx", code, html: await highlight(code, "page.tsx") };
}
