import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { VERSION } from "@/lib/version";

// The agent skills in skills/, served at /skills/<name>/<path> with a manifest at /skills.json. Read at build time
// only (the routes are static): the CLI and the MCP server compare hashes to decide whether a copy is out of date.

export const SITE = "https://ui.astabyte.com";
export const SKILLS = ["astabyte-ui", "astabyte-design", "astabyte-skills-update"] as const;
export const UPDATE_COMMAND = "npx -y asta-ui@latest skills update";

const ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "skills");
const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

async function walk(dir: string, rel = ""): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(path.join(/*turbopackIgnore: true*/ dir, rel), { withFileTypes: true })) {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walk(dir, p)));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out.sort();
}

export async function skillFiles(name: string) {
  const dir = path.join(/*turbopackIgnore: true*/ ROOT, name);
  const files = await walk(dir);
  return Promise.all(files.map(async (p) => ({ path: p, content: await readFile(path.join(/*turbopackIgnore: true*/ dir, p), "utf8") })));
}

const describe = (md: string) => md.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";

export async function manifest() {
  const skills = await Promise.all(
    SKILLS.map(async (name) => {
      const files = await skillFiles(name);
      const main = files.find((f) => f.path === "SKILL.md")?.content ?? "";
      return {
        name,
        description: describe(main),
        // One hash over every file, so a change to a reference file counts as an update too.
        hash: sha(files.map((f) => `${f.path}\n${f.content}`).join("\n\0\n")),
        files: files.map((f) => ({ path: f.path, url: `${SITE}/skills/${name}/${f.path}`, hash: sha(f.content) })),
      };
    }),
  );
  return { version: VERSION, update: UPDATE_COMMAND, mcp: `${SITE}/mcp`, skills };
}
