// Copy-ready prompts for AI coding agents (Claude Code, Cursor, Codex, v0, Lovable).
// Plain data + string builders, no server code, so the site, llms.txt and scripts/gen-skill.ts share them.
import { kitItems } from "./kit";
import { labBlocks } from "./lab";
import type { Primitive } from "./primitive";
import { type UiItem, uiItems } from "./ui-catalog";

export const SITE = "https://ui.astabyte.com";

const LIB = { radix: "Radix primitives from the radix-ui package", base: "Base UI primitives from the @base-ui/react package" };

/** `primitives`: whether the item has interactive pieces built on a headless library. */
const rules = (p: Primitive, primitives = true) => `Rules:
- Keep the colour tokens (paper, paper-2, ink, ink-2, mute, brand). Don't restyle with hard-coded colours; rebrand by changing the token values in the CSS.
- Keep the motion as it is: transform and opacity only, and the prefers-reduced-motion fallback.
- Keep keyboard, focus and ARIA behaviour${primitives ? ` (interactive pieces are built on ${LIB[p]})` : ""}.${
  primitives ? `\n- Stay on ${p === "base" ? "Base UI" : "Radix"}: install other Astabyte UI components with${p === "base" ? " `--base`" : "out `--base`"} so the project uses one primitive library.` : ""
}
- Use fake data and fake brand names in examples.`;

const flag = (p: Primitive) => (p === "base" ? " --base" : "");

const setup = (p: Primitive) =>
  `If the project isn't set up yet, run \`pnpm dlx asta-ui@latest init${flag(p)}\` first: it runs \`shadcn init\` when needed and adds the @astabyte registry (Next.js, Vite, React Router, Astro, TanStack Start; Tailwind CSS v4).`;

/** The CLI command, then the plain shadcn equivalent. */
const install = (slugs: string[], p: Primitive) => `pnpm dlx asta-ui@latest add ${slugs.join(" ")}${flag(p)}
\`\`\`
Or with the shadcn CLI:
\`\`\`sh
pnpm dlx shadcn@latest add ${slugs.map((s) => `${SITE}/r/${p === "base" ? "base/" : ""}${s}.json`).join(" ")}`;

/** Prompt for one component. `imports` = the import lines a project would write (from the page's usage code). */
export function componentPrompt(item: UiItem, imports: string[] = [], primitives = false, p: Primitive = "radix"): string {
  const kit = kitItems.find((k) => k.slug === item.slug);
  const lab = labBlocks.find((b) => b.slug === item.slug);
  const parts = kit ? `\nIt includes: ${kit.parts.join(", ")}.` : "";
  const sizing = lab ? "\nIt fills its parent, so give the wrapper a size. It is designed on a dark surface: put it inside an element with the `dark` class." : "";
  const imp = imports.length
    ? `\n\nImport it like this:\n\`\`\`tsx\n${imports.join("\n")}\n\`\`\``
    : `\n\nThe files land in \`components/astabyte/\`; import from \`@/components/astabyte/${item.slug}\`.`;
  return `Add the Astabyte UI ${item.title} component to my project.

${item.description}${parts}${sizing}

Install it${primitives ? ` (${p === "base" ? "Base UI" : "Radix"} build)` : ""}:
\`\`\`sh
${install([item.slug], p)}
\`\`\`
${setup(p)}${imp}

Usage example and props: ${SITE}/${item.slug}
Full catalogue for context: ${SITE}/llms.txt

${rules(p, primitives)}

Use it to: [describe where it goes and what it should do]`;
}

export function starterPrompt(p: Primitive = "radix"): string {
  return `Use Astabyte UI (${SITE}) for the UI in this project: a motion-first React + Tailwind CSS v4 component kit distributed as a shadcn registry. Interactive components come in a Radix and a Base UI build; this project uses ${p === "base" ? "Base UI" : "Radix"}.

1. Read the catalogue first: ${SITE}/llms.txt (every component with its page and registry URL).
2. Install the agent skill so you keep the rules in later sessions:
\`\`\`sh
npx skills add astabyteidn/asta-ui
\`\`\`
3. Set up the project once (runs \`shadcn init\` if needed and adds the @astabyte registry to components.json):
\`\`\`sh
pnpm dlx asta-ui@latest init${flag(p)}
\`\`\`
Then add components by name: \`pnpm dlx asta-ui@latest add <slug>${flag(p)}\` (or \`pnpm dlx shadcn@latest add @astabyte/<slug>\`). Without the CLI, put this in components.json yourself:
\`\`\`json
{ "registries": { "@astabyte": "${SITE}/r/${p === "base" ? "base/" : ""}{name}.json" } }
\`\`\`
If I'd rather take updates than own the source, use the npm package instead: \`pnpm add asta-ui ${p === "base" ? "@base-ui/react" : "radix-ui"}\`, add \`@import "asta-ui/styles.css";\` after \`@import "tailwindcss";\`, and import from \`"${p === "base" ? "asta-ui/base" : "asta-ui"}"\` (names are on ${SITE}/llms.txt).

Prefer an Astabyte UI component over writing a new one whenever one fits, and compose pages from them.

${rules(p)}

What I'm building: [describe the app or page]`;
}

export interface UseCase {
  slug: string;
  title: string;
  description: string;
  slugs: string[];
  prompt: string;
  /** The same prompt for a Base UI project. */
  promptBase: string;
}

const CASES: { slug: string; title: string; description: string; slugs: string[]; ask: string }[] = [
  {
    slug: "trading-dashboard",
    title: "Trading dashboard",
    description: "A live market view: price line, candlesticks, order book and a ticket to place orders.",
    slugs: ["price-chart", "candlestick", "order-book", "trade-ticket", "segmented-control", "toast"],
    ask: "Build a trading dashboard page: a price chart on top with a segmented control for the time range, candlesticks below it, the order book on the right and a trade ticket under it. Show a toast when an order is placed. Use mock market data that ticks every second.",
  },
  {
    slug: "checkout",
    title: "Checkout",
    description: "Cart to paid: product options, add to cart, free-shipping progress, payment methods, card form and payment status.",
    slugs: ["variant-picker", "add-to-cart", "cart-drawer", "pay-methods", "card-checkout", "payment-status"],
    ask: "Build a checkout flow: a product card with product options and add to cart, a cart with the free-shipping bar, then a checkout step with payment methods and the card form, ending on a payment status screen. Keep state in React, mock the payment.",
  },
  {
    slug: "settings",
    title: "Settings page",
    description: "Account and preferences with tabs, switches, selects, sliders and a save toast.",
    slugs: ["settings-panel", "tabs", "switch", "select", "slider", "field", "button", "toast"],
    ask: "Build a settings page with tabs for Profile, Notifications and Appearance. Use fields for profile data, switches for notifications, a select and a slider for appearance, and a save button that shows a toast.",
  },
  {
    slug: "landing",
    title: "Landing page",
    description: "A product landing page: navbar, hero with motion buttons, pricing and footer.",
    slugs: ["navbar", "motion-button", "badge", "pricing", "footer"],
    ask: "Build a landing page for a fictional product: navbar, a hero with a badge, headline and two motion buttons, a pricing section and the footer.",
  },
  {
    slug: "sign-in",
    title: "Sign-in",
    description: "Auth screen with inputs, a hold-to-confirm action and the command palette for power users.",
    slugs: ["sign-in", "input", "checkbox", "hold-to-confirm", "command-palette"],
    ask: "Build the auth area: a sign-in screen, an account page with a hold-to-confirm \"Delete account\" action, and a command palette (Cmd+K) for navigating the app.",
  },
];

const known = new Set(uiItems.map((i) => i.slug));

export const useCases: UseCase[] = CASES.map((c) => {
  const slugs = c.slugs.filter((s) => known.has(s));
  const list = slugs.map((s) => `- ${uiItems.find((i) => i.slug === s)!.title} (\`${s}\`): ${SITE}/${s}`).join("\n");
  const prompt = (p: Primitive) => `${c.ask}

Use these Astabyte UI components (open each page for its usage example):
${list}

Install them in one go:
\`\`\`sh
${install(slugs, p)}
\`\`\`
${setup(p)}
Full catalogue for context: ${SITE}/llms.txt

${rules(p)}`;
  return { slug: c.slug, title: c.title, description: c.description, slugs, prompt: prompt("radix"), promptBase: prompt("base") };
});

/** Import lines from a usage snippet, for componentPrompt. */
export function importLines(code: string): string[] {
  return code.split("\n").filter((l) => /^import .* from "@\/components\/astabyte\//.test(l));
}
