---
name: astabyte-ui
description: Build React UI with Astabyte UI (ui.astabyte.com), a motion-first shadcn component kit. Use when the user wants buttons, inputs, selects, menus, toasts, dialogs, a navbar, pricing, sign-in, settings or footer sections, or motion components for trading (price chart, candlesticks, order book, trade ticket), payments (card checkout, payment status, payment methods) or ecommerce (add to cart, product options, free shipping bar), or asks to install a component from ui.astabyte.com or the @astabyte registry.
---

# Astabyte UI

A React 19 + Tailwind CSS v4 component kit with hand-tuned motion, distributed as a [shadcn](https://ui.shadcn.com) registry. Components are copied into the project as source by default; the same components are also an npm library (`asta-ui`) for projects that would rather import than own them. Interactive components (dialog, dropdown menu, select, tooltip, tabs, accordion, checkbox, switch, slider, radio group, segmented control, avatar, command palette) come in two builds with the same props, look and motion: on Radix (`radix-ui`) or on Base UI (`@base-ui/react`). The headless library handles behaviour (focus trap, keyboard, ARIA); Astabyte adds the styling and motion. Use the build that matches the project: if it already depends on `@base-ui/react` (or `components.json` has a `base-*` style, or the `@astabyte` registry points at `/r/base/`), use Base UI; if it has `radix-ui` or `@radix-ui/*`, use Radix. Don't mix the two in one project.

- **Kit** (68): everyday building blocks by atomic layer (Atoms, Molecules, Organisms).
- **Motion lab** (34): focused motion components for real products: trading, payments, ecommerce, plus interaction pieces.

Browse: https://ui.astabyte.com · Machine-readable index: https://ui.astabyte.com/llms.txt · Registry index: https://ui.astabyte.com/r/registry.json (Base UI: https://ui.astabyte.com/r/base/registry.json)

## Install a component

Works in any React + Tailwind v4 project: Next.js, Vite, React Router, Astro (React islands), TanStack Start, Laravel + Inertia. Set up once (runs `shadcn init` when there is no `components.json`, then adds the `@astabyte` registry):

```sh
pnpm dlx asta-ui@latest init            # Radix
pnpm dlx asta-ui@latest init --base     # Base UI
```

Then add components by slug (several at once is fine). Without a flag the CLI uses what `init` chose; `--base` / `--radix` override it. Extra flags (`-y`, `-o`, `-p`) go to shadcn. `npx`, `bunx` and `yarn dlx` work too.

```sh
pnpm dlx asta-ui@latest add <slug> [<slug>...] [--base]
pnpm dlx asta-ui@latest list [search]
pnpm dlx asta-ui@latest prompt <slug>
```

Or with the shadcn CLI directly:

```sh
pnpm dlx shadcn@latest add https://ui.astabyte.com/r/<slug>.json        # Radix (also /r/radix/<slug>.json)
pnpm dlx shadcn@latest add https://ui.astabyte.com/r/base/<slug>.json   # Base UI
pnpm dlx shadcn@latest add @astabyte/<slug>             # with the namespace below
```

```json
{ "registries": { "@astabyte": "https://ui.astabyte.com/r/{name}.json" } }
```

(For Base UI use `https://ui.astabyte.com/r/base/{name}.json`. Items without primitives are identical in both.)

The file lands in `components/astabyte/`, its npm dependencies are installed and its colour tokens are merged into the project CSS. Import it from there, e.g. `import { Button } from "@/components/astabyte/button"`. Open `https://ui.astabyte.com/<slug>` for the usage example (the demo is the usage code).

Without the CLI: open the component page, copy the file(s) under Manual, and add the tokens from the page's `globals.css` tab.

## Or use the npm package

When the project should take updates instead of owning the source (or the user asks for a package), install the library build of the same components:

```sh
pnpm add asta-ui radix-ui          # Radix build
pnpm add asta-ui @base-ui/react    # Base UI build
```

```css
@import "tailwindcss";
@import "asta-ui/styles.css";   /* tokens (:root light, .dark), eases and @source for the component classes */
```

```tsx
import { Button, Dialog, PriceChart, TextareaAui003 } from "asta-ui"; // Radix
import { Dialog } from "asta-ui/base";                                // Base UI
import { PriceChart } from "asta-ui/price-chart";                     // one component: "asta-ui/<slug>" or "asta-ui/base/<slug>"
```

Names: kit items by component name (`Dialog`, `Select`, `Toaster` for toast), motion blocks by component name (`PriceChart`, `OrderBook`), variants by id in PascalCase (`TextareaAui003`, also by name, e.g. `ChatComposer`). Button's inline spinner is `ButtonSpinner`; `Spinner` is the standalone loader. Customise through props and the tokens; don't patch files in node_modules. If Tailwind misses classes, add `@source "../node_modules/asta-ui/dist";` (relative to the stylesheet). Don't mix the package and copied files of the same component.

## Rules when using or editing these components

- **Tokens, never hard-coded colours.** Use `paper` / `paper-2` (surfaces), `ink` / `ink-2` (text), `mute` (secondary text), `brand` (the one highlight colour) and `signal`, as Tailwind classes (`bg-paper`, `text-ink`, `text-mute`, `bg-brand`) or `var(--color-*)`. Canvas code reads them with `getComputedStyle`. Rebrand by remapping the tokens, not by editing components.
- **One accent.** Keep to dark/light surfaces, greys and the accent. In market UI, up = accent and down = neutral (no green/red unless the user asks).
- **Motion:** animate `transform` and `opacity` only; ease with `cubic-bezier(.16,1,.3,1)` or springs; interpolate values every frame rather than stepping; loops fade out instead of snapping back; honour `prefers-reduced-motion`.
- **Inputs:** every interactive piece supports pointer, touch and keyboard; keep focus rings (`focus-visible:ring-brand`).
- Components are client components (`"use client"`, ignored outside Next.js). In Astro, render them as islands with `client:visible`.
- Keep to one primitive library: install every Astabyte UI component with the same build (`--base` or not).
- Use fake data and fake brands in demos.

## Example requests

Typical things users ask for, and the components that cover them (more at https://ui.astabyte.com/prompts):

- **Trading dashboard**: A live market view: price line, candlesticks, order book and a ticket to place orders. Components: `price-chart`, `candlestick`, `order-book`, `trade-ticket`, `segmented-control`, `toast`.
- **Checkout**: Cart to paid: product options, add to cart, free-shipping progress, payment methods, card form and payment status. Components: `variant-picker`, `add-to-cart`, `cart-drawer`, `pay-methods`, `card-checkout`, `payment-status`.
- **Settings page**: Account and preferences with tabs, switches, selects, sliders and a save toast. Components: `settings-panel`, `tabs`, `switch`, `select`, `slider`, `field`, `button`, `toast`.
- **Landing page**: A product landing page: navbar, hero with motion buttons, pricing and footer. Components: `navbar`, `motion-button`, `badge`, `pricing`, `footer`.
- **Sign-in**: Auth screen with inputs, a hold-to-confirm action and the command palette for power users. Components: `sign-in`, `input`, `checkbox`, `hold-to-confirm`, `command-palette`.

## Catalogue: kit

| Component | Group | What it does | Primitives |
|---|---|---|---|
| [Button](https://ui.astabyte.com/button) `button` | Atoms | Seven variants, four sizes, icons that nudge, a loading state that keeps its width, and a keyboard hint. | Radix + Base UI |
| [Motion buttons](https://ui.astabyte.com/motion-button) `motion-button` | Atoms | Buttons with a bit of character: rolling labels, a fill that follows the cursor, a light beam on the border, a copy that turns into a check. | — |
| [Input](https://ui.astabyte.com/input) `input` | Atoms | Text input with icons, a clear button, password reveal and states for error and success. | — |
| [Textarea](https://ui.astabyte.com/textarea) `textarea` | Atoms | Grows with its content and counts down the characters left. | — |
| [Checkbox](https://ui.astabyte.com/checkbox) `checkbox` | Atoms | The tick draws itself in. Supports an indeterminate state for select-all rows. | Radix + Base UI |
| [Switch](https://ui.astabyte.com/switch) `switch` | Atoms | A switch whose thumb stretches while you press it, in three sizes. | Radix + Base UI |
| [Slider](https://ui.astabyte.com/slider) `slider` | Atoms | Range slider with a value bubble, ticks and full keyboard support. | Radix + Base UI |
| [Badge](https://ui.astabyte.com/badge) `badge` | Atoms | Labels for status and counts: solid, soft, outline, with a dot, a live pulse or a remove button. | — |
| [Avatar](https://ui.astabyte.com/avatar) `avatar` | Atoms | Image with an initials fallback and a status dot. Groups stack and fan out on hover. | Radix + Base UI |
| [Kbd](https://ui.astabyte.com/kbd) `kbd` | Atoms | Key caps for shortcuts that press down when you press the real key. | — |
| [Spinner](https://ui.astabyte.com/spinner) `spinner` | Atoms | Loaders for every wait: ring, dots, bars, orbit, plus a progress bar. | — |
| [Tooltip](https://ui.astabyte.com/tooltip) `tooltip` | Atoms | Hover or focus to show. A short delay on the first one, instant while you move between them. | Radix + Base UI |
| [Skeleton](https://ui.astabyte.com/skeleton) `skeleton` | Atoms | Placeholders with a soft shimmer, composed into a card while content loads. | — |
| [Rating](https://ui.astabyte.com/rating) `rating` | Atoms | Stars you hover to preview and click to set, with half stars. The filled ones pop in turn when the value changes. | — |
| [Progress](https://ui.astabyte.com/progress) `progress` | Atoms | A bar or a ring that eases to each new value. Leave out the value and it turns into a calm loading sweep. | — |
| [Alert](https://ui.astabyte.com/alert) `alert` | Atoms | An inline callout for info, success or a warning. The tone shows in the icon, not in colour. Dismiss it and it fades, then the space closes up. | — |
| [Breadcrumb](https://ui.astabyte.com/breadcrumb) `breadcrumb` | Atoms | A trail back to the root that ends on the current page. When the row runs out of room, the middle pages fold into a menu. | — |
| [Pagination](https://ui.astabyte.com/pagination) `pagination` | Atoms | Previous, next and page numbers, with an ellipsis where pages are skipped. The active marker slides to the page you pick. | — |
| [Copy button](https://ui.astabyte.com/copy-button) `copy-button` | Atoms | Click to copy. The icon turns into a check that draws itself in, then settles back. Add a label or keep it icon-only. | — |
| [Toggle group](https://ui.astabyte.com/toggle-group) `toggle-group` | Atoms | A row of buttons you press on or off. Pick one and the background slides over from the last, or let several stay pressed. | — |
| [Range slider](https://ui.astabyte.com/range-slider) `range-slider` | Atoms | Two thumbs for a low and a high value. They keep a set gap and never cross. A bubble shows the value as you drag. | — |
| [Color picker](https://ui.astabyte.com/color-picker) `color-picker` | Atoms | A calm grid of swatches with a ring that scales in on the one you pick. Type any hex in the field for a custom colour. | — |
| [Avatar group](https://ui.astabyte.com/avatar-group) `avatar-group` | Atoms | Overlapping avatars that spread a little on hover. The one you point at lifts and shows a name. The rest fold into +N. | Radix + Base UI |
| [Inline edit](https://ui.astabyte.com/inline-edit) `inline-edit` | Atoms | Text that turns into a field when you click it. Enter saves, Esc puts the old text back, and a small tick fades in once it's saved. | — |
| [Radio group](https://ui.astabyte.com/radio-group) `radio-group` | Molecules | Choose one: option cards with a ring that glides to the selection, or a compact list. | Radix + Base UI |
| [Segmented control](https://ui.astabyte.com/segmented-control) `segmented-control` | Molecules | A pill that slides between options and squashes a little on the way. | Radix + Base UI |
| [Tabs](https://ui.astabyte.com/tabs) `tabs` | Molecules | Underline tabs with an indicator that stretches between them and content that cross-fades. | Radix + Base UI |
| [Form field](https://ui.astabyte.com/field) `field` | Molecules | Label, hint and error around any input. Invalid fields shake once and say why. | — |
| [Select](https://ui.astabyte.com/select) `select` | Molecules | A listbox with type-ahead search, check marks and full keyboard control. | Radix + Base UI |
| [Dropdown menu](https://ui.astabyte.com/dropdown-menu) `dropdown-menu` | Molecules | An action menu with icons, shortcuts, groups and a destructive item, opening from its trigger. | Radix + Base UI |
| [Accordion](https://ui.astabyte.com/accordion) `accordion` | Molecules | Questions that open with a smooth height animation, one or many at a time. | Radix + Base UI |
| [Toast](https://ui.astabyte.com/toast) `toast` | Molecules | Stacked notifications that fan out on hover and can be swiped away. | — |
| [Number input](https://ui.astabyte.com/number-input) `number-input` | Molecules | A stepper that repeats while held, with digits that roll to the new value. | — |
| [Tag input](https://ui.astabyte.com/tag-input) `tag-input` | Molecules | Type and press Enter or comma to add a tag, Backspace to remove the last one. | — |
| [Dialog](https://ui.astabyte.com/dialog) `dialog` | Molecules | A modal that grows out of its trigger, traps focus and closes on Escape. | Radix + Base UI |
| [Date picker](https://ui.astabyte.com/date-picker) `date-picker` | Molecules | A date field with a month calendar that slides between months. Pick one day or a range with a soft band between. | — |
| [Combobox](https://ui.astabyte.com/combobox) `combobox` | Molecules | Type to filter with the match in bold, then pick one, or many as removable chips. | — |
| [Stepper](https://ui.astabyte.com/stepper) `stepper` | Molecules | Numbered steps that turn into checks, a line that fills as you go and content that slides in from the side you're heading. | — |
| [File upload](https://ui.astabyte.com/file-upload) `file-upload` | Molecules | Drop files or browse. Each one gets a row with a progress bar, and files that don't fit are turned away with a reason. | — |
| [OTP input](https://ui.astabyte.com/otp-input) `otp-input` | Molecules | Boxes for a one-time code. Digits drop in, paste fills them all, a full code waves and a wrong one shakes. | — |
| [Popover](https://ui.astabyte.com/popover) `popover` | Molecules | A click-to-open panel that grows out of its trigger, flips when there's no room and hands focus back when it closes. | — |
| [Drawer](https://ui.astabyte.com/drawer) `drawer` | Molecules | A sheet that slides in from the right, the left or the bottom over a fading overlay. Escape or a click outside closes it, and the bottom sheet drags down to dismiss. | — |
| [Password input](https://ui.astabyte.com/password-input) `password-input` | Molecules | A new-password field with an eye that morphs as you reveal it. The meter fills as rules pass and turns blue when they all do, and each rule ticks itself off. | — |
| [Timeline](https://ui.astabyte.com/timeline) `timeline` | Molecules | Events on a connector line that rise in one after another as the list scrolls into view. Finished steps draw the line down and the active one pulses softly. | — |
| [Carousel](https://ui.astabyte.com/carousel) `carousel` | Molecules | Slides you swipe, drag or step through with the arrows. The active dot stretches into a bar that fills while autoplay runs, and hovering pauses it. | — |
| [Stat card](https://ui.astabyte.com/stat-card) `stat-card` | Molecules | A KPI tile whose value counts up when it scrolls into view, and from the old number when it changes. Up reads blue, down stays neutral, and a tiny sparkline draws itself in. | — |
| [Empty state](https://ui.astabyte.com/empty-state) `empty-state` | Molecules | What a list shows when there is nothing in it. A small line drawing draws itself in, with a title, a line of text and up to two actions. | Radix + Base UI |
| [Context menu](https://ui.astabyte.com/context-menu) `context-menu` | Molecules | Right-click, long-press or Shift+F10 opens a menu at the pointer. It scales in from the nearest corner and flips to stay on screen, with shortcuts, separators and a submenu. | — |
| [Hover card](https://ui.astabyte.com/hover-card) `hover-card` | Molecules | A preview card for a link, like a profile peek. It fades and lifts in after a short hover or on keyboard focus, and stays open while you move into it. | — |
| [Tree view](https://ui.astabyte.com/tree-view) `tree-view` | Molecules | Nested folders and files. The chevron turns and the children fade in below, and the full tree keyboard works, from arrows to type-ahead. | — |
| [Image compare](https://ui.astabyte.com/image-compare) `image-compare` | Molecules | A before and after slider. Drag anywhere or use the arrows. The before layer sits in a window that slides one way while the picture slides back. | — |
| [Announcement bar](https://ui.astabyte.com/announcement-bar) `announcement-bar` | Molecules | A slim banner for the top of a page with a message and a link. Several messages take turns sliding up, hovering pauses them, and closing slides the bar away. | — |
| [Navbar](https://ui.astabyte.com/navbar) `navbar` | Organisms | A site header with a mega menu: the panel morphs between sections, tiles dim their neighbours, and it folds on mobile. | Radix + Base UI |
| [Sign-in card](https://ui.astabyte.com/sign-in) `sign-in` | Organisms | Email and password with social buttons, inline validation and a submit that shows progress then success. | Radix + Base UI |
| [Pricing](https://ui.astabyte.com/pricing) `pricing` | Organisms | Plans with a monthly / yearly switch whose prices roll to the new amount. | Radix + Base UI |
| [Command palette](https://ui.astabyte.com/command-palette) `command-palette` | Organisms | Press ⌘J (or click): grouped results, fuzzy filtering, arrow keys and recent items. | Radix + Base UI |
| [Settings panel](https://ui.astabyte.com/settings-panel) `settings-panel` | Organisms | A settings form whose save bar slides up as soon as something changes. | Radix + Base UI |
| [Footer](https://ui.astabyte.com/footer) `footer` | Organisms | Link columns, a newsletter field that confirms in place, and a big wordmark. | Radix + Base UI |
| [Data table](https://ui.astabyte.com/data-table) `data-table` | Organisms | Sort by any column, search, select rows and page through. Rows slide in on every change and the header sticks. | — |
| [Sidebar](https://ui.astabyte.com/sidebar) `sidebar` | Organisms | An app sidebar with a workspace switcher and grouped links. The active marker slides and the whole thing folds to an icon rail. | Radix + Base UI |
| [Kanban board](https://ui.astabyte.com/kanban) `kanban` | Organisms | Drag cards between columns and the gap opens where they will land. Works with the keyboard too: Space to pick up, arrows to move. | Radix + Base UI |
| [Onboarding checklist](https://ui.astabyte.com/onboarding) `onboarding` | Organisms | A setup checklist with a progress bar. Finish a step and it ticks off, then the next one opens. | Radix + Base UI |
| [Comments](https://ui.astabyte.com/comments) `comments` | Organisms | A discussion thread with replies, a like that pops and a composer that grows as you type. New comments slide in. | Radix + Base UI |
| [AI chat](https://ui.astabyte.com/ai-chat) `ai-chat` | Organisms | An assistant panel. Replies stream in and each word fades in. Stop a reply mid-way, copy it or ask for another. Suggested prompts fill the empty state. | — |
| [Event calendar](https://ui.astabyte.com/event-calendar) `event-calendar` | Organisms | A month view with event pills and a list for the day you pick. Months slide in from the side you moved to. Arrow keys walk the grid. | — |
| [Checkout](https://ui.astabyte.com/checkout) `checkout` | Organisms | Contact, shipping and payment on one page. Card fields format as you type. Change a quantity or shipping speed and the totals roll. Pay shows a pending state, then a receipt. | Radix + Base UI |
| [Team members](https://ui.astabyte.com/team-members) `team-members` | Organisms | A team list with a role picker per person. Paste several emails to invite them at once. Remove someone and an Undo row gives you a few seconds to change your mind. | Radix + Base UI |
| [Notification center](https://ui.astabyte.com/notification-center) `notification-center` | Organisms | A bell with an unread count that opens a panel grouped by day. Switch between All and Unread and mark one or all as read. The bell rings when something new arrives. | Radix + Base UI |

## Catalogue: motion lab

| Component | Group | What it does | Primitives |
|---|---|---|---|
| [Hold to confirm](https://ui.astabyte.com/hold-to-confirm) `hold-to-confirm` | Actions | Destructive actions ask for commitment: hold to fill, let go early and it drains away. | — |
| [Scramble text](https://ui.astabyte.com/scramble-text) `scramble-text` | Feedback | Words decode letter by letter on hover — a tiny reward for curiosity. | — |
| [Spotlight grid](https://ui.astabyte.com/spotlight-grid) `spotlight-grid` | Surfaces | One light source shared across every tile, so borders glow as the cursor passes. | — |
| [Elastic string](https://ui.astabyte.com/elastic-string) `elastic-string` | Feedback | Pluck a line: it follows you, then rings back to rest. | — |
| [Ink trail](https://ui.astabyte.com/ink-trail) `ink-trail` | Feedback | The pointer leaves a ribbon that thins and fades as it ages. | — |
| [Gravity words](https://ui.astabyte.com/gravity-pills) `gravity-pills` | Surfaces | Words as physical discs. They fall, pile up, and you can grab one and throw it at the rest. | — |
| [Rotary dial](https://ui.astabyte.com/dial-knob) `dial-knob` | Inputs | A knob you actually turn: drag around it, scroll, or use the arrows, with a detent every ten. | — |
| [Morse key](https://ui.astabyte.com/morse-tap) `morse-tap` | Inputs | Tap for a dot, hold for a dash. Pauses commit letters, so one button can spell anything. | — |
| [Split-flap board](https://ui.astabyte.com/split-flap) `split-flap` | Feedback | Each flap steps through the alphabet until it lands, like an old departure board. | — |
| [Combination lock](https://ui.astabyte.com/combo-lock) `combo-lock` | Inputs | Three wheels to drag or scroll. Find the code and the shackle pops open. | — |
| [Needle field](https://ui.astabyte.com/needle-field) `needle-field` | Surfaces | A grid of compass needles that all turn to face you. The closest ones light up. | — |
| [Snap to grid](https://ui.astabyte.com/snap-grid) `snap-grid` | Surfaces | Drag a block anywhere; it springs into the nearest cell. The grid only appears while you drag. | — |
| [Pixel reveal](https://ui.astabyte.com/pixel-reveal) `pixel-reveal` | Surfaces | Rub away a wall of pixels to read the message underneath. It slowly grows back. | — |
| [Bubble wrap](https://ui.astabyte.com/bubble-wrap) `bubble-wrap` | Feedback | Press to pop, or drag across to pop a whole row. Pointless, and hard to stop. | — |
| [Price chart](https://ui.astabyte.com/price-chart) `price-chart` | Feedback | A live price line that eases each new tick in. Hover to scrub it with a crosshair. | — |
| [Candlestick chart](https://ui.astabyte.com/candlestick) `candlestick` | Surfaces | Candles stream in and the current one grows live. Hover for its open, high, low and close. | — |
| [Order book](https://ui.astabyte.com/order-book) `order-book` | Feedback | Bids and asks with depth bars that ease to the new size and prices that flash when they move. | — |
| [Trade ticket](https://ui.astabyte.com/trade-ticket) `trade-ticket` | Inputs | Buy or sell with one slider. The amount rolls as you drag and the order fills with a check. | — |
| [Card checkout](https://ui.astabyte.com/card-checkout) `card-checkout` | Inputs | An illustrated card that fills in as you type. The front slides aside to show the CVC on the back. Click it to type your own. | — |
| [Payment status](https://ui.astabyte.com/payment-status) `payment-status` | Feedback | One ring tells the whole story: it spins while processing, fills while verifying, then turns into a check. | — |
| [Payment methods](https://ui.astabyte.com/pay-methods) `pay-methods` | Inputs | Four ways to pay. The highlight glides between them and the detail line morphs to match. | — |
| [Add to cart](https://ui.astabyte.com/add-to-cart) `add-to-cart` | Actions | A dot arcs from the button into the cart, the badge pops, and the button turns into a stepper. | — |
| [Product options](https://ui.astabyte.com/variant-picker) `variant-picker` | Inputs | Pick a finish and it sweeps across the product; change the storage and the price rolls. | — |
| [Free shipping bar](https://ui.astabyte.com/cart-drawer) `cart-drawer` | Surfaces | Items pop in, the bar fills, and it locks in with a check when shipping is free. | — |
| [Plan switcher](https://ui.astabyte.com/plan-switcher) `plan-switcher` | Inputs | Switch plans and the ring glides over, the price rolls and features slide in or get struck out. Go yearly and a savings pill pops. | — |
| [Shipment tracker](https://ui.astabyte.com/shipment-tracker) `shipment-tracker` | Feedback | A van rides the route and pauses at each stop while the ETA counts down. At the door a check draws. Click a stop to scrub. | — |
| [Payment received](https://ui.astabyte.com/payment-received) `payment-received` | Feedback | A payment lands as a toast, the balance rolls up and the sparkline grows a point. Hover to pause. | — |
| [Wishlist](https://ui.astabyte.com/wishlist) `wishlist` | Actions | Tap a heart and it bursts, then flies into Saved and the badge pops. Tap again and it flies back. | — |
| [Chat thread](https://ui.astabyte.com/chat-thread) `chat-thread` | Inputs | Typing dots grow into a reply, and your message lifts out of the composer. The receipt ticks over to Read. Type and press Enter to join in. | — |
| [Seat picker](https://ui.astabyte.com/seat-picker) `seat-picker` | Inputs | Pick a seat and it pops blue while the total rolls. Now and then someone else books one and it fades in. Arrow keys move between seats. | — |
| [Now playing](https://ui.astabyte.com/now-playing) `now-playing` | Actions | The equalizer bounces while it plays. Skip and the title and cover slide across. Space plays or pauses, arrows seek. | — |
| [Booking slots](https://ui.astabyte.com/booking-slots) `booking-slots` | Inputs | Pick a day and its times stagger in. Pick a time and Confirm slides up, then turns into a check and a Booked summary. | — |
| [Notification stack](https://ui.astabyte.com/notification-stack) `notification-stack` | Feedback | Notifications land on top of a soft stack and the unread badge pops. Hover to fan them out. Swipe or tap X to dismiss and the rest settle up. | — |
| [Token swap](https://ui.astabyte.com/token-swap) `token-swap` | Inputs | Type an amount and the quote rolls. Flip and the rows trade places. Swap goes from Confirming to a check, and the rate refreshes on a ring. | — |

## Catalogue: variants

Standalone takes on a kit component, each with a global id (`aui-001`, `aui-002`…) and installable on its own. They are shown on the base component's page under Variants.

| Id | Variant | What it does | Primitives |
|---|---|---|---|
| `aui-001` | [Textarea · Labelled](https://ui.astabyte.com/textarea#aui-001) | Label, hint, an optional tag and a live character count that warns near the limit. | — |
| `aui-002` | [Textarea · Auto-grow](https://ui.astabyte.com/textarea#aui-002) | Grows with its content and eases to the new height, from a minimum to a maximum number of rows. | — |
| `aui-003` | [Textarea · Chat composer](https://ui.astabyte.com/textarea#aui-003) | A message box with attachment chips and a send button. ⌘/Ctrl + Enter sends. | — |
| `aui-004` | [Textarea · Floating label](https://ui.astabyte.com/textarea#aui-004) | The label sits inside the field and floats up when you focus or type. Pure CSS. | — |
| `aui-005` | [Textarea · Markdown toolbar](https://ui.astabyte.com/textarea#aui-005) | A formatting toolbar that wraps the selection in Markdown, with ⌘B, ⌘I, ⌘E and ⌘K shortcuts and a word count. | — |
| `aui-006` | [Textarea · Mentions & commands](https://ui.astabyte.com/textarea#aui-006) | Type @ to mention someone or / for a command. The list opens at the caret and is fully keyboard driven. | — |
| `aui-007` | [Textarea · Validation](https://ui.astabyte.com/textarea#aui-007) | Checks the text against rules: quiet while typing, shows what's missing on blur with one small shake, ticks rules off live. | — |
| `aui-008` | [Textarea · AI prompt box](https://ui.astabyte.com/textarea#aui-008) | Model picker, token counter and a Generate button that turns into Stop while a response streams. | Radix + Base UI |

Install a variant by its slug, e.g. `pnpm dlx asta-ui@latest add textarea-aui-003`.
