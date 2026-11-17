// Server only: reads lab component sources at build time for ui.astabyte.com.
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface SourceFile {
  name: string;
  code: string;
}
export interface Source {
  files: SourceFile[];
  packages: string[];
}

// turbopackIgnore: these reads only happen at build time (pages are static), so keep them out of file tracing.
const ROOT = /*turbopackIgnore: true*/ process.cwd();

async function slugToFile(): Promise<Map<string, string>> {
  const reg = await readFile(path.join(/*turbopackIgnore: true*/ ROOT, "components/lab/components.ts"), "utf8");
  const map = new Map<string, string>();
  for (const m of reg.matchAll(/"([a-z0-9-]+)":\s*load\(\(\) => import\("\.\/(blocks\/[A-Za-z0-9]+)"\)\)/g)) {
    map.set(m[1], `components/lab/${m[2]}.tsx`);
  }
  // Kit: the demo is registered, the installable file is `components/kit/<slug>.tsx`.
  const kit = await readFile(path.join(/*turbopackIgnore: true*/ ROOT, "components/kit/demos.ts"), "utf8");
  for (const m of kit.matchAll(/"([a-z0-9-]+)":\s*load\(\(\) => import\("\.\/demos\/[a-z0-9-]+"\)\)/g)) {
    map.set(m[1], `components/kit/${m[1]}.tsx`);
  }
  // Variants: `components/kit/variants/<slug>.tsx`, registered in `components/kit/variants.ts`.
  const vars = await readFile(path.join(/*turbopackIgnore: true*/ ROOT, "components/kit/variants.ts"), "utf8");
  for (const m of vars.matchAll(/"([a-z0-9-]+)":\s*load\(\(\) => import\("\.\/variants\/demos\/[a-z0-9-]+"\)\)/g)) {
    map.set(m[1], `components/kit/variants/${m[1]}.tsx`);
  }
  return map;
}

async function resolveLocal(spec: string, from: string): Promise<string | null> {
  const base = spec.startsWith("@/") ? path.join(/*turbopackIgnore: true*/ ROOT, spec.slice(2)) : path.resolve(/*turbopackIgnore: true*/ path.dirname(path.join(/*turbopackIgnore: true*/ ROOT, from)), spec);
  for (const ext of [".tsx", ".ts"]) {
    try {
      await readFile(base + ext);
      return path.relative(ROOT, base + ext);
    } catch {}
  }
  return null;
}

/** The block file plus every local file it imports (recursively), and the npm packages used. */
export async function getSource(slug: string): Promise<Source | null> {
  const entry = (await slugToFile()).get(slug);
  if (!entry) return null;
  const files: SourceFile[] = [];
  const packages = new Set<string>();
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const rel = queue.shift()!;
    if (seen.has(rel)) continue;
    seen.add(rel);
    const code = await readFile(path.join(/*turbopackIgnore: true*/ ROOT, rel), "utf8");
    files.push({ name: rel, code });
    for (const m of code.matchAll(/^import\s[^;]*?from\s+"([^"]+)";?$/gm)) {
      const spec = m[1];
      if (spec.startsWith("@/") || spec.startsWith(".")) {
        const local = await resolveLocal(spec, rel);
        if (local) queue.push(local);
      } else {
        packages.add(spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
      }
    }
  }
  return { files, packages: [...packages].sort() };
}

/** A kit item's demo, with its kit imports pointed at the CLI install path. */
export async function getDemo(slug: string): Promise<string | null> {
  for (const dir of ["components/kit/demos", "components/kit/variants/demos"]) {
    try {
      const code = await readFile(path.join(/*turbopackIgnore: true*/ ROOT, `${dir}/${slug}.tsx`), "utf8");
      return code.replace(/"@\/components\/kit\/(?:variants\/)?([a-z0-9-]+)"/g, (_, s: string) => `"@/components/astabyte/${s}"`);
    } catch {}
  }
  return null;
}

/** The design tokens the components use, as a Tailwind v4 `@theme` block. */
export async function getTheme(light = false): Promise<string> {
  const css = await readFile(path.join(/*turbopackIgnore: true*/ ROOT, "app/globals.css"), "utf8");
  const m = css.match(/@theme \{[\s\S]*?\n\}/);
  if (!m) return "";
  let theme = m[0];
  if (light) {
    // Kit items use the ui site's light palette.
    const ui = css.match(/\.ui-light \{([\s\S]*?)\n\}/)?.[1] ?? "";
    for (const v of ui.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
      theme = theme.replace(new RegExp(`(--color-${v[1]}:\\s*)[^;]+;`), `$1${v[2].trim()};`);
    }
    theme = theme.replace(/\n\s*\/\*[^*]*(?:Dark-first|Lime)[^*]*\*\//g, "");
  }
  return `@import "tailwindcss";\n\n${theme}\n`;
}

// ---- shadcn registry (`npx shadcn add https://ui.astabyte.com/r/<slug>.json`) ----

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Where a file lands in the user's project: blocks → components/astabyte/<slug>, helpers alongside. */
function installPath(rel: string, slug: string, entry: string): string {
  if (rel === entry) return `components/astabyte/${slug}.tsx`;
  const base = path.basename(rel).replace(/\.(tsx|ts)$/, "");
  if (rel.startsWith("lib/")) return `lib/astabyte-${kebab(base)}.ts`;
  return `components/astabyte/${kebab(base)}.tsx`;
}

/**
 * Design tokens in shadcn's shape: colours as CSS variables (shadcn maps `--paper` to `--color-paper`, so
 * classes like `bg-paper` work) and eases straight into `@theme`. Every item ships the same values, because
 * tokens are global: the ui site's light palette (white, black, a little blue) for `:root` and its dark
 * palette for `.dark`. Motion blocks are designed on dark surfaces, so they look their best under `.dark`.
 */
async function cssVars() {
  const css = await readFile(path.join(/*turbopackIgnore: true*/ ROOT, "app/globals.css"), "utf8");
  const base = css.match(/@theme \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const pick = (block: string) => {
    const out: Record<string, string> = {};
    // `accent` is the ui site's own token; components use `brand`, so they never clash with shadcn's `--accent`.
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

export async function registryItem(slug: string, meta: { title: string; description: string }) {
  const src = await getSource(slug);
  const entry = (await slugToFile()).get(slug);
  if (!src || !entry) return null;
  const vars = await cssVars();
  const tokens = new Set(Object.keys(vars.light));
  const files = await Promise.all(
    src.files.map(async (f) => {
      let content = f.code;
      for (const m of f.code.matchAll(/from\s+"(@\/[^"]+|\.{1,2}\/[^"]+)"/g)) {
        const local = await resolveLocal(m[1], f.name);
        if (local) content = content.replace(`"${m[1]}"`, `"@/${installPath(local, slug, entry).replace(/\.(tsx|ts)$/, "")}"`);
      }
      // In the installed project `--color-x` is `var(--x)` resolved once on :root, so a nested `.dark` wouldn't
      // reach raw `var(--color-x)` in inline styles and arbitrary values. Point those at `--x`, which `.dark` sets.
      content = content.replace(/var\(--color-([a-z0-9-]+)\)/g, (m, name: string) => (tokens.has(name) ? `var(--${name})` : m));
      const target = installPath(f.name, slug, entry);
      return { path: `registry/astabyte/${target}`, content, type: target.startsWith("lib/") ? "registry:lib" : "registry:component", target };
    }),
  );
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: slug,
    type: "registry:component",
    title: meta.title,
    description: meta.description,
    author: "Astabyte <https://astabyte.com>",
    dependencies: src.packages.filter((p) => p !== "react" && p !== "react-dom"),
    files,
    cssVars: vars,
  };
}

/** The tokens as the CSS a manual install pastes in: what the shadcn CLI would merge into the stylesheet. */
export async function getTokensCss(): Promise<string> {
  const { theme, light, dark } = await cssVars();
  const vars = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `  --${k}: ${v};`).join("\n");
  const map = Object.keys(light).map((k) => `  --color-${k}: var(--${k});`).join("\n");
  const eases = Object.entries(theme).map(([k, v]) => `  --${k}: ${v};`).join("\n");
  return `@import "tailwindcss";\n\n@custom-variant dark (&:is(.dark *));\n\n@theme inline {\n${map}\n${eases}\n}\n\n:root {\n${vars(light)}\n}\n\n.dark {\n${vars(dark)}\n}\n`;
}
