// Copy-ready prompts for AI coding agents (Claude Code, Cursor, Codex, v0, Lovable).
// Plain data + string builders, no server code, so the site, llms.txt and scripts/gen-skill.ts share them.
import { kitItems } from "./kit";
import { labBlocks } from "./lab";
import { type UiItem, uiItems } from "./ui-catalog";

export const SITE = "https://ui.astabyte.com";

const rules = (radix = true) => `Rules:
- Keep the colour tokens (paper, paper-2, ink, ink-2, mute, brand). Don't restyle with hard-coded colours; rebrand by changing the token values in the CSS.
- Keep the motion as it is: transform and opacity only, and the prefers-reduced-motion fallback.
- Keep keyboard, focus and ARIA behaviour${radix ? " (interactive pieces are built on Radix primitives from the radix-ui package)" : ""}.
- Use fake data and fake brand names in examples.`;

const SETUP = `If shadcn isn't set up yet, run \`npx shadcn@latest init\` first (works in Next.js, Vite, React Router, Astro and TanStack Start with Tailwind CSS v4).`;

const install = (slugs: string[]) => `npx shadcn@latest add ${slugs.map((s) => `${SITE}/r/${s}.json`).join(" ")}`;

/** Prompt for one component. `imports` = the import lines a project would write (from the page's usage code). */
export function componentPrompt(item: UiItem, imports: string[] = [], radix = false): string {
  const kit = kitItems.find((k) => k.slug === item.slug);
  const lab = labBlocks.find((b) => b.slug === item.slug);
  const parts = kit ? `\nIt includes: ${kit.parts.join(", ")}.` : "";
  const sizing = lab ? "\nIt fills its parent, so give the wrapper a size. It is designed on a dark surface: put it inside an element with the `dark` class." : "";
  const imp = imports.length
    ? `\n\nImport it like this:\n\`\`\`tsx\n${imports.join("\n")}\n\`\`\``
    : `\n\nThe files land in \`components/astabyte/\`; import from \`@/components/astabyte/${item.slug}\`.`;
  return `Add the Astabyte UI ${item.title} component to my project.

${item.description}${parts}${sizing}

Install it with the shadcn CLI:
\`\`\`sh
${install([item.slug])}
\`\`\`
${SETUP}${imp}

Usage example and props: ${SITE}/${item.slug}
Full catalogue for context: ${SITE}/llms.txt

${rules(radix)}

Use it to: [describe where it goes and what it should do]`;
}

export function starterPrompt(): string {
  return `Use Astabyte UI (${SITE}) for the UI in this project: a motion-first React + Tailwind CSS v4 component kit distributed as a shadcn registry.

1. Read the catalogue first: ${SITE}/llms.txt (every component with its page and registry URL).
2. Install the agent skill so you keep the rules in later sessions:
\`\`\`sh
npx skills add astabyteidn/asta-ui
\`\`\`
3. Add the registry namespace to components.json so components install by name:
\`\`\`json
{ "registries": { "@astabyte": "${SITE}/r/{name}.json" } }
\`\`\`
Then: \`npx shadcn@latest add @astabyte/<slug>\`. ${SETUP}

Prefer an Astabyte UI component over writing a new one whenever one fits, and compose pages from them.

${rules()}

What I'm building: [describe the app or page]`;
}

export interface UseCase {
  slug: string;
  title: string;
  description: string;
  slugs: string[];
  prompt: string;
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
  return {
    slug: c.slug,
    title: c.title,
    description: c.description,
    slugs,
    prompt: `${c.ask}

Use these Astabyte UI components (open each page for its usage example):
${list}

Install them in one go:
\`\`\`sh
${install(slugs)}
\`\`\`
${SETUP}
Full catalogue for context: ${SITE}/llms.txt

${rules()}`,
  };
});

/** Import lines from a usage snippet, for componentPrompt. */
export function importLines(code: string): string[] {
  return code.split("\n").filter((l) => /^import .* from "@\/components\/astabyte\//.test(l));
}
