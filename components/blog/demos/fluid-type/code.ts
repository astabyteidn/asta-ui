// The real code behind the fluid type demos. The demos inject these strings, and the post shows them as-is.

export const FLUID_CSS = `/* The box is the "screen". Real pages use vw the same way. */
.fluid-page {
  container-type: inline-size;
}

.fluid-page .inner {
  /* 16px to 40px */
  padding: clamp(1rem, 0.413rem + 2.609cqi, 2.5rem);
}

.fluid-page h3 {
  /* 28px at 360px wide, 48px at 1280px */
  font-size: clamp(1.75rem, 1.261rem + 2.174cqi, 3rem);
  line-height: 1.05;
  text-wrap: balance;
}

.fluid-page p {
  /* 16px at 360px wide, 20px at 1280px */
  font-size: clamp(1rem, 0.902rem + 0.435cqi, 1.25rem);
  line-height: 1.5;
  text-wrap: pretty;
}`;

export const FLUID_VW_CSS = `:root {
  --text-body: clamp(1rem, 0.902rem + 0.435vw, 1.25rem);
  --text-h1: clamp(1.75rem, 1.261rem + 2.174vw, 3rem);
  --space-section: clamp(1rem, 0.413rem + 2.609vw, 2.5rem);
}`;

export const WRAP_CSS = `/* The demo swaps the value with a variable. */
.wrap-demo h3 { text-wrap: var(--wrap); }
.wrap-demo p  { text-wrap: var(--wrap); }`;

export const WRAP_SHIP_CSS = `/* What you would ship */
h1, h2, h3 { text-wrap: balance; }
p, li      { text-wrap: pretty; }`;

export const CLAMP_TS = `// One straight line from (minW, minPx) to (maxW, maxPx), capped at both ends.
function fluid(minPx: number, maxPx: number, minW = 360, maxW = 1280) {
  const slope = (maxPx - minPx) / (maxW - minW);   // px per px of width
  const base = minPx - slope * minW;                // size at width 0
  const rem = (px: number) => +(px / 16).toFixed(3);
  return \`clamp(\${rem(minPx)}rem, \${rem(base)}rem + \${+(slope * 100).toFixed(3)}vw, \${rem(maxPx)}rem)\`;
}

fluid(16, 20); // "clamp(1rem, 0.902rem + 0.435vw, 1.25rem)"`;
