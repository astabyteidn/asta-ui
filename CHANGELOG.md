# Changelog

Releases are git tags (`vX.Y.Z`); pushing a tag deploys ui.astabyte.com. Merging to `main` does not.

## 0.1.0 — 2026-11-17

First release.

- **Kit:** 30 everyday components by atomic layer (atoms, molecules, organisms), light tokens, pointer + touch + keyboard. Interactive components built on Radix primitives (`radix-ui`): dialog, dropdown menu, select, tooltip, tabs, accordion, checkbox, switch, slider, radio group, segmented control, avatar, command palette. Exit animations, origin-aware popups and reduced-motion support throughout.
- **Motion lab:** 24 motion components, including trading (price chart, candlesticks, order book, trade ticket), payments (card checkout, payment status, payment methods) and ecommerce (add to cart, product options, free shipping bar).
- **Variants:** standalone takes on a kit component with global ids (`aui-001`, `aui-002`…), each installable on its own (`/r/textarea-aui-003.json`) and shown on the base page under Variants. Starts with 8 textareas: labelled, auto-grow, chat composer, floating label, Markdown toolbar, mentions & commands, validation and AI prompt box.
- **shadcn registry:** `npx shadcn@latest add https://ui.astabyte.com/r/<slug>.json`, or `@astabyte/<slug>` with the registry namespace; index at `/r/registry.json`.
- **Any React framework:** Next.js, Vite, React Router, Astro (islands) and TanStack Start.
- **AI agents:** `astabyte-ui` agent skill (`npx skills add astabyteidn/asta-ui`, also at `/skill.md`), `/llms.txt`, and shadcn MCP support.
- **Prompts:** copy-ready prompts for Claude Code, Cursor, Codex, v0 and Lovable: a "Copy prompt" button and an "Or ask your AI agent" step on every component page, and a `/prompts` page with a starter prompt and use cases (trading dashboard, checkout, settings, landing page, sign-in).
