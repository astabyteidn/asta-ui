import { BEZIER_TS, MENU_CSS, MENU_TSX, RACE_CSS } from "@/components/blog/demos/easing/code";
import type { Post } from "../types";

const post: Post = {
  slug: "easing",
  group: "motion",
  order: 1,
  title: "Easing: read a curve, then pick one",
  summary: "Why ease-out feels fast, what the four numbers in cubic-bezier mean, and why one curve for the whole product beats ten.",
  date: "2026-11-21",
  tldr: [
    "Use ease-out for almost everything in UI. Things start fast and settle softly.",
    "Use ease-in-out for things that move from one spot to another on screen. Never ease-in for an entrance.",
    "Read cubic-bezier(x1, y1, x2, y2) as two handles. x is time, y is progress.",
    "Pick one curve for the product and put it in a variable. Ours is cubic-bezier(.16, 1, .3, 1).",
  ],
  body: `
## Same trip, different feel

Easing decides how fast something moves at each moment of its trip. The start and the end stay the same. The feel changes completely.

Watch the three dots below. They cover the same distance in the same 1000ms. Only the curve is different. The demo runs slow on purpose, so you can see the shape. Real UI runs at 200 to 300ms.

::demo race

The blue dot is ease-out. It covers most of the distance early, then glides in. That is why it feels fast even at the same duration. Your eye sees the response right away.

The middle dot is ease-in-out. It starts slow, speeds up, then slows down. It looks calm and a little heavy.

The bottom dot is linear. Same speed the whole way. Nothing in the physical world moves like that, so it reads as mechanical.

## When to use which

- **ease-out:** anything that enters or reacts to the user. Menus, dialogs, toasts, hover states, a button press. This is most of your UI.
- **ease-in-out:** something that moves from one place on screen to another and stays visible the whole time. A slider thumb gliding to a click, a tab underline, a card changing position.
- **ease-in:** almost never. It starts slow, and a slow start reads as lag. The one fair use is an element leaving the screen for good, and even then a fast ease-out exit usually feels better.
- **linear:** progress bars, spinners and things tied to scroll or a drag. Anything where the motion follows an outside value.

Try it on a real menu. Pick ease-in first and open it a few times. Then switch to ease-out.

::demo menu

With ease-in the menu seems to think before it opens. With ease-out it feels like it was already there. The duration is 300ms in both cases.

## How to read cubic-bezier

Every CSS curve is a cubic Bézier with four numbers: \`cubic-bezier(x1, y1, x2, y2)\`. The start point is fixed at 0,0 and the end at 1,1. The four numbers place two handles in between.

- **x** is time, from 0 to 1. It must stay between 0 and 1.
- **y** is progress. It can go below 0 or above 1, which makes the motion overshoot.
- The first handle shapes the start. A high **y1** with a low **x1** means a fast start.
- The second handle shapes the end. A **y2** of 1 with a low **x2** means a long, soft landing.

So \`cubic-bezier(.16, 1, .3, 1)\` reads like this. The first handle is far up and close to the start, so the motion jumps forward. The second handle sits at full progress early, so the end is a slow glide.

You don't have to picture it. Look at the numbers instead. The demo shows how far along each curve is at 10, 25, 50 and 75 percent of the time.

::demo numbers

Our ease-out is at 83% of the distance after a quarter of the time. CSS \`ease\` is at 41%. Plain ease-in has barely moved. That one number explains most of the feel.

Drag **y1** above 1 and watch the 25% row pass 100%. That is overshoot. Use it with care. A small overshoot on a toast feels lively. On a dialog it feels like a bug.

## One curve for the product

Mixed curves make a product feel like several products. A menu from one library, a drawer from another, a toast from a third. Nobody can name the problem, but everyone feels it.

Pick one curve and use it everywhere. Put it in a token:

\`\`\`css
:root {
  --ease: cubic-bezier(.16, 1, .3, 1);
}

.menu   { transition: opacity 200ms var(--ease), transform 200ms var(--ease); }
.drawer { transition: transform 300ms var(--ease); }
\`\`\`

Every component in this kit uses that one curve, or a spring for things you drag. In Tailwind it lives as \`ease-expo\`.

You will want a second curve for one case: an element that moves across the screen while staying visible. Ease-in-out reads better there. Two curves is fine. Five is a mess.

## Reduced motion

Some people get dizzy from movement. Every demo here checks \`prefers-reduced-motion\` and swaps the slide for a short fade or the end state. Do the same in your product. The curve matters less than the respect.

## Support

\`cubic-bezier()\` works in every browser. The container units in the race demo, \`cqw\`, work in Chrome 105, Safari 16 and Firefox 110. Older browsers ignore the transform and the dot stays put, which is a fine fallback.

## Next

Easing is half the feel. The other half is time. Next: [Duration and distance](/blog/duration-and-distance).
`,
  demos: {
    race: {
      title: "ease-out · ease-in-out · linear",
      caption: "All three take **1000ms** over the same distance, slowed down so you can see the shape. In a real product use **200 to 300ms**.",
      code: [{ name: "race.css", code: RACE_CSS }],
      height: 300,
    },
    menu: {
      title: "One menu, four curves",
      caption: "The duration is **300ms** for every curve. Open it with **ease-in**, then **ease-out**. The menu scales from **0.96** and moves **4px**.",
      code: [
        { name: "menu.css", code: MENU_CSS },
        { name: "Menu.tsx", code: MENU_TSX },
      ],
      height: 340,
    },
    numbers: {
      title: "Read a curve by its numbers",
      caption: "Our ease-out is at **83%** of the distance after **25%** of the time. CSS **ease** is at **41%**. The code is the same solver the demo uses.",
      code: [{ name: "bezier.ts", code: BEZIER_TS }],
      height: 360,
    },
  },
};

export default post;
