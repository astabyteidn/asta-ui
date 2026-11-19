---
name: astabyte-skills-update
description: Keep the Astabyte agent skills (astabyte-ui, astabyte-design, astabyte-skills-update) current with ui.astabyte.com. Use when the user asks to update, refresh, install, check or auto-update the Astabyte skills, asks whether they have the latest Astabyte components or rules, or once per session before the first task that uses an Astabyte skill.
---

# Astabyte skills update

Astabyte ships its agent skills from https://ui.astabyte.com. Every release regenerates them: new components, new variants, changed rules. This skill keeps the copies on this machine in step, so the agent never works from an old catalogue.

## Check and update

Run this once per session, before the first Astabyte task, or whenever the user asks:

```sh
npx -y asta-ui@latest skills update --quiet --daily
```

- It reads https://ui.astabyte.com/skills.json, which lists every skill with a content hash and its file URLs.
- It looks for Astabyte skills in `~/.claude/skills`, `./.claude/skills`, `~/.agents/skills` and `./.agents/skills`, and rewrites only the ones whose hash changed. It never touches other skills.
- `--quiet` prints nothing when everything is current. `--daily` skips the network check when it already ran in the last 24 hours.
- When it updates a skill you are using, re-read that SKILL.md before you continue, and tell the user in one line what was updated.

If there is no network, or `npx` is missing, skip the check and carry on with the skills you have. Don't retry in a loop.

## Other commands

```sh
npx -y asta-ui@latest skills status              # installed copies and whether each one is current
npx -y asta-ui@latest skills install             # install every Astabyte skill into ~/.claude/skills
npx -y asta-ui@latest skills install --project   # into ./.claude/skills, to commit with the repo
npx -y asta-ui@latest skills install astabyte-ui --dir ~/.agents/skills
npx -y asta-ui@latest skills install --auto      # also update automatically at the start of each Claude Code session
```

`--auto` adds one SessionStart hook to `~/.claude/settings.json` (with `--project`, to `./.claude/settings.json`). The hook runs the update at most once a day and stays quiet unless something changed. Remove it with `npx -y asta-ui@latest skills auto --off`. Only add it when the user asks for automatic updates; it edits their settings.

## Without the CLI

- **Manifest:** https://ui.astabyte.com/skills.json
- **Files:** `https://ui.astabyte.com/skills/<name>/<path>`, e.g. https://ui.astabyte.com/skills/astabyte-ui/SKILL.md
- **MCP server:** https://ui.astabyte.com/mcp (Streamable HTTP, no auth). It always serves the live catalogue, so it never goes stale. Its `get_skills` tool returns the same manifest. Claude Code: `claude mcp add --transport http astabyte-ui https://ui.astabyte.com/mcp`.

To update by hand, download each file listed in the manifest over the old copy, keeping the folder layout (`SKILL.md`, `references/…`).
