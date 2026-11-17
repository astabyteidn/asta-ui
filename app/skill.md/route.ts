import { readFile } from "node:fs/promises";
import path from "node:path";

// The agent skill as plain markdown (same file `npx skills add astabyteidn/asta-ui` installs). Built once.
export const dynamic = "force-static";

export async function GET() {
  const md = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "skills/astabyte-ui/SKILL.md"), "utf8");
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
