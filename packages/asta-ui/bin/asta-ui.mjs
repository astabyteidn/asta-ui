#!/usr/bin/env node
// Astabyte UI CLI: a thin layer over the shadcn CLI that knows our registry.
// No dependencies on purpose, so `npx asta-ui@latest` starts instantly.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const { version } = createRequire(import.meta.url)("../package.json");
const SITE = (process.env.ASTA_UI_URL || "https://ui.astabyte.com").replace(/\/$/, "");
const NS = "@astabyte";
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const dim = c(2), bold = c(1), blue = c(34), red = c(31), green = c(32);

const HELP = `
${bold("asta-ui")} ${dim(`v${version}`)}  Astabyte UI components for any React + Tailwind v4 project

${bold("Usage")}
  npx asta-ui@latest init [--radix | --base]      set up shadcn and the ${NS} registry
  npx asta-ui@latest add <component...> [flags]   add components (e.g. add dialog select)
  npx asta-ui@latest list [search]                 list components and variants
  npx asta-ui@latest prompt <component>            print a prompt for your AI coding agent
  npx asta-ui@latest skills install [name...]      install the agent skills (~/.claude/skills)
  npx asta-ui@latest skills update                 update installed agent skills that changed
  npx asta-ui@latest skills status                 show installed agent skills and if they're current
  npx asta-ui@latest skills auto [--off]           update the skills at the start of each Claude Code session

${bold("Flags")}
  --radix | --base   primitive library (default: what init chose, else Radix)
  any other flag is passed to shadcn (e.g. -y, -o, -p src/components)
  skills: --project (./.claude), --dir <path>, --auto, --quiet, --daily

${bold("Docs")}  ${SITE}
`;

function runner() {
  const ua = process.env.npm_config_user_agent || "";
  if (ua.startsWith("pnpm")) return ["pnpm", ["dlx"]];
  if (ua.startsWith("bun")) return ["bunx", []];
  if (ua.startsWith("yarn")) return ["yarn", ["dlx"]];
  return ["npx", ["--yes", "--package", "shadcn@latest", "--"]];
}

function shadcn(args) {
  const [bin, pre] = runner();
  const cmd = bin === "npx" ? [...pre, "shadcn", ...args] : [...pre, "shadcn@latest", ...args];
  console.log(dim(`→ ${bin === "npx" ? "npx shadcn@latest" : `${bin} ${pre.join(" ")} shadcn@latest`.replace(/ +/g, " ")} ${args.join(" ")}`));
  // When we run under `npx asta-ui`, npm leaves its own exec settings in the env; drop them so the
  // nested call resolves shadcn instead of re-running this package.
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/^npm_config_(package|call|yes)$/i.test(k)) delete env[k];
  return new Promise((resolve) => {
    const p = spawn(bin, cmd, { stdio: "inherit", env, shell: process.platform === "win32" });
    p.on("close", (code) => resolve(code ?? 1));
    p.on("error", (e) => {
      console.error(red(`Could not start ${bin}: ${e.message}`));
      resolve(1);
    });
  });
}

const CONFIG = join(process.cwd(), "components.json");
const readConfig = () => {
  try {
    return JSON.parse(readFileSync(CONFIG, "utf8"));
  } catch {
    return null;
  }
};
const registryUrl = (p) => (p === "base" ? `${SITE}/r/base/{name}.json` : `${SITE}/r/{name}.json`);

function primitive(flags) {
  if (flags.has("--base")) return "base";
  if (flags.has("--radix")) return "radix";
  const url = readConfig()?.registries?.[NS];
  const u = typeof url === "string" ? url : url?.url;
  return u && u.includes("/r/base/") ? "base" : "radix";
}

async function catalogue() {
  const res = await fetch(`${SITE}/r/registry.json`).catch(() => null);
  if (!res?.ok) throw new Error(`Could not load the catalogue from ${SITE}/r/registry.json`);
  return (await res.json()).items;
}

function closest(name, names) {
  const score = (a, b) => {
    const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  };
  return names
    .map((n) => [n, n.includes(name) ? 0 : score(name, n)])
    .sort((x, y) => x[1] - y[1])
    .slice(0, 3)
    .filter(([, s]) => s <= 4)
    .map(([n]) => n);
}

async function init(flags, rest) {
  const p = primitive(flags);
  if (!existsSync(CONFIG)) {
    console.log(bold("No components.json yet, running shadcn init first."));
    const code = await shadcn(["init", ...rest]);
    if (code !== 0 || !existsSync(CONFIG)) return code || 1;
  }
  const cfg = readConfig();
  if (!cfg) {
    console.error(red("components.json is not valid JSON."));
    return 1;
  }
  cfg.registries = { ...(cfg.registries || {}), [NS]: registryUrl(p) };
  writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + "\n");
  console.log(`${green("✓")} Added the ${bold(NS)} registry (${p === "base" ? "Base UI" : "Radix"}) to components.json`);
  console.log(`  Next: ${blue("npx asta-ui@latest add button")}  or  ${blue(`npx shadcn@latest add ${NS}/button`)}`);
  return 0;
}

async function add(flags, names, rest) {
  if (!names.length) {
    console.error(red("Name at least one component, e.g. ") + blue("npx asta-ui@latest add dialog"));
    return 1;
  }
  const p = primitive(flags);
  let items = null;
  try {
    items = await catalogue();
  } catch (e) {
    console.warn(dim(`${e.message}. Skipping the name check.`));
  }
  if (items) {
    const known = items.map((i) => i.name);
    const missing = names.filter((n) => !known.includes(n));
    if (missing.length) {
      for (const m of missing) {
        const s = closest(m, known);
        console.error(red(`Unknown component "${m}".`) + (s.length ? ` Did you mean ${s.map(blue).join(", ")}?` : ""));
      }
      console.error(dim(`See all: npx asta-ui@latest list`));
      return 1;
    }
  }
  const urls = names.map((n) => registryUrl(p).replace("{name}", n));
  console.log(`${bold("Adding")} ${names.join(", ")} ${dim(`(${p === "base" ? "Base UI" : "Radix"})`)}`);
  return shadcn(["add", ...urls, ...rest]);
}

async function list(query) {
  const items = await catalogue();
  const q = (query || "").toLowerCase();
  const rows = items.filter((i) => !q || `${i.name} ${i.title} ${i.description}`.toLowerCase().includes(q));
  const w = Math.max(...rows.map((i) => i.name.length), 4);
  for (const i of rows) console.log(`${blue(i.name.padEnd(w))}  ${i.title}${i.description ? dim(` — ${i.description.slice(0, 70)}`) : ""}`);
  console.log(dim(`\n${rows.length} of ${items.length} · add with: npx asta-ui@latest add <name>`));
  return 0;
}

async function prompt(name, flags) {
  if (!name) {
    console.error(red("Usage: npx asta-ui@latest prompt <component>"));
    return 1;
  }
  const items = await catalogue();
  const it = items.find((i) => i.name === name);
  if (!it) {
    const s = closest(name, items.map((i) => i.name));
    console.error(red(`Unknown component "${name}".`) + (s.length ? ` Did you mean ${s.join(", ")}?` : ""));
    return 1;
  }
  const p = primitive(flags);
  console.log(`Add the Astabyte UI ${it.title} component to my project.
${it.description ?? ""}

Install it (any React + Tailwind CSS v4 project; run \`npx shadcn@latest init\` first if there is no components.json):
  npx asta-ui@latest add ${name}${p === "base" ? " --base" : ""}

Docs and usage: ${SITE}/${name.replace(/-aui-\d+$/, "")}
Full catalogue for context: ${SITE}/llms.txt

Rules: keep the kit's colour tokens (brand, paper, ink, mute) instead of hard-coded colours, keep motion on transform/opacity and respect prefers-reduced-motion, keep the keyboard and ARIA behaviour.

Use it to: [describe where it goes and what it should do]`);
  return 0;
}


/* Agent skills: install and keep them in step with ui.astabyte.com/skills.json. */

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const STAMP = join(homedir(), ".cache", "asta-ui", "skills-checked");
const HOOK_MARK = "asta-ui@latest skills update";
const skillDirs = () => [
  ...new Set([join(homedir(), ".claude", "skills"), resolve(".claude", "skills"), join(homedir(), ".agents", "skills"), resolve(".agents", "skills")]),
];
const pretty = (p) => p.replace(homedir(), "~");

async function getText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
}
const manifest = async () => JSON.parse(await getText(`${SITE}/skills.json`));

const readOr = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
};
// Same hash as the site: every file of the skill, in manifest order. A missing file never matches.
function localHash(dir, skill) {
  const parts = [];
  for (const f of skill.files) {
    const c = readOr(join(dir, skill.name, f.path));
    if (c === null) return null;
    parts.push(`${f.path}\n${c}`);
  }
  return sha(parts.join("\n\0\n"));
}

async function writeSkill(dir, skill) {
  for (const f of skill.files) {
    const target = join(dir, skill.name, f.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, await getText(`${SITE}/skills/${skill.name}/${f.path}`));
  }
}

function pick(m, names) {
  const unknown = names.filter((n) => !m.skills.some((s) => s.name === n));
  if (unknown.length) throw new Error(`Unknown skill ${unknown.join(", ")}. Available: ${m.skills.map((s) => s.name).join(", ")}`);
  return names.length ? m.skills.filter((s) => names.includes(s.name)) : m.skills;
}

function touchStamp() {
  try {
    mkdirSync(dirname(STAMP), { recursive: true });
    writeFileSync(STAMP, new Date().toISOString() + "\n");
  } catch {}
}

async function skillsUpdate(names, opts) {
  if (opts.daily) {
    try {
      if (Date.now() - statSync(STAMP).mtimeMs < 24 * 3600 * 1000) return 0;
    } catch {}
  }
  let m;
  try {
    m = await manifest();
  } catch (e) {
    if (opts.quiet) return 0; // offline: keep the skills we have, say nothing
    throw e;
  }
  const wanted = pick(m, names);
  let found = 0;
  const updated = [];
  for (const dir of skillDirs()) {
    for (const s of wanted) {
      if (!existsSync(join(dir, s.name, "SKILL.md"))) continue;
      found++;
      if (localHash(dir, s) === s.hash) continue;
      await writeSkill(dir, s);
      updated.push(`${s.name} in ${pretty(dir)}`);
    }
  }
  touchStamp();
  if (updated.length) console.log(`${green("✓")} Updated Astabyte skills to v${m.version}: ${updated.join(", ")}. Re-read any of them you are using.`);
  else if (!opts.quiet) console.log(found ? `${green("✓")} Astabyte skills are current (v${m.version}).` : `No Astabyte skills installed. Install them with ${blue("npx asta-ui@latest skills install")}`);
  return 0;
}

async function skillsInstall(names, opts) {
  const m = await manifest();
  const dir = opts.dir ? resolve(opts.dir.replace(/^~(?=$|\/)/, homedir())) : opts.project ? resolve(".claude", "skills") : join(homedir(), ".claude", "skills");
  for (const s of pick(m, names)) {
    await writeSkill(dir, s);
    console.log(`${green("✓")} ${bold(s.name)} → ${pretty(join(dir, s.name))}`);
  }
  touchStamp();
  if (opts.auto) return skillsAuto(opts);
  console.log(dim(`Keep them current: npx asta-ui@latest skills update  ·  or every session: npx asta-ui@latest skills auto`));
  return 0;
}

async function skillsStatus() {
  const m = await manifest();
  let any = false;
  for (const dir of skillDirs()) {
    for (const s of m.skills) {
      if (!existsSync(join(dir, s.name, "SKILL.md"))) continue;
      any = true;
      const ok = localHash(dir, s) === s.hash;
      console.log(`${ok ? green("current") : red("outdated")}  ${s.name.padEnd(24)} ${dim(pretty(dir))}`);
    }
  }
  if (!any) console.log(`No Astabyte skills installed. Install them with ${blue("npx asta-ui@latest skills install")}`);
  const hooked = (readOr(join(homedir(), ".claude", "settings.json")) ?? "").includes(HOOK_MARK) || (readOr(resolve(".claude", "settings.json")) ?? "").includes(HOOK_MARK);
  console.log(dim(`\nLatest v${m.version} · auto-update ${hooked ? "on" : "off"} · ${SITE}/skills.json`));
  return 0;
}

// One SessionStart hook in Claude Code settings. On macOS/Linux a find test skips npx entirely when the last
// check is under a day old, so most sessions start without touching the network.
function skillsAuto(opts) {
  const file = opts.project ? resolve(".claude", "settings.json") : join(homedir(), ".claude", "settings.json");
  const raw = readOr(file);
  if (opts.off && (raw === null || !raw.includes(HOOK_MARK))) {
    console.log(`Auto-update is already off (${pretty(file)})`);
    return 0;
  }
  let cfg = {};
  if (raw) {
    try {
      cfg = JSON.parse(raw);
    } catch {
      console.error(red(`${pretty(file)} is not valid JSON; not touching it.`));
      return 1;
    }
  }
  const starts = (cfg.hooks?.SessionStart ?? []).filter((g) => !JSON.stringify(g).includes(HOOK_MARK));
  if (!opts.off) {
    const cmd = `npx -y ${HOOK_MARK} --quiet --daily`;
    const command = process.platform === "win32" ? cmd : `test -n "$(find "$HOME/.cache/asta-ui/skills-checked" -mmin -1440 2>/dev/null)" || ${cmd}`;
    starts.push({ hooks: [{ type: "command", command, timeout: 60 }] });
  }
  cfg.hooks = { ...(cfg.hooks ?? {}), SessionStart: starts };
  if (!cfg.hooks.SessionStart.length) delete cfg.hooks.SessionStart;
  if (!Object.keys(cfg.hooks).length) delete cfg.hooks;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
  console.log(opts.off ? `${green("✓")} Auto-update off (${pretty(file)})` : `${green("✓")} Auto-update on: Claude Code checks the Astabyte skills once a day at session start (${pretty(file)})`);
  return 0;
}

function skills(args) {
  const [sub, ...more] = args;
  const opts = {};
  const names = [];
  for (let i = 0; i < more.length; i++) {
    const a = more[i];
    if (a === "--dir") opts.dir = more[++i];
    else if (a.startsWith("--")) opts[a.slice(2)] = true;
    else names.push(a);
  }
  if (sub === "install" || sub === "add") return skillsInstall(names, opts);
  if (sub === "update" || sub === "up") return skillsUpdate(names, opts);
  if (sub === "status" || sub === "ls") return skillsStatus();
  if (sub === "auto") return skillsAuto(opts);
  console.error(red("Usage: npx asta-ui@latest skills <install|update|status|auto> [name...] [--project] [--dir <path>] [--auto] [--off]"));
  return Promise.resolve(1);
}

const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = new Set();
const names = [];
const rest = [];
const VALUE = new Set(["-p", "--path", "-c", "--cwd"]); // shadcn flags that take a value
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--base" || a === "--radix") flags.add(a);
  else if (VALUE.has(a)) rest.push(a, argv[++i] ?? "");
  else if (a.startsWith("-")) rest.push(a);
  else names.push(a);
}

const main = {
  init: () => init(flags, rest),
  add: () => add(flags, names, rest),
  list: () => list(names[0]),
  ls: () => list(names[0]),
  prompt: () => prompt(names[0], flags),
  skills: async () => skills(argv.slice(1)),
  "-v": () => (console.log(version), 0),
  "--version": () => (console.log(version), 0),
}[cmd];

if (!main) {
  console.log(HELP);
  process.exit(cmd && !["-h", "--help", "help"].includes(cmd) ? 1 : 0);
}
main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(red(e.message));
    process.exit(1);
  });
