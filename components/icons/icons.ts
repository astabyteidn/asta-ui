/**
 * Astabyte icons. 24×24 grid, 1.75 stroke, round caps and joins, drawn with currentColor.
 * Each entry is the inner SVG markup, so the same data feeds <Icon>, the /icons page and the copied SVG.
 */
import { CORE_ICONS } from "./core";
import { UI_ICONS } from "./icons-ui";
import { WORLD_ICONS } from "./icons-world";



export const ICONS = { ...CORE_ICONS, ...UI_ICONS, ...WORLD_ICONS } as const;

export type IconName = keyof typeof ICONS;

/** The full SVG string for one icon, as the /icons page copies it. */
export const svgString = (name: IconName, size = 24) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
