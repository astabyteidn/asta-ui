import { CLAMP_TS, FLUID_CSS, FLUID_VW_CSS, WRAP_CSS, WRAP_SHIP_CSS } from "@/components/blog/demos/fluid-type/code";
import type { Post } from "../types";

const post: Post = {
  slug: "fluid-type",
  group: "web",
  order: 3,
  title: "Fluid type with clamp()",
  summary: "Type and spacing that grow with the screen in one line of CSS, plus text-wrap to fix ragged headings and lonely last words.",
  date: "2026-11-21",
  tldr: [
    "Write clamp(min, preferred, max). The middle value grows with the width. The other two cap it.",
    "Pick two points, like 16px at 360px and 20px at 1280px. Draw a straight line between them. That line is the middle value.",
    "Keep a rem part in the middle so text still grows when people zoom.",
    "Use the same trick for spacing, not only type.",
    "Add text-wrap: balance to headings and text-wrap: pretty to body text.",
  ],
  body: `
## One size per breakpoint

The classic way is a size per breakpoint. 16px on phones, 18px from 768px, 20px from 1280px. It works, but it jumps. A tablet held one way gets one size, and turned the other way gets a different one. Every jump is another media query to keep in sync.

\`clamp()\` replaces the steps with a line. Text grows smoothly with the width and stops at a floor and a ceiling.

\`\`\`css
font-size: clamp(1rem, 0.902rem + 0.435vw, 1.25rem);
\`\`\`

Read it from the outside in. Never smaller than **1rem**, which is 16px. Never larger than **1.25rem**, which is 20px. In between, follow the middle value.

## Try it on a page

The box below acts as the screen. Drag its width. The heading, the body text and the padding all follow it. The demo uses \`cqi\`, which is 1% of the box width. A real page uses \`vw\`, 1% of the window width, in exactly the same way.

::demo page

Below **360px** everything sits at its minimum. Above **1280px** everything sits at its maximum. In between there are no steps at all. Press Replay to jump through three widths.

## The slope math

The middle value is a straight line through two points. Pick them first. Our body text is **16px at 360px** wide and **20px at 1280px** wide.

1. **Slope.** The size grows 4px over 920px of width. That is 4 ÷ 920 = 0.00435px per pixel of width.
2. **As vw.** 1vw is 1% of the width, so multiply by 100. That gives **0.435vw**.
3. **Base.** Find the size at width 0. That is 16 minus 0.00435 × 360, which is 14.43px, or **0.902rem**.
4. **Put it together.** \`clamp(1rem, 0.902rem + 0.435vw, 1.25rem)\`.

Check it at 1280px. 14.43 + 0.00435 × 1280 is 20. The line hits both points.

Change the two sizes and watch each step update.

::demo math

The base is in rem on purpose. If the middle value were only \`vw\`, browser zoom would do nothing to it, because zoom doesn't change the window width in CSS pixels. A rem part keeps text growing with zoom. That matters for people who need bigger text.

## Space grows too

Type that grows inside fixed padding looks cramped on big screens and loose on small ones. Use the same line for spacing. The section padding in the first demo goes from **16px** to **40px** over the same range.

Put the values in tokens once, then use them everywhere:

\`\`\`css
${FLUID_VW_CSS}
\`\`\`

Keep the ratio between min and max modest for body text. **1.25** is plenty. Headings can stretch more. Ours go from **28px** to **48px**, a ratio of about 1.7.

## Better line breaks

Fluid sizes change where lines break. A heading that fit on two even lines at one width leaves one word alone at another. Two values fix most of that.

- **balance** spreads a heading evenly over its lines. Chrome only balances blocks of 6 lines or fewer, so use it on headings, not paragraphs.
- **pretty** fixes the last line of body text, so a paragraph doesn't end on one short word. It costs a little more work, so browsers run it where it counts.

Compare them side by side, and change the width.

::demo wrap

Notice that neither changes the width of the text box. Balance can make a heading look narrower, so leave room for it in your layout.

## Support

- \`clamp()\` works in every current browser.
- Container units like \`cqi\`: Chrome 105, Safari 16, Firefox 110. Real pages use \`vw\`, which works everywhere.
- \`text-wrap: balance\`: Chrome 114, Safari 17.5, Firefox 121.
- \`text-wrap: pretty\`: Chrome 117, Safari 26. Firefox doesn't support it yet.

The fallback is free. A browser that doesn't know \`balance\` or \`pretty\` ignores them and wraps text the normal way. Nothing breaks, so add them today.

## Next

Fluid type follows the screen. Often the space you have is a slot inside it. Next: [Container queries](/blog/container-queries).
`,
  demos: {
    page: {
      title: "A page that follows its width",
      caption: "Body **16 to 20px**, heading **28 to 48px**, padding **16 to 40px**, all between **360px** and **1280px** wide. Wider boxes are scaled down to fit. The numbers are the real sizes.",
      code: [{ name: "fluid.css", code: FLUID_CSS }],
      height: 480,
    },
    math: {
      title: "From two sizes to a clamp()",
      caption: "**16px** at **360px** and **20px** at **1280px** give **0.435vw** and a base of **0.902rem**. The code is the same function the demo uses.",
      code: [{ name: "fluid.ts", code: CLAMP_TS }],
      height: 400,
    },
    wrap: {
      title: "text-wrap: normal · balance · pretty",
      caption: "Same text and width on both sides. At **230px** the normal paragraph ends on one word, and **pretty** fixes it. At **260px** the normal heading leaves one word alone, and **balance** evens it out.",
      code: [
        { name: "base.css", code: WRAP_SHIP_CSS },
        { name: "demo.css", code: WRAP_CSS },
      ],
      height: 400,
    },
  },
};

export default post;
