import { DISTANCE_CSS, DRAWER_CSS, DRAWER_TSX, EXIT_CSS } from "@/components/blog/demos/duration-and-distance/code";
import type { Post } from "../types";

const post: Post = {
  slug: "duration-and-distance",
  group: "motion",
  order: 2,
  title: "Duration and distance: why 200ms feels right",
  summary: "Pick a duration by how far things travel, make exits faster than entrances, and answer every press within 100ms.",
  date: "2026-11-21",
  tldr: [
    "Most UI motion fits between 150 and 300ms. Start at 200ms.",
    "Scale the time with the distance. A 4px tooltip gets 150ms, a full-width drawer gets 300ms.",
    "Exits take about two thirds of the entrance. 300ms in, 200ms out.",
    "A press answers within 100ms. Scale to 0.97 and back.",
  ],
  body: `
## Feel the time

Open the cart below. Then drag the slider and open it again. Try 100ms, 200ms and 600ms.

::demo drawer

At 100ms the drawer jumps. Your eye can't follow where it came from. At 600ms you wait for it, and by the third time you are annoyed. Somewhere around 200 to 250ms it feels like the drawer was always there and just slid into view.

That window is not a taste thing. Below about 150ms motion stops reading as motion. Above about 400ms people start waiting for it. A drawer, a menu or a toast is something people open dozens of times a day. Every extra 100ms adds up.

## Start from these numbers

- **100ms:** press states, hover colour, a checkbox tick.
- **150ms:** tooltips and small fades.
- **200ms:** menus, popovers, toggles. Your default.
- **250 to 300ms:** dialogs, drawers, a section that changes.
- **350 to 400ms:** large sheets that cover the screen.

Over 500ms is for one-off moments, like a first-run welcome. Never for something people do every day.

Keep the curve the same and change only the time. If you haven't picked a curve yet, read [Easing](/blog/easing) first.

## Scale time with distance

The same duration does not feel the same at every size. A tooltip that moves 4px in 300ms looks sleepy. A drawer that crosses the screen in 150ms looks like a glitch.

So give each piece a time that fits how far it travels. Press Show all in both modes and compare.

::demo distance

With scaled times all three feel equally quick, even though they finish at different moments. With one 300ms for everything, the tooltip drags and the menu lags behind your click.

A simple rule works well:

- Under 10px of travel: 150ms.
- A menu or popover, 8 to 16px: 200ms.
- Across a panel or the screen: 300ms.

Scale counts as distance too. A dialog that grows from 0.96 to 1 moves only a few pixels at its edges, so it can stay at 200 to 250ms.

## Make exits faster

When someone opens a dialog, they want to see what came in. When they close it, they are done with it. Get out of the way.

Close the dialog below with each setting. Both open in 300ms.

::demo exit

With a 300ms exit the dialog lingers. You click Remove, and it seems to wait before it leaves. With 200ms it feels like it obeyed.

Use about two thirds of the entrance:

- 300ms in, 200ms out.
- 200ms in, 150ms out.
- Under 150ms in? Use the same time out. You can't go much faster without it looking like a cut.

Our [Dialog](/dialog) and [Drawer](/drawer) both do this. They travel far, so their times are longer. The Dialog grows out of its button in 520ms and goes back in 320ms. The Drawer slides in over 560ms and out in 340ms. Both exits are about 60% of the entrance.

## Answer every press

A press needs a reply within 100ms, or it feels like the tap was missed. Show it on pointer down, not on click. Don't wait for the server.

A small scale works well: 0.97 on press, back to 1 on release, both in about 100ms. Every [Button](/button) in this kit does it. Don't go below 0.95. A deeper squash looks like a toy.

Some actions should take longer on purpose. Deleting a project or sending money deserves a deliberate press, not a second dialog. Hold to confirm stretches the press to about 1 second and drains back if you let go early.

::live hold-to-confirm

That one long press is fine because the user chose it. It is the only place where slow is the point.

## Check your durations

- Open the thing ten times in a row. If you start to wait, cut 50ms.
- Slow it down 10x in DevTools under Animations. Look for jumps and wrong starting points.
- Turn on reduced motion and check that state changes are still visible. A 150ms fade is enough.

## Support

CSS transitions, \`transform\` and \`opacity\` work in every browser. \`prefers-reduced-motion\` works in Chrome 74, Safari 10.1 and Firefox 63. Older browsers ignore it and play the full motion, which is the same as having it off.

## Next

Fixed durations break when people interrupt them. Springs don't. Next: [Springs vs curves](/blog/springs).
`,
  demos: {
    drawer: {
      title: "Cart drawer · duration slider",
      caption: "Slide from **100 to 800ms**. Around **200 to 250ms** the drawer feels instant but still readable. The curve stays **cubic-bezier(.16, 1, .3, 1)** the whole time.",
      code: [
        { name: "drawer.css", code: DRAWER_CSS },
        { name: "Drawer.tsx", code: DRAWER_TSX },
      ],
      height: 330,
    },
    distance: {
      title: "Tooltip · menu · drawer",
      caption: "Scaled: **4px in 150ms**, **8px in 200ms**, full width in **300ms**. Switch to **Same 300ms** and the small pieces start to drag.",
      code: [{ name: "distance.css", code: DISTANCE_CSS }],
      height: 300,
    },
    exit: {
      title: "Enter 300ms · exit 300ms or 200ms",
      caption: "Both open in **300ms** with an **8px** rise. The **200ms** exit is two thirds of that and feels like the dialog obeyed.",
      code: [{ name: "exit.css", code: EXIT_CSS }],
      height: 300,
    },
  },
};

export default post;
