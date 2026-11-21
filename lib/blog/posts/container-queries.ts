import { CARD_CSS, CHIPS_CSS, SLOTS_TSX, UNITS_CSS } from "@/components/blog/demos/container-queries/code";
import type { Post } from "../types";

const post: Post = {
  slug: "container-queries",
  group: "web",
  order: 4,
  title: "Container queries: style the slot, not the screen",
  summary: "Let a card pick its layout from the space it sits in. Same component in a sidebar, a grid or a full-width page, with no layout props.",
  date: "2026-11-21",
  tldr: [
    "Mark the slot with container-type: inline-size. Then style its children with @container instead of @media.",
    "Name containers, like container: card / inline-size, so a query always finds the right one.",
    "Write the narrow layout as the default. Wide layouts go inside @container. Old browsers get the narrow one.",
    "Use cqi units to size padding and type by the slot. 1cqi is 1% of the container's width.",
    "A container can't size itself from its content. Give it a width from its parent.",
  ],
  body: `
## Ask the slot, not the screen

Media queries ask how wide the window is. A component rarely cares. A product card in a 280px sidebar is narrow on a 1440px screen. The same card in a full-width page is wide on a tablet.

So teams add props. \`compact\`, \`horizontal\`, \`size="lg"\`. Every place that uses the card has to pick one, and every new layout needs another.

Container queries let the card ask its parent instead. The card reads the width of the slot it sits in and picks a layout by itself.

## Set up a container

It takes two steps.

1. **Mark the slot.** \`container: card / inline-size\` makes the element a container named \`card\` that can be queried by width.
2. **Query it.** \`@container card (min-width: 360px)\` works like a media query, but measures that slot.

Drag the slot below. The card has three layouts. It is compact under **360px**, a row from **360px** and wide from **560px**. The labels above the card use the same queries, so CSS lights up the one that applies.

::demo breakpoints

There is no JavaScript in the layout. The slider only sets the slot's width. Press Replay to jump through all three.

Name your containers. An unnamed \`@container\` query uses the nearest ancestor that is a container, and that might be a container you didn't mean. A name makes the target explicit.

Pick breakpoints from the content, not from devices. 360px is where the image fits beside the text without squeezing the title. 560px is where the specs and the button fit on one row. Those numbers come from the card, so they stay true wherever the card goes.

## One card, two slots

Here is the real payoff. The same component sits in a sidebar and in the main area. Neither gets a prop.

::demo slots

With the sidebar shown, the sidebar card is compact and the main card is a row. Hide the sidebar and the main card becomes wide. The window didn't change. The slot did.

This is also why container queries make components easier to share. Our [Stat card](/stat-card) and [Pricing](/pricing) components use the same idea, so they fit a dashboard grid, a sidebar or a full page.

## Units that follow the slot

Layout is one half. Size is the other. Container query units measure the container the way \`vw\` measures the window.

- **cqi** is 1% of the container's inline size, which is its width in English.
- **cqb** is 1% of its block size. You rarely need it.
- **cqmin** and **cqmax** pick the smaller or larger of the two.

Wrap them in \`clamp()\` so they stop at sensible limits. The stat card below sizes its padding, its number and its label in \`cqi\`.

::demo units

At **200px** the padding is **12px** and the number is **24px**. At **600px** the padding is **32px** and the number reaches its cap of **56px**. One card works as a small tile and as a hero number. The same math as [Fluid type](/blog/fluid-type) applies, with \`cqi\` in place of \`vw\`.

## Where it goes wrong

- **A container can't size itself from its content.** \`inline-size\` containment means the content doesn't affect the width. A container inside a shrink-to-fit parent, like an inline-block or an auto-width flex item, collapses to zero. Give it a width from its parent, or let it fill a grid track.
- **You can't query yourself.** An element's own \`@container\` rules look at its ancestors. Put \`container-type\` on the slot and the styles on the card inside.
- **Don't use size by default.** \`container-type: size\` also contains height, so the element needs a fixed height. Use \`inline-size\` unless you really query height.
- **Don't drop media queries.** Page layout still depends on the window. Use media queries for the page and container queries for the parts.

## Support

Container size queries and \`cqi\` units work in Chrome 105, Safari 16 and Firefox 110.

The fallback is in how you write the CSS. Make the narrow layout the default and put wider layouts inside \`@container\`. A browser that doesn't know container queries skips those blocks and shows the narrow layout, which works in any slot. Without a container ancestor, \`cqi\` falls back to the small viewport size, so wrap it in \`clamp()\` to keep the values sane.

## Next

Container queries let a part react to its size. \`:has()\` lets it react to its content. Next: [The :has() selector](/blog/has-selector).
`,
  demos: {
    breakpoints: {
      title: "One card, three layouts",
      caption: "Compact under **360px**, a row from **360px**, wide from **560px**. The slider sets the slot width directly, with no transition. Wide slots are scaled down to fit.",
      code: [
        { name: "card.css", code: CARD_CSS },
        { name: "labels.css", code: CHIPS_CSS },
      ],
      height: 480,
    },
    slots: {
      title: "Sidebar slot · main slot",
      caption: "The sidebar is **220px**, so its card is compact. The main card is a row, and turns wide past **560px** when the sidebar hides. On a phone both slots stack.",
      code: [
        { name: "Page.tsx", code: SLOTS_TSX },
        { name: "card.css", code: CARD_CSS },
      ],
      height: 460,
    },
    units: {
      title: "Padding and type in cqi",
      caption: "Padding is **6cqi** between **12** and **32px**. The number is **11cqi** between **24** and **56px**. The numbers above the card are the real sizes.",
      code: [{ name: "stat.css", code: UNITS_CSS }],
      height: 400,
    },
  },
};

export default post;
