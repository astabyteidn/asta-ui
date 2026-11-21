import { CAP_CSS, LIST_CSS, LIST_TSX, ORDER_CSS } from "@/components/blog/demos/stagger/code";
import type { Post } from "../types";

const post: Post = {
  slug: "stagger",
  group: "motion",
  order: 4,
  title: "Stagger: lists that flow in, not pop in",
  summary: "Delay each item by a small step, move things in reading order, and cap the total so long lists never make people wait.",
  date: "2026-11-21",
  tldr: [
    "Delay each item by 30 to 50ms. Start at 40ms.",
    "Keep the whole list done within about 600ms.",
    "Bring things in the order people read them. Header, then content, then actions.",
    "Cap long lists. Only the first 6 items wait, and no item waits more than 300ms.",
  ],
  body: `
## Why stagger

When a list appears all at once, it lands as one block. Your eye has nowhere to start. Stagger gives each row a small delay, so the list flows in from top to bottom. The eye follows it and lands on the first row.

Drag the step below. Try 0ms, 40ms and 120ms.

::demo list

At 0ms the list pops in as a block. At 40ms it flows. It still reads as one list, and the last row starts at only 200ms. At 120ms each row arrives on its own. Now it feels like a slow load, not a list.

## Pick a step

- **30 to 50ms:** lists, menus, search results. Your default.
- **60 to 80ms:** a few large cards, like 3 pricing plans.
- **Over 100ms:** almost never. It reads as lag.

Then do the sum. The last item starts at (count − 1) × step. Add the duration of one item to get the total. Six rows at 40ms with a 300ms animation are done at 500ms. Try to stay under 600ms.

The step is small on purpose. Each item still runs the full 300ms. They overlap a lot, and that overlap is what makes it read as one motion.

## Keep the CSS simple

Give each item its index as a CSS variable, then multiply:

\`\`\`css
li { animation-delay: calc(var(--i) * 40ms); }
\`\`\`

Set \`--i\` from your loop in JavaScript. Change the step in one place and the whole list follows. Use \`animation-fill-mode: both\`, or \`both\` in the shorthand. Without it, items show at full opacity during their delay, then vanish and fade in.

Only animate \`opacity\` and \`transform\`. A small 8px rise is enough. Anything larger and the list seems to fall in.

## Move in reading order

Stagger is not only for lists. Any group of parts can enter in order. People read a dialog from the top: what is this, what do I fill in, what can I do. Bring it in that way.

::demo order

In order, the header leads, the fields follow 60ms later, and the buttons land last at 120ms. Your eye moves down with it and ends on Continue.

All at once is not wrong. It is just flat. For a dialog people open all day, flat is often fine. For a first-run screen or an empty state, order helps people find the next step.

Keep the parts few. Three groups is plenty. Staggering every label and icon inside a dialog turns it into a show.

## Cap long lists

The sum gets out of hand fast. A grid of 18 items at 50ms means the last one starts at 850ms. People wait for the grid before they can use it.

::demo cap

With the cap, only the first 6 items wait. Everything after starts together with item 6, at 300ms. The grid still flows at the top, where people look first, and nothing waits longer than 300ms.

Two more rules for long lists:

- Only stagger what is on screen. Rows below the fold should just be there when people scroll.
- Don't stagger on every update. New items in a live feed slide in one at a time. Sorting or filtering moves things instead. That is the [FLIP](/blog/flip) technique.

You can see it in the lab. In [Booking slots](/booking-slots), pick a day and its times stagger in at 45ms a step.

## Reduced motion

With reduced motion, drop the delay and the rise. A short fade for the whole list is enough. The demos here do exactly that.

## Support

\`animation-delay\`, \`calc()\` and CSS variables work in every browser in use today. The cap uses \`min()\` inside \`calc()\`, which works in Chrome 79, Safari 11.1 and Firefox 75. Older browsers drop the whole delay and show the grid at once, which is a fine fallback.

## Next

Stagger handles things that enter. Things that move to a new spot need a different trick. Next: [FLIP](/blog/flip).
`,
  demos: {
    list: {
      title: "Stagger step, live",
      caption: "**6 rows**, **300ms** each. At **40ms** the last row starts at **200ms** and the list is done at **500ms**. At **120ms** it takes **900ms**.",
      code: [
        { name: "list.css", code: LIST_CSS },
        { name: "List.tsx", code: LIST_TSX },
      ],
      height: 340,
    },
    order: {
      title: "Header, content, actions",
      caption: "In order: header at **0ms**, content at **60ms**, actions at **120ms**. Each part rises **6px** over **300ms**.",
      code: [{ name: "order.css", code: ORDER_CSS }],
      height: 320,
    },
    cap: {
      title: "18 tiles, capped at 6",
      caption: "**50ms** a step. No cap: the last tile starts at **850ms**. Capped at **6**: every tile has started by **300ms**.",
      code: [{ name: "cap.css", code: CAP_CSS }],
      height: 300,
    },
  },
};

export default post;
