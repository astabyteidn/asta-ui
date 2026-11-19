# Studio surface

The astabyte.com look. Think instrument or spec sheet: a dark page, precise type, one lime signal. It should feel like its own thing, not a copy of other agency sites.

## Tokens

| Token | Value | Use |
|---|---|---|
| `paper` | `#0a0b0a` | Page ground. Dark first, always. |
| `paper-2` | `#141513` | Raised surfaces, code, cards that need a fill |
| `ink` | `#e9e9e4` | Headlines and main text |
| `ink-2` | `#cfcfc8` | Body copy |
| `mute` | `#7b7d76` | Labels, captions, meta |
| `signal` | `#c5f82a` | The lime accent. Logo mark, link underlines, bullets, selection, one highlight per view |
| `on-signal` | `#0a0b0a` | Text on a lime fill |
| `line` | `rgb(233 233 228 / 0.12)` | Input underlines and code block borders only |

Selection is lime with paper text. Lime is a signal, not a fill colour for big areas.

## Type

- Geist for everything, Geist Mono for labels.
- **Display** (`.display`): Geist 500, `letter-spacing: -0.05em`, `line-height: 0.92`, sentence case.
  - Hero: `clamp(4rem, 16vw, 16rem)`.
  - Section headline: `clamp(2.2rem, 6vw, 6rem)`.
  - Smaller statements: `clamp(1.6rem, 3vw, 2.6rem)`.
- **Label** (`.label`): Geist Mono, 11–12px, `letter-spacing: 0.08em`, uppercase, usually `mute`.
- **Prose**: 1.125rem, line-height 1.7. `h2` at `clamp(1.6rem, 3vw, 2.3rem)`, weight 500, `-0.035em`. Links underline with a lime decoration, offset 3px. Bullets are a short 1px lime dash. Blockquotes are large (up to 2rem), weight 500, with a 2px lime left rule.

## Layout

- Side gutter: `clamp(16px, 2.8vw, 40px)`.
- 12-column grid. The section label sits in the first 3 columns on desktop, content in the rest. On mobile the label stacks on top.
- Generous vertical space between sections. Spacing does the separating.
- No column guides, grid lines, dot grids or hairlines between rows, cards or sections.
- Square corners everywhere. No rounded grey cards.

## Motifs

- **Section labels:** `§ 01 — The studio`, `§ 02 — Selected work`. Mono, uppercase via `.label`, `mute`. Numbered in page order.
- **Specimen ids:** short codes like `AB-L01` on items, in mono.
- **Ticks:** registration marks on the four corners of a frame. 10px long, 1px thick, in `ink` (override with `--tick`).

```css
.ticks { position: relative; }
.ticks::before, .ticks::after {
  content: ""; position: absolute; inset: -1px; pointer-events: none;
}
.ticks::before {
  background:
    linear-gradient(var(--tick, var(--color-ink)) 0 0) top left / 10px 1px no-repeat,
    linear-gradient(var(--tick, var(--color-ink)) 0 0) top left / 1px 10px no-repeat,
    linear-gradient(var(--tick, var(--color-ink)) 0 0) top right / 10px 1px no-repeat,
    linear-gradient(var(--tick, var(--color-ink)) 0 0) top right / 1px 10px no-repeat;
}
.ticks::after {
  background:
    linear-gradient(var(--tick, var(--color-ink)) 0 0) bottom left / 10px 1px no-repeat,
    linear-gradient(var(--tick, var(--color-ink)) 0 0) bottom left / 1px 10px no-repeat,
    linear-gradient(var(--tick, var(--color-ink)) 0 0) bottom right / 10px 1px no-repeat,
    linear-gradient(var(--tick, var(--color-ink)) 0 0) bottom right / 1px 10px no-repeat;
}
```

## Header

- Fixed, 64px tall, no solid background and no divider. It stays visible while scrolling.
- Past 40px of scroll, a soft fade (paper → transparent, about 96px tall) fades in behind it so links stay readable.
- Left: the lime logo mark, "Astabyte" in display type at 15px, and a mono "/ Labs" label on wider screens.
- The logo mark may rotate slowly with scroll speed.
- It slides down into place after the preloader (about 1.1s, expo out).

## Preloader

Once per tab only. Scattered dots gather into the logo while a mono counter runs `000` to `100`. A lime sweep passes, then the panel lifts away. Skip it entirely with reduced motion or on later visits.

## Motion

- Headline lines slide up from behind a mask (`overflow: hidden` wrapper, inner span from `translateY(115%)` to `0`), 1.3s, expo out, 80ms stagger. Trigger on scroll at about 88% of the viewport, once.
- A paragraph can light up word by word as it scrolls through.
- Marquees run linear, about 28s per loop, and stop with reduced motion.
- Panel lifts and big wipes may use quart in-out `cubic-bezier(.76,0,.24,1)`.
- Smooth scrolling is fine. A custom cursor is allowed on fine pointers only. Inputs keep the text cursor.

## Work and case studies

- Covers are real screenshots (webp), framed on a card colour picked for the project.
- Web3 covers come from the real product with every name, logo, ticker, contract address, domain and social scrubbed. The card colour is never the project's brand colour. The client is "Web3 client".
- Case studies can show outcomes as big numbers ("value — label") and a testimonial. Real results and real quotes only.

## Don't

- Serif display, wide or extended faces, all-caps display.
- Rounded grey cards, column guides, grid lines, dot grids, dividers.
- ✳, ®, "Let's talk", Hover/Press/Drag filter chips.
- Lime as a large background or more than one lime highlight competing in a view.
