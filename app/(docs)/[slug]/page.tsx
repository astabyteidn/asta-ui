import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CodeTabs from "@/components/ui-site/CodeTabs";
import CopyPrompt from "@/components/ui-site/CopyPrompt";
import InstallCommand from "@/components/ui-site/InstallCommand";
import PackageCommand from "@/components/ui-site/PackageCommand";
import { Live } from "@/components/ui-site/Live";
import PreviewTabs from "@/components/ui-site/PreviewTabs";
import { ByPrimitive, PrimitiveSwitch, PrimitiveText } from "@/components/ui-site/Primitive";
import Toc from "@/components/ui-site/Toc";
import { kitItems } from "@/lib/kit";
import { labBlocks } from "@/lib/lab";
import { componentPrompt, importLines } from "@/lib/prompts";
import { uiItems } from "@/lib/ui-catalog";
import { variantItemsOf } from "@/lib/variant-items";
import { highlight } from "@/lib/ui-highlight";
import { htmlUsage } from "@/lib/html-usage";
import { primitiveLabel, type Primitive } from "@/lib/primitive";
import { getDemo, getPackageExport, getSource, getTheme, hasBase } from "@/lib/ui-source";

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
  <code className="break-words rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[13.5px] text-ink">{children}</code>
);

const TOC_BASE = [
  { id: "preview", title: "Preview" },
  { id: "installation", title: "Installation" },
  { id: "cli", title: "CLI", depth: 1 },
  { id: "package", title: "Package", depth: 1 },
  { id: "manual", title: "Manual", depth: 1 },
  { id: "prompt", title: "Prompt for AI", depth: 1 },
  { id: "usage", title: "Usage" },
];

/** Everything on the page that depends on the primitive: files, packages, usage code and the prompt. */
async function build(slug: string, block: (typeof uiItems)[number], theme: string | null, p: Primitive, primitives: boolean) {
  const source = (await getSource(slug, p))!;
  const files = await Promise.all(
    [...source.files, ...(theme ? [{ name: "app/globals.css", code: theme }] : [])].map(async (f) => ({
      name: f.name.split("/").pop()!,
      path: f.name,
      code: f.code,
      html: await highlight(f.code, f.name),
    })),
  );
  const deps = source.packages.filter((x) => x !== "react");
  const lines = source.files.reduce((n, f) => n + f.code.split("\n").length, 0);
  const demo = block.source === "kit" ? await getDemo(slug, p) : null;
  const use = demo
    ? { name: "page.tsx", path: "app/page.tsx", code: demo, html: await highlight(demo, "page.tsx") }
    : await usage(block.title, files[0].name, slug);
  const prompt = componentPrompt(block, importLines(use.code), primitives, p);
  const usesButton = source.files.some((f) => /\/button\.tsx$/.test(f.name)) && slug !== "button";
  return { source, files, deps, lines, use, prompt, primitive: primitiveLabel(slug, p, usesButton) };
}

export default async function UiComponent({ params }: Props) {
  const { slug } = await params;
  const index = uiItems.findIndex((b) => b.slug === slug);
  if (index < 0 || !(await getSource(slug))) notFound();
  const block = uiItems[index];
  const isKit = block.source === "kit";
  const kit = kitItems.find((k) => k.slug === slug);
  const lab = labBlocks.find((b) => b.slug === slug);
  const prev = uiItems[(index - 1 + uiItems.length) % uiItems.length];
  const next = uiItems[(index + 1) % uiItems.length];
  const theme = await getTheme(isKit);
  const dual = await hasBase(slug);
  const R = await build(slug, block, theme, "radix", dual);
  const B = dual ? await build(slug, block, theme, "base", dual) : R;
  const { files, deps, source } = R;
  const vars = await Promise.all(
    variantItemsOf(slug).map(async (v) => {
      const vdual = await hasBase(v.slug);
      const one = async (p: Primitive) => {
        const src = await getSource(v.slug, p);
        const code = (await getDemo(v.slug, p)) ?? "";
        const vdeps = (src?.packages ?? []).filter((x) => x !== "react");
        const vfiles = await Promise.all(
          [{ name: "app/page.tsx", code }, ...(src?.files ?? [])].map(async (f) => ({
            name: f.name.split("/").pop()!,
            path: f.name,
            code: f.code,
            html: await highlight(f.code, f.name),
          })),
        );
        return { files: vfiles, deps: vdeps, prompt: componentPrompt(v, importLines(code), vdual, p) };
      };
      const r = await one("radix");
      return { v, dual: vdual, r, b: vdual ? await one("base") : r };
    }),
  );
  const html = isKit ? htmlUsage(slug) : null;
  const tocBase = [
    ...TOC_BASE.slice(0, 6),
    ...(html ? [{ id: "html", title: "HTML + CSS", depth: 1 }] : []),
    TOC_BASE[6],
  ];
  const TOC = vars.length
    ? [tocBase[0], { id: "variants", title: `Variants (${vars.length})` }, ...vars.map(({ v }) => ({ id: v.id, title: `${v.id} · ${v.variant.name}`, depth: 1 })), ...tocBase.slice(1)]
    : tocBase;
  const HEAD = `<link rel="stylesheet" href="https://ui.astabyte.com/cdn/asta.css" />\n<script src="https://ui.astabyte.com/cdn/asta.js" defer></script>`;
  const htmlFiles = html
    ? await Promise.all(
        [
          { name: "index.html", code: html },
          { name: "head.html", code: HEAD },
        ].map(async (f) => ({ name: f.name, path: `html-${f.name}`, code: f.code, html: await highlight(f.code, "x.html") })),
      )
    : [];
  const promptFile = async (code: string) => ({ name: "prompt.txt", path: "prompt.txt", code, html: await highlight(code, "prompt.txt") });
  const [promptR, promptB] = await Promise.all([promptFile(R.prompt), promptFile(B.prompt)]);
  /** Radix and Base UI versions of a block, or just the one when the item has no primitives. */
  const pv = (radix: React.ReactNode, base: React.ReactNode) => (dual ? <ByPrimitive radix={radix} base={base} /> : radix);
  const pt = (radix: string, base: string) => (dual && radix !== base ? <PrimitiveText radix={radix} base={base} /> : radix);
  // npm package: the barrel for items with two builds, a deep import (no primitive package needed) for the rest.
  const exportName = (await getPackageExport(slug)) ?? "";
  const pkgCss = `@import "tailwindcss";\n@import "asta-ui/styles.css";`;
  const pkgCssFile = { name: "globals.css", path: "pkg-globals.css", code: pkgCss, html: await highlight(pkgCss, "globals.css") };
  const pkgFile = async (from: string) => {
    const code = `import { ${exportName} } from "${from}";`;
    return [{ name: "usage.tsx", path: `pkg-${from}`, code, html: await highlight(code, "usage.tsx") }, pkgCssFile];
  };
  const [pkgR, pkgB] = await Promise.all([pkgFile(dual ? "asta-ui" : `asta-ui/${slug}`), pkgFile("asta-ui/base")]);

  return (
    <div className="flex gap-12">
      <article className="min-w-0 flex-1 pb-10 pt-6 lg:pt-8">
        <div className="ui-enter flex items-center gap-2 text-[14px] text-mute">
          <Link href="/" className="transition-colors hover:text-ink">
            Components
          </Link>
          <span aria-hidden className="text-mute/50">/</span>
          <span>{block.group}</span>
          <span aria-hidden className="text-mute/50">/</span>
          <span className="truncate text-ink">{block.title}</span>
          <div className="ml-auto flex items-center gap-1">
            <CopyPrompt text={R.prompt} textBase={dual ? B.prompt : undefined} className="mr-1 hidden sm:inline-flex" />
            <Link href={`/${prev.slug}`} prefetch className="btn btn-quiet btn-sm btn-icon" aria-label={`Previous: ${prev.title}`} title={prev.title}>
              <span className="btn-arrow back" />
            </Link>
            <Link href={`/${next.slug}`} prefetch className="btn btn-quiet btn-sm btn-icon" aria-label={`Next: ${next.title}`} title={next.title}>
              <span className="btn-arrow" />
            </Link>
          </div>
        </div>

        <h1 className="display ui-enter mt-6 text-[clamp(2.4rem,5vw,4.2rem)] [--i:1]">{block.title}</h1>
        <p className="ui-enter mt-4 max-w-2xl text-[clamp(1.05rem,1.4vw,1.2rem)] leading-snug text-ink-2 [--i:2]">
          {block.description}
        </p>

        {dual && <PrimitiveSwitch className="ui-enter mt-6 [--i:3]" />}

        {kit && (
          <ul className="ui-enter mt-6 flex flex-wrap gap-1.5 [--i:3]" aria-label="Included">
            {kit.parts.map((p) => (
              <li key={p} className="rounded-[5px] bg-paper-2 px-2.5 py-1 font-mono text-[12.5px] text-ink-2">
                {p}
              </li>
            ))}
          </ul>
        )}

        <section id="preview" className="ui-enter mt-10 scroll-mt-10 [--i:4]">
          <PreviewTabs
            id={block.id}
            hint={block.hint}
            tone={isKit ? "light" : "dark"}
            preview={<Live slug={slug} eager ssr={isKit} />}
            code={pv(<CodeTabs files={R.files.slice(0, 1)} fill />, <CodeTabs files={B.files.slice(0, 1)} fill />)}
          />
        </section>

        {vars.length > 0 && (
          <section id="variants" className="mt-20 scroll-mt-10">
            <h2 className="display text-[clamp(1.6rem,2.6vw,2.2rem)]">Variants</h2>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-mute">
              {vars.length} more takes on the {block.title.toLowerCase()}, each a single file you install on its own by its id.
            </p>
            <div className="mt-10 flex flex-col gap-16">
              {vars.map(({ v, dual: vdual, r, b }) => (
                <div key={v.id} id={v.id} className="scroll-mt-10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2.5 text-[20px] font-medium tracking-[-0.015em]">
                        <span className="rounded-[5px] bg-paper-2 px-1.5 py-0.5 font-mono text-[13px] font-normal tabular-nums text-accent">{v.id}</span>
                        {v.variant.name}
                      </h3>
                      <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-mute">
                        {v.description}
                        {r.deps.length ? (
                          <>
                            {" "}
                            Needs <Code>{vdual ? <PrimitiveText radix={r.deps.join(", ")} base={b.deps.join(", ")} /> : r.deps.join(", ")}</Code>.
                          </>
                        ) : null}
                      </p>
                    </div>
                    <CopyPrompt text={r.prompt} textBase={vdual ? b.prompt : undefined} className="shrink-0" />
                  </div>
                  <div className="mt-5">
                    <PreviewTabs id={`${block.title} · ${v.id}`} hint={v.variant.name} tone="light" preview={<Live slug={v.slug} />} code={vdual ? <ByPrimitive radix={<CodeTabs files={r.files} fill />} base={<CodeTabs files={b.files} fill />} /> : <CodeTabs files={r.files} fill />} />
                  </div>
                  <div className="mt-4">
                    <InstallCommand slugs={[v.slug]} hasBase={vdual} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-20 flex flex-wrap items-end justify-between gap-4">
          <h2 id="installation" className="display scroll-mt-10 text-[clamp(1.6rem,2.6vw,2.2rem)]">
            Installation
          </h2>
          {dual && <PrimitiveSwitch />}
        </div>

        <ol className="ui-steps mt-8 flex flex-col gap-12">
          <li id="cli" className="scroll-mt-10">
            <h3 className="text-[18px] font-medium tracking-[-0.01em]">Run the CLI</h3>
            <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-mute">
              Run <Code>pnpm dlx asta-ui@latest init</Code> once, then this. The file lands in <Code>components/astabyte/</Code>
              {deps.length ? (
                <>
                  , installs <Code>{pt(R.deps.join(", "), B.deps.join(", "))}</Code>
                </>
              ) : null}{" "}
              and the colour tokens go into your CSS.
              {dual && (
                <>
                  {" "}
                  <PrimitiveText radix="Want Base UI? Add --base." base="This is the Base UI build. Drop --base for Radix." />
                </>
              )}
            </p>
            <div className="mt-4">
              <InstallCommand slugs={[slug]} hasBase={dual} />
            </div>
          </li>
          <li id="package" className="scroll-mt-10">
            <h3 className="text-[18px] font-medium tracking-[-0.01em]">Or install the package</h3>
            <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-mute">
              Don&rsquo;t want the file? Import from <Code>{dual ? pt("asta-ui", "asta-ui/base") : `asta-ui/${slug}`}</Code> and update with{" "}
              <Code>pnpm update asta-ui</Code>. Add the stylesheet once.{" "}
              <Link href="/installation#package" className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent">
                More
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <PackageCommand hasBase={dual} />
              {pv(<CodeTabs files={pkgR} />, <CodeTabs files={pkgB} />)}
            </div>
          </li>
          <li id="manual" className="scroll-mt-10">
            <h3 className="text-[18px] font-medium tracking-[-0.01em]">Or copy it by hand</h3>
            <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-mute">
              {deps.length ? (
                <>
                  Install <Code>{pt(R.deps.join(" "), B.deps.join(" "))}</Code>, then copy{" "}
                </>
              ) : (
                "Copy "
              )}
              {files.length > 2 ? "these files" : "this file"}. Keep the paths, or fix the <Code>@/</Code> imports. Then add the tokens from{" "}
              <Code>globals.css</Code>.
            </p>
            <div className="mt-4">{pv(<CodeTabs files={R.files} />, <CodeTabs files={B.files} />)}</div>
          </li>
          <li id="prompt" className="scroll-mt-10">
            <h3 className="text-[18px] font-medium tracking-[-0.01em]">Or ask your AI agent</h3>
            <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-mute">
              Paste this into Claude Code, Cursor, Codex, v0 or Lovable. Fill in the last line. More in{" "}
              <Link href="/prompts" className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent">
                Prompts
              </Link>
              .
            </p>
            <div className="mt-4">
              {pv(<CodeTabs files={[promptR]} peek={200} wrap />, <CodeTabs files={[promptB]} peek={200} wrap />)}
            </div>
          </li>
          {html && (
            <li id="html" className="scroll-mt-10">
              <h3 className="text-[18px] font-medium tracking-[-0.01em]">Or use plain HTML + CSS</h3>
              <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-mute">
                Not on React? Use it from Django, Rails, Laravel, Go <Code>html/template</Code>, htmx or a static page. Load <Code>asta.css</Code> and{" "}
                <Code>asta.js</Code> once (the <Code>head.html</Code> tab), then paste the markup. The{" "}
                <Code>ui.astabyte.com/cdn</Code> link is temporary: pin a version from jsDelivr for production. More in{" "}
                <Link href="/css" className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent">
                  HTML + CSS
                </Link>
                .
              </p>
              <div className="mt-4">
                <CodeTabs files={htmlFiles} />
              </div>
            </li>
          )}
        </ol>

        <h2 id="usage" className="display mt-20 scroll-mt-10 text-[clamp(1.6rem,2.6vw,2.2rem)]">
          Usage
        </h2>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-mute">
          {isKit ? "The demo above, as code." : "It fills its parent. Give the wrapper a size."}
        </p>
        <div className="mt-5">{R.use.code === B.use.code ? <CodeTabs files={[R.use]} /> : pv(<CodeTabs files={[R.use]} />, <CodeTabs files={[B.use]} />)}</div>

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
              <span className="flex items-center gap-2 text-[14px] text-mute">
                {back && <span className="btn-arrow back" />}
                {dir}
                {!back && <span className="btn-arrow" />}
              </span>
              <span className="display mt-3 block text-[clamp(1.4rem,2.4vw,2rem)] transition-colors group-hover:text-accent">{b.title}</span>
            </Link>
          ))}
        </nav>
      </article>

      <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-56 shrink-0 overflow-y-auto pb-10 pt-8 [scrollbar-width:none] xl:block">
        <Toc items={TOC} />
        <dl className="mt-10 rounded-[10px] bg-paper-2 p-4 text-[14px]">
          <p className="label mb-3 flex justify-between text-mute">
            Spec <span className="tabular-nums">{block.id}</span>
          </p>
          {(
            [
            ...(kit ? [["Layer", kit.layer]] : []),
            ...(lab ? [["Kind", lab.kind.join(", ")], ["Input", lab.input.join(", ")]] : []),
            ["Primitive", pt(R.primitive, B.primitive)],
            ["Files", pt(String(source.files.length), String(B.source.files.length))],
            ["Lines", pt(String(R.lines), String(B.lines))],
            ["Needs", pt(["tailwindcss", ...R.deps].join(", "), ["tailwindcss", ...B.deps].join(", "))],
            ] as [string, React.ReactNode][]
          ).map(([k, v]) => (
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
