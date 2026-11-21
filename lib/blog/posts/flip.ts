import { FILTER_TSX, FLIP_TS, REORDER_TSX, STEPS_CSS } from "@/components/blog/demos/flip/code";
import type { Post } from "../types";

const post: Post = {
  slug: "flip",
  group: "motion",
  order: 5,
  title: "Layout animation with FLIP",
  summary: "Animate a list re-sort or a grid filter with transforms only. Measure once before the change, once after, and let the browser glide the difference.",
  date: "2026-11-21",
  tldr: [
    "FLIP is First, Last, Invert, Play. Measure, change the DOM, offset back, then animate the offset to zero.",
    "Read getBoundingClientRect once before and once after each change. Never inside a per-frame callback.",
    "Animate transform only. The layout is already final, so the browser just moves pixels.",
    "Items without a First position are new. Fade them in instead of sliding them.",
  ],
  body: `
## The problem with layout

You re-sort a list and every row jumps to its new spot in one frame. The eye loses track of what moved. You want each row to glide.

The naive fix is to animate \`top\` or \`height\`. That forces layout on every frame, for every row. On a phone it stutters at 20 rows.

FLIP turns a layout change into a transform. The layout happens once, in a single frame. The motion after it is pure compositing.

## The four steps

1. **First.** Read where each element is now, with \`getBoundingClientRect()\`.
2. **Last.** Change the DOM. Then read the new positions.
3. **Invert.** Work out the difference. Apply a transform that puts each element back where it was. On screen, nothing has moved yet.
4. **Play.** Animate that transform to \`none\`. The element glides from the old spot to the new one.

The trick is that steps 2 and 3 happen before the browser paints. The user never sees the jump. Step through it slowly below.

::demo steps

Note the numbers. The pinned task starts at one y, jumps to another, and the invert offset is the gap between them. Play only animates that one number back to zero.

## Two reads per change

Every FLIP reads layout exactly twice. Once before the change, once after. That is it.

The animation itself never touches layout. There is no \`requestAnimationFrame\` loop and no reading inside one. The browser gets a start transform and an end transform, and it interpolates on the compositor thread.

This matters. If you read \`getBoundingClientRect()\` inside a per-frame callback, you force the browser to recalculate layout 60 times a second. That is the exact cost FLIP exists to avoid.

The full helper is about 30 lines. It sits under the next demo, and it is the same code the demos run. Using it takes three lines.

\`\`\`ts
const first = measure(list);   // read 1
setTasks(sorted);              // React writes the new order
// in useLayoutEffect, before paint:
play(list, first);             // read 2, then animate
\`\`\`

In React, put the second half in \`useLayoutEffect\`. It runs after the DOM is updated but before paint. A plain \`useEffect\` can run after the paint, and the user sees a flash of the final layout.

## Re-sort a task list

Sort this list by due date, priority or name. Then shuffle it. Drag the duration up to 1200ms to see each row travel.

::demo reorder

Each row uses \`el.animate()\` from the Web Animations API. It needs no CSS and no class toggling, and the browser cleans up when it ends. If you click again mid-flight, the helper cancels the running animations first. That way the Last read is the real layout, not a half-moved row.

The same idea drives drag and drop in the [kanban board](/kanban) and row moves in the [data table](/data-table).

## Filter a product grid

Filtering adds one wrinkle. Some cards leave, some stay and some arrive.

- Cards that **stay** have a First and a Last. FLIP slides them to the new cell.
- Cards that **arrive** have no First. Fade and scale them in from 0.96.
- Cards that **leave** are gone from the DOM before you can animate them. Let them vanish. A short exit is rarely worth the extra state.

::demo filter

Pick Audio, then All. The audio cards glide from their packed spots back into place. The five others fade in 120ms later, so the eye follows the movers first.

## Keep it calm

- Use the house curve, \`cubic-bezier(.16, 1, .3, 1)\`, at 400 to 500ms for a list. Longer reads as slow.
- Skip rows that did not move. The helper returns early when both offsets are zero.
- Animate translate only. Scale changes text size mid-flight and looks blurry. If the size changes too, cross-fade instead.
- Keep keys stable. FLIP matches elements by id before and after. A new key means a new element, and it will fade instead of slide.

## Reduced motion

The helper checks \`prefers-reduced-motion\` first and returns. Rows snap to their new place, which is what people asking for less motion want. The step demo turns its transition off too.

## Support

\`getBoundingClientRect()\` and transforms work everywhere. \`el.animate()\` works in Chrome 36, Safari 13.1 and Firefox 48. The \`getAnimations()\` call that cancels a running FLIP needs Chrome 84, Safari 14 or Firefox 75. For older browsers, set the transform, force a reflow, then set a CSS transition back to \`none\`. Without either, the rows just snap, which is a fine fallback.

## Next

FLIP reacts to clicks. Next, tie motion to the scroll position with no JavaScript at all. Next: [Scroll-driven animation](/blog/scroll-driven-animation).
`,
  demos: {
    steps: {
      title: "First, Last, Invert, Play",
      caption: "One click per step. The pinned task moves about **150px**. Play animates only the transform back to zero over **800ms**.",
      code: [{ name: "steps.css", code: STEPS_CSS }],
      height: 360,
    },
    reorder: {
      title: "Re-sort a task list",
      caption: "Two layout reads per change, **0** per frame. Default **500ms** with the house curve. Drag the duration to **1200ms** to watch each row.",
      code: [
        { name: "flip.ts", code: FLIP_TS },
        { name: "TaskList.tsx", code: REORDER_TSX },
      ],
      height: 400,
    },
    filter: {
      title: "Filter a product grid",
      caption: "Cards that stay slide with FLIP. New cards fade in from **0.96** after **120ms**. Cards that leave just go.",
      code: [
        { name: "Grid.tsx", code: FILTER_TSX },
        { name: "flip.ts", code: FLIP_TS },
      ],
      height: 340,
    },
  },
};

export default post;
