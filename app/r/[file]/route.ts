import { uiItems } from "@/lib/ui-catalog";
import { registryItem } from "@/lib/ui-source";

// shadcn registry, built once at build time: /r/registry.json (index) and /r/<slug>.json (items).
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ file: "registry.json" }, ...uiItems.map((b) => ({ file: `${b.slug}.json` }))];
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (file === "registry.json") {
    return Response.json({
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "astabyte",
      homepage: "https://ui.astabyte.com",
      items: uiItems.map((b) => ({
        name: b.slug,
        type: "registry:component",
        title: b.title,
        description: b.description,
        files: [],
      })),
    });
  }
  const block = uiItems.find((b) => `${b.slug}.json` === file);
  const item = block && (await registryItem(block.slug, block, block.source === "kit"));
  return item ? Response.json(item) : new Response("Not found", { status: 404 });
}
