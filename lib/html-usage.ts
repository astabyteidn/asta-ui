import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Plain HTML usage per kit component, for the HTML + CSS layer (asta.css + asta.js), read at build time from
 * `css/examples/<slug>.html`. The same files feed the layer's own test page, so the docs show markup that renders.
 */
export function htmlUsage(slug: string): string | null {
  const file = join(process.cwd(), "css/examples", `${slug}.html`);
  return existsSync(file) ? readFileSync(file, "utf8").trimEnd() : null;
}
