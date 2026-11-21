import { LANES_CSS, LANES_TS, PAUSE_TS } from "@/components/blog/demos/smooth-on-phones/code";
import type { Post } from "../types";

const post: Post = {
  slug: "smooth-on-phones",
  group: "web",
  order: 6,
  title: "Smooth on a mid-range phone",
  summary: "Test with a slow CPU, animate what the compositor can run, pause loops nobody sees and keep scroll handlers light.",
  date: "2026-11-21",
  tldr: [
    "Test with the CPU slowed 4x in DevTools. Your laptop hides most jank.",
    "Animate transform and opacity. The compositor runs them even while JavaScript is busy.",
    "Pause every loop that is off screen or in a hidden tab.",
    "Never read layout inside a scroll handler or an animation frame. Use IntersectionObserver.",
    "Use will-change on the few elements that move, not on everything.",
  ],
  body: `
## Test on a slow CPU

A new laptop is five to ten times faster than the phone most people carry. Animations that look perfect at your desk can stutter in their hand.

So slow your machine down before you judge anything:

1. Open DevTools and go to the Performance panel.
2. Set CPU to **4x slowdown**. Use **6x** for an older Android phone.
3. Record while you open the menu, scroll the list or switch the tab.
4. Look for long tasks. Anything over **50ms** blocks input.

The frame budget is small. At 60Hz the browser has **16.7ms** per frame. At 120Hz it has **8.3ms**. Your code, the style work, layout and paint all share that time.

## Let the compositor work

Browsers can hand some animations to the compositor. That part of the browser runs apart from your JavaScript. If the main thread is busy, those animations keep going.

The two dots below move the same way. The blue one is a CSS animation on \`transform\`. The black one is a \`requestAnimationFrame\` loop that sets the position from JavaScript. Press the button to block the main thread for one second.

::demo lanes

The blue dot keeps gliding. The black dot freezes for a full second, then jumps. The gap counter shows how long the JS loop waited for a frame.

That busy second is not made up. A heavy React render, a big JSON parse or a third-party script can all hold the main thread that long on a cheap phone.

What this means in practice:

- Prefer CSS transitions and animations, or the Web Animations API, for UI motion.
- Keep JS-driven motion for things that need it, like springs and drag. Keep the work per frame tiny.
- Never animate from a timer that also fetches or renders.

## What to animate

Only two properties are cheap on every browser: **transform** and **opacity**. They skip layout and paint, so the browser only moves pixels it already drew.

- **Animate:** \`transform\` for position, scale and rotation. \`opacity\` for fades.
- **Avoid:** \`width\`, \`height\`, \`top\`, \`left\`, \`margin\` and \`padding\`. Each frame runs layout for the element and often its neighbours.
- **Careful:** \`filter: blur()\` and \`backdrop-filter\`. They run on the GPU but cost a lot on large areas.
- **Shadows:** do not animate \`box-shadow\`. Put the shadow on a pseudo-element and fade its opacity.

\`\`\`css
.card { position: relative; }
.card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 12px 32px -12px rgb(0 0 0 / .3);
  opacity: 0;
  transition: opacity 200ms cubic-bezier(.16, 1, .3, 1);
}
.card:hover::after { opacity: 1; }
\`\`\`

Need a size change? Animate \`scale\` and fix the content after, or use the FLIP technique from [Layout animation with FLIP](/blog/flip).

## Pause what nobody sees

A loop that runs off screen still costs battery and frames. A spinner far down the page, a ticker in a closed tab, a chart in a hidden panel. They add up.

Scroll the list below. The live card at the bottom runs a frame loop only while you can see it.

::demo pause

The frame counter stops the moment the card leaves the box. It also stops when you switch tabs. Every demo on this site works the same way, and so does every looping block in the kit.

Two signals cover almost every case:

- **IntersectionObserver** tells you when an element enters or leaves the viewport, or any scroll box you pass as \`root\`.
- **visibilitychange** tells you when the tab is hidden.

For CSS loops you can do it without JavaScript logic. Set \`animation-play-state: paused\` from a data attribute that the observer flips.

## Keep scroll light

Scroll is where phones struggle most. The rules are short:

- Mark touch and wheel listeners \`{ passive: true }\` so the browser never waits for your code before it scrolls.
- Do not read \`getBoundingClientRect\` or \`offsetTop\` inside a scroll handler. Each read can force a layout.
- Use IntersectionObserver for reveals and lazy loading instead of measuring on scroll.
- Add \`content-visibility: auto\` to long sections below the fold. The browser skips their layout until they come close.

## Use will-change with care

\`will-change: transform\` asks the browser to put an element on its own layer before it moves. That avoids a hitch on the first frame.

Each layer costs memory, and phones have little. Add it to the drawer that is about to open, not to every card in a grid. Remove it once the motion ends if the element stays on screen for long.

## Support

CSS transitions, animations and \`requestAnimationFrame\` work everywhere. IntersectionObserver and \`visibilitychange\` work in every current browser.

\`content-visibility\` works in Chrome 85, Firefox 125 and Safari 18. Older browsers ignore it and render the section as usual, which is a safe fallback.

The container units in the lanes demo, \`cqw\`, work in Chrome 105, Safari 16 and Firefox 110.

## Next

That is the end of the web group. Next, the basics: [Button and touch target sizes](/blog/button-and-touch-target-sizes).
`,
  demos: {
    lanes: {
      title: "Compositor vs main thread",
      caption: "Both dots run a **1600ms** ease-in-out loop. The button blocks the main thread for **1000ms**. The CSS dot keeps moving. The JS dot waits.",
      code: [
        { name: "lanes.css", code: LANES_CSS },
        { name: "lanes.ts", code: LANES_TS },
      ],
      height: 300,
    },
    pause: {
      title: "A loop that pauses off screen",
      caption: "The loop draws **every frame** while the card is visible and **0** frames when it is scrolled out or the tab is hidden.",
      code: [{ name: "useVisibleLoop.ts", code: PAUSE_TS }],
      height: 320,
    },
  },
};

export default post;
