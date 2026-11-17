# Changelog

Releases are git tags (`vX.Y.Z`); pushing a tag deploys ui.astabyte.com. Merging to `main` does not.

## 0.2.1 — 2026-11-18

- **Release:** the npm package is published by GitHub Actions through Trusted Publishing. No npm token in CI.
- **Package build:** types come from one tsc run, so building the package takes seconds and fits in CI memory.

## 0.2.0 — 2026-11-17

- **Radix or Base UI:** every interactive component now also ships on [Base UI](https://base-ui.com) (`@base-ui/react`), with the same props, look and motion: accordion, avatar, button (`asChild` via `useRender`), checkbox, command palette, dialog, dropdown menu, radio group, segmented control, select (plain and searchable), slider, switch, tabs, tooltip and the AI prompt box (`textarea-aui-008`). Components that use them (pricing, navbar, footer, sign-in, settings panel) come in both builds too.
- **Registry:** `/r/base/<slug>.json` is the Base UI build, `/r/radix/<slug>.json` (and `/r/<slug>.json` as before) the Radix build; Base UI indexes at `/r/base/registry.json`. Base UI items depend on `@base-ui/react` and pull in the Base UI build of their kit dependencies.
- **CLI:** `npx asta-ui@latest init [--base]` sets up shadcn and the `@astabyte` registry; `npx asta-ui@latest add <names...> [--base]`, `list` and `prompt`. It is now the main install command across the site; the plain shadcn command stays as a second line.
- **Docs:** a global **Primitive: Radix | Base UI** switch (remembered, or `?primitive=base`) swaps install commands, code, prompts and the live preview without a layout shift; the spec card names the primitive. Introduction and Installation explain the choice.
- **npm package `asta-ui`:** the CLI's package is now also a component library. `import { Dialog, Button, PriceChart, TextareaAui003 } from "asta-ui"` is the Radix build, `"asta-ui/base"` the Base UI build, `"asta-ui/<slug>"` and `"asta-ui/base/<slug>"` one component at a time, and `import "asta-ui/styles.css"` adds the tokens plus an `@source` line for Tailwind v4. ESM with types, every module `"use client"`, `sideEffects` only for CSS; `react`/`react-dom` are peers, `radix-ui` and `@base-ui/react` optional peers. Built from the same sources as the registry (`bun packages/asta-ui/build.ts`). Button's inline spinner is exported as `ButtonSpinner` so `Spinner` stays the standalone loader.
- **Docs:** component pages have a third install step, **Package** (switch-aware: `asta-ui` + `radix-ui`, or `asta-ui/base` + `@base-ui/react`); Installation has an "Install as a package" section. pnpm is the first package-manager tab everywhere.
- **Fix:** price chart, candlesticks and order book seed their first frame deterministically, so server-rendered markup matches the client (no hydration mismatch, and Next.js prerendering with Cache Components works).
- Prompts, the agent skill and `llms.txt` cover both builds, the CLI and the package.
- **Astabyte Icons:** a separate icon set, not part of the kit, (40 icons, 24 grid, 1.75 stroke) at `/icons`. Each icon has its own hover motion, click to copy the SVG. Button arrows, search and the header use it.
- **Header:** GitHub link with the star count, an Icons link and a Beta badge. Search (⌘K) runs on our command palette, with fuzzy matching on names and descriptions.
- **Card checkout:** redesigned as a white illustrated card with the back peeking out behind. The front slides aside for the CVC.
- **Docs:** rewritten in short plain sentences, bigger type, centred layout up to 1600px. Popups open without jank: no backdrop blur, keyframes hoisted once.

## 0.1.0 — 2026-11-17

First release.

- **Kit:** 30 everyday components by atomic layer (atoms, molecules, organisms), light tokens, pointer + touch + keyboard. Interactive components built on Radix primitives (`radix-ui`): dialog, dropdown menu, select, tooltip, tabs, accordion, checkbox, switch, slider, radio group, segmented control, avatar, command palette. Exit animations, origin-aware popups and reduced-motion support throughout.
- **Motion lab:** 24 motion components, including trading (price chart, candlesticks, order book, trade ticket), payments (card checkout, payment status, payment methods) and ecommerce (add to cart, product options, free shipping bar).
- **Variants:** standalone takes on a kit component with global ids (`aui-001`, `aui-002`…), each installable on its own (`/r/textarea-aui-003.json`) and shown on the base page under Variants. Starts with 8 textareas: labelled, auto-grow, chat composer, floating label, Markdown toolbar, mentions & commands, validation and AI prompt box.
- **shadcn registry:** `npx shadcn@latest add https://ui.astabyte.com/r/<slug>.json`, or `@astabyte/<slug>` with the registry namespace; index at `/r/registry.json`.
- **Any React framework:** Next.js, Vite, React Router, Astro (islands) and TanStack Start.
- **AI agents:** `astabyte-ui` agent skill (`npx skills add astabyteidn/asta-ui`, also at `/skill.md`), `/llms.txt`, and shadcn MCP support.
- **Prompts:** copy-ready prompts for Claude Code, Cursor, Codex, v0 and Lovable: a "Copy prompt" button and an "Or ask your AI agent" step on every component page, and a `/prompts` page with a starter prompt and use cases (trading dashboard, checkout, settings, landing page, sign-in).
