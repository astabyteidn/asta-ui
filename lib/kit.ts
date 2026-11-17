// The ui.astabyte.com kit: everyday building blocks, from the smallest (atoms) to whole sections (organisms).
// Unlike the lab, these are ui-site only. Each item is a reusable file `components/kit/<slug>.tsx` plus a demo
// `components/kit/demos/<slug>.tsx` registered in `components/kit/demos.ts`.

export const LAYERS = ["Atoms", "Molecules", "Organisms"] as const;
export type Layer = (typeof LAYERS)[number];

export interface KitMeta {
  slug: string;
  title: string;
  layer: Layer;
  description: string;
  /** What's inside (variants / exports), shown on the page. */
  parts: string[];
}

export const kitItems: KitMeta[] = [
  // Atoms
  { slug: "button", title: "Button", layer: "Atoms", description: "Seven variants, four sizes, icons that nudge, a loading state that keeps its width, and a keyboard hint.", parts: ["solid", "accent", "outline", "soft", "ghost", "link", "danger", "loading", "icon"] },
  { slug: "motion-button", title: "Motion buttons", layer: "Atoms", description: "Buttons with a bit of character: rolling labels, a fill that follows the cursor, a light beam on the border, a copy that turns into a check.", parts: ["RollButton", "FillButton", "ArrowButton", "ShineButton", "BeamButton", "PressButton", "CopyButton", "ConfirmButton"] },
  { slug: "input", title: "Input", layer: "Atoms", description: "Text input with icons, a clear button, password reveal and states for error and success.", parts: ["Input", "PasswordInput", "icons", "clearable", "states"] },
  { slug: "textarea", title: "Textarea", layer: "Atoms", description: "Grows with its content and counts down the characters left.", parts: ["autosize", "counter", "limit"] },
  { slug: "checkbox", title: "Checkbox", layer: "Atoms", description: "The tick draws itself in. Supports an indeterminate state for select-all rows.", parts: ["checked", "indeterminate", "disabled"] },
  { slug: "switch", title: "Switch", layer: "Atoms", description: "A switch whose thumb stretches while you press it, in three sizes.", parts: ["sm", "md", "lg", "label"] },
  { slug: "slider", title: "Slider", layer: "Atoms", description: "Range slider with a value bubble, ticks and full keyboard support.", parts: ["single", "steps", "ticks", "keys"] },
  { slug: "badge", title: "Badge", layer: "Atoms", description: "Labels for status and counts: solid, soft, outline, with a dot, a live pulse or a remove button.", parts: ["solid", "soft", "outline", "dot", "pulse", "removable"] },
  { slug: "avatar", title: "Avatar", layer: "Atoms", description: "Image with an initials fallback and a status dot. Groups stack and fan out on hover.", parts: ["Avatar", "AvatarGroup", "status", "sizes"] },
  { slug: "kbd", title: "Kbd", layer: "Atoms", description: "Key caps for shortcuts that press down when you press the real key.", parts: ["Kbd", "KbdCombo", "live"] },
  { slug: "spinner", title: "Spinner", layer: "Atoms", description: "Loaders for every wait: ring, dots, bars, orbit, plus a progress bar.", parts: ["ring", "dots", "bars", "orbit", "Progress"] },
  { slug: "tooltip", title: "Tooltip", layer: "Atoms", description: "Hover or focus to show. A short delay on the first one, instant while you move between them.", parts: ["top", "right", "bottom", "left", "delay group"] },
  { slug: "skeleton", title: "Skeleton", layer: "Atoms", description: "Placeholders with a soft shimmer, composed into a card while content loads.", parts: ["line", "circle", "block", "card"] },
  // Molecules
  { slug: "radio-group", title: "Radio group", layer: "Molecules", description: "Choose one: option cards with a ring that glides to the selection, or a compact list.", parts: ["cards", "list", "keys"] },
  { slug: "segmented-control", title: "Segmented control", layer: "Molecules", description: "A pill that slides between options and squashes a little on the way.", parts: ["sm", "md", "icons"] },
  { slug: "tabs", title: "Tabs", layer: "Molecules", description: "Underline tabs with an indicator that stretches between them and content that cross-fades.", parts: ["underline", "pill", "keys"] },
  { slug: "field", title: "Form field", layer: "Molecules", description: "Label, hint and error around any input. Invalid fields shake once and say why.", parts: ["label", "hint", "error", "required", "validation"] },
  { slug: "select", title: "Select", layer: "Molecules", description: "A listbox with type-ahead search, check marks and full keyboard control.", parts: ["search", "keys", "check"] },
  { slug: "dropdown-menu", title: "Dropdown menu", layer: "Molecules", description: "An action menu with icons, shortcuts, groups and a destructive item, opening from its trigger.", parts: ["items", "shortcuts", "groups", "keys"] },
  { slug: "accordion", title: "Accordion", layer: "Molecules", description: "Questions that open with a smooth height animation, one or many at a time.", parts: ["single", "multiple"] },
  { slug: "toast", title: "Toast", layer: "Molecules", description: "Stacked notifications that fan out on hover and can be swiped away.", parts: ["success", "error", "action", "swipe"] },
  { slug: "number-input", title: "Number input", layer: "Molecules", description: "A stepper that repeats while held, with digits that roll to the new value.", parts: ["hold to repeat", "min/max", "keys"] },
  { slug: "tag-input", title: "Tag input", layer: "Molecules", description: "Type and press Enter or comma to add a tag, Backspace to remove the last one.", parts: ["add", "remove", "paste", "limit"] },
  { slug: "dialog", title: "Dialog", layer: "Molecules", description: "A modal that grows out of its trigger, traps focus and closes on Escape.", parts: ["confirm", "focus trap", "escape"] },
  // Organisms
  { slug: "navbar", title: "Navbar", layer: "Organisms", description: "A site header with a mega menu: the panel morphs between sections, tiles dim their neighbours, and it folds on mobile.", parts: ["mega menu", "morphing panel", "mobile sheet", "scroll state"] },
  { slug: "sign-in", title: "Sign-in card", layer: "Organisms", description: "Email and password with social buttons, inline validation and a submit that shows progress then success.", parts: ["Field", "Button", "validation", "states"] },
  { slug: "pricing", title: "Pricing", layer: "Organisms", description: "Plans with a monthly / yearly switch whose prices roll to the new amount.", parts: ["billing switch", "plans", "features"] },
  { slug: "command-palette", title: "Command palette", layer: "Organisms", description: "Press ⌘J (or click): grouped results, fuzzy filtering, arrow keys and recent items.", parts: ["⌘J", "groups", "filter", "keys"] },
  { slug: "settings-panel", title: "Settings panel", layer: "Organisms", description: "A settings form whose save bar slides up as soon as something changes.", parts: ["switches", "radio", "save bar"] },
  { slug: "footer", title: "Footer", layer: "Organisms", description: "Link columns, a newsletter field that confirms in place, and a big wordmark.", parts: ["columns", "newsletter", "wordmark"] },
];

/** Catalogue number per layer, e.g. AB-A03, AB-M01, AB-O02. */
export function kitId(slug: string): string {
  const item = kitItems.find((k) => k.slug === slug);
  if (!item) return "";
  const n = kitItems.filter((k) => k.layer === item.layer).findIndex((k) => k.slug === slug) + 1;
  return `AB-${item.layer[0]}${String(n).padStart(2, "0")}`;
}
