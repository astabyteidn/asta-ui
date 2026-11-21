import { GALLERY_CSS, PROGRESS_CSS, REVEAL_CSS } from "@/components/blog/demos/scroll-driven-animation/code";
import type { Post } from "../types";

const post: Post = {
  slug: "scroll-driven-animation",
  group: "motion",
  order: 6,
  title: "Scroll-driven animation in plain CSS",
  summary: "Tie a keyframe animation to scroll position with animation-timeline. A progress bar, cards that reveal on entry and a gallery, with no scroll listener.",
  date: "2026-11-21",
  tldr: [
    "animation-timeline swaps the clock for a scroll position. 0% is the top of the scroll, 100% is the bottom.",
    "Use scroll() for progress of a whole scroller. Use view() for one element crossing the visible area.",
    "Name a timeline with scroll-timeline when the animated element is not inside the scroller.",
    "Wrap it all in @supports. Browsers without it show the content static and visible.",
  ],
  body: `
## A clock made of scroll

A normal CSS animation runs on time. You give it 300ms and it plays from 0% to 100% over 300ms.

A scroll-driven animation runs on scroll position instead. Scroll a quarter of the way down and the animation sits at 25%. Scroll back up and it plays in reverse. Stop and it stops.

You write the keyframes the same way. You only change one property:

\`\`\`css
.bar {
  animation: grow auto linear both;
  animation-timeline: scroll();
}
\`\`\`

Set the duration to \`auto\`. Time no longer matters, and Firefox needs \`auto\` to accept it. Use \`linear\`, because the motion should track your finger one to one. Put \`animation-timeline\` after the \`animation\` shorthand. The shorthand resets it.

Chrome runs it off the main thread when you animate transform or opacity. A heavy React render will not make the bar stutter. A \`scroll\` listener with \`setState\` can't promise that.

## Reading progress

\`scroll()\` follows a scroll container. With no arguments it uses the nearest one on the block axis, which is usually what you want. Inside a scroll box, write \`scroll(nearest block)\` to make that explicit.

Scroll the release notes below. The blue bar fills as you read.

::demo progress

The bar is a 4px div with \`transform: scaleX(0)\` to \`scaleX(1)\`. It sits in a sticky header inside the box, so the nearest scroller is the article. No JavaScript reads the scroll position. The only script in the demo scrolls back to the top when you press Replay.

Use \`scroll(root)\` for a bar that tracks the whole page. Use \`scroll(self)\` when the element that scrolls is also the one you animate.

## Reveal on entry

\`view()\` is different. It tracks one element as it crosses the visible part of its scroller. Every card gets its own timeline.

Ranges pick the slice of that trip you care about:

- **entry:** from the first pixel showing to fully inside.
- **exit:** from starting to leave to fully gone.
- **cover:** the whole trip, from first pixel in to last pixel out.
- **contain:** only while the element fits fully inside.

For a reveal, \`animation-range: entry 0% entry 100%\` is right. The card fades and rises while it comes in, then stays put.

::demo reveal

Scroll fast and the cards catch up instantly. Scroll back and they sink again. That is honest motion. It always matches where the content really is.

Keep the travel small. 24px and a scale of 0.98 is plenty. A card flying in from 200px makes people wait for content they already scrolled to.

## Named timelines

Sometimes the animated element is not inside the scroller. A gallery counter often sits under the track, as a sibling.

Give the timeline a name on the scroller with \`scroll-timeline: --sda-gallery inline\`. Then point to it with \`animation-timeline: --sda-gallery\`. A sibling can't see that name by default. Put \`timeline-scope: --sda-gallery\` on the shared parent to lift it.

::demo gallery

Each photo also runs \`view(inline)\`. It sits at 35% opacity near the edges and full strength in the middle. The track uses scroll snap, so the focused photo always lands centred. The images are lazy and sized, so nothing shifts while they load.

Names are global inside their scope. Put the scope on the demo root, as here, and two galleries on one page won't fight.

## The fallback

Wrap every scroll-driven rule in \`@supports\`:

\`\`\`css
@supports (animation-timeline: view()) {
  .card {
    animation: rise auto linear both;
    animation-timeline: view();
  }
}
\`\`\`

Outside the block, nothing hides the content. Cards are visible, the gallery scrolls and snaps, and the progress bar is not shown at all. Never set \`opacity: 0\` outside \`@supports\`. In a browser without support, the content would stay invisible forever.

Each demo tells you which version you see.

## Reduced motion

Progress bars are fine to keep. They are feedback, not decoration. The reveal and the gallery focus turn off under \`prefers-reduced-motion\`, and the content shows at full strength.

## Support

- **Chrome and Edge 115** and newer run \`scroll()\`, \`view()\` and named timelines. \`timeline-scope\` needs Chrome 116.
- **Safari 26** and newer run scroll-driven animations.
- **Firefox** has them only behind the \`layout.css.scroll-driven-animations.enabled\` flag.

Everything else gets the static fallback above. The page still reads fine.

## Next

Scroll timelines handle motion tied to position. Entrances on first render need one more tool. Next: [Entry animations with @starting-style](/blog/starting-style).
`,
  demos: {
    progress: {
      title: "Reading progress with scroll()",
      caption: "A **4px** bar scaled from **0** to **1** by the article's own scroll. Zero scroll listeners. Replay scrolls back to the top.",
      code: [{ name: "progress.css", code: PROGRESS_CSS }],
      height: 340,
    },
    reveal: {
      title: "Cards that rise on entry",
      caption: "Each card has its own **view()** timeline. It rises **24px** and fades in over the **entry** range. Scroll back and it reverses.",
      code: [{ name: "reveal.css", code: REVEAL_CSS }],
      height: 340,
    },
    gallery: {
      title: "A named scroll-timeline",
      caption: "The bar sits outside the track, so **timeline-scope** lifts the name to the parent. Photos dim to **35%** at the edges with **view(inline)**.",
      code: [{ name: "gallery.css", code: GALLERY_CSS }],
      height: 320,
    },
  },
};

export default post;
