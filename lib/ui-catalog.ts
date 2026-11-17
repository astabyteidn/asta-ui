// Everything ui.astabyte.com lists: the kit (atoms → organisms) first, then the motion lab.
import { kitId, kitItems, LAYERS } from "./kit";
import { KINDS, labBlocks, specimenId } from "./lab";

export interface UiItem {
  slug: string;
  title: string;
  description: string;
  /** Sidebar / breadcrumb group: a kit layer or a lab kind. */
  group: string;
  id: string;
  source: "kit" | "lab";
  /** Short line in the preview toolbar. */
  hint: string;
}

export const UI_GROUPS: string[] = [...LAYERS, ...KINDS.map((k) => `Motion · ${k}`)];

export const uiItems: UiItem[] = [
  ...LAYERS.flatMap((layer) =>
    kitItems
      .filter((k) => k.layer === layer)
      .map((k) => ({ slug: k.slug, title: k.title, description: k.description, group: layer, id: kitId(k.slug), source: "kit" as const, hint: k.parts.slice(0, 4).join(" · ") })),
  ),
  ...labBlocks.map((b, i) => ({
    slug: b.slug,
    title: b.title,
    description: b.description,
    group: `Motion · ${b.kind[0]}`,
    id: specimenId(i),
    source: "lab" as const,
    hint: b.input.join(" · "),
  })),
];
