# UI kit surface

The ui.astabyte.com look. White, black and white, and one blue. Components feel premium because of motion and detail, not colour.

## Tokens

Light is the default (`:root`). Previews and code sit on dark stages (`.dark`).

| Token | Light | Dark stage | Use |
|---|---|---|---|
| `paper` | `#fcfcfb` | `#0b0b0c` | Ground |
| `paper-2` | `#f2f2f0` | `#151516` | Raised surfaces, soft buttons, inline code |
| `ink` | `#0a0a0a` | `#f2f2f0` | Headlines, main text, solid buttons |
| `ink-2` | `#3b3b3a` | `#cfcfcc` | Body copy, ghost buttons |
| `mute` | `#8a8a87` | `#7d7d80` | Secondary text, hints |
| `brand` | `#2f54eb` | `#8aa4ff` | The one blue. Accent buttons, focus rings, active states, link underlines |
| `signal` | `#0a0a0a` | `#f2f2f0` | Strong neutral highlight (bullets, active chips) |
| `on-signal` | `#ffffff` | `#0b0b0c` | Text on a `signal` fill |
| `line` | `rgb(10 10 10 / 0.1)` | `rgb(242 242 240 / 0.12)` | Rare separators, inset outlines |

No lime, green, red or gold. Market up = blue, down = neutral. Destructive buttons may use `#e5484d`.

Hover surfaces mix a little ink into `paper-2`: `color-mix(in srgb, var(--color-ink) 5%, var(--color-paper-2))`.

## Type

- Geist and Geist Mono.
- Page headings: weight 500, `-0.04em`, line-height 1, about `clamp(1.5rem, 2.4vw, 2rem)` for doc sections. Bigger hero headings follow the same rule.
- Buttons and UI labels: weight 500, `-0.01em`.
- Docs body: 17px, line-height 1.7, `ink-2`, with `ink` for strong text.
- Code: Geist Mono 13.5px, line-height 1.7.
- Keyboard hints: mono 11.5px in a small 20px chip with 4px corners.

## Shape

- Buttons 6–9px. Cards and panels 10–14px.
- Pills (full rounding) only for switches, avatars and dots.
- Outlines are inset shadows in ink at 8–24%, not borders: `box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-ink) 14%, transparent)`.

## Buttons

| Size | Height | Padding | Text | Radius |
|---|---|---|---|---|
| xs | 28px | 10px | 12px | 6px |
| sm | 32px | 12px | 13px | 6px |
| md | 40px | 16px | 14px | 8px |
| lg | 48px | 20px | 15px | 9px |

- Variants: solid (ink fill), accent (brand fill, white text), outline, soft (`paper-2`), ghost, link, danger.
- Filled buttons get a little body without a gradient: a light top inset edge plus a soft drop. `inset 0 1px 0 rgb(255 255 255 / .18), 0 1px 2px rgb(0 0 0 / .16), 0 6px 14px -8px rgb(0 0 0 / .45)`.
- Press: `scale(.97)`. Transition 200ms on colour, shadow, transform and opacity.
- Focus: `ring-2` in brand at 50%, offset 2px on `paper`.
- Disabled: 45% opacity, no pointer events.
- Marketing buttons can fill from the bottom on hover (a pseudo-element from `translateY(101%)` to `0`, 550ms expo out) and swap their arrow (the old arrow slides out, a new one slides in, 500ms).
- Link buttons grow an underline from the left on hover.

## Layout

- Header: sticky, 56px. Clear at the top. Once the page scrolls, a solid paper bar fades in over the first 48px. No glass, no blur, no gradient tail, no shadow, no bottom border.
- Docs shell: centred at 1600px with a `clamp(16px, 2.8vw, 40px)` gutter. Sidebars stick at 56px from the top.
- Prose column: 720px max.
- Previews mount only near the viewport and keep their height when unmounted, so scrolling never jumps.

## Motion lab cards

- Real use cases (trading, payments, ecommerce) that look like finished product UI and fill the card.
- One focused, looping motion moment per card. Not a crammed full-app preview.
- Monochrome plus the blue. Abstract and typographic over illustrated.
- Fake data, and the brand is always Astabyte.
- Placeholder photos are neutral and unbranded.

## Motion

- Easing `cubic-bezier(.16,1,.3,1)` or springs.
- Entrances: fade plus `translateY(8px)`, 400ms, staggered 45ms per item.
- Menus and popovers: fade plus `translateY(-6px) scale(.985)` to rest. Open in about 220–450ms, close faster (about 180ms).
- Tab or panel swaps: the outgoing panel leaves fast (about 120ms), the incoming one arrives just after (260–360ms). They never sit half-transparent on top of each other.
- Icons can have one small move each on hover (nudge, tilt, pop), 700ms, transform only.
- Keyframes are injected once, not inside every popup.
- Reduced motion turns all of it off.

## Docs copy

Write like a blog post. Short sentences, one idea each. Lead with what the reader does. A TL;DR or a list where it helps. No semicolons or long parentheses. Don't wrap inline code in brackets.
