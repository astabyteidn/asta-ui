<div align="center">

# Astabyte UI

**React components that feel good to use.**
Copy them into your project, or install them from npm.

[Website](https://ui.astabyte.com) · [Docs](https://ui.astabyte.com/introduction) · [Icons](https://ui.astabyte.com/icons) · [Changelog](CHANGELOG.md)

</div>

> **Beta.** Names and props can change before 1.0.

## What's inside

| | |
|---|---|
| **Kit** | Everyday pieces. Buttons, inputs, dialogs, tabs, navbars, pricing. |
| **Motion lab** | Bigger components for real products. Price charts, order books, card checkout. |
| **Icons** | A separate set we draw ourselves. Each one has its own hover move. |

Built on Radix or Base UI. You pick. React 19, Tailwind CSS v4, TypeScript.

## Quick start

Copy the files into your project:

```sh
pnpm dlx asta-ui@latest init
pnpm dlx asta-ui@latest add button dialog
```

Or install the library:

```sh
pnpm add asta-ui radix-ui
```

```tsx
import { Button, Dialog } from "asta-ui";
```

Want Base UI? Add `--base` to the CLI, or install `@base-ui/react` and import from `asta-ui/base`.

Full guide: [Installation](https://ui.astabyte.com/installation).

## For AI agents

```sh
npx skills add astabyteidn/asta-ui
```

Also: [llms.txt](https://ui.astabyte.com/llms.txt) · [prompts](https://ui.astabyte.com/prompts) · [skill.md](https://ui.astabyte.com/skill.md)

## Contributing

```sh
bun install
bun run dev    # http://localhost:3792
```

`main` is protected. Open a PR, and CI has to pass before it merges.

Before you push:

```sh
bunx tsc --noEmit && bun run lint && bun run skill && bun run base --check && bun run build
```

Read [CLAUDE.md](CLAUDE.md) for where things live and the rules for motion and colour.

## License

[MIT](LICENSE) © Astabyte Labs
