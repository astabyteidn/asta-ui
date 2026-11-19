import type { Metadata } from "next";
import Link from "next/link";
import CodeTabs from "@/components/ui-site/CodeTabs";
import { ByPrimitive, PrimitiveSwitch } from "@/components/ui-site/Primitive";
import { highlight } from "@/lib/ui-highlight";
import DocPage from "../DocPage";

export const metadata: Metadata = {
  title: "AI agents",
  description: "Use Astabyte UI from Claude Code, Cursor, Codex and other coding agents: agent skills that update themselves, the Astabyte MCP server and llms.txt.",
};

const SITE = "https://ui.astabyte.com";

async function block(name: string, code: string, lang: string) {
  return { name, path: name, code, html: await highlight(code, `x.${lang}`) };
}

export default async function Skill() {
  const [skillAdd, skillCli, skillCopy, update, auto, mcpClaude, mcpCursor, init, initBase, registry, registryBase, nsAdd, mcp] = await Promise.all([
    block("Terminal", "npx skills add astabyteidn/asta-ui", "sh"),
    block("Terminal", "npx asta-ui@latest skills install            # all three, into ~/.claude/skills\nnpx asta-ui@latest skills install --project  # into ./.claude/skills, to commit with the repo", "sh"),
    block("Terminal", `mkdir -p ~/.claude/skills/astabyte-ui\ncurl -fsSL ${SITE}/skill.md -o ~/.claude/skills/astabyte-ui/SKILL.md`, "sh"),
    block("Terminal", "npx asta-ui@latest skills status   # what's installed, and whether it's current\nnpx asta-ui@latest skills update   # rewrite only the skills that changed", "sh"),
    block("Terminal", "npx asta-ui@latest skills auto        # check once a day at session start\nnpx asta-ui@latest skills auto --off  # remove the hook", "sh"),
    block("Terminal", `claude mcp add --transport http astabyte-ui ${SITE}/mcp`, "sh"),
    block(".cursor/mcp.json", `{\n  "mcpServers": {\n    "astabyte-ui": { "url": "${SITE}/mcp" }\n  }\n}`, "json"),
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
        { id: "skill", title: "Agent skills" },
        { id: "update", title: "Keep them current" },
        { id: "mcp", title: "MCP server" },
        { id: "registry", title: "Registry namespace" },
        { id: "shadcn-mcp", title: "shadcn MCP" },
        { id: "llms", title: "llms.txt" },
      ]}
      next={{ href: "/prompts", title: "Prompts" }}
    >
      <h2 id="skill">Agent skills</h2>
      <p>Three skills. Your agent loads each one only when the task needs it.</p>
      <ul>
        <li>
          <code>astabyte-ui</code>: what&rsquo;s in the kit, how to install each piece, and the rules. Tokens, not hard-coded colours. One
          accent. Motion with transform only, and respect reduced motion.
        </li>
        <li>
          <code>astabyte-design</code>: the Astabyte look for everything around the components: colour, type, spacing, motion and copy.
        </li>
        <li>
          <code>astabyte-skills-update</code>: keeps the other two in step with this site.
        </li>
      </ul>
      <p>Install them with our CLI:</p>
      <div className="my-6">
        <CodeTabs files={[skillCli]} />
      </div>
      <p>Or with the skills CLI. Works with Claude Code, Cursor, Codex and others:</p>
      <div className="my-6">
        <CodeTabs files={[skillAdd]} />
      </div>
      <p>Or copy one by hand:</p>
      <div className="my-6">
        <CodeTabs files={[skillCopy]} />
      </div>
      <p>
        Then just ask: &ldquo;add a live price chart and an order book to the dashboard&rdquo;. Or start from a{" "}
        <Link href="/prompts">ready-made prompt</Link>. Raw file: <a href={`${SITE}/skill.md`}>ui.astabyte.com/skill.md</a>.
      </p>

      <h2 id="update">Keep them current</h2>
      <p>
        Every release regenerates the skills: new components, new variants, changed rules. The skills check for that themselves. Once a
        session, before the first Astabyte task, the agent compares its copy with <a href={`${SITE}/skills.json`}>skills.json</a> and
        rewrites only what changed. It finds skills in <code>~/.claude/skills</code>, <code>.claude/skills</code> and{" "}
        <code>.agents/skills</code>, and leaves your other skills alone.
      </p>
      <div className="my-6">
        <CodeTabs files={[update]} />
      </div>
      <p>
        Want it hands-off in Claude Code? <code>skills auto</code> adds one SessionStart hook to <code>~/.claude/settings.json</code>. It
        checks at most once a day and stays quiet unless something changed. Add <code>--project</code> for the repo&rsquo;s settings instead.
      </p>
      <div className="my-6">
        <CodeTabs files={[auto]} />
      </div>

      <h2 id="mcp">MCP server</h2>
      <p>
        Prefer tools over files? Connect the Astabyte MCP server. It runs on this site, so it always serves the current catalogue and
        there&rsquo;s nothing to update. No key, read-only.
      </p>
      <div className="my-6">
        <CodeTabs files={[mcpClaude, mcpCursor]} />
      </div>
      <p>Other clients: add a Streamable HTTP server with the URL <code>{SITE}/mcp</code>. Your agent gets six tools:</p>
      <ul>
        <li>
          <code>search_components</code>: find components by what they do.
        </li>
        <li>
          <code>get_component</code>: one component&rsquo;s install command and full source, for Radix or Base UI.
        </li>
        <li>
          <code>get_setup</code>: set up a project and the rules to follow.
        </li>
        <li>
          <code>get_design_guide</code>: the Astabyte design rules, per surface.
        </li>
        <li>
          <code>get_use_cases</code>: common requests and the components that cover them.
        </li>
        <li>
          <code>get_skills</code>: the current skills and the update command.
        </li>
      </ul>

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

      <h2 id="shadcn-mcp">shadcn MCP</h2>
      <p>
        Already use the shadcn MCP server? With the namespace set, it finds our components next to your other registries:
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
