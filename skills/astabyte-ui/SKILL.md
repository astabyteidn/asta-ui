---
name: astabyte-ui
description: Build React UI with Astabyte UI (ui.astabyte.com), a motion-first shadcn component kit. Use when the user wants buttons, inputs, selects, menus, toasts, dialogs, a navbar, pricing, sign-in, settings or footer sections, or motion components for trading (price chart, candlesticks, order book, trade ticket), payments (card checkout, payment status, payment methods) or ecommerce (add to cart, product options, free shipping bar), or asks to install a component from ui.astabyte.com or the @astabyte registry.
---

# Astabyte UI

A React 19 + Tailwind CSS v4 component kit with hand-tuned motion, distributed as a [shadcn](https://ui.shadcn.com) registry. Components are copied into the project as source; there is no Astabyte package to depend on. Interactive components (dialog, dropdown menu, select, tooltip, tabs, accordion, checkbox, switch, slider, radio group, segmented control, avatar, command palette) are built on Radix primitives via the `radix-ui` package, which the shadcn CLI installs; they keep Radix's props for behaviour (focus trap, keyboard, ARIA) and add Astabyte's styling and motion.

- **Kit** (30): everyday building blocks by atomic layer (Atoms, Molecules, Organisms).
- **Motion lab** (24): focused motion components for real products: trading, payments, ecommerce, plus interaction pieces.

Browse: https://ui.astabyte.com · Machine-readable index: https://ui.astabyte.com/llms.txt · Registry index: https://ui.astabyte.com/r/registry.json

## Install a component

Works in any React + Tailwind v4 project that has a `components.json` (run `npx shadcn@latest init` first): Next.js, Vite, React Router, Astro (React islands), TanStack Start, Laravel + Inertia.

```sh
npx shadcn@latest add https://ui.astabyte.com/r/<slug>.json
```

With the namespace configured in `components.json`:

```json
{ "registries": { "@astabyte": "https://ui.astabyte.com/r/{name}.json" } }
```

```sh
npx shadcn@latest add @astabyte/<slug>
```

The file lands in `components/astabyte/`, its npm dependencies are installed and its colour tokens are merged into the project CSS. Import it from there, e.g. `import { Button } from "@/components/astabyte/button"`. Open `https://ui.astabyte.com/<slug>` for the usage example (the demo is the usage code).

Without the CLI: open the component page, copy the file(s) under Manual, and add the tokens from the page's `globals.css` tab.

## Rules when using or editing these components

- **Tokens, never hard-coded colours.** Use `paper` / `paper-2` (surfaces), `ink` / `ink-2` (text), `mute` (secondary text), `brand` (the one highlight colour) and `signal`, as Tailwind classes (`bg-paper`, `text-ink`, `text-mute`, `bg-brand`) or `var(--color-*)`. Canvas code reads them with `getComputedStyle`. Rebrand by remapping the tokens, not by editing components.
- **One accent.** Keep to dark/light surfaces, greys and the accent. In market UI, up = accent and down = neutral (no green/red unless the user asks).
- **Motion:** animate `transform` and `opacity` only; ease with `cubic-bezier(.16,1,.3,1)` or springs; interpolate values every frame rather than stepping; loops fade out instead of snapping back; honour `prefers-reduced-motion`.
- **Inputs:** every interactive piece supports pointer, touch and keyboard; keep focus rings (`focus-visible:ring-brand`).
- Components are client components (`"use client"`, ignored outside Next.js). In Astro, render them as islands with `client:visible`.
- Use fake data and fake brands in demos.

## Example requests

Typical things users ask for, and the components that cover them (more at https://ui.astabyte.com/prompts):

- **Trading dashboard**: A live market view: price line, candlesticks, order book and a ticket to place orders. Components: `price-chart`, `candlestick`, `order-book`, `trade-ticket`, `segmented-control`, `toast`.
- **Checkout**: Cart to paid: product options, add to cart, free-shipping progress, payment methods, card form and payment status. Components: `variant-picker`, `add-to-cart`, `cart-drawer`, `pay-methods`, `card-checkout`, `payment-status`.
- **Settings page**: Account and preferences with tabs, switches, selects, sliders and a save toast. Components: `settings-panel`, `tabs`, `switch`, `select`, `slider`, `field`, `button`, `toast`.
- **Landing page**: A product landing page: navbar, hero with motion buttons, pricing and footer. Components: `navbar`, `motion-button`, `badge`, `pricing`, `footer`.
- **Sign-in**: Auth screen with inputs, a hold-to-confirm action and the command palette for power users. Components: `sign-in`, `input`, `checkbox`, `hold-to-confirm`, `command-palette`.

## Catalogue: kit

| Component | Group | What it does | Install |
|---|---|---|---|
| [Button](https://ui.astabyte.com/button) `button` | Atoms | Seven variants, four sizes, icons that nudge, a loading state that keeps its width, and a keyboard hint. | `https://ui.astabyte.com/r/button.json` |
| [Motion buttons](https://ui.astabyte.com/motion-button) `motion-button` | Atoms | Buttons with a bit of character: rolling labels, a fill that follows the cursor, a light beam on the border, a copy that turns into a check. | `https://ui.astabyte.com/r/motion-button.json` |
| [Input](https://ui.astabyte.com/input) `input` | Atoms | Text input with icons, a clear button, password reveal and states for error and success. | `https://ui.astabyte.com/r/input.json` |
| [Textarea](https://ui.astabyte.com/textarea) `textarea` | Atoms | Grows with its content and counts down the characters left. | `https://ui.astabyte.com/r/textarea.json` |
| [Checkbox](https://ui.astabyte.com/checkbox) `checkbox` | Atoms | The tick draws itself in. Supports an indeterminate state for select-all rows. | `https://ui.astabyte.com/r/checkbox.json` |
| [Switch](https://ui.astabyte.com/switch) `switch` | Atoms | A switch whose thumb stretches while you press it, in three sizes. | `https://ui.astabyte.com/r/switch.json` |
| [Slider](https://ui.astabyte.com/slider) `slider` | Atoms | Range slider with a value bubble, ticks and full keyboard support. | `https://ui.astabyte.com/r/slider.json` |
| [Badge](https://ui.astabyte.com/badge) `badge` | Atoms | Labels for status and counts: solid, soft, outline, with a dot, a live pulse or a remove button. | `https://ui.astabyte.com/r/badge.json` |
| [Avatar](https://ui.astabyte.com/avatar) `avatar` | Atoms | Image with an initials fallback and a status dot. Groups stack and fan out on hover. | `https://ui.astabyte.com/r/avatar.json` |
| [Kbd](https://ui.astabyte.com/kbd) `kbd` | Atoms | Key caps for shortcuts that press down when you press the real key. | `https://ui.astabyte.com/r/kbd.json` |
| [Spinner](https://ui.astabyte.com/spinner) `spinner` | Atoms | Loaders for every wait: ring, dots, bars, orbit, plus a progress bar. | `https://ui.astabyte.com/r/spinner.json` |
| [Tooltip](https://ui.astabyte.com/tooltip) `tooltip` | Atoms | Hover or focus to show. A short delay on the first one, instant while you move between them. | `https://ui.astabyte.com/r/tooltip.json` |
| [Skeleton](https://ui.astabyte.com/skeleton) `skeleton` | Atoms | Placeholders with a soft shimmer, composed into a card while content loads. | `https://ui.astabyte.com/r/skeleton.json` |
| [Radio group](https://ui.astabyte.com/radio-group) `radio-group` | Molecules | Choose one: option cards with a ring that glides to the selection, or a compact list. | `https://ui.astabyte.com/r/radio-group.json` |
| [Segmented control](https://ui.astabyte.com/segmented-control) `segmented-control` | Molecules | A pill that slides between options and squashes a little on the way. | `https://ui.astabyte.com/r/segmented-control.json` |
| [Tabs](https://ui.astabyte.com/tabs) `tabs` | Molecules | Underline tabs with an indicator that stretches between them and content that cross-fades. | `https://ui.astabyte.com/r/tabs.json` |
| [Form field](https://ui.astabyte.com/field) `field` | Molecules | Label, hint and error around any input. Invalid fields shake once and say why. | `https://ui.astabyte.com/r/field.json` |
| [Select](https://ui.astabyte.com/select) `select` | Molecules | A listbox with type-ahead search, check marks and full keyboard control. | `https://ui.astabyte.com/r/select.json` |
| [Dropdown menu](https://ui.astabyte.com/dropdown-menu) `dropdown-menu` | Molecules | An action menu with icons, shortcuts, groups and a destructive item, opening from its trigger. | `https://ui.astabyte.com/r/dropdown-menu.json` |
| [Accordion](https://ui.astabyte.com/accordion) `accordion` | Molecules | Questions that open with a smooth height animation, one or many at a time. | `https://ui.astabyte.com/r/accordion.json` |
| [Toast](https://ui.astabyte.com/toast) `toast` | Molecules | Stacked notifications that fan out on hover and can be swiped away. | `https://ui.astabyte.com/r/toast.json` |
| [Number input](https://ui.astabyte.com/number-input) `number-input` | Molecules | A stepper that repeats while held, with digits that roll to the new value. | `https://ui.astabyte.com/r/number-input.json` |
| [Tag input](https://ui.astabyte.com/tag-input) `tag-input` | Molecules | Type and press Enter or comma to add a tag, Backspace to remove the last one. | `https://ui.astabyte.com/r/tag-input.json` |
| [Dialog](https://ui.astabyte.com/dialog) `dialog` | Molecules | A modal that grows out of its trigger, traps focus and closes on Escape. | `https://ui.astabyte.com/r/dialog.json` |
| [Navbar](https://ui.astabyte.com/navbar) `navbar` | Organisms | A site header with a mega menu: the panel morphs between sections, tiles dim their neighbours, and it folds on mobile. | `https://ui.astabyte.com/r/navbar.json` |
| [Sign-in card](https://ui.astabyte.com/sign-in) `sign-in` | Organisms | Email and password with social buttons, inline validation and a submit that shows progress then success. | `https://ui.astabyte.com/r/sign-in.json` |
| [Pricing](https://ui.astabyte.com/pricing) `pricing` | Organisms | Plans with a monthly / yearly switch whose prices roll to the new amount. | `https://ui.astabyte.com/r/pricing.json` |
| [Command palette](https://ui.astabyte.com/command-palette) `command-palette` | Organisms | Press ⌘J (or click): grouped results, fuzzy filtering, arrow keys and recent items. | `https://ui.astabyte.com/r/command-palette.json` |
| [Settings panel](https://ui.astabyte.com/settings-panel) `settings-panel` | Organisms | A settings form whose save bar slides up as soon as something changes. | `https://ui.astabyte.com/r/settings-panel.json` |
| [Footer](https://ui.astabyte.com/footer) `footer` | Organisms | Link columns, a newsletter field that confirms in place, and a big wordmark. | `https://ui.astabyte.com/r/footer.json` |

## Catalogue: motion lab

| Component | Group | What it does | Install |
|---|---|---|---|
| [Hold to confirm](https://ui.astabyte.com/hold-to-confirm) `hold-to-confirm` | Actions | Destructive actions ask for commitment: hold to fill, let go early and it drains away. | `https://ui.astabyte.com/r/hold-to-confirm.json` |
| [Scramble text](https://ui.astabyte.com/scramble-text) `scramble-text` | Feedback | Words decode letter by letter on hover — a tiny reward for curiosity. | `https://ui.astabyte.com/r/scramble-text.json` |
| [Spotlight grid](https://ui.astabyte.com/spotlight-grid) `spotlight-grid` | Surfaces | One light source shared across every tile, so borders glow as the cursor passes. | `https://ui.astabyte.com/r/spotlight-grid.json` |
| [Elastic string](https://ui.astabyte.com/elastic-string) `elastic-string` | Feedback | Pluck a line: it follows you, then rings back to rest. | `https://ui.astabyte.com/r/elastic-string.json` |
| [Ink trail](https://ui.astabyte.com/ink-trail) `ink-trail` | Feedback | The pointer leaves a ribbon that thins and fades as it ages. | `https://ui.astabyte.com/r/ink-trail.json` |
| [Gravity words](https://ui.astabyte.com/gravity-pills) `gravity-pills` | Surfaces | Words as physical discs. They fall, pile up, and you can grab one and throw it at the rest. | `https://ui.astabyte.com/r/gravity-pills.json` |
| [Rotary dial](https://ui.astabyte.com/dial-knob) `dial-knob` | Inputs | A knob you actually turn: drag around it, scroll, or use the arrows, with a detent every ten. | `https://ui.astabyte.com/r/dial-knob.json` |
| [Morse key](https://ui.astabyte.com/morse-tap) `morse-tap` | Inputs | Tap for a dot, hold for a dash. Pauses commit letters, so one button can spell anything. | `https://ui.astabyte.com/r/morse-tap.json` |
| [Split-flap board](https://ui.astabyte.com/split-flap) `split-flap` | Feedback | Each flap steps through the alphabet until it lands, like an old departure board. | `https://ui.astabyte.com/r/split-flap.json` |
| [Combination lock](https://ui.astabyte.com/combo-lock) `combo-lock` | Inputs | Three wheels to drag or scroll. Find the code and the shackle pops open. | `https://ui.astabyte.com/r/combo-lock.json` |
| [Needle field](https://ui.astabyte.com/needle-field) `needle-field` | Surfaces | A grid of compass needles that all turn to face you. The closest ones light up. | `https://ui.astabyte.com/r/needle-field.json` |
| [Snap to grid](https://ui.astabyte.com/snap-grid) `snap-grid` | Surfaces | Drag a block anywhere; it springs into the nearest cell. The grid only appears while you drag. | `https://ui.astabyte.com/r/snap-grid.json` |
| [Pixel reveal](https://ui.astabyte.com/pixel-reveal) `pixel-reveal` | Surfaces | Rub away a wall of pixels to read the message underneath. It slowly grows back. | `https://ui.astabyte.com/r/pixel-reveal.json` |
| [Bubble wrap](https://ui.astabyte.com/bubble-wrap) `bubble-wrap` | Feedback | Press to pop, or drag across to pop a whole row. Pointless, and hard to stop. | `https://ui.astabyte.com/r/bubble-wrap.json` |
| [Price chart](https://ui.astabyte.com/price-chart) `price-chart` | Feedback | A live price line that eases each new tick in. Hover to scrub it with a crosshair. | `https://ui.astabyte.com/r/price-chart.json` |
| [Candlestick chart](https://ui.astabyte.com/candlestick) `candlestick` | Surfaces | Candles stream in and the current one grows live. Hover for its open, high, low and close. | `https://ui.astabyte.com/r/candlestick.json` |
| [Order book](https://ui.astabyte.com/order-book) `order-book` | Feedback | Bids and asks with depth bars that ease to the new size and prices that flash when they move. | `https://ui.astabyte.com/r/order-book.json` |
| [Trade ticket](https://ui.astabyte.com/trade-ticket) `trade-ticket` | Inputs | Buy or sell with one slider. The amount rolls as you drag and the order fills with a check. | `https://ui.astabyte.com/r/trade-ticket.json` |
| [Card checkout](https://ui.astabyte.com/card-checkout) `card-checkout` | Inputs | A card that fills in as you type and flips over for the CVC. Click it to type your own. | `https://ui.astabyte.com/r/card-checkout.json` |
| [Payment status](https://ui.astabyte.com/payment-status) `payment-status` | Feedback | One ring tells the whole story: it spins while processing, fills while verifying, then turns into a check. | `https://ui.astabyte.com/r/payment-status.json` |
| [Payment methods](https://ui.astabyte.com/pay-methods) `pay-methods` | Inputs | Four ways to pay. The highlight glides between them and the detail line morphs to match. | `https://ui.astabyte.com/r/pay-methods.json` |
| [Add to cart](https://ui.astabyte.com/add-to-cart) `add-to-cart` | Actions | A dot arcs from the button into the cart, the badge pops, and the button turns into a stepper. | `https://ui.astabyte.com/r/add-to-cart.json` |
| [Product options](https://ui.astabyte.com/variant-picker) `variant-picker` | Inputs | Pick a finish and it sweeps across the product; change the storage and the price rolls. | `https://ui.astabyte.com/r/variant-picker.json` |
| [Free shipping bar](https://ui.astabyte.com/cart-drawer) `cart-drawer` | Surfaces | Items pop in, the bar fills, and it locks in with a check when shipping is free. | `https://ui.astabyte.com/r/cart-drawer.json` |
