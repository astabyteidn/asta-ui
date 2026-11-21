import { BULK_CSS, FIELD_CSS, FIELD_HTML, PLANS_CSS } from "@/components/blog/demos/has-selector/code";
import type { Post } from "../types";

const post: Post = {
  slug: "has-selector",
  group: "web",
  order: 5,
  title: ":has() for parent-aware styling",
  summary: "Style a wrapper by what is inside it. Form fields, radio cards and bulk actions with no state and no JavaScript.",
  date: "2026-11-21",
  tldr: [
    "`.field:has(input:focus-visible)` styles the wrapper when the input inside has focus.",
    "Read a choice from anywhere in a form: `form:has(#team:checked) .note`.",
    "Pair `:has()` with `:user-invalid` so errors show after the user leaves the field, not on page load.",
    "Keep the anchor small. Write `.field:has()`, never `body:has()`.",
    "Works in Chrome 105, Safari 15.4 and Firefox 121. Give old browsers a usable default.",
  ],
  body: `
## A parent selector, finally

For years CSS could only look down the tree. A parent could not react to its child. So we wrote JavaScript to copy state upward: a focused class on the wrapper, a selected class on the card, a has-items class on the list.

\`:has()\` removes that code. It matches an element if something inside it matches. \`.card:has(img)\` is a card that contains an image. \`.field:has(input:focus)\` is a field whose input has focus.

Here is the first place to use it.

## Fields that react

A text field is rarely just an input. It has a wrapper, a label, an icon and a hint. The focus ring belongs on the wrapper. The error belongs on the hint. The input is the only element that knows either state.

::demo field

Tab into the field and the whole wrapper lights up. Type something that is not an email and click away. The border darkens and the hint fades in. Type a valid address and a check appears. There is no event handler anywhere.

Two details make it feel right:

- **\`:focus-visible\`, not \`:focus\`.** The ring shows for keyboard users and stays quiet on a mouse click.
- **\`:user-invalid\`, not \`:invalid\`.** \`:invalid\` matches an empty required field the moment the page loads. \`:user-invalid\` waits until the person has typed and moved on. Nobody likes being told they are wrong before they start.

The markup stays plain:

\`\`\`html
${FIELD_HTML}
\`\`\`

Our [Input](/input) and [Field](/field) components use the same idea with React state, because they also need to support older browsers and custom error messages from a server.

## Read a choice from anywhere

\`:has()\` does not have to sit on the direct parent. Put it on the form and you can style anything inside based on any input.

::demo plans

The plan cards highlight themselves with \`.plan:has(input:checked)\`. The summary under them reads the same radio with \`.has-plans:has(#plan-team:checked) .note-team\`. Two parts of the form stay in sync without a line of state.

Use this for small, local reactions:

- Show a VAT field only when "Business" is picked.
- Dim the submit button while the form \`:has(:user-invalid)\`.
- Switch a card to a compact layout when it \`:has(.badge)\`.

Keep real logic in your code. If a choice changes what gets sent to the server, it belongs in state. \`:has()\` is for how things look.

## Bulk actions with CSS

Tables are where \`:has()\` saves the most code. Pick a row and it tints. Pick any row and a bulk bar slides in. Count the picks with a CSS counter.

::demo bulk

Three rules do it:

1. \`tr:has(input:checked)\` tints the row.
2. \`.has-bulk:has(tbody input:checked) .bar\` shows the bar, with a 250ms fade and an 8px rise.
3. A CSS counter increments on every checked box, and the bar prints it with \`counter()\`.

The bar animates opacity and transform only, so it stays smooth while you click fast. Our [Data table](/data-table) does the same job in React with keyboard range selection on top.

## Keep it fast

Every time the DOM changes, the browser checks which \`:has()\` rules might now match. A narrow anchor keeps that check cheap.

- **Good:** \`.field:has(input:user-invalid)\`. Only fields are checked.
- **Risky:** \`body:has(.modal-open)\`. Every change anywhere re-checks the whole page.
- Avoid deep chains like \`:has(> * > * > input)\`. Put a class closer to the input instead.

On a page with a few hundred fields you will not notice. On a long list that updates every second, a broad \`:has()\` can show up in the Performance panel as style recalculation. Measure before and after.

## Support

\`:has()\` works in Chrome and Edge 105, Safari 15.4 and Firefox 121. That covers most browsers in use today. \`:user-invalid\` works in Chrome 119, Safari 16.5 and Firefox 88.

Old browsers drop the whole rule they do not understand. Plan for that:

- Make the default state usable. In the bulk demo the bar is visible by default when \`:has()\` is missing, through \`@supports not selector(:has(*))\`.
- Never hide required content behind \`:has()\`. Use it to add polish, not to unlock a feature.

## Next

Last stop in this group: keeping all of this smooth on a cheap phone. Next: [Smooth on a mid-range phone](/blog/smooth-on-phones).
`,
  thumb: "bulk",
  demos: {
    field: {
      title: "A field that styles itself",
      caption: "Focus ring from **:focus-visible**, error from **:user-invalid** after you leave the field, check from **:valid**. Each change fades in **200ms** with a **2px** rise.",
      code: [
        { name: "field.css", code: FIELD_CSS },
        { name: "field.html", code: FIELD_HTML },
      ],
      height: 280,
    },
    plans: {
      title: "Radio cards and a live summary",
      caption: "The checked card gets a **2px** brand ring. The summary swaps text with a **250ms** fade. Both read the same radio input.",
      code: [{ name: "plans.css", code: PLANS_CSS }],
      height: 300,
    },
    bulk: {
      title: "Row selection without JavaScript",
      caption: "Rows tint at **7%** brand. The bar fades in over **250ms** and rises **8px**. The count comes from a CSS counter.",
      code: [{ name: "bulk.css", code: BULK_CSS }],
      height: 330,
    },
  },
};

export default post;
