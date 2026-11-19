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
  { base: "input", name: "Floating label", exportName: "FloatingInput", description: "The label lifts out of the field and settles into the border, cutting a notch in the hairline, while a blue line sweeps along the bottom." },
  { base: "input", name: "Search with recents", exportName: "SearchField", description: "A dark search field whose / chip turns into a clear button as you type, with one highlight that glides between recent searches and pages." },
  { base: "input", name: "Prefix and suffix", exportName: "AffixInput", description: "The suffix rides right behind your text so a subdomain reads as one address, and unit chips roll to the next unit on click." },
  { base: "input", name: "Live validation", exportName: "ValidatedInput", description: "Checks an email once you pause, rolls a calm message up to the next one, offers a one-tap fix for typos and draws a check when the address is good." },
  { base: "input", name: "Title to slug", exportName: "SlugInput", description: "The URL preview rewrites itself letter by letter as you type the title, then a tiny spinner checks the address and shows Available or a free alternative." },
  { base: "input", name: "Amount", exportName: "AmountInput", description: "A big dark money field whose digits roll into place, with a currency switch that converts the amount and quick-amount chips." },
  { base: "textarea", name: "Character budget", exportName: "BudgetTextarea", description: "A textarea with a ring that fills as you type. It counts down near the limit and marks any text past the soft limit in blue, which you can still send." },
  { base: "textarea", name: "Notes card", exportName: "NotesTextarea", description: "A notes card on ruled paper with a blue margin line. It saves itself and shows \"Saving\" and then \"Saved · just now\" with a tick." },
  { base: "textarea", name: "Product review", exportName: "ReviewTextarea", description: "A review box where the stars fill in a quick wave. The verdict and the prompt change with the score, and photos sit as chips you can add or remove." },
  { base: "textarea", name: "Code snippet", exportName: "SnippetTextarea", description: "A dark code field with line numbers and a highlighted current line. Tab indents, Enter keeps the indent, and there is a language picker and a copy button." },
  { base: "password-input", name: "Strength dial", exportName: "StrengthPassword", description: "A password field with four arcs around a padlock that light up as the password gets stronger. The lock clicks shut at full strength, next to a crack-time estimate." },
  { base: "password-input", name: "Rule tiles", exportName: "ChecklistPassword", description: "A new-password field where rule tiles like 8+ and Aa turn blue as you meet them, one eye button reveals both fields, and the confirm field says when they match." },
  { base: "otp-input", name: "Split code", exportName: "SplitOtp", description: "A six-digit code split 3 + 3, with one focus frame that slides from box to box. When the code is complete the two halves slide together, and paste works anywhere." },
  { base: "otp-input", name: "Dark verify", exportName: "VerifyOtp", description: "A dark two-step verification card with a resend timer. The boxes ripple while the code is checked, then fold into a blue badge when it is right." },
  { base: "select", name: "Rich options", exportName: "RichSelect", description: "A role select with icon tiles and descriptions, where a highlight glides between rows and a check slides to the picked one." },
  { base: "select", name: "Inline pill", exportName: "PillSelect", description: "A select that sits inside a sentence as a brand pill and rolls the new word in when it changes." },
  { base: "select", name: "Grouped", exportName: "GroupedSelect", description: "A time zone select with sticky region headers, search with highlighted matches and a live local clock with a day or night dot." },
  { base: "combobox", name: "Multi assign", exportName: "AssignCombobox", description: "A people picker where avatars spring into a stack on the trigger and the summary rolls to \"Lena and 2 others\"." },
  { base: "combobox", name: "Create on enter", exportName: "CreatableCombobox", description: "A label combobox that offers to create a missing label with a colour swatch and drops the new chip in with a ripple." },
  { base: "tag-input", name: "Email chips", exportName: "EmailTagInput", description: "A recipient field that splits pasted addresses into chips, marks teammates and guests, and shakes invalid ones until you fix them." },
  { base: "tag-input", name: "Suggested tags", exportName: "SuggestTagInput", description: "A tag field with a ghost completion you accept with Tab, where a clicked suggestion flies into place as a dark chip." },
  { base: "date-picker", name: "Two-month range", exportName: "RangeDatePicker", description: "An inline two-month calendar where a band previews the stay as you hover, a tip counts the nights and the active field slides between check-in and check-out." },
  { base: "date-picker", name: "Quick presets", exportName: "PresetDatePicker", description: "A dark picker with presets beside a calendar. Number keys 1 to 7 pick a preset and the date label rolls in letter by letter." },
  { base: "checkbox", name: "Add-on cards", exportName: "CheckboxCard", description: "Add-on cards with a check that pops and draws in, a brand ring on the picked card and a monthly total that rolls." },
  { base: "checkbox", name: "Task list", exportName: "TaskCheckbox", description: "A task list where ticking a task sweeps a line through it and the row glides down to the done pile while the progress bar fills." },
  { base: "checkbox", name: "Permission tree", exportName: "TreeCheckbox", description: "Nested permissions with half-ticked parents and role presets that stay in sync with the tree as the role name rolls." },
  { base: "radio-group", name: "Plan picker", exportName: "PlanRadio", description: "Plan rows in a checkout card with a brand ring that stretches as it glides to the choice, and a total and button label that roll." },
  { base: "radio-group", name: "Segmented range", exportName: "SegmentRadio", description: "A dark revenue card with a segmented range picker. The thumb slides, the chart redraws and the figure rolls." },
  { base: "radio-group", name: "Swatches", exportName: "SwatchRadio", description: "An app icon colour picker in ink, greys and brand shades. A ring springs to the swatch, the name rolls and the icon recolours." },
  { base: "switch", name: "Settings rows", exportName: "SettingSwitch", description: "A settings card where each switch saves itself, with a small spinner that turns into a drawn Saved tick and fades away." },
  { base: "switch", name: "Icon thumb", exportName: "IconSwitch", description: "A dark focus card whose thumb carries a bell that rings when turned on and gets a slash drawn through it when turned off." },
  { base: "switch", name: "Theme", exportName: "ThemeSwitch", description: "A light and dark toggle where the sun thumb rolls into a moon, stars come out and an ink circle grows from the switch to re-theme the card." },
  { base: "slider", name: "Value bubble", exportName: "BubbleSlider", description: "A budget slider whose value bubble rides the thumb, tilts with the speed of your drag and rolls its digits." },
  { base: "slider", name: "Stepped", exportName: "StepSlider", description: "A storage slider that drags freely and snaps to the nearest step with a small overshoot, lifting the tick label and rolling size and price." },
  { base: "slider", name: "Volume", exportName: "VolumeSlider", description: "A volume slider in a mini player whose speaker gains and loses waves by level, with a brand glow under the thumb and tap to mute." },
];

export const variants: VariantMeta[] = RAW.map((v, i) => {
  const id = `aui-${String(i + 1).padStart(3, "0")}`;
  return { ...v, id, slug: `${v.base}-${id}` };
});

export const variantsOf = (base: string) => variants.filter((v) => v.base === base);
