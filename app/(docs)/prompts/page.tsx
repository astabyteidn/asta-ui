import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import CodeTabs from "@/components/ui-site/CodeTabs";
import CopyPrompt from "@/components/ui-site/CopyPrompt";
import { ByPrimitive, PrimitiveSwitch } from "@/components/ui-site/Primitive";
import { starterPrompt, useCases } from "@/lib/prompts";
import { uiItems } from "@/lib/ui-catalog";
import { highlight } from "@/lib/ui-highlight";
import DocPage from "../DocPage";

export const metadata: Metadata = {
  title: "Prompts",
  description: "Copy-ready prompts for Claude Code, Cursor, Codex, v0 and Lovable: set up Astabyte UI or build a whole page with it.",
};

const file = async (code: string) => ({ name: "prompt.txt", path: "prompt.txt", code, html: await highlight(code, "prompt.txt") });

export default async function Prompts() {
  const starter = starterPrompt();
  const starterBase = starterPrompt("base");
  const [starterFile, starterBaseFile] = await Promise.all([file(starter), file(starterBase)]);
  const caseFiles = await Promise.all(useCases.map(async (c) => ({ radix: await file(c.prompt), base: await file(c.promptBase) })));

  return (
    <DocPage
      title="Prompts"
      lead="Copy. Paste into your agent. Fill in the last line. Works with Claude Code, Cursor, Codex, v0 and Lovable."
      toc={[{ id: "starter", title: "Start a project" }, ...useCases.map((c) => ({ id: c.slug, title: c.title })), { id: "component", title: "One component" }]}
      next={{ href: "/button", title: "Button" }}
    >
      <PrimitiveSwitch className="mb-8" />
      <Head id="starter" title="Start a project" text={starter} textBase={starterBase} />
      <p>Use this first. Your agent installs the skill, runs <code>asta-ui init</code> and learns the rules for the rest of the session.</p>
      <div className="my-6">
        <ByPrimitive radix={<CodeTabs files={[starterFile]} peek={200} wrap />} base={<CodeTabs files={[starterBaseFile]} peek={200} wrap />} />
      </div>

      {useCases.map((c, i) => (
        <Fragment key={c.slug}>
          <Head id={c.slug} title={c.title} text={c.prompt} textBase={c.promptBase} />
          <p>{c.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Components">
            {c.slugs.map((s) => (
              <Link key={s} href={`/${s}`} className="rounded-[5px] bg-paper-2 px-2.5 py-1 font-mono text-[12.5px] text-ink-2 transition-colors hover:text-accent">
                {uiItems.find((u) => u.slug === s)?.title ?? s}
              </Link>
            ))}
          </div>
          <div className="my-6">
            <ByPrimitive radix={<CodeTabs files={[caseFiles[i].radix]} peek={200} wrap />} base={<CodeTabs files={[caseFiles[i].base]} peek={200} wrap />} />
          </div>
        </Fragment>
      ))}

      <h2 id="component">One component</h2>
      <p>
        Every component page has its own prompt. Hit <strong>Copy prompt</strong> next to the title. Want the rules to stick between sessions?
        Install the <Link href="/skill">agent skill</Link>.
      </p>
    </DocPage>
  );
}

function Head({ id, title, text, textBase }: { id: string; title: string; text: string; textBase?: string }) {
  return (
    <div className="doc-row">
      <h2 id={id}>{title}</h2>
      <CopyPrompt text={text} textBase={textBase} className="shrink-0" />
    </div>
  );
}
