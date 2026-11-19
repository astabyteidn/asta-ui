import { LOGOS } from "@/components/logos/logos";
import { BASE_SLUGS } from "@/lib/base-slugs";
import { uiItems } from "@/lib/ui-catalog";
import { variantItems } from "@/lib/variant-items";
import { VERSION } from "@/lib/version";

// llms.txt (https://llmstxt.org): a map of the site for language models and coding agents. Built once.
export const dynamic = "force-static";

const SITE = "https://ui.astabyte.com";
const reg = (slug: string) => `Registry: ${SITE}/r/${slug}.json${BASE_SLUGS.includes(slug) ? ` (Base UI: ${SITE}/r/base/${slug}.json)` : ""}`;

export function GET() {
  const list = (source: "kit" | "lab") =>
    uiItems
      .filter((i) => i.source === source)
      .map((i) => `- [${i.title}](${SITE}/${i.slug}): ${i.description} ${reg(i.slug)}`)
      .join("\n");
  const body = `# Astabyte UI

> A motion-first React 19 + Tailwind CSS v4 component kit, distributed as a shadcn registry (v${VERSION}). Set up once with \`pnpm dlx asta-ui@latest init\` (add \`--base\` for Base UI), then install with \`pnpm dlx asta-ui@latest add <slug>\` (same flag), in Next.js, Vite, React Router, Astro or TanStack Start. Without our CLI: \`pnpm dlx shadcn@latest add ${SITE}/r/<slug>.json\` (Radix) or \`${SITE}/r/base/<slug>.json\` (Base UI), or \`@astabyte/<slug>\` with the registry namespace. Interactive components come in a Radix build (radix-ui) and a Base UI build (@base-ui/react) with the same props, look and motion; use the one the project already has. Components use colour tokens (paper, ink, mute, brand, signal), never hard-coded colours.

Also an npm component library: \`pnpm add asta-ui radix-ui\` then \`import { Dialog, PriceChart, TextareaAui003 } from "asta-ui"\` (Radix), or \`pnpm add asta-ui @base-ui/react\` and \`from "asta-ui/base"\` (Base UI); one component via \`"asta-ui/<slug>"\` or \`"asta-ui/base/<slug>"\`. Add \`@import "asta-ui/styles.css";\` after \`@import "tailwindcss";\` once. Export names: kit items by component name, motion blocks by component name (PriceChart), variants by id in PascalCase (TextareaAui003); Button's inline spinner is ButtonSpinner. Use the registry when the project should own and edit the source, the package when it should take updates.

## Docs

- [Introduction](${SITE}/introduction): what the kit is and how it differs from a package.
- [Installation](${SITE}/installation): CLI setup per framework, Radix or Base UI, the npm package, registry URLs, manual install and tokens.
- [AI agents](${SITE}/skill): the agent skill, llms.txt and the shadcn MCP server.
- [Prompts](${SITE}/prompts): copy-ready prompts to set up the kit or build a trading dashboard, checkout, settings page, landing page or sign-in with it.
- [Icons](${SITE}/icons): Astabyte Icons, a small hand-drawn set with a hover motion each. Click to copy the SVG.
- [Logos](${SITE}/logos): ${LOGOS.length} logos of well-known tools, frameworks and brands as 24×24 SVG (Simple Icons data, CC0). Copy as SVG or a React component, mono or brand colour.
- [Agent skill (SKILL.md)](${SITE}/skill.md): rules and the full catalogue in one file.
- [Registry index (Radix)](${SITE}/r/registry.json)
- [Registry index (Base UI)](${SITE}/r/base/registry.json)

## Kit

${list("kit")}

## Motion lab

${list("lab")}

## Variants

Standalone takes on a kit component, each with a global id and installable on its own.

${variantItems.map((v) => `- [${v.title} (${v.id})](${SITE}/${v.variant.base}#${v.id}): ${v.description} ${reg(v.slug)}`).join("\n")}
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
