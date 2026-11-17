// Shared by the server (layout, pages) and the client switch in components/ui-site/Primitive.tsx.
export type Primitive = "radix" | "base";

export const PRIMITIVE_KEY = "asta-primitive";

/**
 * Runs before first paint (inlined in the root layout): `?primitive=base` wins, then the saved choice. It only sets
 * `<html data-primitive>`, so CSS can show the right install command and code without a flash or a hydration mismatch.
 */
export const PRIMITIVE_SCRIPT = `try{var q=new URLSearchParams(location.search).get("primitive");var p=q==="base"||q==="radix"?q:localStorage.getItem("${PRIMITIVE_KEY}");if(p==="base")document.documentElement.dataset.primitive="base";if(q)localStorage.setItem("${PRIMITIVE_KEY}",q)}catch(e){}`;

/** What each kit item is built on, for the spec card. Items not listed have no primitives (plain HTML). */
export const PRIMITIVE_PARTS: Record<string, string> = {
  accordion: "Accordion",
  avatar: "Avatar",
  button: "Slot",
  checkbox: "Checkbox",
  "command-palette": "Dialog",
  dialog: "Dialog",
  "dropdown-menu": "Menu",
  "radio-group": "Radio Group",
  "segmented-control": "Radio Group",
  select: "Select + Popover",
  slider: "Slider",
  switch: "Switch",
  tabs: "Tabs",
  tooltip: "Tooltip",
  "textarea-aui-008": "Menu",
};

/** The spec-card line for one item: "Radix Dialog" / "Base UI Dialog", or the button for items that only use it. */
export function primitiveLabel(slug: string, p: Primitive, usesButton = false): string {
  const part = PRIMITIVE_PARTS[slug];
  if (part) {
    if (p === "radix") return `Radix ${part === "Menu" ? "Dropdown Menu" : part}`;
    return slug === "button" ? "Base UI useRender" : `Base UI ${part}`;
  }
  if (usesButton) return p === "radix" ? "Radix Slot (via Button)" : "Base UI useRender (via Button)";
  return "none (HTML)";
}
