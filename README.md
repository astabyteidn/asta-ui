<div align="center">

# Astabyte UI

**React components that feel good to use.**
Copy them into your project, or install them from npm.

[Website](https://ui.astabyte.com) · [Docs](https://ui.astabyte.com/introduction) · [Icons](https://ui.astabyte.com/icons) · [Releases](https://github.com/astabyteidn/asta-ui/releases) · [Changelog](CHANGELOG.md)

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

Three skills live in [`skills/`](skills):

| Skill | What it does |
|---|---|
| [`astabyte-ui`](skills/astabyte-ui/SKILL.md) | Installs and uses the components |
| [`astabyte-design`](skills/astabyte-design/SKILL.md) | Teaches the Astabyte look: colour, type, motion, copy |
| [`astabyte-skills-update`](skills/astabyte-skills-update/SKILL.md) | Keeps the installed skills in step with each release |

Install them with our CLI, and keep them current:

```sh
npx asta-ui@latest skills install    # ~/.claude/skills (--project for ./.claude/skills, --dir for any folder)
npx asta-ui@latest skills update     # rewrite only the skills that changed
npx asta-ui@latest skills auto       # Claude Code: check once a day at session start
```

The skills also check for updates themselves, once a session, against [skills.json](https://ui.astabyte.com/skills.json).

Or with the [skills](https://github.com/vercel-labs/skills) CLI:

```sh
npx skills add astabyteidn/asta-ui                            # pick from all
npx skills add astabyteidn/asta-ui --skill astabyte-design   # just one
```

Or copy a skill folder by hand:

| Agent | Personal | Project |
|---|---|---|
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Codex | `~/.agents/skills/` | `.agents/skills/` |
| Gemini CLI | `~/.gemini/skills/` or `~/.agents/skills/` | `.gemini/skills/` or `.agents/skills/` |
| Pi | `~/.pi/agent/skills/` or `~/.agents/skills/` | `.pi/skills/` or `.agents/skills/` |

```sh
git clone --depth 1 https://github.com/astabyteidn/asta-ui
cp -r asta-ui/skills/astabyte-design ~/.agents/skills/
```

Gemini CLI can also install straight from git: `gemini skills install https://github.com/astabyteidn/asta-ui.git --path skills/astabyte-design`.

### MCP server

The site runs an MCP server at `https://ui.astabyte.com/mcp` (Streamable HTTP, no key, read-only). It always serves the live catalogue: search components, get one with its source, setup steps, the design guide and the current skills.

```sh
claude mcp add --transport http astabyte-ui https://ui.astabyte.com/mcp
```

Also: [llms.txt](https://ui.astabyte.com/llms.txt) · [prompts](https://ui.astabyte.com/prompts) · [skill.md](https://ui.astabyte.com/skill.md)

## Contributing

PRs are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

```sh
bun install
bun run dev    # http://localhost:3792
```

- Questions and help: [SUPPORT.md](SUPPORT.md)
- Security problems: [SECURITY.md](SECURITY.md), never a public issue
- Everyone follows the [Code of Conduct](CODE_OF_CONDUCT.md)
- Every version is on the [Releases](https://github.com/astabyteidn/asta-ui/releases) page

## License

[MIT](LICENSE) © Astabyte Labs
