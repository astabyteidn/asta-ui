// Variants: standalone takes on a kit component, each installable on its own. Ids run globally (aui-001, aui-002…)
// in the order below, so only ever append. Files: `components/kit/variants/<slug>.tsx` plus a demo in
// `components/kit/variants/demos/<slug>.tsx`, registered in `components/kit/variants.ts`.

export interface VariantMeta {
  /** Global id, e.g. "aui-003". */
  id: string;
  /** The kit item it belongs to, e.g. "textarea". */
  base: string;
  /** Registry / install name, e.g. "textarea-aui-003". */
  slug: string;
  name: string;
  description: string;
  /** Main export, used in usage snippets. */
  exportName: string;
}

const RAW: Omit<VariantMeta, "id" | "slug">[] = [
  { base: "textarea", name: "Labelled", exportName: "TextareaField", description: "Label, hint, an optional tag and a live character count that warns near the limit." },
  { base: "textarea", name: "Auto-grow", exportName: "AutoGrowTextarea", description: "Grows with its content and eases to the new height, from a minimum to a maximum number of rows." },
  { base: "textarea", name: "Chat composer", exportName: "ChatComposer", description: "A message box with attachment chips and a send button. ⌘/Ctrl + Enter sends." },
  { base: "textarea", name: "Floating label", exportName: "FloatingLabelTextarea", description: "The label sits inside the field and floats up when you focus or type. Pure CSS." },
  { base: "textarea", name: "Markdown toolbar", exportName: "MarkdownTextarea", description: "A formatting toolbar that wraps the selection in Markdown, with ⌘B, ⌘I, ⌘E and ⌘K shortcuts and a word count." },
  { base: "textarea", name: "Mentions & commands", exportName: "MentionTextarea", description: "Type @ to mention someone or / for a command. The list opens at the caret and is fully keyboard driven." },
  { base: "textarea", name: "Validation", exportName: "ValidatedTextarea", description: "Checks the text against rules: quiet while typing, shows what's missing on blur with one small shake, ticks rules off live." },
  { base: "textarea", name: "AI prompt box", exportName: "PromptBox", description: "Model picker, token counter and a Generate button that turns into Stop while a response streams." },
];

export const variants: VariantMeta[] = RAW.map((v, i) => {
  const id = `aui-${String(i + 1).padStart(3, "0")}`;
  return { ...v, id, slug: `${v.base}-${id}` };
});

export const variantsOf = (base: string) => variants.filter((v) => v.base === base);
