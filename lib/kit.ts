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
  { slug: "rating", title: "Rating", layer: "Atoms", description: "Stars you hover to preview and click to set, with half stars. The filled ones pop in turn when the value changes.", parts: ["hover", "half", "readOnly", "sm", "md", "keys"] },
  { slug: "progress", title: "Progress", layer: "Atoms", description: "A bar or a ring that eases to each new value. Leave out the value and it turns into a calm loading sweep.", parts: ["ProgressBar", "ProgressRing", "determinate", "indeterminate", "label", "value text"] },
  { slug: "alert", title: "Alert", layer: "Atoms", description: "An inline callout for info, success or a warning. The tone shows in the icon, not in colour. Dismiss it and it fades, then the space closes up.", parts: ["info", "success", "warning", "neutral", "title", "action", "dismiss"] },
  { slug: "breadcrumb", title: "Breadcrumb", layer: "Atoms", description: "A trail back to the root that ends on the current page. When the row runs out of room, the middle pages fold into a menu.", parts: ["separator", "current page", "auto collapse", "ellipsis menu", "icons", "keys"] },
  { slug: "pagination", title: "Pagination", layer: "Atoms", description: "Previous, next and page numbers, with an ellipsis where pages are skipped. The active marker slides to the page you pick.", parts: ["prev/next", "ellipsis", "siblings", "boundaries", "sliding marker", "keys"] },
  { slug: "copy-button", title: "Copy button", layer: "Atoms", description: "Click to copy. The icon turns into a check that draws itself in, then settles back. Add a label or keep it icon-only.", parts: ["ClipboardButton", "icon only", "label", "copied state", "ghost", "outline", "soft"] },
  { slug: "toggle-group", title: "Toggle group", layer: "Atoms", description: "A row of buttons you press on or off. Pick one and the background slides over from the last, or let several stay pressed.", parts: ["single", "multiple", "sliding background", "icons", "allowEmpty", "full", "keys"] },
  { slug: "range-slider", title: "Range slider", layer: "Atoms", description: "Two thumbs for a low and a high value. They keep a set gap and never cross. A bubble shows the value as you drag.", parts: ["two thumbs", "minGap", "step", "bubbles", "format", "commit", "keys"] },
  { slug: "color-picker", title: "Color picker", layer: "Atoms", description: "A calm grid of swatches with a ring that scales in on the one you pick. Type any hex in the field for a custom colour.", parts: ["swatches", "custom hex", "preview", "columns", "sm", "md", "keys"] },
  { slug: "avatar-group", title: "Avatar group", layer: "Atoms", description: "Overlapping avatars that spread a little on hover. The one you point at lifts and shows a name. The rest fold into +N.", parts: ["AvatarStack", "overflow", "tooltips", "sm", "md", "lg", "keys"] },
  { slug: "inline-edit", title: "Inline edit", layer: "Atoms", description: "Text that turns into a field when you click it. Enter saves, Esc puts the old text back, and a small tick fades in once it's saved.", parts: ["click to edit", "enter", "escape", "async save", "required", "sm", "md", "lg"] },
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
  { slug: "date-picker", title: "Date picker", layer: "Molecules", description: "A date field with a month calendar that slides between months. Pick one day or a range with a soft band between.", parts: ["single", "range", "min/max", "locale", "keys"] },
  { slug: "combobox", title: "Combobox", layer: "Molecules", description: "Type to filter with the match in bold, then pick one, or many as removable chips.", parts: ["filter", "highlight", "multiple", "chips", "empty state", "keys"] },
  { slug: "stepper", title: "Stepper", layer: "Molecules", description: "Numbered steps that turn into checks, a line that fills as you go and content that slides in from the side you're heading.", parts: ["steps", "check", "progress line", "back/next", "complete"] },
  { slug: "file-upload", title: "File upload", layer: "Molecules", description: "Drop files or browse. Each one gets a row with a progress bar, and files that don't fit are turned away with a reason.", parts: ["drop zone", "progress", "remove", "retry", "accept/maxSize", "maxFiles"] },
  { slug: "otp-input", title: "OTP input", layer: "Molecules", description: "Boxes for a one-time code. Digits drop in, paste fills them all, a full code waves and a wrong one shakes.", parts: ["autofill", "paste", "caret", "complete", "error", "groups"] },
  { slug: "popover", title: "Popover", layer: "Molecules", description: "A click-to-open panel that grows out of its trigger, flips when there's no room and hands focus back when it closes.", parts: ["placement", "flip", "arrow", "outside click", "focus return", "render prop"] },
  { slug: "drawer", title: "Drawer", layer: "Molecules", description: "A sheet that slides in from the right, the left or the bottom over a fading overlay. Escape or a click outside closes it, and the bottom sheet drags down to dismiss.", parts: ["right", "left", "bottom", "drag to close", "focus trap", "Escape", "contained"] },
  { slug: "password-input", title: "Password input", layer: "Molecules", description: "A new-password field with an eye that morphs as you reveal it. The meter fills as rules pass and turns blue when they all do, and each rule ticks itself off.", parts: ["PasswordField", "show/hide", "strength meter", "checklist", "custom rules", "passwordStrength"] },
  { slug: "timeline", title: "Timeline", layer: "Molecules", description: "Events on a connector line that rise in one after another as the list scrolls into view. Finished steps draw the line down and the active one pulses softly.", parts: ["done", "active", "pending", "time", "reveal on scroll"] },
  { slug: "carousel", title: "Carousel", layer: "Molecules", description: "Slides you swipe, drag or step through with the arrows. The active dot stretches into a bar that fills while autoplay runs, and hovering pauses it.", parts: ["swipe/drag", "arrows", "dots", "autoplay", "loop", "keys"] },
  { slug: "stat-card", title: "Stat card", layer: "Molecules", description: "A KPI tile whose value counts up when it scrolls into view, and from the old number when it changes. Up reads blue, down stays neutral, and a tiny sparkline draws itself in.", parts: ["count-up", "format", "delta", "sparkline", "prefix/suffix"] },
  { slug: "empty-state", title: "Empty state", layer: "Molecules", description: "What a list shows when there is nothing in it. A small line drawing draws itself in, with a title, a line of text and up to two actions.", parts: ["no data", "no results", "error", "actions"] },
  { slug: "context-menu", title: "Context menu", layer: "Molecules", description: "Right-click, long-press or Shift+F10 opens a menu at the pointer. It scales in from the nearest corner and flips to stay on screen, with shortcuts, separators and a submenu.", parts: ["right-click", "long-press", "Shift+F10", "submenu", "shortcuts", "type-ahead", "contained"] },
  { slug: "hover-card", title: "Hover card", layer: "Molecules", description: "A preview card for a link, like a profile peek. It fades and lifts in after a short hover or on keyboard focus, and stays open while you move into it.", parts: ["open/close delay", "safe travel", "keyboard focus", "flip", "Escape"] },
  { slug: "tree-view", title: "Tree view", layer: "Molecules", description: "Nested folders and files. The chevron turns and the children fade in below, and the full tree keyboard works, from arrows to type-ahead.", parts: ["expand/collapse", "selection", "arrow keys", "Home/End", "type-ahead", "meta", "disabled"] },
  { slug: "image-compare", title: "Image compare", layer: "Molecules", description: "A before and after slider. Drag anywhere or use the arrows. The before layer sits in a window that slides one way while the picture slides back.", parts: ["drag", "keys", "labels", "controlled", "any content"] },
  { slug: "announcement-bar", title: "Announcement bar", layer: "Molecules", description: "A slim banner for the top of a page with a message and a link. Several messages take turns sliding up, hovering pauses them, and closing slides the bar away.", parts: ["rotating", "dismissible", "badge", "ink", "brand", "subtle", "storageKey"] },
  // Organisms
  { slug: "navbar", title: "Navbar", layer: "Organisms", description: "A site header with a mega menu: the panel morphs between sections, tiles dim their neighbours, and it folds on mobile.", parts: ["mega menu", "morphing panel", "mobile sheet", "scroll state"] },
  { slug: "sign-in", title: "Sign-in card", layer: "Organisms", description: "Email and password with social buttons, inline validation and a submit that shows progress then success.", parts: ["Field", "Button", "validation", "states"] },
  { slug: "pricing", title: "Pricing", layer: "Organisms", description: "Plans with a monthly / yearly switch whose prices roll to the new amount.", parts: ["billing switch", "plans", "features"] },
  { slug: "command-palette", title: "Command palette", layer: "Organisms", description: "Press ⌘J (or click): grouped results, fuzzy filtering, arrow keys and recent items.", parts: ["⌘J", "groups", "filter", "keys"] },
  { slug: "settings-panel", title: "Settings panel", layer: "Organisms", description: "A settings form whose save bar slides up as soon as something changes.", parts: ["switches", "radio", "save bar"] },
  { slug: "footer", title: "Footer", layer: "Organisms", description: "Link columns, a newsletter field that confirms in place, and a big wordmark.", parts: ["columns", "newsletter", "wordmark"] },
  { slug: "data-table", title: "Data table", layer: "Organisms", description: "Sort by any column, search, select rows and page through. Rows slide in on every change and the header sticks.", parts: ["sort", "search", "select", "pagination", "sticky header", "empty"] },
  { slug: "sidebar", title: "Sidebar", layer: "Organisms", description: "An app sidebar with a workspace switcher and grouped links. The active marker slides and the whole thing folds to an icon rail.", parts: ["workspace switcher", "groups", "sliding indicator", "icon rail", "user"] },
  { slug: "kanban", title: "Kanban board", layer: "Organisms", description: "Drag cards between columns and the gap opens where they will land. Works with the keyboard too: Space to pick up, arrows to move.", parts: ["drag", "keyboard", "placeholder", "counts", "announcements"] },
  { slug: "onboarding", title: "Onboarding checklist", layer: "Organisms", description: "A setup checklist with a progress bar. Finish a step and it ticks off, then the next one opens.", parts: ["progress", "steps", "done state"] },
  { slug: "comments", title: "Comments", layer: "Organisms", description: "A discussion thread with replies, a like that pops and a composer that grows as you type. New comments slide in.", parts: ["thread", "replies", "composer", "reactions"] },
  { slug: "ai-chat", title: "AI chat", layer: "Organisms", description: "An assistant panel. Replies stream in and each word fades in. Stop a reply mid-way, copy it or ask for another. Suggested prompts fill the empty state.", parts: ["streaming", "suggestions", "stop", "copy", "regenerate"] },
  { slug: "event-calendar", title: "Event calendar", layer: "Organisms", description: "A month view with event pills and a list for the day you pick. Months slide in from the side you moved to. Arrow keys walk the grid.", parts: ["month grid", "today", "day list", "keyboard", "slide"] },
  { slug: "checkout", title: "Checkout", layer: "Organisms", description: "Contact, shipping and payment on one page. Card fields format as you type. Change a quantity or shipping speed and the totals roll. Pay shows a pending state, then a receipt.", parts: ["card fields", "shipping", "promo code", "rolling totals", "pending", "success"] },
  { slug: "team-members", title: "Team members", layer: "Organisms", description: "A team list with a role picker per person. Paste several emails to invite them at once. Remove someone and an Undo row gives you a few seconds to change your mind.", parts: ["roles", "invite chips", "pending invites", "undo", "announcements"] },
  { slug: "notification-center", title: "Notification center", layer: "Organisms", description: "A bell with an unread count that opens a panel grouped by day. Switch between All and Unread and mark one or all as read. The bell rings when something new arrives.", parts: ["bell", "unread count", "tabs", "grouped by day", "mark read", "empty state"] },
];

/** Catalogue number per layer, e.g. AB-A03, AB-M01, AB-O02. */
export function kitId(slug: string): string {
  const item = kitItems.find((k) => k.slug === slug);
  if (!item) return "";
  const n = kitItems.filter((k) => k.layer === item.layer).findIndex((k) => k.slug === slug) + 1;
  return `AB-${item.layer[0]}${String(n).padStart(2, "0")}`;
}
