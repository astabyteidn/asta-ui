# asta-ui

[Astabyte UI](https://ui.astabyte.com): motion-first React + Tailwind CSS v4 components. Interactive ones come in a Radix or a Base UI build with the same props, look and motion. This one package works two ways:

- **CLI:** copy a component's source into your project (shadcn style) and own it.
- **Library:** `import { Dialog } from "asta-ui"` and take updates with `pnpm update asta-ui`.

> **Beta.** Names and props can still change before 1.0. Pin the version and check the changelog before you update.

Works in Next.js, Vite, React Router, Astro (islands), TanStack Start and Gatsby.

## Copy the source (CLI)

```sh
pnpm dlx asta-ui@latest init            # sets up shadcn (if needed) and the @astabyte registry
pnpm dlx asta-ui@latest add dialog select
pnpm dlx asta-ui@latest add textarea-aui-003 --base
pnpm dlx asta-ui@latest list chart
pnpm dlx asta-ui@latest prompt price-chart   # a prompt for your AI coding agent
```

Works with `npx`, `bunx` and `yarn dlx` too. Under the hood it calls the [shadcn CLI](https://ui.shadcn.com/docs/cli) with our registry URLs, so the files land in your project and are yours to edit. Any extra flag (`-y`, `-o`, `-p src/components`) is passed to shadcn.

| Command | What it does |
|---|---|
| `init [--radix \| --base]` | Runs `shadcn init` when there is no `components.json`, then adds the `@astabyte` registry for the primitive you pick. |
| `add <name...> [--radix \| --base]` | Checks the names against the catalogue and installs them. Without a flag it uses what `init` chose (Radix by default). |
| `list [search]` | Lists every component and variant. |
| `prompt <name>` | Prints a ready-to-paste prompt for Claude Code, Cursor, Codex, v0 or Lovable. |

Set `ASTA_UI_URL` to point at another registry host (e.g. a local dev server).

## Import it (library)

```sh
pnpm add asta-ui radix-ui          # Radix build
pnpm add asta-ui @base-ui/react    # Base UI build
```

Needs React 18.3+ and Tailwind CSS v4. Add the stylesheet once, after Tailwind:

```css
@import "tailwindcss";
@import "asta-ui/styles.css";
```

It holds the tokens (`:root` light, `.dark` dark), the eases and an `@source` line, so Tailwind generates the classes the components use. If your setup misses them, add `@source "../node_modules/asta-ui/dist";` to your stylesheet (path relative to that file).

```tsx
import { Button, Dialog, PriceChart, TextareaAui003 } from "asta-ui"; // Radix build
import { Button, Dialog } from "asta-ui/base";                        // Base UI build
import { PriceChart } from "asta-ui/price-chart";                     // one component
import { Dialog } from "asta-ui/base/dialog";                         // one component, Base UI
```

| Entry | What it is | Needs |
|---|---|---|
| `asta-ui` | Every component, Radix build | `radix-ui` |
| `asta-ui/base` | Every component, Base UI build | `@base-ui/react` |
| `asta-ui/<slug>` | One component (Radix where it applies) | what that component uses |
| `asta-ui/base/<slug>` | One component, Base UI build | what that component uses |
| `asta-ui/styles.css` | Tokens + `@source` for Tailwind v4 | |

Components without primitives (motion blocks, inputs, badges…) are the same in both builds and need no headless package when imported by slug.

**Names** follow the site. Kit components go by their component name (`Dialog`, `Select`, `Toaster` and `useToast` for toast, `SignInCard`), motion blocks by theirs (`PriceChart`, `OrderBook`, `CardCheckout`) and variants by their id in PascalCase (`TextareaAui003`, also exported by name as `ChatComposer`). Button's inline spinner is exported as `ButtonSpinner`, so `Spinner` is the standalone loader. Props types are exported too (`DialogProps`, `SelectOption`…).

Every module is a client component (`"use client"`), so Next.js Server Components can render them directly. Motion blocks fill their parent: give the wrapper a size. They are designed on dark surfaces, so put them inside an element with the `dark` class.

MIT © Astabyte Labs
