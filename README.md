# Astabyte UI

A motion-first React component kit for [shadcn](https://ui.shadcn.com), plus a motion lab. This repo is the source of **[ui.astabyte.com](https://ui.astabyte.com)**.

- **Kit:** everyday building blocks by atomic layer: atoms (button, input, switch…), molecules (select, tabs, toast…) and organisms (navbar, pricing, sign-in…).
- **Motion lab:** focused motion components for real products: trading (price chart, candlesticks, order book), payments (card checkout, payment status) and ecommerce (add to cart, product options).

## Use a component

Every component is a shadcn registry item. In a Tailwind v4 project with a `components.json`:

```sh
npx shadcn@latest add https://ui.astabyte.com/r/button.json
```

The file lands in `components/astabyte/`, its npm dependencies are installed and its colour tokens are merged into your CSS. Or open the component's page and copy the file by hand.

## Develop

```sh
bun install
bun run dev          # http://localhost:3792
bunx tsc --noEmit && bun run lint && bun run build
```

Stack: Next.js 16 (App Router, React Compiler), React 19, Tailwind CSS v4, shiki for build-time highlighting.

### Layout

| Path | What |
|---|---|
| `components/kit/<slug>.tsx` | Kit component (the file people install) |
| `components/kit/demos/<slug>.tsx` | Its demo, also shown as the usage code. Register it in `components/kit/demos.ts` |
| `lib/kit.ts` | Kit metadata (title, layer, description) |
| `components/lab/blocks/*.tsx` | Motion lab components. Register in `components/lab/components.ts`, metadata in `lib/lab.ts` |
| `lib/ui-catalog.ts` | Merges kit + lab for the sidebar, ⌘K, pages and the `/r/*` registry |
| `lib/ui-source.ts` | Reads component sources from disk at build time for the code tabs and the registry |
| `app/` | The site: home, docs pages, `/r/[file]` registry routes |

Components use colour tokens (`paper`, `ink`, `mute`, `accent`…) from `app/globals.css`, never hard-coded colours, so they follow your theme.

## Licence

[MIT](LICENSE) © Astabyte Labs
