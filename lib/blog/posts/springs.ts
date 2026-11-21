import { LINEAR_CSS, SAMPLE_TS, SPRING_TS, TABS_TSX, TRANSITION_CSS } from "@/components/blog/demos/springs/code";
import type { Post } from "../types";

const post: Post = {
  slug: "springs",
  group: "motion",
  order: 3,
  title: "Springs vs curves: motion you can interrupt",
  summary: "A spring has no duration. It has stiffness and damping, keeps its speed when you change your mind, and fits in 30 lines.",
  date: "2026-11-21",
  tldr: [
    "A spring is set by stiffness and damping, not by a duration. It ends when it comes to rest.",
    "Start at stiffness 300 and damping 30. It reaches 90% in about 190ms and barely overshoots.",
    "Springs keep their speed when the target changes. A CSS transition restarts from zero.",
    "Use a spring for anything people drag, flick or click fast. Use a curve for the rest.",
    "CSS linear() can play a spring with no JavaScript. Chrome 113, Safari 17.2, Firefox 112.",
  ],
  body: `
## A spring has no duration

A curve says: go from A to B in 300ms. A spring says: here is a target, pull toward it. The pull is the **stiffness**. The friction that slows it down is the **damping**. The motion ends when the thing comes to rest.

Click the tabs below. Then try the presets and drag the sliders.

::demo tabs

Snappy is stiffness 300 and damping 30. The pill covers 90% of the trip in about 190ms, then glides in. It looks a lot like our ease-out curve, and that is on purpose.

Bouncy is stiffness 220 with damping 12. It overshoots by about 25% and wobbles back. Fun on a toy, too much on a tab bar.

## Read the two numbers

- **Stiffness** sets the speed. Higher is faster. 200 to 400 covers most UI.
- **Damping** sets the bounce. Lower bounces more. Raise it until the bounce is gone, then stop.
- The two work together. A stiff spring needs more damping to stay calm.

A handy check is the ratio damping ÷ (2 × √stiffness). At 1 there is no bounce at all. Snappy sits at 0.87, so it overshoots by a third of a percent. Nobody sees that, but it softens the landing. Below 0.6 people start to see a wobble.

The settle time in the demo is when the spring is fully at rest. Most of the motion happens long before that. Judge a spring by how it feels, not by the last millisecond.

## Interrupt it

This is where springs win. Press the button below. It clicks the tabs 6 times, 140ms apart. Both bars get the same clicks.

::demo race

The spring pill turns around smoothly. It carries its speed into each new target, so it never stops dead.

The CSS pill restarts on every click. Each new transition starts from where the pill is, at speed zero, then jumps to full speed again. You see a stutter at every change of mind.

In normal use people rarely click that fast. But they do drag, flick and change their mind halfway through a swipe. Every one of those is an interruption.

## When to use a spring

- Anything people drag: sheets, sliders, cards, the bottom [Drawer](/drawer) when you pull it down.
- Anything tied to a gesture that can reverse halfway.
- Indicators that follow fast clicks, like tab pills and the [Segmented control](/segmented-control).
- Layout that changes while it is still moving.

Use a curve for the rest. Menus, dialogs and toasts open and close as one event. A 200ms ease-out is easier to reason about, and you can read its duration off the code.

## Springs in plain CSS

You don't need JavaScript to play a spring once. CSS \`linear()\` takes a list of points and draws straight lines between them. Sample the spring into 40 points and you get a curve that bounces.

::demo toast

Each preset makes a new \`linear()\` string and its duration. The toast then enters with plain CSS. Nothing runs on the main thread while it moves.

The catch: it is still a fixed animation. Interrupt it and it restarts like any transition. Use \`linear()\` for entrances. Use the JavaScript spring for drags.

## Keep the loop cheap

A spring in JavaScript means a frame loop. Three rules keep it cheap:

- Run the loop only while the spring moves. Stop it the frame it comes to rest.
- Stop it when the element is offscreen or the tab is hidden. Every demo here does.
- Cancel the frame on unmount.

Write the value to a CSS variable and let \`transform\` use it. Never read layout inside the loop. The full solver is the code under the tabs demo.

## Support

The JavaScript spring uses \`requestAnimationFrame\` and \`transform\`, which work everywhere. \`linear()\` works in Chrome 113, Safari 17.2 and Firefox 112. The toast checks it with \`@supports\` and falls back to our ease-out curve, which looks almost the same without the bounce.

## Next

One thing moving well is half the job. Many things moving together is the other half. Next: [Stagger](/blog/stagger).
`,
  demos: {
    tabs: {
      title: "Stiffness and damping, live",
      caption: "Snappy is **stiffness 300, damping 30**. It covers **90%** of the trip in about **190ms** and overshoots by **0.3%**. Bouncy, **220 and 12**, overshoots by **25%**.",
      code: [
        { name: "spring.ts", code: SPRING_TS },
        { name: "Tabs.tsx", code: TABS_TSX },
      ],
      height: 340,
    },
    race: {
      title: "Spring vs transition, interrupted",
      caption: "Same **6 clicks**, **140ms** apart. The spring keeps its speed into each new target. The **300ms** transition restarts from zero every time.",
      code: [{ name: "transition.css", code: TRANSITION_CSS }],
      height: 320,
    },
    toast: {
      title: "A spring in CSS linear()",
      caption: "Snappy becomes **48 points** over about **530ms**. Browsers without **linear()** get **cubic-bezier(.16, 1, .3, 1)** instead.",
      code: [
        { name: "toast.css", code: LINEAR_CSS },
        { name: "toLinear.ts", code: SAMPLE_TS },
      ],
      height: 300,
    },
  },
};

export default post;
