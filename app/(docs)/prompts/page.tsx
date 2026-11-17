import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import CodeTabs from "@/components/ui-site/CodeTabs";
import CopyPrompt from "@/components/ui-site/CopyPrompt";
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
  const [starterFile, ...caseFiles] = await Promise.all([file(starter), ...useCases.map((c) => file(c.prompt))]);

  return (
    <DocPage
      title="Prompts"
      lead="Copy a prompt, paste it into your coding agent, fill in the last line. Works with Claude Code, Cursor, Codex, v0 and Lovable."
      toc={[{ id: "starter", title: "Start a project" }, ...useCases.map((c) => ({ id: c.slug, title: c.title })), { id: "component", title: "One component" }]}
      next={{ href: "/button", title: "Button" }}
    >
      <Head id="starter" title="Start a project" text={starter} />
      <p>Points the agent at the catalogue, installs the agent skill and the registry namespace, and sets the rules for the rest of the session.</p>
      <div className="my-6">
        <CodeTabs files={[starterFile]} peek={200} wrap />
      </div>

      {useCases.map((c, i) => (
        <Fragment key={c.slug}>
          <Head id={c.slug} title={c.title} text={c.prompt} />
          <p>{c.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Components">
            {c.slugs.map((s) => (
              <Link key={s} href={`/${s}`} className="rounded-[5px] bg-paper-2 px-2.5 py-1 font-mono text-[11.5px] text-ink-2 transition-colors hover:text-accent">
                {uiItems.find((u) => u.slug === s)?.title ?? s}
              </Link>
            ))}
          </div>
          <div className="my-6">
            <CodeTabs files={[caseFiles[i]]} peek={200} wrap />
          </div>
        </Fragment>
      ))}

      <h2 id="component">One component</h2>
      <p>
        Every component page has its own prompt: use <strong>Copy prompt</strong> next to the title, or the &ldquo;Or ask your AI agent&rdquo; step
        under Installation. To keep the rules across sessions, install the <Link href="/skill">agent skill</Link>.
      </p>
    </DocPage>
  );
}

function Head({ id, title, text }: { id: string; title: string; text: string }) {
  return (
    <div className="doc-row">
      <h2 id={id}>{title}</h2>
      <CopyPrompt text={text} className="shrink-0" />
    </div>
  );
}
