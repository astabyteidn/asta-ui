# Astabyte UI

A motion-first React component kit for [shadcn](https://ui.shadcn.com), plus a motion lab. This repo is the source of **[ui.astabyte.com](https://ui.astabyte.com)**.

- **Kit:** everyday building blocks by atomic layer: atoms (button, input, switch…), molecules (select, tabs, toast…) and organisms (navbar, pricing, sign-in…).
- **Built on Radix:** interactive components (dialog, dropdown menu, select, tooltip, tabs, accordion, checkbox, switch, slider, radio group, avatar, command palette) use [Radix primitives](https://www.radix-ui.com/primitives) via the `radix-ui` package for focus, keyboard and screen-reader behaviour. The styling and motion are ours.
- **Motion lab:** focused motion components for real products: trading (price chart, candlesticks, order book), payments (card checkout, payment status) and ecommerce (add to cart, product options).

## Use a component

Every component is a shadcn registry item. In a Tailwind v4 project with a `components.json`:

```sh
npx shadcn@latest add https://ui.astabyte.com/r/button.json
```

The file lands in `components/astabyte/`, its npm dependencies are installed and its colour tokens are merged into your CSS. Or open the component's page and copy the file by hand.

Works in any React 19 + Tailwind v4 framework the shadcn CLI supports: Next.js, Vite, React Router, Astro (as islands) and TanStack Start. See [Installation](https://ui.astabyte.com/installation).

With the namespace in `components.json` you can install by name:

```json
{ "registries": { "@astabyte": "https://ui.astabyte.com/r/{name}.json" } }
```

```sh
npx shadcn@latest add @astabyte/button
```

## AI agents

- **Agent skill:** `npx skills add astabyteidn/asta-ui` (Claude Code, Cursor, Codex…). Or copy [`skills/astabyte-ui/SKILL.md`](skills/astabyte-ui/SKILL.md) to `~/.claude/skills/astabyte-ui/`. Also served at [ui.astabyte.com/skill.md](https://ui.astabyte.com/skill.md).
- **llms.txt:** [ui.astabyte.com/llms.txt](https://ui.astabyte.com/llms.txt) lists every component with its page and registry URL.
- **Prompts:** [ui.astabyte.com/prompts](https://ui.astabyte.com/prompts) has copy-ready prompts (set up the kit, build a trading dashboard, checkout, settings page…), and every component page has a **Copy prompt** button. Built from `lib/prompts.ts`.
- **shadcn MCP:** `npx shadcn@latest mcp init`, with the `@astabyte` namespace above.

The skill's catalogue is generated from `lib/kit.ts` + `lib/lab.ts` by `bun run skill`; CI fails if `skills/` is out of date.

## Develop

```sh
bun install
bun run dev          # http://localhost:3792
bunx tsc --noEmit && bun run lint && bun run build
```

Stack: Next.js 16 (App Router, React Compiler), React 19, Tailwind CSS v4, shiki for build-time highlighting.

### Release

Merging to `main` only runs checks. Production deploys from version tags:

```sh
# bump "version" in package.json, add a CHANGELOG.md entry, commit, then
git tag v0.1.0 && git push --tags
```

CI checks the tag matches `package.json`, pushes the image as `:<version>` and `:latest`, rolls out the service and waits for `/healthz`. See [CHANGELOG.md](CHANGELOG.md).

### Layout

| Path | What |
|---|---|
| `components/kit/<slug>.tsx` | Kit component (the file people install) |
| `components/kit/demos/<slug>.tsx` | Its demo, also shown as the usage code. Register it in `components/kit/demos.ts` |
| `lib/kit.ts` | Kit metadata (title, layer, description) |
| `components/lab/blocks/*.tsx` | Motion lab components. Register in `components/lab/components.ts`, metadata in `lib/lab.ts` |
| `lib/ui-catalog.ts` | Merges kit + lab for the sidebar, ⌘K, pages and the `/r/*` registry |
| `lib/ui-source.ts` | Reads component sources from disk at build time for the code tabs and the registry |
| `scripts/gen-skill.ts` | Generates `skills/astabyte-ui/SKILL.md` (`bun run skill`) |
| `app/` | The site: home, docs pages, `/r/[file]` registry routes |

Components use colour tokens (`paper`, `ink`, `mute`, `accent`…) from `app/globals.css`, never hard-coded colours, so they follow your theme.

## Licence

[MIT](LICENSE) © Astabyte Labs
