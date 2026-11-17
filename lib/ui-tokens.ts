// Design tokens parsed from app/globals.css. Pure functions (no file access), shared by the registry
// (lib/ui-source.ts) and the npm package build (packages/asta-ui/build.ts), so both ship the same values.

export interface Tokens {
  /** `ease-*` values for `@theme`. */
  theme: Record<string, string>;
  /** Colour tokens for `:root` (the ui site's light palette). */
  light: Record<string, string>;
  /** Colour tokens for `.dark`. */
  dark: Record<string, string>;
}

/**
 * Colours as CSS variables in shadcn's shape (`--paper`, mapped to `--color-paper`, so `bg-paper` works)
 * and eases straight into `@theme`. `accent` is the ui site's own token; components use `brand`, so they
 * never clash with shadcn's `--accent`.
 */
export function parseTokens(css: string): Tokens {
  const base = css.match(/@theme \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const pick = (block: string) => {
    const out: Record<string, string> = {};
    for (const m of block.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) if (m[1] !== "accent") out[m[1]] = m[2].trim();
    return out;
  };
  const baseColors = pick(base);
  const light = { ...baseColors, ...pick(css.match(/\.ui-light \{([\s\S]*?)\n\}/)?.[1] ?? "") };
  const dark = { ...baseColors, ...pick(css.match(/\.ui-dark \{([\s\S]*?)\n\}/)?.[1] ?? "") };
  const theme: Record<string, string> = {};
  for (const m of base.matchAll(/--(ease-[a-z0-9-]+):\s*([^;]+);/g)) theme[m[1]] = m[2].trim();
  return { theme, light, dark };
}

/**
 * In an installed project `--color-x` is `var(--x)` resolved once on :root, so a nested `.dark` wouldn't
 * reach raw `var(--color-x)` in inline styles and arbitrary values. Point those at `--x`, which `.dark` sets.
 */
export function pointAtTokens(code: string, tokens: Tokens): string {
  const names = new Set(Object.keys(tokens.light));
  return code.replace(/var\(--color-([a-z0-9-]+)\)/g, (m, name: string) => (names.has(name) ? `var(--${name})` : m));
}

/** The token CSS (without `@import "tailwindcss"`): `@theme inline` mapping plus `:root` and `.dark` values. */
export function tokensCss({ theme, light, dark }: Tokens): string {
  const vars = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `  --${k}: ${v};`).join("\n");
  const map = Object.keys(light).map((k) => `  --color-${k}: var(--${k});`).join("\n");
  const eases = Object.entries(theme).map(([k, v]) => `  --${k}: ${v};`).join("\n");
  return `@theme inline {\n${map}\n${eases}\n}\n\n:root {\n${vars(light)}\n}\n\n.dark {\n${vars(dark)}\n}\n`;
}
