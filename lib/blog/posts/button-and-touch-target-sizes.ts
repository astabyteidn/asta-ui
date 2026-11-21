import type { Post } from "../types";

const post: Post = {
  slug: "button-and-touch-target-sizes",
  group: "basics",
  order: 1,
  title: "Size buttons for the finger, not the label",
  summary: "Heights, padding and hit areas you can copy: 40px buttons, 44px targets on touch and 8px between them.",
  date: "2026-11-18",
  tldr: [
    "Use a 40px default button. Go to 44 or 48px on touch screens.",
    "Make every tap target at least 44 by 44px, even when the icon is 16px.",
    "Keep at least 8px between targets.",
    "Set horizontal padding to about 40% of the button height.",
    "One primary button per view. Size is part of the hierarchy."
  ],
  body: `
## Start with the hit area

The button you see and the area that takes the tap are two different things. Design the second one first.

A fingertip is far wider than a cursor. Here is what the main guidelines ask for:

- **WCAG 2.2:** at least 24 by 24px, or enough space around a smaller target.
- **Apple:** 44 by 44pt.
- **Material:** 48 by 48dp.

Use 44px as your floor on touch and you are close to all three.

An icon button can show a 16px icon inside a 44px box. A small icon is fine. A small target is not.

With a mouse, 32px is fine for a dense toolbar. But don't guess the input from the screen width. Laptops have touch screens and tablets have trackpads. Use \`@media (pointer: coarse)\` to grow targets when the main input is a finger.

## Pick four heights

- **28px:** tags, dense table rows.
- **32px:** toolbars and secondary actions.
- **40px:** the default.
- **48px:** the main call to action and forms on a phone.

That is the scale our [Button](/button) ships with. Four sizes cover almost everything. If you think you need a fifth, one of the four is probably wrong.

::live button

Match your inputs to the same scale. A 40px input next to a 40px button lines up. Mixed heights look broken, even when nobody can say why. [Input](/input), [Select](/select) and [Number input](/number-input) all follow the button sizes.

## Padding follows height

Once the height is set, the rest follows.

- **Horizontal padding:** about 40% of the height. 12px at 32, 16px at 40, 20px at 48.
- **Font size:** 13px at 32, 14px at 40, 15px at 48.
- **Icon to label gap:** 6 to 10px.
- **Corner radius:** 6 to 9px, growing a little with the size.

Give short labels a minimum width. "OK" in a 40px button looks like a tag. A minimum width of about 80px fixes it.

## Space between targets

Keep at least 8px between targets. On a phone, 12px is safer.

Put more distance between a destructive action and a safe one. Or move it to the other side of the row. Nobody should delete a project because they aimed for Cancel.

The gap counts between hit areas, not between the icons you see. A row of toolbar icons can sit 4px apart if each one already has padding around it.

To grow a hit area without moving the layout, give the button a transparent \`::before\` with \`inset: -8px\`. Just make sure neighbouring hit areas don't overlap, or they will fight over the tap.

## Size is hierarchy

Use one primary button per view. Make it the only filled one. You don't need it to be bigger and louder than the rest.

- **Primary:** filled, brand colour.
- **Secondary:** same height, quieter fill.
- **Tertiary:** text only.

If two buttons are the same size and both filled, the user has to read both to choose. That is a slow screen.

On a phone, the main action can go full width at 48px, at the bottom, in thumb reach. Our [Checkout](/checkout) does this for the pay button.

## Answer every press

A target has to respond the moment it's touched.

- Show the pressed state within 100ms. A scale to 0.97 is enough.
- Don't wait for the server to show it.
- If the action takes longer than about 300ms, swap the label for a spinner inside the button.
- Keep the button width fixed when the label changes, so the layout doesn't jump.

For actions that can't be undone, a second dialog is often worse than a longer press. [Hold to confirm](/hold-to-confirm) asks for a deliberate hold instead.

::live hold-to-confirm

## Quick checklist

- Every target at least 44 by 44px on touch?
- At least 8px between targets?
- Inputs and buttons share heights?
- One filled button per view?
- Pressed state shown in under 100ms?
`,
};

export default post;
