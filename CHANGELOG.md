# Changelog

Releases are git tags (`vX.Y.Z`); pushing a tag deploys ui.astabyte.com. Merging to `main` does not.

## 0.5.1 — 2026-11-19

- **Lighter pages.** The Code tab mounts its highlighted source the first time you hover, focus or open it, so pages with many variants carry half the DOM: navbar 19.7k → 9.4k nodes, input 7.3k → 2.8k.
- **Icons stay on /icons.** The header ships only the core icons, and the full set of 532 with its hover CSS loads on the icons page alone.

## 0.5.0 — 2026-11-19

- **35 form variants, 28 → 63.**
  - **Input (aui-029–034):** floating label, search with recents, prefix and suffix, live validation, title to slug and a rolling amount field.
  - **Textarea, password and OTP (aui-035–042):** character budget, notes card, product review, code snippet, strength dial, rule tiles, split code and dark verify.
  - **Select, combobox, tags and dates (aui-043–051):** rich options, inline pill, grouped time zones, multi assign, create on enter, email chips, suggested tags, two-month range and quick presets.
  - **Checkbox, radio, switch and slider (aui-052–063):** add-on cards, task list, permission tree, plan picker, segmented range, swatches, settings rows, icon thumb, theme, value bubble, stepped and volume.
- **Icons, 131 → 532** in 22 groups, each with its own hover move. The /icons page has search, size and stroke sliders, category chips and keyboard navigation.
- **Logos:** a new /logos page with 215 product and tech logos from Simple Icons (CC0). Copy as SVG or JSX, in mono or brand colour.
- **Header:** 56px, one pill that slides between links and rests on the current section, and tile menus for Components and Motion. Once you scroll it turns solid paper, with no blur, fade tail or border.
- **Sidebar:** the filter and the Kit / Motion tabs stay pinned while the list scrolls, and focus rings are no longer clipped.

## 0.4.0 — 2026-11-19

- **20 new variants, 8 → 28.**
  - **Navbar (aui-009–014):** compact bars with 14px links and small buttons. Minimal, Wordmark and Docs have mega menus of tiles. Glass pill floats over a painted hero, App header opens a command palette, Reading swaps its links for the title and a live percent read.
  - **Sign-in (aui-015–020):** magic link, painted split, social first, two-step, passkey and sign up.
  - **Pricing (aui-021–024):** comparison table, painted plan, usage calculator and tier picker.
  - **Footer (aui-025–028):** minimal, dark glow, landscape and status.
  - A few variants use public-domain paintings (Seurat, Monet, Van Gogh, Pissarro) from `public/lab/art/`.
- **Demos say Astabyte.** Every brand in components and demos is now Astabyte. Other companies are plain descriptions.
- **Performance standard.** `bun run perf` checks every component for layout animation, leaked timers and listeners, bare `<style>` tags, unpaused loops and file size. It runs in CI. The indeterminate spinner now moves with transform only.
- **Smoother docs.** Previews keep their height after they unmount, so scrolling never jumps. Preview and Code switch without the two panels overlapping, and the tabs work with arrow keys.

## 0.3.0 — 2026-11-18

- **Kit, 30 → 68 components.**
  - **Atoms:** rating, progress (`ProgressBar`, `ProgressRing`), alert, breadcrumb, pagination, copy button (`ClipboardButton`), toggle group, range slider, color picker, avatar group (`AvatarStack`) and inline edit.
  - **Molecules:** date picker, combobox, stepper, file upload, OTP input, popover, drawer, password input (`PasswordField`), timeline, carousel, stat card, empty state, context menu, hover card, tree view, image compare and announcement bar.
  - **Organisms:** data table, sidebar, kanban board, onboarding checklist, comments, AI chat, event calendar, checkout, team members and notification center.
  - Names that already existed in the package keep their old meaning. The new ones get their own names, shown in brackets above.
- **Motion lab, 24 → 34 cards:** plan switcher, shipment tracker, payment received, wishlist, chat thread, seat picker, now playing, booking slots, notification stack and token swap.
- **Icons, 40 → 131.** 91 new icons, each with its own small hover move: the clock hand spins, the wifi bars light up one by one, the compass needle swings.

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
