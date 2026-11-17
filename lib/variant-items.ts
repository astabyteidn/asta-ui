// Variants in the catalogue's shape, so the registry, prompts, llms.txt and search treat them like any item.
import { kitItems } from "./kit";
import type { UiItem } from "./ui-catalog";
import { type VariantMeta, variants } from "./variants";

export interface VariantItem extends UiItem {
  variant: VariantMeta;
  baseTitle: string;
}

export const variantItems: VariantItem[] = variants.map((v) => {
  const base = kitItems.find((k) => k.slug === v.base);
  const baseTitle = base?.title ?? v.base;
  return {
    slug: v.slug,
    title: `${baseTitle} · ${v.name}`,
    description: v.description,
    group: base?.layer ?? "Atoms",
    id: v.id,
    source: "kit" as const,
    hint: v.name,
    variant: v,
    baseTitle,
  };
});

export const variantItemsOf = (base: string) => variantItems.filter((v) => v.variant.base === base);
