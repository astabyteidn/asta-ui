/**
 * Blog posts for /blog. Each body is a small Markdown subset rendered by `components/blog/Prose.tsx`:
 * `## ` headings, paragraphs, `- ` and `1. ` lists, plus inline `**bold**`, backtick code and [links](/path).
 * Links that start with "/" stay on this site.
 */

import { DESIGN_URL } from "./design";

export type Post = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tldr: string[];
  body: string;
};


const posts: Post[] = [
  {
    slug: "empty-loading-error-states",
    title: "Design the empty, loading and error states first",
    summary: "Every data view has at least four states. Here is what to show in each one, and when to show it.",
    date: "2026-11-21",
    tldr: [
      "Every data view has four states: empty, loading, error and full. Design all four.",
      "An empty state says what goes here and offers one action.",
      "Show nothing for 300ms. Then show a skeleton shaped like the real content.",
      "An error says what happened, whether anything was lost, and what to do next.",
      "Keep the frame the same size in every state, so nothing jumps.",
    ],
    body: `
## Four states, one canvas

Mockups show the full state with perfect data. Real users meet the other states first. A new account starts empty. A slow train connection starts loading. A server deploy starts with an error.

So put all four next to each other before you build anything. Full, empty, loading, error. Same frame, same width.

You can do this in [Design by Astabyte](${DESIGN_URL}&utm_campaign=blog), our design editor in the browser. AI agents work on the same canvas over MCP, so you can draw the full state and ask an agent to draft the empty and error frames next to it. Then fix what it got wrong.

## Empty

There are three kinds of empty. Each needs different words.

- **First use.** Nothing exists yet. Say what will live here and give one button that creates it. "No invoices yet. Create your first invoice."
- **No results.** A search or filter found nothing. Repeat the query and offer to clear it. "No orders match “refund” in the last 7 days. Clear filters."
- **Cleared.** The user finished everything. Confirm it calmly. "You're all caught up." No confetti.

The button should do the thing, not link to a help page. If it can't, it's probably the wrong button.

Keep it small. A 240px illustration above one line of text pushes the action below the fold on a phone. An icon, a title, one line and a button is enough. That is all our [Empty state](/empty-state) has.

## Loading

Timing matters more than the spinner you pick.

- **Under 300ms:** show nothing. A spinner that flashes for 100ms makes the app feel slower than no spinner at all.
- **300ms to about 2s:** show a [Skeleton](/skeleton) in the shape of the real content.
- **Longer, or a known length:** show [Progress](/progress) and say what is happening. "Importing 1,200 contacts."
- **Over 10s:** let people leave. Tell them with a [Toast](/toast) when it's done.

Make the skeleton match the real layout. Same row height, same number of rows you usually show, same column widths. When the data arrives, nothing should move.

On a refresh, keep the data you already have. Dim it a little and put a small spinner in a corner. Don't blank a table to reload it.

For a button that starts work, put the [Spinner](/spinner) inside the button. Keep the button the same width and disable it, so a second click can't send a second request.

For cheap actions that are easy to undo, skip loading entirely. Rename, like, reorder. Show the result right away and roll it back if the server says no.

## Error

A good error message answers three questions.

1. What happened, in plain words.
2. Is my data safe? Did the payment go through?
3. What can I do now?

"We couldn't load your orders. Nothing was changed. Try again." Add a Try again button right there.

"Error 500" answers none of them. "Something went wrong" answers none of them either.

Put the error where the problem is:

- A field error goes under the field.
- A section error goes inside that section, as an [Alert](/alert).
- A full-page error is only for when the whole page failed.

Don't use a toast for a form error. It disappears before people find the field.

Never clear a form on error. Keep every character the user typed.

Payments need extra care. Say clearly whether money moved. "Your card was not charged." Our [Payment status](/payment-status) block shows processing, verifying and done as one ring, so people always know which step they are on.

Don't blame the user and don't make jokes. A calm, specific sentence does more.

## Partial

There is a fifth state: some data loaded and some failed. Show what you have. Mark the part that failed and give it its own retry. One broken widget should not take the whole dashboard down.

## Same size, every state

Give the container a minimum height close to the typical full state. Swap the content inside it. Fade between states with opacity over about 150ms.

Layout shift is not only ugly. It moves buttons under people's fingers, and they tap the wrong thing.

## Checklist

- First use, no results and cleared: each one designed?
- Nothing shown for the first 300ms?
- Skeleton matches the real layout?
- Errors say what happened, what's safe and what's next?
- Forms keep their input after an error?
- Same height across all states?
`,
  },
  {
    slug: "hierarchy-in-dense-ui",
    title: "Contrast and hierarchy in dense product UI",
    summary: "How to keep trading and checkout screens readable: three text levels, one accent colour, tabular numbers and contrast you can measure.",
    date: "2026-11-20",
    tldr: [
      "Use three text levels, not seven: primary, secondary and muted.",
      "Text people need to read needs 4.5:1 contrast. Muted labels too.",
      "Give one accent colour one job.",
      "Use tabular numbers and right-align them in columns.",
      "Group with space before you add borders and boxes.",
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

## The squint test

Blur a screenshot by about 4px, or just squint. What is still visible should be what matters most. If what stands out is a border, an icon or a badge, fix the hierarchy before you add anything else.
`,
  },
  {
    slug: "motion-that-feels-good",
    title: "Motion that feels good: one easing, short durations",
    summary: "One curve for the whole product, 150 to 400ms, transform and opacity only, and a calm version for reduced motion.",
    date: "2026-11-19",
    tldr: [
      "Use one easing curve everywhere. Ours is cubic-bezier(.16,1,.3,1).",
      "Keep most UI motion between 150 and 300ms. Big surfaces get up to 400ms.",
      "Animate transform and opacity. Leave width, height and top alone.",
      "Make exits faster than entrances.",
      "Respect reduced motion. Swap movement for a short fade.",
    ],
    body: `
## Pick one easing

Mixed curves make a product feel like several products stitched together. Pick one and use it for everything.

Ours is \`cubic-bezier(.16,1,.3,1)\`. It is an ease-out with a long tail. It starts fast, so the UI answers right away. It settles softly, so it doesn't feel mechanical.

Two curves to avoid for UI:

- **linear.** Nothing in the real world moves like that. It feels robotic.
- **ease-in on entrances.** It starts slow, and a slow start reads as lag.

Springs are fine too. They work best for things the user drags or throws, because they can pick up the speed of the finger. Use springs for things the user moves and the curve for things the UI moves.

## Durations that work

- **100ms:** press states and hover colour.
- **150 to 200ms:** tooltips, small menus, toggles.
- **250 to 300ms:** dialogs, drawers, a section changing.
- **350 to 400ms:** large panels and full-screen sheets.

Anything over 500ms for a common action feels slow by the tenth time. People see your menus hundreds of times a day.

Scale the duration with the distance. A tooltip that moves 4px needs less time than a drawer that crosses the screen.

Make exits about two thirds of the entrance. A dialog that opens in 300ms can close in 200ms. Once someone decides to leave, get out of the way.

## Transform and opacity only

Browsers can animate \`transform\` and \`opacity\` without redoing layout. Width, height, top, left, margin and padding force layout on every frame. On a mid-range phone, that is where the stutter comes from.

- To slide, use \`translate\`, not top or left.
- To grow, use \`scale\`, not width.
- To reveal, fade in with a small translate, or use \`clip-path\`.

The one common exception is an accordion opening to its natural height. Keep it short and animate one panel at a time.

Our build fails if a component's keyframes animate width, height or position. It's a cheap check and it keeps every block in the kit smooth.

## Move things a short way

Enter from 4 to 8px away, not 40. Scale from 0.96, not from 0. Motion should hint where something came from, not fly it across the screen.

A dropdown that scales from 0.96 at its trigger with a 150ms fade feels attached to the button. One that drops 30px feels like it fell from somewhere else.

## One moment per screen

If everything moves, nothing stands out. Pick the one thing the user should notice and animate only that.

[Add to cart](/add-to-cart) is one moment: a dot arcs into the cart and the badge pops. The [Motion button](/motion-button) is another: a small response on press and nothing else. Every block in the [motion lab](/#components) works this way.

## Loops and interruptions

- Fade loops out at the end instead of snapping back to the first frame.
- Pause loops when they scroll offscreen or the tab is hidden. They burn battery and nobody is watching.
- Let motion be interrupted. If someone clicks again halfway, start from where things are now.

CSS transitions handle interruption for you. Keyframes don't. Use transitions for state changes and keyframes for one-off entrances.

## Reduced motion

Some people get dizzy or sick from movement on screen. Their OS has a setting for it, and CSS can read it with \`prefers-reduced-motion: reduce\`.

Don't just switch every animation off. State changes still need to be visible. Swap movement for a short opacity fade of about 150ms.

Do stop these completely:

- Parallax and scroll-linked movement.
- Loops that play on their own.
- Large slides and zooms.

## Test on a slow phone

A fast laptop hides problems. Set CPU throttling to 4x in your browser's dev tools, or borrow a mid-range Android phone. If an animation drops frames there, make it shorter or cut it.

Good motion is mostly restraint. One curve, short times, two properties, and a calm version for the people who need it.
`,
  },
  {
    slug: "button-and-touch-target-sizes",
    title: "Size buttons for the finger, not the label",
    summary: "Heights, padding and hit areas you can copy: 40px buttons, 44px targets on touch and 8px between them.",
    date: "2026-11-18",
    tldr: [
      "Use a 40px default button. Go to 44 or 48px on touch screens.",
      "Make every tap target at least 44 by 44px, even when the icon is 16px.",
      "Keep at least 8px between targets.",
      "Set horizontal padding to about 40% of the button height.",
      "One primary button per view. Size is part of the hierarchy.",
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

## Quick checklist

- Every target at least 44 by 44px on touch?
- At least 8px between targets?
- Inputs and buttons share heights?
- One filled button per view?
- Pressed state shown in under 100ms?
`,
  },
];

/** Newest first. */
export const POSTS = [...posts].sort((a, b) => b.date.localeCompare(a.date));

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);

/** Plain text of a body, for word counts and summaries. */
export const plainText = (md: string) =>
  md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*#]/g, "")
    .replace(/^\s*(-|\d+\.)\s+/gm, "");

export const wordCount = (p: Post) => plainText(`${p.tldr.join(" ")} ${p.body}`).split(/\s+/).filter(Boolean).length;

/** Minutes to read at about 230 words a minute. */
export const readingTime = (p: Post) => Math.max(1, Math.round(wordCount(p) / 230));

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type Block = { t: "h2"; text: string; id: string } | { t: "p"; text: string } | { t: "ul" | "ol"; items: string[] };

/** Splits a body into blocks. Blank lines separate blocks. */
export function parse(md: string): Block[] {
  return md
    .trim()
    .split(/\n\s*\n/)
    .map((chunk): Block => {
      const lines = chunk.trim().split("\n").map((l) => l.trim());
      if (lines[0].startsWith("## ")) {
        const text = lines[0].slice(3);
        return { t: "h2", text, id: slugify(text) };
      }
      if (lines.every((l) => l.startsWith("- "))) return { t: "ul", items: lines.map((l) => l.slice(2)) };
      if (lines.every((l) => /^\d+\.\s/.test(l))) return { t: "ol", items: lines.map((l) => l.replace(/^\d+\.\s/, "")) };
      return { t: "p", text: lines.join(" ") };
    });
}

export const tocOf = (p: Post) => [
  { id: "tldr", title: "TL;DR" },
  ...parse(p.body).flatMap((b) => (b.t === "h2" ? [{ id: b.id, title: b.text }] : [])),
];
