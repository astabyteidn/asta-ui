// Generates skills/astabyte-ui/SKILL.md from the catalogue, so the agent skill never drifts from the site.
// Run from the repo root: bun run skill (CI fails if the committed file is out of date).
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { useCases } from "../lib/prompts";
import { uiItems } from "../lib/ui-catalog";

const SITE = "https://ui.astabyte.com";
const row = (s: string) => s.replace(/\|/g, "\\|");

const table = (source: "kit" | "lab") =>
  [
    "| Component | Group | What it does | Install |",
    "|---|---|---|---|",
    ...uiItems
      .filter((i) => i.source === source)
      .map((i) => `| [${row(i.title)}](${SITE}/${i.slug}) \`${i.slug}\` | ${row(i.group.replace("Motion · ", ""))} | ${row(i.description)} | \`${SITE}/r/${i.slug}.json\` |`),
  ].join("\n");

const md = `---
name: astabyte-ui
description: Build React UI with Astabyte UI (ui.astabyte.com), a motion-first shadcn component kit. Use when the user wants buttons, inputs, selects, menus, toasts, dialogs, a navbar, pricing, sign-in, settings or footer sections, or motion components for trading (price chart, candlesticks, order book, trade ticket), payments (card checkout, payment status, payment methods) or ecommerce (add to cart, product options, free shipping bar), or asks to install a component from ui.astabyte.com or the @astabyte registry.
---

# Astabyte UI

A React 19 + Tailwind CSS v4 component kit with hand-tuned motion, distributed as a [shadcn](https://ui.shadcn.com) registry. Components are copied into the project as source; there is no Astabyte package to depend on. Interactive components (dialog, dropdown menu, select, tooltip, tabs, accordion, checkbox, switch, slider, radio group, segmented control, avatar, command palette) are built on Radix primitives via the \`radix-ui\` package, which the shadcn CLI installs; they keep Radix's props for behaviour (focus trap, keyboard, ARIA) and add Astabyte's styling and motion.

- **Kit** (${uiItems.filter((i) => i.source === "kit").length}): everyday building blocks by atomic layer (Atoms, Molecules, Organisms).
- **Motion lab** (${uiItems.filter((i) => i.source === "lab").length}): focused motion components for real products: trading, payments, ecommerce, plus interaction pieces.

Browse: ${SITE} · Machine-readable index: ${SITE}/llms.txt · Registry index: ${SITE}/r/registry.json

## Install a component

Works in any React + Tailwind v4 project that has a \`components.json\` (run \`npx shadcn@latest init\` first): Next.js, Vite, React Router, Astro (React islands), TanStack Start, Laravel + Inertia.

\`\`\`sh
npx shadcn@latest add ${SITE}/r/<slug>.json
\`\`\`

With the namespace configured in \`components.json\`:

\`\`\`json
{ "registries": { "@astabyte": "${SITE}/r/{name}.json" } }
\`\`\`

\`\`\`sh
npx shadcn@latest add @astabyte/<slug>
\`\`\`

The file lands in \`components/astabyte/\`, its npm dependencies are installed and its colour tokens are merged into the project CSS. Import it from there, e.g. \`import { Button } from "@/components/astabyte/button"\`. Open \`${SITE}/<slug>\` for the usage example (the demo is the usage code).

Without the CLI: open the component page, copy the file(s) under Manual, and add the tokens from the page's \`globals.css\` tab.

## Rules when using or editing these components

- **Tokens, never hard-coded colours.** Use \`paper\` / \`paper-2\` (surfaces), \`ink\` / \`ink-2\` (text), \`mute\` (secondary text), \`brand\` (the one highlight colour) and \`signal\`, as Tailwind classes (\`bg-paper\`, \`text-ink\`, \`text-mute\`, \`bg-brand\`) or \`var(--color-*)\`. Canvas code reads them with \`getComputedStyle\`. Rebrand by remapping the tokens, not by editing components.
- **One accent.** Keep to dark/light surfaces, greys and the accent. In market UI, up = accent and down = neutral (no green/red unless the user asks).
- **Motion:** animate \`transform\` and \`opacity\` only; ease with \`cubic-bezier(.16,1,.3,1)\` or springs; interpolate values every frame rather than stepping; loops fade out instead of snapping back; honour \`prefers-reduced-motion\`.
- **Inputs:** every interactive piece supports pointer, touch and keyboard; keep focus rings (\`focus-visible:ring-brand\`).
- Components are client components (\`"use client"\`, ignored outside Next.js). In Astro, render them as islands with \`client:visible\`.
- Use fake data and fake brands in demos.

## Example requests

Typical things users ask for, and the components that cover them (more at ${SITE}/prompts):

${useCases.map((c) => `- **${c.title}**: ${c.description} Components: ${c.slugs.map((s) => `\`${s}\``).join(", ")}.`).join("\n")}

## Catalogue: kit

${table("kit")}

## Catalogue: motion lab

${table("lab")}
`;

writeFileSync(join(process.cwd(), "skills", "astabyte-ui", "SKILL.md"), md);
console.log(`skills/astabyte-ui/SKILL.md: ${uiItems.length} components`);
