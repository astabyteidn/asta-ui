import { uiItems } from "@/lib/ui-catalog";
import { registryItem, type Primitive } from "@/lib/ui-source";
import { variantItems } from "@/lib/variant-items";

// shadcn registry, built once at build time. Every item exists in both trees, so `/r/{style}/{name}.json`
// always resolves: items without primitives are identical in both.
//   /r/<slug>.json, /r/radix/<slug>.json   Radix (the default)
//   /r/base/<slug>.json                    Base UI
const all = () => [...uiItems, ...variantItems];

export const registryParams = () => [{ file: "registry.json" }, ...all().map((b) => ({ file: `${b.slug}.json` }))];

export function registryGet(primitive: Primitive) {
  return async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
    const { file } = await params;
    if (file === "registry.json") {
      return Response.json({
        $schema: "https://ui.shadcn.com/schema/registry.json",
        name: primitive === "base" ? "astabyte-base" : "astabyte",
        homepage: "https://ui.astabyte.com",
        items: all().map((b) => ({
          name: b.slug,
          type: "registry:component",
          title: b.title,
          description: b.description,
          files: [],
        })),
      });
    }
    const block = all().find((b) => `${b.slug}.json` === file);
    const item = block && (await registryItem(block.slug, block, primitive));
    return item ? Response.json(item) : new Response("Not found", { status: 404 });
  };
}
