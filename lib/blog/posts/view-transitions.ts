import { LAYOUT_CSS, LAYOUT_TSX, SHARED_CSS, SHARED_TSX, TIMING_CSS, TIMING_TSX, TRANSITION_TS } from "@/components/blog/demos/view-transitions/code";
import type { Post } from "../types";

const post: Post = {
  slug: "view-transitions",
  group: "web",
  order: 2,
  title: "View Transitions for state changes",
  summary: "Morph between two states of the same page with document.startViewTransition. A grid to list toggle, a shared element and custom timing, with a plain fallback.",
  date: "2026-11-21",
  tldr: [
    "Wrap a state change in document.startViewTransition. The browser snapshots before and after, then animates between them.",
    "Give an element a view-transition-name and it morphs on its own. Names must be unique on the page at that moment.",
    "In React, call flushSync inside the callback so the DOM is updated before the new snapshot.",
    "No API or reduced motion? Skip the transition and just update. Nothing breaks.",
  ],
  body: `
## Two snapshots and a morph

You change the page from one state to another. Grid to list, a thumbnail to a detail view, one sort order to the next. Without help the swap happens in one frame.

\`document.startViewTransition(update)\` adds the motion for you. It works in four steps:

1. The browser takes a picture of the current page.
2. It runs your \`update\` callback, which changes the DOM.
3. It takes a picture of the new page.
4. It animates from the first picture to the second, on a layer above the page.

By default the whole page cross-fades over 250ms. That alone is a small win. The real power comes from names.

## Names do the matching

Give an element \`view-transition-name: card-42\`. If an element with that name exists before and after, the browser treats them as one thing. It moves and resizes it from the old box to the new box, and cross-fades its content.

Here is the helper every demo uses:

\`\`\`ts
transition("vt-layout", () => setLayout("list"));
\`\`\`

It does three jobs. It falls back to a plain update when the API is missing or the user prefers reduced motion. It wraps the update in \`flushSync\`. And it tags the root element with a key, so each demo's CSS only applies to its own transitions.

\`flushSync\` matters in React. React batches state updates and may write the DOM a moment later. The browser takes the second snapshot when your callback returns. Without \`flushSync\` it photographs the old DOM, and nothing animates.

## Grid to list

Switch this photo gallery between grid and list. Each photo and each title has its own name.

::demo layout

Every photo travels from its grid cell to its list row and shrinks on the way. The titles slide over to sit beside their thumbnails. You wrote no positions and no keyframes. The browser worked out all 12 moves from the two layouts.

Names must be unique on the page while a transition runs. Two elements with the same name and the transition is skipped. So scope them. The demo builds names from React's \`useId()\`, so a second copy of this gallery on the page gets different names.

## A shared element

The classic case is a thumbnail that grows into a detail view. Only one element at a time may hold the name. So the picked thumbnail holds it, then hands it to the big image.

::demo shared

Open a photo, then go back. The image grows out of its exact cell and shrinks back into it. The text around it fades, because it has no name and rides along with the page cross-fade.

Two details make this work.

- Set the name on the thumbnail **before** the first snapshot. The demo does that with one \`flushSync\` before it starts the transition.
- The photo changes shape on the way. Add \`object-fit: cover\` to the old and new snapshots. Otherwise the browser stretches them to fit.

The same pattern fits a product card opening into a [cart drawer](/cart-drawer) or a row opening into a detail page.

## Your own timing

The browser default is 250ms with \`ease\`. It is fine, but it is not your product's curve. Style the pseudo-elements the browser builds during a transition:

- \`::view-transition-group(name)\` moves and resizes the box.
- \`::view-transition-old(name)\` and \`::view-transition-new(name)\` cross-fade the two pictures.

Use \`*\` to match every name. Scope the rule with the root key, or every transition on the site picks it up.

::demo timing

Try both. The default feels quick but a little flat. The house curve, \`cubic-bezier(.16, 1, .3, 1)\`, starts fast and lands softly. Push the duration to 1200ms to see it. Then come back to 400 to 600ms for real use.

The cross-fade runs in the first 60% of the move. Faces swap early, and the box settles after. That reads cleaner than both finishing at once.

## Reduced motion

The helper checks \`prefers-reduced-motion\` and skips the transition. The state still changes at once. If you want a gentle fade instead, keep the transition and set the group animation to a short opacity change.

## Support

- **Chrome and Edge 111** and newer support same-document view transitions.
- **Safari 18** and newer support them.
- **Firefox 144** and newer support them.

The fallback is one line in the helper. If \`document.startViewTransition\` does not exist, call \`update()\` directly. The page changes instantly, exactly as it would without this post.

Cross-document transitions between two pages use a different opt-in, \`@view-transition\`. Support there is narrower, so treat them as a bonus.

## Next

The demos here switch between fixed layouts. Next, make type itself adapt to the screen. Next: [Fluid type with clamp()](/blog/fluid-type).
`,
  demos: {
    layout: {
      title: "Grid to list",
      caption: "**12** named elements, **450ms** with the house curve. You write two layouts and the browser animates between them.",
      code: [
        { name: "Gallery.tsx", code: LAYOUT_TSX },
        { name: "layout.css", code: LAYOUT_CSS },
        { name: "transition.ts", code: TRANSITION_TS },
      ],
      height: 380,
    },
    shared: {
      title: "Thumbnail to detail",
      caption: "One name moves from the thumbnail to the big image. **500ms**, house curve, **object-fit: cover** so the photo never stretches.",
      code: [
        { name: "Photos.tsx", code: SHARED_TSX },
        { name: "shared.css", code: SHARED_CSS },
      ],
      height: 360,
    },
    timing: {
      title: "Default timing vs the house curve",
      caption: "The browser default is **250ms ease**. Ours is the house curve at **600ms**, with the cross-fade in the first **60%**.",
      code: [
        { name: "timing.css", code: TIMING_CSS },
        { name: "Sort.tsx", code: TIMING_TSX },
      ],
      height: 320,
    },
  },
};

export default post;
