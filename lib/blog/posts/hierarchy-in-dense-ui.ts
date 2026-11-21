import type { Post } from "../types";

const post: Post = {
  slug: "hierarchy-in-dense-ui",
  group: "basics",
  order: 2,
  title: "Contrast and hierarchy in dense product UI",
  summary: "How to keep trading and checkout screens readable: three text levels, one accent colour, tabular numbers and contrast you can measure.",
  date: "2026-11-20",
  tldr: [
    "Use three text levels, not seven: primary, secondary and muted.",
    "Text people need to read needs 4.5:1 contrast. Muted labels too.",
    "Give one accent colour one job.",
    "Use tabular numbers and right-align them in columns.",
    "Group with space before you add borders and boxes."
  ],
  body: `
## Dense is fine. Flat is not.

Traders want a lot on one screen. So do support teams and anyone who runs a store. Density is not the problem. A screen where everything has the same weight is. The eye has nowhere to land.

Your job is to decide what gets read first, second and third. Then make that obvious at a glance.

## Three levels of text

- **Primary.** The number or label the screen is about. Full ink, weight 500, larger.
- **Secondary.** Supporting values. Full ink at regular weight.
- **Muted.** Labels, units, timestamps. A clear grey.

Keep the sizes few. In dense UI, 12, 13 and 14px plus one big number at 24 to 32px covers almost everything. Every extra size adds noise.

Reach for colour and weight before size. A 13px grey label next to a 13px ink value already reads as label and value. You don't need a bigger font to say which is which.

## Contrast you can measure

The WCAG numbers are simple:

- **4.5:1** for normal text.
- **3:1** for large text, which means 24px, or about 19px bold.
- **3:1** for the parts of controls you need to see, like input borders, focus rings and icons.

Light grey is where screens fail. \`#999\` on white is about 2.8:1. That fails. \`#767676\` is roughly the lightest grey that still passes 4.5:1 on pure white.

Check against the real background. The same grey on a light grey card has less contrast than on white. Measure it there.

Disabled controls are exempt from the rule. Still ask whether a control that can't be used should be on the screen at all.

## One accent, one job

Pick one accent colour and give it one meaning. On this site it is blue. Blue marks the main action and a price going up. Down is plain ink, not red.

The fewer colours you use, the more each one says. Every blue thing that is only decoration makes the real action harder to find.

If your product needs red and green for profit and loss, never rely on colour alone. Add a sign or an arrow. Around 8% of men have some form of colour blindness, and red against green is the most common pair they confuse.

## Make numbers easy to scan

- Turn on \`font-variant-numeric: tabular-nums\`. Digits get equal widths, so columns line up and prices don't jitter when they update.
- Right-align numbers in a column. Left-align text.
- Use the same number of decimals down a column.
- Put units in the header or in muted text, not in bold next to every value.
- When a value changes, flash it once, for about 600ms, then let it settle.

Our [Order book](/order-book) does the last one. Depth bars ease to their new size and a price flashes when it moves. Nothing else on the card animates. The [Price chart](/price-chart) follows the same rule and only eases each new tick in.

::live order-book

## Space before lines

Group related things by putting them close. Push unrelated things apart.

- 4 to 8px inside a group.
- 12 to 16px between groups.
- 24 to 32px between sections.

That often does the whole job. Borders and boxes add noise fast in a dense screen. Try removing a divider and adding 8px of space instead. It usually reads better.

When a region really needs to stand apart, like the order ticket next to a chart, give it a soft background panel. One surface tone is enough.

## Checkout is dense too

A checkout looks simple, but it carries a lot. Items, shipping, discount, tax, total, payment details.

Two things are primary: the total and the pay button. Everything else supports them.

- Keep the total in one place while people edit their cart.
- Show fees before the pay button, not after it.
- Put each error next to the field that caused it.
- Use one filled button. Everything else is quieter.

See how our [Checkout](/checkout) and [Card checkout](/card-checkout) handle it.

::live card-checkout

## The squint test

Blur a screenshot by about 4px, or just squint. What is still visible should be what matters most. If what stands out is a border, an icon or a badge, fix the hierarchy before you add anything else.
`,
};

export default post;
