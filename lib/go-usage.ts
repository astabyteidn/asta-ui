import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Go + htmx usage per kit component, read at build time from the Go gallery (`go/examples/gallery/*.templ`).
 * The snippets are the gallery's own demos, so they compile in CI and never drift from the module.
 */

const GALLERY = join(process.cwd(), "go/examples/gallery");

/** Kit slug → gallery demo id, where they differ. */
const DEMO: Record<string, string> = {
  input: "field",
  "ai-chat": "blocks-ai-chat",
  "sign-in": "blocks-sign-in",
  onboarding: "blocks-onboarding",
  pricing: "blocks-pricing",
  checkout: "blocks-checkout",
  "properties-panel": "blocks-properties",
  "settings-panel": "blocks-settings",
  "team-members": "blocks-team",
};

/** Kit slug → templ file, where it isn't the slug in snake case. */
const FILE: Record<string, string> = {
  input: "field.templ",
  "radio-group": "radio.templ",
  "avatar-group": "avatar.templ",
  toast: "ui.go",
};

let demos: Map<string, { body: string; file: string }> | null = null;
let helpers: Map<string, string> | null = null;

/** The text of a block that starts at `from` (just after its opening brace), up to the matching close. */
function block(src: string, from: number) {
  let depth = 1;
  let i = from;
  for (; i < src.length && depth > 0; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") depth--;
  }
  return src.slice(from, i - 1);
}

/** Every `@demo("id", "Title") { … }` block in the gallery (dedented), and the gallery's own templ helpers. */
function load() {
  if (demos && helpers) return { demos, helpers };
  demos = new Map();
  helpers = new Map();
  for (const f of readdirSync(GALLERY).filter((f) => f.endsWith(".templ"))) {
    const src = readFileSync(join(GALLERY, f), "utf8");
    for (const m of src.matchAll(/^\t@demo\("([^"<]+)", "[^"]*"\) \{\n/gm)) {
      const body = block(src, m.index! + m[0].length)
        .split("\n")
        .map((l) => l.replace(/^\t\t/, ""))
        .join("\n")
        .trimEnd();
      demos.set(m[1], { body, file: f });
    }
    for (const m of src.matchAll(/^(?:\/\/.*\n)*templ ([a-z]\w*)\(.*\) \{\n/gm)) {
      helpers.set(m[1], `${m[0]}${block(src, m.index! + m[0].length)}}`);
    }
  }
  return { demos, helpers };
}

/** The gallery helpers a snippet calls (`@formsCard(…)`), and the ones they call, in order of first use. */
function helpersOf(code: string, all: Map<string, string>, seen = new Set<string>()): string[] {
  const out: string[] = [];
  for (const m of code.matchAll(/@([a-z]\w*)\(/g)) {
    const name = m[1];
    if (seen.has(name) || !all.has(name)) continue;
    seen.add(name);
    out.push(all.get(name)!, ...helpersOf(all.get(name)!, all, seen));
  }
  return out;
}

export type GoUsage = { templ: string; file: string; demo: string; handler?: string };

const TOAST_HANDLER = `func save(w http.ResponseWriter, r *http.Request) {
	// …save…
	ui.Toast(w, ui.ToastMsg{Title: "Saved", Tone: "success"})
	w.WriteHeader(http.StatusNoContent)
}`;

/** The Go snippet for a kit component, or null when it has none. */
export function goUsage(slug: string): GoUsage | null {
  const { demos, helpers } = load();
  const d = demos.get(DEMO[slug] ?? slug);
  if (!d) return null;
  const extra = helpersOf(d.body, helpers);
  return {
    templ: [d.body, ...extra].join("\n\n"),
    demo: d.file,
    file: FILE[slug] ?? `${slug.replaceAll("-", "_")}.templ`,
    handler: slug === "toast" ? TOAST_HANDLER : undefined,
  };
}
