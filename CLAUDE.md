# CLAUDE.md — asta-ui

Source of ui.astabyte.com: a motion-first component kit (shadcn registry) plus a motion lab. Public repo (MIT). Split out of the private `astabyte` monorepo on 2026-11-17; the studio site astabyte.com stays there.

- **Style** (differs from astabyte.com): white ground, black and white, a little blue (`accent` #2f54eb), only slightly rounded (buttons 6–9px, cards 10–14px, no pills except switches/avatars/dots), no lime. Not a copy of theweekendproject.club: left-aligned hero with a spec-sheet readout, no hand-drawn scribbles. The header has no background and is not sticky; docs sidebars stick at `top-0`.
- `.ui-light`/`.ui-dark` in `app/globals.css` re-scope the tokens; in both, `signal` is black/white instead of lime, so components use `var(--color-signal)` / `var(--color-accent)` (canvas blocks read them with `getComputedStyle`), never hard-coded colours.
- Hero = `SwapWord` (click to swap, scramble, drawn as a selected layer), story = `LitText`.
- **Kit:** atoms / molecules / organisms, metadata in `lib/kit.ts`, file `components/kit/<slug>.tsx`, demo `components/kit/demos/<slug>.tsx` registered in `components/kit/demos.ts`. Kit files use tokens only, local `cx`, may import other kit files; the demo doubles as the Usage code.
- **Motion lab:** `components/lab/blocks/*`, registered in `components/lab/components.ts`, metadata in `lib/lab.ts`. Real use cases (trading, payments, ecommerce) that look like polished product UI and fill the card; one focused, self-looping motion moment per card. Palette ONLY dark surfaces, white/greys and one blue: no green/red/gold, no coloured illustrations. Market up = accent, down = neutral. Fake data and brands only. Motion: transform/opacity, one easing `cubic-bezier(.16,1,.3,1)` or springs, values interpolated per frame, loops fade out instead of snapping.
- Placeholder photos come from Unsplash (free licence), self-hosted under `public/lab/`, neutral and unbranded.
- `lib/ui-catalog.ts` merges kit + lab for the sidebar, ⌘K, pages and the `/r/*` registry. Component pages read sources from disk at build time (`lib/ui-source.ts`, fully static).
- Pageviews go to the Astabyte API (`POST /api/analytics/collect`, routed by nginx), namespaced with the `/ui` prefix.
- Never name or show real web3 projects in demos.
- Commits: English, one line, Conventional Commits, no body or trailers.
- Before finishing: `bunx tsc --noEmit && bun run lint && bun run build`.
- Deploy: push to `main` → `.github/workflows/deploy.yml` builds the image, calls the service webhook and waits for `https://ui.astabyte.com/healthz`.
