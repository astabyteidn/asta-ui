import { SKILLS, skillFiles } from "@/lib/skills";

// Every file of every agent skill as plain markdown: /skills/<name>/SKILL.md, /skills/<name>/references/<file>.md.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const all = await Promise.all(SKILLS.map(async (name) => (await skillFiles(name)).map((f) => ({ name, path: f.path.split("/") }))));
  return all.flat();
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string; path: string[] }> }) {
  const { name, path } = await params;
  const file = (SKILLS as readonly string[]).includes(name) ? (await skillFiles(name)).find((f) => f.path === path.join("/")) : undefined;
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.content, { headers: { "content-type": "text/markdown; charset=utf-8", "access-control-allow-origin": "*" } });
}
