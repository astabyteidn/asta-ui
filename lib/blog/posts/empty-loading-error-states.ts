import { DESIGN_URL } from "@/lib/design";
import type { Post } from "../types";

const post: Post = {
  slug: "empty-loading-error-states",
  group: "basics",
  order: 3,
  title: "Design the empty, loading and error states first",
  summary: "Every data view has at least four states. Here is what to show in each one, and when to show it.",
  date: "2026-11-21",
  tldr: [
    "Every data view has four states: empty, loading, error and full. Design all four.",
    "An empty state says what goes here and offers one action.",
    "Show nothing for 300ms. Then show a skeleton shaped like the real content.",
    "An error says what happened, whether anything was lost, and what to do next.",
    "Keep the frame the same size in every state, so nothing jumps."
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

::live empty-state

## Loading

Timing matters more than the spinner you pick.

- **Under 300ms:** show nothing. A spinner that flashes for 100ms makes the app feel slower than no spinner at all.
- **300ms to about 2s:** show a [Skeleton](/skeleton) in the shape of the real content.
- **Longer, or a known length:** show [Progress](/progress) and say what is happening. "Importing 1,200 contacts."
- **Over 10s:** let people leave. Tell them with a [Toast](/toast) when it's done.

Make the skeleton match the real layout. Same row height, same number of rows you usually show, same column widths. When the data arrives, nothing should move.

::live skeleton

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

::live payment-status

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
};

export default post;
