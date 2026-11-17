# Astabyte UI

React components that feel good to use. Copy them into your project, or install them from npm.

This repo is the source of **[ui.astabyte.com](https://ui.astabyte.com)**.

> **Beta.** Names and props can change before 1.0. Check [CHANGELOG.md](CHANGELOG.md) before you update.

## TL;DR

- **Kit:** everyday pieces, from atoms (button, input, switch) to molecules (select, tabs, toast) to organisms (navbar, pricing, sign-in).
- **Motion lab:** bigger components for real products. Price charts, order books, card checkout, add to cart.
- **Icons:** separate from the kit. A small set we draw ourselves, each with its own hover move. Same grid, same stroke. Copy any of them as SVG at [ui.astabyte.com/icons](https://ui.astabyte.com/icons).
- **Radix or Base UI:** interactive parts come in both builds, with the same props, look and motion. You pick.
- **React 19, Tailwind CSS v4, TypeScript.** One file per component.

## Add a component

Works in any React 19 project with Tailwind v4: Next.js, Vite, React Router, TanStack Start, or Astro islands.

```sh
pnpm dlx asta-ui@latest init
pnpm dlx asta-ui@latest add button dialog
```

The files land in `components/astabyte/`. They're yours now. Change anything.

Want Base UI? Add `--base` to both commands. `npx`, `bunx` and `yarn dlx` work too.

More commands:

- `list` prints every component.
- `prompt <name>` prints a prompt for your AI agent.

Full guide: [Installation](https://ui.astabyte.com/installation).

### With the shadcn CLI

Every component is a plain shadcn registry item, so this works too:

```sh
pnpm dlx shadcn@latest add https://ui.astabyte.com/r/button.json        # Radix
pnpm dlx shadcn@latest add https://ui.astabyte.com/r/base/button.json   # Base UI
```

Add the namespace to `components.json` and you can install by name:

```json
{ "registries": { "@astabyte": "https://ui.astabyte.com/r/{name}.json" } }
```

One namespace points at one build. Add `@astabyte-base` with `/r/base/{name}.json` if you want both.

## Or import it as a package

Don't want the files in your repo? Install the library instead.

```sh
pnpm add asta-ui radix-ui          # Radix build
pnpm add asta-ui @base-ui/react    # Base UI build
```

```css
@import "tailwindcss";
@import "asta-ui/styles.css";
```

```tsx
import { Button, Dialog, PriceChart } from "asta-ui";   // Radix
import { Dialog } from "asta-ui/base";                   // Base UI
import { PriceChart } from "asta-ui/price-chart";        // one component
```

Details in the [package README](packages/asta-ui/README.md).

## AI agents

- **Skill:** `npx skills add astabyteidn/asta-ui`. Works with Claude Code, Cursor and Codex. Also at [ui.astabyte.com/skill.md](https://ui.astabyte.com/skill.md).
- **llms.txt:** [ui.astabyte.com/llms.txt](https://ui.astabyte.com/llms.txt) lists every component with its page and registry URL.
- **Prompts:** copy-ready prompts at [ui.astabyte.com/prompts](https://ui.astabyte.com/prompts). Every component page has a Copy prompt button too.
- **shadcn MCP:** `npx shadcn@latest mcp init`, with the `@astabyte` namespace above.

## Develop

```sh
bun install
bun run dev          # http://localhost:3792
```

Before you open a PR:

```sh
bunx tsc --noEmit && bun run lint && bun run skill && bun run base --check && bun run build
```

A few things to know:

- Changed a Radix component? Make the same change in its twin under `components/kit/base/`, then run `bun run base`.
- Added a component or changed a description? Run `bun run skill`. CI fails if `skills/` is stale.
- Components use colour tokens like `paper`, `ink` and `brand`. Never hard-coded colours, so they follow your theme.
- Motion uses transform and opacity only, and respects reduced motion.

Stack: Next.js 16, React 19, Tailwind CSS v4, shiki for build-time highlighting.

### Where things live

| Path | What |
|---|---|
| `components/kit/` | Kit components, the files people install |
| `components/kit/demos/` | Demos, also shown as usage code |
| `components/kit/base/` | Base UI builds. Some hand-written, the rest from `scripts/gen-base.ts` |
| `components/lab/blocks/` | Motion lab components |
| `components/icons/` | The icon set |
| `lib/kit.ts`, `lib/lab.ts` | Titles, groups and descriptions |
| `lib/ui-catalog.ts` | Kit + lab merged for the sidebar, search, pages and registry |
| `packages/asta-ui/` | The npm package: CLI and library |
| `skills/astabyte-ui/` | Agent skill, generated. Don't edit by hand |

### Release

Pushing to `main` only runs checks. Tags deploy.

1. Bump `version` in `package.json` and `packages/asta-ui/package.json`.
2. Add a CHANGELOG entry and commit.
3. `git tag vX.Y.Z && git push origin vX.Y.Z`

CI then deploys the site and publishes the package to npm.

## Licence

[MIT](LICENSE) © Astabyte Labs
