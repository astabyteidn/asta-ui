---
name: astabyte-design
description: Design UI in the Astabyte style. Use when designing or building pages, components, marketing sites, docs or app screens for Astabyte, when choosing colours, type, spacing, radii or motion for them, or when reviewing a UI against the Astabyte look. Covers three surfaces with their own tokens - the studio site (dark, lime, square), the UI kit (white, black, one blue, soft corners) and app UI (dense dark editor chrome, blue). For installing ready-made components from ui.astabyte.com, use the astabyte-ui skill instead.
---

# Astabyte design

How Astabyte UI looks, moves and reads. Every rule here comes from shipped Astabyte products, so follow it literally.

TL;DR:

- Pick the surface first. Each one has its own tokens. Never mix them.
- One accent colour per surface. Everything else is ground, text and greys.
- One type family: Geist, plus Geist Mono for labels and numbers.
- One easing: `cubic-bezier(.16,1,.3,1)`. Animate `transform` and `opacity` only.
- Copy is short, plain and in sentence case. The only brand name is Astabyte.
- No grid lines, dividers or dot grids. Separate things with space and surfaces.

Need a component that already exists (button, dialog, price chart, pricing section)? Install it with the `astabyte-ui` skill or from ui.astabyte.com. This skill is for designing everything around it, or something new.

## 1. Pick the surface

| Surface | Use it for | Ground | Accent | Corners |
|---|---|---|---|---|
| **Studio** | astabyte.com style: agency pages, case studies, launches, editorial | Dark `#0a0b0a` | Lime `#c5f82a` | Square |
| **UI kit** | ui.astabyte.com style: component docs, product marketing, light product UI | White `#fcfcfb` | Blue `#2f54eb` | Soft, 6–14px |
| **App** | Dense tools: editors, canvases, timelines, inspectors | Dark `#0d0d0f` | Blue `#2f54eb` | Small, 4–10px |

If the request doesn't say, ask or infer: a portfolio or agency page is Studio, a component or docs page is UI kit, a tool people work in all day is App.

Each surface has a full reference with tokens, layout and patterns:

- [references/studio.md](references/studio.md)
- [references/ui-kit.md](references/ui-kit.md)
- [references/app-ui.md](references/app-ui.md)

Read the one you need before you start.

## 2. Shared foundations

These hold on every surface.

### Colour

- Name colours by role, never by hue: `paper` (ground), `paper-2` (raised surface), `ink` (text), `ink-2` (body text), `mute` (secondary text), plus one accent (`signal` on Studio, `brand` on UI kit and App).
- Use the tokens in code (`bg-paper`, `text-mute`, `var(--color-brand)`). No hard-coded hex in components.
- One accent per surface. No second highlight colour. No green, red or gold for status. A market going up uses the accent. Going down stays neutral.
- The one exception is a destructive action (delete, revoke), which may use red `#e5484d`.
- No gradients as decoration. A soft fade behind a sticky header or at the edge of a marquee is fine.
- Lines are rare. When you need one, use `line`: ink at 7–12% opacity.

### Type

- Geist for display and body. Geist Mono for labels, ids, keyboard hints and numbers.
- Display is Geist 500, sentence case, tight tracking (`-0.04em` to `-0.05em`), tight leading (`0.92`–`1.05`).
- Body text 15–18px with a line-height around 1.7. Keep prose columns near 720px.
- Use `tabular-nums` for any number that changes or lines up.
- Mono labels are small (10.5–12px). On Studio they are uppercase with `0.08em` tracking.
- Never: serif display type, wide or extended faces, all-caps headlines, more than one family.

### Copy

Write like a short blog post, not a spec.

- Short sentences, one idea each. Lead with what the reader does.
- Sentence case for headings, buttons and labels. "Get started", not "Get Started".
- Plain words. No hype, no filler, no "unleash" or "seamless".
- No semicolons and no long parentheses. Split the sentence instead.
- Lists, tables and a TL;DR where they help scanning.
- Buttons say the action: "Copy code", "Start a project". Never "Let's talk".
- Never use the ✳ asterisk or ® in copy or decoration.

### Brand and names

- Every brand or product in a demo, mockup or placeholder is **Astabyte**. Logo mark "A", emails `@astabyte.com`.
- Never Acme, Northwind or another invented brand. Other companies become plain descriptions: "Design studio", "Logistics team".
- People's names in demos are fine.
- Web3 work stays anonymous. Call it "Web3 client" with a generic description. No project names, tickers, contract addresses, domains, logos, socials or brand colours.
- Demo data is fake but realistic. Real results and real quotes only when they are real.

### Motion

- One easing everywhere: `cubic-bezier(.16,1,.3,1)` (expo out). Springs are fine too. `cubic-bezier(.76,0,.24,1)` (quart in-out) only for big panel moves on Studio.
- Animate `transform` and `opacity` only. Never animate width, height, top, left, margin or padding.
- Durations:
  - 150–200ms: hover colour, press, small toggles.
  - 250–400ms: menus, popovers, tab swaps, list entries.
  - 450–600ms: button fills, panels, cards entering.
  - 0.9–1.3s: page-level reveals (headline lines, hero).
- Press feedback is a small scale: `scale(.96)`–`scale(.97)`.
- Stagger lists by 30–80ms per item.
- Loops fade out and back in. They never snap to the start.
- One focused motion moment per card or section. Don't animate everything.
- Interpolate values every frame instead of stepping them.
- Always honour `prefers-reduced-motion`: drop loops, reveals and transitions.

### Performance

Smooth on a mid-range phone is the bar.

- Loops (`requestAnimationFrame`, `setInterval`) pause when offscreen (IntersectionObserver) or when the tab is hidden, and stop on unmount.
- Clean up every listener, observer and timer.
- No layout reads (`getBoundingClientRect`, `offsetWidth`) inside a per-frame callback. Measure once or on resize.
- Images are webp, sized with `width` and `height`, and `loading="lazy"` below the fold.
- Long lists (100+ items) render in chunks or with `content-visibility`.
- Heavy previews mount near the viewport and keep their height when unmounted, so the page never jumps.
- No new runtime dependency for one component.

### Accessibility

- Everything works with pointer, touch and keyboard.
- Keep visible focus: a 2px ring or outline in the accent, offset 2px.
- Text contrast: `ink` and `ink-2` for reading, `mute` only for secondary text, never for body copy.
- Icon-only buttons get an `aria-label`. Decorative marks get `aria-hidden`.
- Hit targets at least 28px in dense app chrome, 40px on marketing and touch surfaces.

### Layout and surfaces

- Separate with spacing and a `paper-2` surface, not with borders.
- No column guides, grid lines, dot-grid fills, or hairline dividers between rows, cards or sections. Input underlines and the thin separators inside dense app panels are the only exceptions.
- No glass or blur. No drop shadow under headers.
- Sticky headers start clear and gain a paper background (or a soft paper fade on Studio) once the page scrolls.
- No illustrations, stock 3D, emoji art or coloured product renders. Be typographic and abstract. Neutral, unbranded photos are allowed where a photo is the point.
- Mobile first: 16px side gutter minimum, no horizontal scroll.

## 3. Tokens at a glance

Copy the block for your surface into a Tailwind v4 stylesheet. The references explain each value.

### Studio

```css
@theme {
  --color-paper: #0a0b0a;
  --color-paper-2: #141513;
  --color-ink: #e9e9e4;
  --color-ink-2: #cfcfc8;
  --color-mute: #7b7d76;
  --color-signal: #c5f82a;
  --color-on-signal: #0a0b0a;
  --color-line: rgb(233 233 228 / 0.12);
  --font-display: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-quart: cubic-bezier(0.76, 0, 0.24, 1);
}
```

### UI kit (light, with dark stages)

```css
@theme {
  --color-paper: #fcfcfb;
  --color-paper-2: #f2f2f0;
  --color-ink: #0a0a0a;
  --color-ink-2: #3b3b3a;
  --color-mute: #8a8a87;
  --color-brand: #2f54eb;
  --color-signal: #0a0a0a;
  --color-on-signal: #ffffff;
  --color-line: rgb(10 10 10 / 0.1);
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Dark stage for previews and code blocks. */
.dark {
  --color-paper: #0b0b0c;
  --color-paper-2: #151516;
  --color-ink: #f2f2f0;
  --color-ink-2: #cfcfcc;
  --color-mute: #7d7d80;
  --color-brand: #8aa4ff;
  --color-signal: #f2f2f0;
  --color-on-signal: #0b0b0c;
  --color-line: rgb(242 242 240 / 0.12);
}
```

### App

```css
@theme {
  --color-paper: #0d0d0f;
  --color-paper-2: #16161a;
  --color-paper-3: #232328;
  --color-canvas: #1c1c20;
  --color-ink: #ededee;
  --color-ink-2: #c4c4c9;
  --color-mute: #82828a;
  --color-line: rgb(255 255 255 / 0.07);
  --color-brand: #2f54eb;
  --color-brand-2: #5576ff;
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## 4. Surface rules in one line each

- **Studio:** dark ground, lime used sparingly, square corners, huge sentence-case display, `§ NN — Title` mono labels, specimen ids like `AB-L01`, corner `.ticks` on frames, lines that slide up from a mask.
- **UI kit:** white ground, black and white with one blue, buttons 6–9px, cards 10–14px, pills only for switches, avatars and dots, previews on dark stages, sticky 56px header.
- **App:** 12px base type, 48px top bar, 240–268px side panels on `paper-2`, 32px tool buttons with 7px corners, 28px fields with 6px corners, selection and guides in `brand-2`.

## 5. Don'ts

- Serif display, wide or all-caps headlines, a second type family.
- A second accent colour, green and red for up and down, gold badges.
- Rounded grey cards on Studio. Square corners on the UI kit.
- Grid lines, dot grids, hairline dividers between sections or cards.
- Glass, blur, drop shadows under headers, decorative gradients.
- Illustrations, coloured product renders, emoji as decoration.
- The ✳ asterisk, ®, "Let's talk", Hover/Press/Drag filter chips.
- Acme, Northwind or any invented brand. Any real web3 project.
- Layout animation, loops that never pause, snapping loops, easings other than expo out.

## 6. Before you ship

- [ ] The surface is clear and only its tokens are used. No hard-coded colours.
- [ ] One accent. Up = accent, down = neutral. Red only for destructive actions.
- [ ] Geist and Geist Mono only. Display is 500, sentence case, tight tracking.
- [ ] Corners match the surface: square (Studio), 6–14px (UI kit), 4–10px (App).
- [ ] No grid lines, dividers, dot grids, glass, illustrations, ✳ or ®.
- [ ] Copy is short and plain, sentence case, no semicolons. Buttons name the action.
- [ ] Every brand is Astabyte. Web3 work is "Web3 client".
- [ ] Motion is `transform`/`opacity` only, expo out, one moment per card, reduced motion respected.
- [ ] Loops pause offscreen and on hidden tabs. Listeners are cleaned up.
- [ ] Keyboard and touch work. Focus is visible. Icon buttons have labels.
- [ ] Works at 360px wide with a 16px gutter and no horizontal scroll.
- [ ] Images are webp, sized and lazy.
