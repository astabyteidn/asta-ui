import { uiItems } from "@/lib/ui-catalog";
import { variantItems } from "@/lib/variant-items";
import { VERSION } from "@/lib/version";

// llms.txt (https://llmstxt.org): a map of the site for language models and coding agents. Built once.
export const dynamic = "force-static";

const SITE = "https://ui.astabyte.com";

export function GET() {
  const list = (source: "kit" | "lab") =>
    uiItems
      .filter((i) => i.source === source)
      .map((i) => `- [${i.title}](${SITE}/${i.slug}): ${i.description} Registry: ${SITE}/r/${i.slug}.json`)
      .join("\n");
  const body = `# Astabyte UI

> A motion-first React 19 + Tailwind CSS v4 component kit, distributed as a shadcn registry (v${VERSION}). Install any component with \`npx shadcn@latest add ${SITE}/r/<slug>.json\` (or \`@astabyte/<slug>\` with the registry namespace) in Next.js, Vite, React Router, Astro or TanStack Start. Components use colour tokens (paper, ink, mute, brand, signal), never hard-coded colours.

## Docs

- [Introduction](${SITE}/introduction): what the kit is and how it differs from a package.
- [Installation](${SITE}/installation): shadcn CLI setup per framework, manual install and tokens.
- [AI agents](${SITE}/skill): the agent skill, llms.txt and the shadcn MCP server.
- [Prompts](${SITE}/prompts): copy-ready prompts to set up the kit or build a trading dashboard, checkout, settings page, landing page or sign-in with it.
- [Agent skill (SKILL.md)](${SITE}/skill.md): rules and the full catalogue in one file.
- [Registry index](${SITE}/r/registry.json)

## Kit

${list("kit")}

## Motion lab

${list("lab")}

## Variants

Standalone takes on a kit component, each with a global id and installable on its own.

${variantItems.map((v) => `- [${v.title} (${v.id})](${SITE}/${v.variant.base}#${v.id}): ${v.description} Registry: ${SITE}/r/${v.slug}.json`).join("\n")}
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
