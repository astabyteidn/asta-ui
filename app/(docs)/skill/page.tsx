import type { Metadata } from "next";
import Link from "next/link";
import CodeTabs from "@/components/ui-site/CodeTabs";
import { ByPrimitive, PrimitiveSwitch } from "@/components/ui-site/Primitive";
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
  const [skillAdd, skillCopy, init, initBase, registry, registryBase, nsAdd, mcp] = await Promise.all([
    block("Terminal", "npx skills add astabyteidn/asta-ui", "sh"),
    block("Terminal", `mkdir -p ~/.claude/skills/astabyte-ui\ncurl -fsSL ${SITE}/skill.md -o ~/.claude/skills/astabyte-ui/SKILL.md`, "sh"),
    block("Terminal", "pnpm dlx asta-ui@latest init", "sh"),
    block("Terminal", "pnpm dlx asta-ui@latest init --base", "sh"),
    block("components.json", `{\n  "registries": {\n    "@astabyte": "${SITE}/r/{name}.json"\n  }\n}`, "json"),
    block("components.json", `{\n  "registries": {\n    "@astabyte": "${SITE}/r/base/{name}.json"\n  }\n}`, "json"),
    block("Terminal", "pnpm dlx shadcn@latest add @astabyte/button @astabyte/price-chart", "sh"),
    block("Terminal", "pnpm dlx shadcn@latest mcp init", "sh"),
  ]);

  return (
    <DocPage
      title="AI agents"
      lead="Ask your coding agent for a price chart. It picks the right component, installs it and follows our rules."
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
        The <code>astabyte-ui</code> skill tells your agent three things: what&rsquo;s in the kit, how to install each piece, and the rules. Use
        tokens, not hard-coded colours. One accent. Motion with transform only, and respect reduced motion. It&rsquo;s regenerated on every
        release, so the list is always current.
      </p>
      <p>Install it with the skills CLI. Works with Claude Code, Cursor, Codex and others:
      </p>
      <div className="my-6">
        <CodeTabs files={[skillAdd]} />
      </div>
      <p>Or copy it into Claude Code yourself:</p>
      <div className="my-6">
        <CodeTabs files={[skillCopy]} />
      </div>
      <p>
        Then just ask: &ldquo;add a live price chart and an order book to the dashboard&rdquo;. Or start from a{" "}
        <Link href="/prompts">ready-made prompt</Link>. Raw file: <a href={`${SITE}/skill.md`}>ui.astabyte.com/skill.md</a>.
      </p>

      <h2 id="registry">Registry namespace</h2>
      <p>
        <code>asta-ui init</code> adds <code>@astabyte</code> to <code>components.json</code>. Now you, or your agent, can install by name
        instead of URL:
      </p>
      <PrimitiveSwitch className="my-6" />
      <div className="my-6">
        <ByPrimitive radix={<CodeTabs files={[init]} />} base={<CodeTabs files={[initBase]} />} />
      </div>
      <p>Or add it by hand:</p>
      <div className="my-6">
        <ByPrimitive radix={<CodeTabs files={[registry]} />} base={<CodeTabs files={[registryBase]} />} />
      </div>
      <div className="my-6">
        <CodeTabs files={[nsAdd]} />
      </div>

      <h2 id="mcp">shadcn MCP</h2>
      <p>
        With the namespace set, the shadcn MCP server lets your agent search our components next to your other registries:
      </p>
      <div className="my-6">
        <CodeTabs files={[mcp]} />
      </div>

      <h2 id="llms">llms.txt</h2>
      <p>
        Agents that browse the web can start at <a href={`${SITE}/llms.txt`}>ui.astabyte.com/llms.txt</a>. It lists every component with its
        page and registry URL.
      </p>
    </DocPage>
  );
}
