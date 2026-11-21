import { DIALOG_CSS, DIALOG_TSX, POPOVER_CSS, POPOVER_HTML, TOAST_CSS, TOAST_TSX } from "@/components/blog/demos/starting-style/code";
import type { Post } from "../types";

const post: Post = {
  slug: "starting-style",
  group: "web",
  order: 1,
  title: "Enter and exit with @starting-style",
  summary: "Animate popovers, dialogs and new list items in and out with CSS alone. No animation library, no timers for the entrance.",
  date: "2026-11-21",
  tldr: [
    "Use @starting-style to say where an element starts when it first appears.",
    "Add display and overlay to the transition with allow-discrete, so the exit can play before the element hides.",
    "Style three states: open, closed, and just opened. That covers popover, dialog and anything new in the DOM.",
    "Fade the dialog backdrop with opacity, not background-color.",
    "Old browsers show and hide instantly. That is the fallback, and it is fine.",
  ],
  body: `
## The old problem

CSS transitions need a before and an after. An element that was just added to the page has no before. Neither does one that goes from \`display: none\` to visible. So the browser skips the transition and the element pops in.

The usual fix was JavaScript. Mount the element, wait a frame, add a class. To leave, add another class, wait for the transition, then remove it. Every menu and every dialog carried that dance.

Now CSS does it. Two pieces make it work.

- **@starting-style** gives the element a before. The browser uses those values for the very first frame it renders.
- **transition-behavior: allow-discrete** lets \`display\` take part in a transition. The browser holds the element visible until the exit is done, then hides it.

## A popover, both ways

Here is a native popover. The button opens it with \`popovertarget\`. Clicking outside or pressing Esc closes it. There is no state for open or closed and no animation code.

::demo popover

You style three moments:

1. **Open.** The resting state, at full opacity and size.
2. **Closed.** Where it goes on the way out. \`:not(:popover-open)\` matches it.
3. **Just opened.** Where it comes from on the way in. That rule sits inside \`@starting-style\`.

Closed and just opened often share values. They don't have to. A menu can drop in from above and fade out in place.

The transition list carries \`display\` and \`overlay\` with \`allow-discrete\`. Without them the exit has no time. The popover would leave the top layer and hide on the first frame.

Keep the numbers small. A **4px** move and a scale from **0.96** over **200ms** is enough for a menu. More than that and it starts to feel like a slide.

## A dialog with a backdrop

Dialogs work the same way. \`showModal()\` puts the dialog in the top layer and adds the \`[open]\` attribute. Closing removes it.

::demo dialog

The backdrop is its own pseudo element, so it needs its own three states. Give it a solid colour and fade its \`opacity\`. Fading \`background-color\` works too, but opacity is the cheaper property to animate across the whole screen.

Use **250ms** for the dialog and the backdrop together. The backdrop can be linear. The dialog itself uses the same ease-out as everything else.

The dialog uses \`<form method="dialog">\`. Each button closes it and sets \`returnValue\`, so you know which one was pressed. Still no state for open or closed. Our [Dialog](/dialog) and [Popover](/popover) components add focus handling and positioning on top of the same idea.

## New items in a list

\`@starting-style\` also works on any element that is new to the page. Add a row and it fades in. That covers toasts, chat messages, table rows and search results.

::demo toast

The entrance has no JavaScript at all. React adds an item. The browser sees a new element, reads its starting style and runs the transition.

The exit needs one step. An element you remove from the DOM is gone at once, so there is nothing left to animate. Set \`hidden\` instead. That turns on \`display: none\`, and \`allow-discrete\` keeps it visible while it fades. After **240ms** remove it for real.

Notice the other toasts jump when one leaves. That is layout, and \`@starting-style\` can't help with it. Moving the rest smoothly takes [FLIP](/blog/flip). Our [Toast](/toast) component does both.

## Where it goes wrong

- **Selector order.** The \`@starting-style\` block must come after the open rule, or the open rule wins and nothing animates.
- **Missing display.** Forget \`display ... allow-discrete\` and the exit is instant in every browser.
- **Transition shorthand.** \`transition: all\` is tempting. Don't. It animates layout properties too, and it will catch things you didn't mean.
- **Reduced motion.** Keep the fade and drop the movement. A **150ms** opacity change still tells people something opened.

## Support

- \`@starting-style\`: Chrome 117, Safari 17.5, Firefox 129.
- \`transition-behavior: allow-discrete\`: Chrome 117, Safari 17.4, Firefox 129.
- The \`overlay\` property: Chrome 117. Firefox doesn't support it yet. There, popovers and dialogs can leave the top layer before the exit ends, so the exit is less smooth. The entrance still plays.

Older browsers ignore the new rules. The element shows and hides instantly, exactly like it did before you added the CSS. Nothing breaks, so you can ship this today without a fallback branch.

## Next

\`@starting-style\` handles one element coming and going. To animate between two whole states of a page, use [View Transitions](/blog/view-transitions).
`,
  thumb: "toast",
  demos: {
    popover: {
      title: "popover · @starting-style",
      caption: "**200ms** in and out, a **4px** move and a scale from **0.96**. No open state in React and no animation code. The JS only places the menu under its button.",
      code: [
        { name: "popover.css", code: POPOVER_CSS },
        { name: "popover.html", code: POPOVER_HTML },
      ],
      height: 240,
    },
    dialog: {
      title: "dialog · fading ::backdrop",
      caption: "Dialog and backdrop both take **250ms**. The backdrop is **35%** black and fades with **opacity**. Press Esc or a button to close it.",
      code: [
        { name: "dialog.css", code: DIALOG_CSS },
        { name: "Dialog.tsx", code: DIALOG_TSX },
      ],
      height: 220,
    },
    toast: {
      title: "New items · enter and leave",
      caption: "Toasts enter over **240ms** from **8px** below. Dismiss sets **hidden**, the toast slides **16px** right and fades, then React removes it. At most **3** stay on screen.",
      code: [
        { name: "toasts.css", code: TOAST_CSS },
        { name: "Toasts.tsx", code: TOAST_TSX },
      ],
      height: 280,
    },
  },
};

export default post;
