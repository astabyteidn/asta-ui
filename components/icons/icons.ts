/**
 * Astabyte icons. 24×24 grid, 1.75 stroke, round caps and joins, drawn with currentColor.
 * Each entry is the inner SVG markup, so the same data feeds <Icon>, the /icons page and the copied SVG.
 */
export const ICONS = {
  "arrow-right": '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  "arrow-left": '<path d="M20 12H5"/><path d="m11 6-6 6 6 6"/>',
  "arrow-up": '<path d="M12 20V5"/><path d="m6 11 6-6 6 6"/>',
  "arrow-down": '<path d="M12 4v15"/><path d="m6 13 6 6 6-6"/>',
  "arrow-up-right": '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
  "chevron-right": '<path d="m9.5 6 6 6-6 6"/>',
  "chevron-down": '<path d="m6 9.5 6 6 6-6"/>',
  "chevrons-up-down": '<path d="m8 9 4-4 4 4"/><path d="m8 15 4 4 4-4"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="m6 6 12 12"/><path d="M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  filter: '<path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/>',
  command: '<path d="M9 9V6.5A2.5 2.5 0 1 0 6.5 9H17.5A2.5 2.5 0 1 0 15 6.5v11a2.5 2.5 0 1 0 2.5-2.5h-11A2.5 2.5 0 1 0 9 17.5Z"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  external: '<path d="M13 5h6v6"/><path d="m19 5-8 8"/><path d="M17 14v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V8.5A1.5 1.5 0 0 1 6.5 7H10"/>',
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 19.5h14"/>',
  code: '<path d="m8.5 7-5 5 5 5"/><path d="m15.5 7 5 5-5 5"/>',
  terminal: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="m7.5 9.5 3 2.5-3 2.5"/><path d="M12.5 15h4"/>',
  book: '<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5Z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 8h6"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/>',
  layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5Z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/>',
  wave: '<path d="M2.5 12c2-5.5 4-5.5 6 0s4 5.5 6 0 4-5.5 6 0"/>',
  sparkle: '<path d="M12 3.5c.7 4.6 2.4 6.3 7 7-4.6.7-6.3 2.4-7 7-.7-4.6-2.4-6.3-7-7 4.6-.7 6.3-2.4 7-7Z"/><path d="M19 16.5c.25 1.6.9 2.25 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.25 2.25-.9 2.5-2.5Z"/>',
  star: '<path d="m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8Z"/>',
  heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z"/>',
  bolt: '<path d="M13.5 3 5.5 13.5h6L10.5 21l8-10.5h-6Z"/>',
  bell: '<path d="M6.5 10a5.5 5.5 0 0 1 11 0v3.5l1.5 3h-14l1.5-3Z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>',
  eye: '<path d="M2.5 12c3-5.5 16-5.5 19 0-3 5.5-16 5.5-19 0Z"/><circle cx="12" cy="12" r="2.75"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M6.5 15h3"/>',
  cart: '<path d="M3.5 4.5h2l2 10.5h10l2-7.5H7"/><circle cx="9.5" cy="19" r="1.25"/><circle cx="16.5" cy="19" r="1.25"/>',
  chart: '<path d="M4 4v16h16"/><path d="m7.5 14.5 3.5-4 3 2.5 4.5-6"/>',
  user: '<circle cx="12" cy="8.5" r="3.75"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  settings: '<path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/>',
  sun: '<circle cx="12" cy="12" r="3.75"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z"/>',
} as const;

export type IconName = keyof typeof ICONS;

/** The full SVG string for one icon, as the /icons page copies it. */
export const svgString = (name: IconName, size = 24) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
