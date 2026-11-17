import type { Metadata } from "next";
import Link from "next/link";
import CodeTabs from "@/components/ui-site/CodeTabs";
import { highlight } from "@/lib/ui-highlight";
import DocPage from "../DocPage";

export const metadata: Metadata = {
  title: "AI agents",
  description: "Use Astabyte UI from Claude Code, Cursor, Codex and other coding agents: an agent skill, llms.txt and the shadcn MCP server.",
};

const SITE = "https://ui.astabyte.com";

async function block(name: string, code: string, lang: string) {
  return { name, path: name, code, html: await highlight(code, `x.${lang}`) };
}

export default async function Skill() {
  const [skillAdd, skillCopy, registry, nsAdd, mcp] = await Promise.all([
    block("Terminal", "npx skills add astabyteidn/asta-ui", "sh"),
    block("Terminal", `mkdir -p ~/.claude/skills/astabyte-ui\ncurl -fsSL ${SITE}/skill.md -o ~/.claude/skills/astabyte-ui/SKILL.md`, "sh"),
    block("components.json", `{\n  "registries": {\n    "@astabyte": "${SITE}/r/{name}.json"\n  }\n}`, "json"),
    block("Terminal", "npx shadcn@latest add @astabyte/button @astabyte/price-chart", "sh"),
    block("Terminal", "npx shadcn@latest mcp init", "sh"),
  ]);

  return (
    <DocPage
      title="AI agents"
      lead="Let your coding agent pick, install and use the right component, with the same rules we follow."
      toc={[
        { id: "skill", title: "Agent skill" },
        { id: "registry", title: "Registry namespace" },
        { id: "mcp", title: "shadcn MCP" },
        { id: "llms", title: "llms.txt" },
      ]}
      next={{ href: "/prompts", title: "Prompts" }}
    >
      <h2 id="skill">Agent skill</h2>
      <p>
        The <code>astabyte-ui</code> skill tells an agent what is in the kit, how to install each piece and the rules to keep: colour tokens instead
        of hard-coded colours, one accent, transform-only motion with reduced-motion support. It includes the full catalogue, generated from this
        site on every release. Install it with the skills CLI (Claude Code, Cursor, Codex and others):
      </p>
      <div className="my-6">
        <CodeTabs files={[skillAdd]} />
      </div>
      <p>Or drop it into Claude Code by hand:</p>
      <div className="my-6">
        <CodeTabs files={[skillCopy]} />
      </div>
      <p>
        Then just ask, e.g. &ldquo;add a live price chart and an order book to the dashboard&rdquo;, or start from a ready-made prompt on the{" "}
        <Link href="/prompts">Prompts</Link> page. The raw file is at <a href={`${SITE}/skill.md`}>ui.astabyte.com/skill.md</a>.
      </p>

      <h2 id="registry">Registry namespace</h2>
      <p>
        Add the <code>@astabyte</code> namespace to <code>components.json</code> and you (or your agent) can install by name instead of URL:
      </p>
      <div className="my-6">
        <CodeTabs files={[registry]} />
      </div>
      <div className="my-6">
        <CodeTabs files={[nsAdd]} />
      </div>

      <h2 id="mcp">shadcn MCP</h2>
      <p>
        With the namespace in place, the shadcn MCP server lets agents browse and search Astabyte UI alongside your other registries. Set it up for
        your client:
      </p>
      <div className="my-6">
        <CodeTabs files={[mcp]} />
      </div>

      <h2 id="llms">llms.txt</h2>
      <p>
        Agents that read the web can start from <a href={`${SITE}/llms.txt`}>ui.astabyte.com/llms.txt</a>: every component with its page and
        registry URL. For setup per framework, see <Link href="/installation">Installation</Link>.
      </p>
    </DocPage>
  );
}
