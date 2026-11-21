/**
 * Performance check for kit components, variants, demos, lab blocks and blog demos.
 * Static rules that catch the usual jank before it ships. Run `bun run perf`.
 *
 *   error  = CI fails
 *   warn   = printed, does not fail (use `--strict` to fail on warnings too)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DIRS = ["components/kit", "components/lab", "components/ui-site", "components/icons", "components/logos", "components/blog"];
const strict = process.argv.includes("--strict");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

type Level = "error" | "warn";
type Hit = { file: string; line: number; level: Level; rule: string; text: string };
const hits: Hit[] = [];

/** Size budgets in KB. Generated data files are exempt. */
const BUDGET = { component: 28, demo: 14 };
const EXEMPT = /components\/(icons\/icons[^/]*|logos\/logos)\.ts$/;

function walk(dir: string): string[] {
  let out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (/\.(tsx?|css)$/.test(e)) out.push(p);
  }
  return out;
}

const LAYOUT_PROPS = "width|height|top|left|right|bottom|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|max-height|max-width|inset";

const rules: { rule: string; level: Level; test: (src: string, line: string, i: number, lines: string[]) => boolean }[] = [
  {
    rule: "transition on a layout property (prefer transform/opacity; mark intentional ones with // perf-ok)",
    level: "warn",
    test: (_s, line) =>
      new RegExp(`transition(-property)?\\s*:\\s*[^;"]*\\b(${LAYOUT_PROPS})\\b`).test(line) ||
      new RegExp(`transition-\\[(?:[^\\]]*,)?(${LAYOUT_PROPS})(?:,[^\\]]*)?\\]`).test(line) ||
      /\btransition-all\b/.test(line),
  },
  {
    rule: "bare <style> (hoist keyframes with <style href precedence>)",
    level: "error",
    test: (_s, line) => /<style(\s|>)/.test(line) && !/href=/.test(line) && !/<style\s*$/.test(line),
  },
  {
    rule: "<img> without width/height",
    level: "warn",
    test: (_s, line) => /<img\b/.test(line) && !/(width|height)=/.test(line) && !/fill/.test(line),
  },
];

/** Bodies of every @keyframes block, with the line it starts on. */
function keyframes(src: string) {
  const out: { line: number; name: string; body: string }[] = [];
  const re = /@keyframes\s+([\w-]+)\s*{/g;
  for (let m; (m = re.exec(src)); ) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < src.length && depth) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") depth--;
      i++;
    }
    out.push({ line: src.slice(0, m.index).split("\n").length, name: m[1], body: src.slice(re.lastIndex, i - 1) });
  }
  return out;
}

/** File-level rules. */
function fileRules(file: string, src: string) {
  const rel = relative(ROOT, file);
  const lines = src.split("\n");
  for (const k of keyframes(src)) {
    const ok = /perf-ok/.test(lines[k.line - 1] ?? "") || /perf-ok/.test(lines[k.line - 2] ?? "");
    if (!ok && new RegExp(`(^|[{;\\s])(${LAYOUT_PROPS})\\s*:`).test(k.body))
      hits.push({ file: rel, line: k.line, level: "error", rule: `@keyframes ${k.name} animates a layout property (use transform/opacity)`, text: "" });
    if (!ok && /(^|[{;\s])(filter|backdrop-filter)\s*:/.test(k.body))
      hits.push({ file: rel, line: k.line, level: "warn", rule: `@keyframes ${k.name} animates filter (expensive per frame)`, text: "" });
  }
  const kb = Buffer.byteLength(src) / 1024;
  if (!EXEMPT.test(rel) && /\.tsx$/.test(rel)) {
    const isDemo = /\/demos\//.test(rel);
    const cap = isDemo ? BUDGET.demo : BUDGET.component;
    if (kb > cap) hits.push({ file: rel, line: 1, level: "warn", rule: `file is ${kb.toFixed(1)} KB (budget ${cap} KB)`, text: "" });
  }
  const pairs: [RegExp, RegExp, string][] = [
    [/\bsetInterval\(/, /\bclearInterval\(/, "setInterval without clearInterval"],
    [/\baddEventListener\(/, /\bremoveEventListener\(/, "addEventListener without removeEventListener"],
    [/new (ResizeObserver|IntersectionObserver|MutationObserver)\(/, /\.disconnect\(\)/, "observer without disconnect()"],
  ];
  for (const [a, b, msg] of pairs) {
    // Listeners added with { once: true } clean themselves up.
    const live = a.source.includes("addEventListener") ? lines.some((l) => a.test(l) && !/once:\s*true/.test(l)) : a.test(src);
    if (live && !b.test(src)) {
      const line = src.split("\n").findIndex((l) => a.test(l)) + 1;
      hits.push({ file: rel, line, level: "error", rule: msg, text: "" });
    }
  }
  if (/\brequestAnimationFrame\(/.test(src) && !/\bcancelAnimationFrame\(/.test(src))
    hits.push({ file: rel, line: lines.findIndex((l) => /requestAnimationFrame\(/.test(l)) + 1, level: "warn", rule: "requestAnimationFrame never cancelled (fine for one-shot, not for loops)", text: "" });
  // Looping rAF/interval with no visibility or viewport gate.
  const loops = /requestAnimationFrame\(|setInterval\(/.test(src);
  const gated = /IntersectionObserver|visibilitychange|document\.hidden|useInView|inView/.test(src);
  if (loops && !gated && /\/(variants|lab)\//.test(rel))
    hits.push({ file: rel, line: 1, level: "warn", rule: "loop without an offscreen/hidden-tab pause", text: "" });
  // Layout reads inside a rAF callback.
  const raf = src.match(/requestAnimationFrame\(\s*(?:function\s*\w*)?\(?[^)]*\)?\s*=>?\s*{[\s\S]{0,600}?}/g) ?? [];
  if (raf.some((b) => /getBoundingClientRect|offset(Width|Height|Top|Left)|scrollHeight|getComputedStyle/.test(b)))
    hits.push({ file: rel, line: 1, level: "warn", rule: "layout read inside a requestAnimationFrame callback", text: "" });
}

const files = DIRS.flatMap((d) => walk(join(ROOT, d))).filter((f) => !only.length || only.some((o) => f.includes(o)));
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (/perf-ok/.test(line) || /perf-ok/.test(lines[i - 1] ?? "")) return;
    for (const r of rules) if (r.test(src, line, i, lines)) hits.push({ file: relative(ROOT, file), line: i + 1, level: r.level, rule: r.rule, text: line.trim().slice(0, 110) });
  });
  if (!/perf-ok-file/.test(src)) fileRules(file, src);
}

const errors = hits.filter((h) => h.level === "error");
const warns = hits.filter((h) => h.level === "warn");
for (const h of [...errors, ...warns]) console.log(`${h.level === "error" ? "✗" : "!"} ${h.file}:${h.line}  ${h.rule}${h.text ? `\n    ${h.text}` : ""}`);
console.log(`perf: ${files.length} files, ${errors.length} errors, ${warns.length} warnings`);
if (errors.length || (strict && warns.length)) process.exit(1);
