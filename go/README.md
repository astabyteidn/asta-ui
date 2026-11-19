# Astabyte UI for Go + htmx

The Astabyte kit as [templ](https://templ.guide) components. Server-rendered, htmx-ready, and embedded, so your app still ships as **one binary**.

**TL;DR**

```sh
go get github.com/astabyteidn/asta-ui/go@latest
```

```go
mux.Handle(ui.Prefix, ui.Handler())   // serves the embedded CSS, JS and htmx
```

```templ
<head>@ui.Head()</head>
<body>
	@ui.Button(ui.ButtonProps{Variant: "accent", Attrs: templ.Attributes{"hx-post": "/save"}}) { Save }
</body>
```

No Node, no Tailwind build, no CDN. The stylesheet is already compiled and lives inside the package.

## What you get

- Every component of the main kit, 100+ templ components in all. Same look as the React kit:
  - **Actions:** Button, MotionButton, CopyButton, Menu, DropdownMenu, ContextMenu, Kbd, KbdCombo, Tooltip, ToggleGroup, SegmentedControl
  - **Forms:** Field, Input, PasswordInput, NumberInput, OtpInput, Textarea, InlineEdit, Select, Combobox, TagInput, Checkbox, RadioGroup, Switch, Slider, RangeSlider, Rating, DatePicker, ColorPicker, FileUpload
  - **Overlays:** Dialog, Drawer, Popover, HoverCard, CommandPalette, toasts (Toast, Flash)
  - **Navigation:** Navbar, Sidebar, WorkspaceSwitcher, Tabs, Breadcrumb, Pagination, Accordion, Stepper, ToolDock, AnnouncementBar, Footer, Newsletter
  - **Data:** Table, DataTable, TreeView, Timeline, Kanban, EventCalendar, FileCard, ImageCompare, Carousel, StatCard
  - **Feedback:** Alert, Badge, CountBadge, Spinner, ProgressBar, ProgressRing, Skeleton, EmptyState, NotificationCenter
  - **Blocks:** Card, Avatar, AvatarGroup, Comments, AIChat, SignIn, Onboarding, Pricing, Checkout, SettingsPanel, TeamMembers, PropertiesPanel
- One stylesheet (`asta.css`), one small script (`asta.js`) and htmx 2, all embedded with `go:embed`.
- Server helpers for htmx responses: `ui.Toast(w, …)`, `ui.CloseDialog(w, id)`, `ui.OpenDialog(w, id)`.
- Light and dark. Add `class="dark"` to `<html>`.

The motion lab (price charts, order books…) is React only for now.

## Set up

1. Add the module:

   ```sh
   go get github.com/astabyteidn/asta-ui/go@latest
   go install github.com/a-h/templ/cmd/templ@latest
   ```

2. Serve the assets and put `Head` in your layout:

   ```go
   mux := http.NewServeMux()
   mux.Handle(ui.Prefix, ui.Handler())
   ```

   ```templ
   templ Layout() {
   	<!DOCTYPE html>
   	<html lang="en">
   		<head>
   			<meta charset="utf-8"/>
   			<meta name="viewport" content="width=device-width, initial-scale=1"/>
   			@ui.Head()
   		</head>
   		<body>{ children... }</body>
   	</html>
   }
   ```

3. Build. `templ generate && go build` gives you one binary with everything inside.

Already load htmx yourself? Use `@ui.Head(ui.HeadProps{NoHTMX: true})`.

## htmx patterns

**Toast after a request.** Call it before you write the body:

```go
func save(w http.ResponseWriter, r *http.Request) {
	// …save…
	ui.Toast(w, ui.ToastMsg{Title: "Saved", Tone: "success"})
	w.WriteHeader(http.StatusNoContent)
}
```

**Dialog with a form.** Open it from any element, close it from the handler when the form saves:

```templ
@ui.Button(ui.ButtonProps{Attrs: ui.Opens("invite")}) { Invite }
@ui.Dialog(ui.DialogProps{ID: "invite", Title: "Invite a teammate"}) {
	<form hx-post="/invite" hx-target="this" hx-swap="outerHTML">…</form>
}
```

```go
ui.CloseDialog(w, "invite")
ui.Toast(w, ui.ToastMsg{Title: "Invite sent", Tone: "success"})
```

**Loading state.** Buttons show their spinner during their own htmx request. Nothing to wire.

**Toast after a redirect.** Render `@ui.Flash(msgs...)` anywhere in the page.

**Toast with an action.** `ui.ToastMsg{Title: "Removed", Action: &ui.ToastAction{Label: "Undo", Event: "undo", Detail: id}}` shows a button that fires `undo` on `document` (use `hx-trigger="undo from:document"`), or follows `Href`.

From JavaScript: `asta.toast({ title: "Copied" })`, `asta.open("id")`, `asta.close("id")`.

## Examples

[`examples/app`](examples/app) is a small team settings page: forms with validation, a dialog, a menu per row, pagination, tabs and toasts, all over htmx.

[`examples/gallery`](examples/gallery) shows every component, with the htmx endpoints behind them (live search, lazy tree, kanban moves, comments…).

```sh
cd go
templ generate
go run ./examples/app       # http://localhost:8080
go run ./examples/gallery   # http://localhost:8081
```

## Customise

- Every component takes `Class` (extra classes) and `Attrs` (any attribute, hx-* included).
- Colours are CSS variables: `--paper`, `--paper-2`, `--ink`, `--ink-2`, `--mute`, `--brand`. Override them after `Head` to rebrand.
- Need a class that isn't in `asta.css`? Load your own stylesheet next to it.
- `Class` adds classes, it doesn't merge them. To size a full-width control, wrap it in a sized `div`.
- Group controls (radio, toggle group, segmented control) post with `hx-include="this"` on the group.
- templ strips `hx-on:*` from `Attrs`, since it is JavaScript. Write it in the markup, with `ui.ButtonClass(…)` for the look.
- Using `html/template`? `templ.ToGoHTML(ctx, ui.Button(…))` gives you a `template.HTML`.
- Asset URLs carry a hash of the file, so browsers cache them for a year and still pick up a new release.

Not on Go? The same look ships as plain CSS: `https://ui.astabyte.com/cdn/asta.css` (temporary), or pinned from jsDelivr `https://cdn.jsdelivr.net/npm/asta-ui@0.8.0/css/asta.css`. See [HTML + CSS](https://ui.astabyte.com/css).

## Versions

The module is tagged `go/vX.Y.Z` with every Astabyte UI release, so it always matches the npm package and [ui.astabyte.com](https://ui.astabyte.com).

## Contributing

The source of truth for the look is the React kit in `components/kit/`. After you change a `.templ` file:

```sh
cd go && templ generate && go test ./...
cd .. && bun run go      # rebuilds asta.css and asta.js
```

Sources for the runtime and styles are in `ui/assets/src/` (`core.*` first, then one file per group); `asta.js`, `asta.css` and `ui.go`'s hashes are generated.

CI fails if the generated files or `asta.css` are stale. See [CONTRIBUTING.md](../CONTRIBUTING.md).

MIT © Astabyte Labs
