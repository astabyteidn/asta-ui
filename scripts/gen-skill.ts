// Generates skills/astabyte-ui/SKILL.md from the catalogue, so the agent skill never drifts from the site.
// Run from the repo root: bun run skill (CI fails if the committed file is out of date).
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASE_SLUGS } from "../lib/base-slugs";
import { useCases } from "../lib/prompts";
import { uiItems } from "../lib/ui-catalog";
import { variantItems } from "../lib/variant-items";

const SITE = "https://ui.astabyte.com";
const row = (s: string) => s.replace(/\|/g, "\\|");
const base = (slug: string) => (BASE_SLUGS.includes(slug) ? "Radix + Base UI" : "—");

const table = (source: "kit" | "lab") =>
  [
    "| Component | Group | What it does | Primitives |",
    "|---|---|---|---|",
    ...uiItems
      .filter((i) => i.source === source)
      .map((i) => `| [${row(i.title)}](${SITE}/${i.slug}) \`${i.slug}\` | ${row(i.group.replace("Motion · ", ""))} | ${row(i.description)} | ${base(i.slug)} |`),
  ].join("\n");

const md = `---
name: astabyte-ui
description: Build React UI with Astabyte UI (ui.astabyte.com), a motion-first shadcn component kit. Use when the user wants buttons, inputs, selects, menus, toasts, dialogs, a navbar, pricing, sign-in, settings or footer sections, or motion components for trading (price chart, candlesticks, order book, trade ticket), payments (card checkout, payment status, payment methods) or ecommerce (add to cart, product options, free shipping bar), or asks to install a component from ui.astabyte.com or the @astabyte registry.
---

# Astabyte UI

A React 19 + Tailwind CSS v4 component kit with hand-tuned motion, distributed as a [shadcn](https://ui.shadcn.com) registry. Components are copied into the project as source by default; the same components are also an npm library (\`asta-ui\`) for projects that would rather import than own them. Interactive components (dialog, dropdown menu, select, tooltip, tabs, accordion, checkbox, switch, slider, radio group, segmented control, avatar, command palette) come in two builds with the same props, look and motion: on Radix (\`radix-ui\`) or on Base UI (\`@base-ui/react\`). The headless library handles behaviour (focus trap, keyboard, ARIA); Astabyte adds the styling and motion. Use the build that matches the project: if it already depends on \`@base-ui/react\` (or \`components.json\` has a \`base-*\` style, or the \`@astabyte\` registry points at \`/r/base/\`), use Base UI; if it has \`radix-ui\` or \`@radix-ui/*\`, use Radix. Don't mix the two in one project.

- **Kit** (${uiItems.filter((i) => i.source === "kit").length}): everyday building blocks by atomic layer (Atoms, Molecules, Organisms).
- **Motion lab** (${uiItems.filter((i) => i.source === "lab").length}): focused motion components for real products: trading, payments, ecommerce, plus interaction pieces.

Browse: ${SITE} · Machine-readable index: ${SITE}/llms.txt · Registry index: ${SITE}/r/registry.json (Base UI: ${SITE}/r/base/registry.json)

## Install a component

Works in any React + Tailwind v4 project: Next.js, Vite, React Router, Astro (React islands), TanStack Start, Laravel + Inertia. Set up once (runs \`shadcn init\` when there is no \`components.json\`, then adds the \`@astabyte\` registry):

\`\`\`sh
pnpm dlx asta-ui@latest init            # Radix
pnpm dlx asta-ui@latest init --base     # Base UI
\`\`\`

Then add components by slug (several at once is fine). Without a flag the CLI uses what \`init\` chose; \`--base\` / \`--radix\` override it. Extra flags (\`-y\`, \`-o\`, \`-p\`) go to shadcn. \`npx\`, \`bunx\` and \`yarn dlx\` work too.

\`\`\`sh
pnpm dlx asta-ui@latest add <slug> [<slug>...] [--base]
pnpm dlx asta-ui@latest list [search]
pnpm dlx asta-ui@latest prompt <slug>
\`\`\`

Or with the shadcn CLI directly:

\`\`\`sh
pnpm dlx shadcn@latest add ${SITE}/r/<slug>.json        # Radix (also /r/radix/<slug>.json)
pnpm dlx shadcn@latest add ${SITE}/r/base/<slug>.json   # Base UI
pnpm dlx shadcn@latest add @astabyte/<slug>             # with the namespace below
\`\`\`

\`\`\`json
{ "registries": { "@astabyte": "${SITE}/r/{name}.json" } }
\`\`\`

(For Base UI use \`${SITE}/r/base/{name}.json\`. Items without primitives are identical in both.)

The file lands in \`components/astabyte/\`, its npm dependencies are installed and its colour tokens are merged into the project CSS. Import it from there, e.g. \`import { Button } from "@/components/astabyte/button"\`. Open \`${SITE}/<slug>\` for the usage example (the demo is the usage code).

Without the CLI: open the component page, copy the file(s) under Manual, and add the tokens from the page's \`globals.css\` tab.

## Or use the npm package

When the project should take updates instead of owning the source (or the user asks for a package), install the library build of the same components:

\`\`\`sh
pnpm add asta-ui radix-ui          # Radix build
pnpm add asta-ui @base-ui/react    # Base UI build
\`\`\`

\`\`\`css
@import "tailwindcss";
@import "asta-ui/styles.css";   /* tokens (:root light, .dark), eases and @source for the component classes */
\`\`\`

\`\`\`tsx
import { Button, Dialog, PriceChart, TextareaAui003 } from "asta-ui"; // Radix
import { Dialog } from "asta-ui/base";                                // Base UI
import { PriceChart } from "asta-ui/price-chart";                     // one component: "asta-ui/<slug>" or "asta-ui/base/<slug>"
\`\`\`

Names: kit items by component name (\`Dialog\`, \`Select\`, \`Toaster\` for toast), motion blocks by component name (\`PriceChart\`, \`OrderBook\`), variants by id in PascalCase (\`TextareaAui003\`, also by name, e.g. \`ChatComposer\`). Button's inline spinner is \`ButtonSpinner\`; \`Spinner\` is the standalone loader. Customise through props and the tokens; don't patch files in node_modules. If Tailwind misses classes, add \`@source "../node_modules/asta-ui/dist";\` (relative to the stylesheet). Don't mix the package and copied files of the same component.

## Rules when using or editing these components

- **Tokens, never hard-coded colours.** Use \`paper\` / \`paper-2\` (surfaces), \`ink\` / \`ink-2\` (text), \`mute\` (secondary text), \`brand\` (the one highlight colour) and \`signal\`, as Tailwind classes (\`bg-paper\`, \`text-ink\`, \`text-mute\`, \`bg-brand\`) or \`var(--color-*)\`. Canvas code reads them with \`getComputedStyle\`. Rebrand by remapping the tokens, not by editing components.
- **One accent.** Keep to dark/light surfaces, greys and the accent. In market UI, up = accent and down = neutral (no green/red unless the user asks).
- **Motion:** animate \`transform\` and \`opacity\` only; ease with \`cubic-bezier(.16,1,.3,1)\` or springs; interpolate values every frame rather than stepping; loops fade out instead of snapping back; honour \`prefers-reduced-motion\`.
- **Inputs:** every interactive piece supports pointer, touch and keyboard; keep focus rings (\`focus-visible:ring-brand\`).
- Components are client components (\`"use client"\`, ignored outside Next.js). In Astro, render them as islands with \`client:visible\`.
- Keep to one primitive library: install every Astabyte UI component with the same build (\`--base\` or not).
- Use fake data and fake brands in demos.

## Example requests

Typical things users ask for, and the components that cover them (more at ${SITE}/prompts):

${useCases.map((c) => `- **${c.title}**: ${c.description} Components: ${c.slugs.map((s) => `\`${s}\``).join(", ")}.`).join("\n")}

## Catalogue: kit

${table("kit")}

## Catalogue: motion lab

${table("lab")}

## Catalogue: variants

Standalone takes on a kit component, each with a global id (\`aui-001\`, \`aui-002\`…) and installable on its own. They are shown on the base component's page under Variants.

| Id | Variant | What it does | Primitives |
|---|---|---|---|
${variantItems.map((v) => `| \`${v.id}\` | [${row(v.title)}](${SITE}/${v.variant.base}#${v.id}) | ${row(v.description)} | ${base(v.slug)} |`).join("\n")}

Install a variant by its slug, e.g. \`pnpm dlx asta-ui@latest add textarea-aui-003\`.
`;

writeFileSync(join(process.cwd(), "skills", "astabyte-ui", "SKILL.md"), md);
console.log(`skills/astabyte-ui/SKILL.md: ${uiItems.length} components, ${variantItems.length} variants`);
