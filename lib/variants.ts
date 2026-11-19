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
  { base: "navbar", name: "Minimal", exportName: "MinimalNavbar", description: "A compact header with an elastic underline that stretches to whatever you point at, and mega menus of tiles." },
  { base: "navbar", name: "Glass pill", exportName: "FloatingNavbar", description: "A slim glass pill that floats over the page, with a glow and a highlight that follow your pointer." },
  { base: "navbar", name: "Wordmark", exportName: "CenteredNavbar", description: "A dark header with a centred wordmark whose letters ripple under the pointer, and dark mega menus on the left." },
  { base: "navbar", name: "App header", exportName: "AppNavbar", description: "A compact app header whose search field opens a command palette, plus a workspace switcher, a bell and an avatar menu." },
  { base: "navbar", name: "Docs header", exportName: "DocsNavbar", description: "A single-row docs header with mega menus, a search button and a version switch that rolls to the release you pick." },
  { base: "navbar", name: "Reading", exportName: "AutoHideNavbar", description: "A compact reading header that slides away as you scroll and swaps its links for the title and a live percent read." },
  { base: "sign-in", name: "Magic link", exportName: "MagicLinkSignIn", description: "A passwordless card that sends a sign-in link and shows it landing in a small inbox preview, with a resend timer." },
  { base: "sign-in", name: "Painted split", exportName: "SplitSignIn", description: "A split card with a painting on one side and a calm serif sign-in form on the other." },
  { base: "sign-in", name: "Social first", exportName: "SocialSignIn", description: "Provider buttons first, with a highlight that glides between rows, a last used tag and email tucked behind one link." },
  { base: "sign-in", name: "Two-step", exportName: "StepSignIn", description: "Email first, then password. The steps slide sideways and the chosen account shows as a chip." },
  { base: "sign-in", name: "Passkey", exportName: "PasskeySignIn", description: "A dark passkey card with a fingerprint that scans while it waits and a password fallback." },
  { base: "sign-in", name: "Sign up", exportName: "SignUpCard", description: "A sign-up card with a live initials avatar, a strength meter that fills in steps and a terms check." },
  { base: "pricing", name: "Comparison table", exportName: "PricingTable", description: "Plan columns and grouped feature rows under a sticky header. A brand lens rests on the recommended plan and glides to the column you point at." },
  { base: "pricing", name: "Painted plan", exportName: "SinglePlan", description: "One plan on a painted card: a serif name beside a slowly settling painting, a monthly and yearly switch and a price that rolls." },
  { base: "pricing", name: "Usage calculator", exportName: "UsagePricing", description: "Drag to set seats or requests. A cost chart lights up to the thumb, the price rolls live and the tier marker glides." },
  { base: "pricing", name: "Tier picker", exportName: "PricingTiers", description: "Tiers as rows in a radio group. A brand ring glides to the choice and the total rolls in a dark dock below." },
  { base: "footer", name: "Minimal", exportName: "MinimalFooter", description: "One row: brand, links with a gliding brand underline, social icons and copyright. Wraps neatly on small screens." },
  { base: "footer", name: "Dark glow", exportName: "CenteredFooter", description: "A dark centred footer with a brand glow that follows the cursor, a big tagline and social icons that lift and show their name." },
  { base: "footer", name: "Landscape", exportName: "CtaFooter", description: "A light footer with a glow along the top, one call to action, link columns and a painted landscape that rises in along the bottom." },
  { base: "footer", name: "Status", exportName: "StatusFooter", description: "A product footer with a live status card, an uptime strip you can hover, link columns, a language picker and back to top." },
];

export const variants: VariantMeta[] = RAW.map((v, i) => {
  const id = `aui-${String(i + 1).padStart(3, "0")}`;
  return { ...v, id, slug: `${v.base}-${id}` };
});

export const variantsOf = (base: string) => variants.filter((v) => v.base === base);
