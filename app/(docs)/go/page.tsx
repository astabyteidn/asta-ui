import Link from "next/link";
import type { Metadata } from "next";
import CodeTabs from "@/components/ui-site/CodeTabs";
import { highlight } from "@/lib/ui-highlight";
import DocPage from "../DocPage";

export const metadata: Metadata = {
  title: "Go + htmx",
  description: "Astabyte UI as templ components for Go and htmx. CSS, JS and htmx are embedded, so your app ships as one binary.",
};

const REPO = "https://github.com/astabyteidn/asta-ui";

async function block(name: string, code: string, lang: string) {
  return { name, path: `${name}-${lang}-${code.length}`, code, html: await highlight(code, `x.${lang}`) };
}

const MAIN = `package main

import (
	"net/http"

	ui "github.com/astabyteidn/asta-ui/go/ui"
)

func main() {
	mux := http.NewServeMux()
	mux.Handle(ui.Prefix, ui.Handler()) // asta.css, asta.js and htmx, from the binary
	mux.Handle("GET /{$}", templ.Handler(Page()))
	http.ListenAndServe(":8080", mux)
}`;

const LAYOUT = `templ Page() {
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="utf-8"/>
			<meta name="viewport" content="width=device-width, initial-scale=1"/>
			@ui.Head()
		</head>
		<body class="bg-paper text-ink">
			@ui.Button(ui.ButtonProps{Variant: "accent", Attrs: templ.Attributes{"hx-post": "/save"}}) {
				Save
			}
		</body>
	</html>
}`;

const TOAST = `func save(w http.ResponseWriter, r *http.Request) {
	// …save…
	ui.Toast(w, ui.ToastMsg{Title: "Saved", Tone: "success"})
	w.WriteHeader(http.StatusNoContent)
}`;

const DIALOG = `@ui.Button(ui.ButtonProps{Attrs: ui.Opens("invite")}) {
	Invite
}
@ui.Dialog(ui.DialogProps{ID: "invite", Title: "Invite a teammate"}) {
	<form hx-post="/invite" hx-target="this" hx-swap="outerHTML">
		@ui.Field(ui.FieldProps{Label: "Email", For: "email", Error: f.Errors["email"]}) {
			@ui.Input(ui.InputProps{ID: "email", Name: "email", Type: "email", State: f.State})
		}
		@ui.DialogFooter() {
			@ui.Button(ui.ButtonProps{Variant: "ghost", Attrs: ui.Closes()}) {
				Cancel
			}
			@ui.Button(ui.ButtonProps{Variant: "accent", Type: "submit"}) {
				Send invite
			}
		}
	</form>
}`;

const INVITE = `func invite(w http.ResponseWriter, r *http.Request) {
	f := validate(r)
	if len(f.Errors) > 0 {
		InviteForm(f).Render(r.Context(), w) // the errors show inside the dialog
		return
	}
	ui.CloseDialog(w, "invite")
	ui.Toast(w, ui.ToastMsg{Title: "Invite sent", Tone: "success"})
	InviteForm(Form{}).Render(r.Context(), w)
}`;

const RUN = `git clone ${REPO}
cd asta-ui/go
go run ./examples/app     # http://localhost:8080`;

const BUILD = `templ generate
CGO_ENABLED=0 go build -o app .   # one file, nothing else to copy`;

const JS = `asta.toast({ title: "Copied" })
asta.open("invite")
asta.close("invite")`;

const KIT: [string, string][] = [
  ["Actions", "Button, MotionButton, CopyButton, Menu, DropdownMenu, ContextMenu, Kbd, KbdCombo, Tooltip, ToggleGroup, SegmentedControl"],
  ["Forms", "Field, Input, PasswordInput, NumberInput, OtpInput, Textarea, InlineEdit, Select, Combobox, TagInput, Checkbox, RadioGroup, Switch, Slider, RangeSlider, Rating, DatePicker, ColorPicker, FileUpload"],
  ["Overlays", "Dialog, Drawer, Popover, HoverCard, CommandPalette, toasts (Toast, Flash)"],
  ["Navigation", "Navbar, Sidebar, WorkspaceSwitcher, Tabs, Breadcrumb, Pagination, Accordion, Stepper, ToolDock, AnnouncementBar, Footer, Newsletter"],
  ["Data", "Table, DataTable, TreeView, Timeline, Kanban, EventCalendar, FileCard, ImageCompare, Carousel, StatCard"],
  ["Feedback", "Alert, Badge, CountBadge, Spinner, ProgressBar, ProgressRing, Skeleton, EmptyState, NotificationCenter"],
  ["Blocks", "Card, Avatar, AvatarGroup, Comments, AIChat, SignIn, Onboarding, Pricing, Checkout, SettingsPanel, TeamMembers, PropertiesPanel"],
];

export default async function GoPage() {
  const [get, main, layout, toast, dialog, invite, run, build, js] = await Promise.all([
    block("Terminal", "go get github.com/astabyteidn/asta-ui/go@latest\ngo install github.com/a-h/templ/cmd/templ@latest", "sh"),
    block("main.go", MAIN, "go"),
    block("page.templ", LAYOUT, "templ"),
    block("handlers.go", TOAST, "go"),
    block("page.templ", DIALOG, "templ"),
    block("handlers.go", INVITE, "go"),
    block("Terminal", RUN, "sh"),
    block("Terminal", BUILD, "sh"),
    block("Console", JS, "tsx"),
  ]);

  return (
    <DocPage
      title="Go + htmx"
      lead="The kit as templ components. Server-rendered, htmx-ready, and your app still ships as one binary."
      toc={[
        { id: "install", title: "Install" },
        { id: "setup", title: "Set up" },
        { id: "htmx", title: "htmx patterns" },
        { id: "example", title: "Example app" },
        { id: "kit", title: "What's in it" },
        { id: "customise", title: "Customise" },
        { id: "versions", title: "Versions" },
      ]}
      next={{ href: "/prompts", title: "Prompts" }}
    >
      <p>
        No Node, no Tailwind build, no CDN. The stylesheet is already compiled, and it lives inside the Go package with a small script and
        htmx 2. Same look as the React kit, light and dark.
      </p>

      <h2 id="install">Install</h2>
      <div className="my-6">
        <CodeTabs files={[get]} />
      </div>

      <h2 id="setup">Set up</h2>
      <p>
        Mount the embedded files once, then put <code>@ui.Head()</code> in your layout. The file URLs carry a hash of their content, so
        browsers cache them for a year and still pick up a new release.
      </p>
      <div className="my-6">
        <CodeTabs files={[main, layout]} />
      </div>
      <p>Build it. Everything is in the binary:</p>
      <div className="my-6">
        <CodeTabs files={[build]} />
      </div>
      <p>
        Already load htmx yourself? Use <code>@ui.Head(ui.HeadProps{"{"}NoHTMX: true{"}"})</code>.
      </p>

      <h2 id="htmx">htmx patterns</h2>
      <p>
        <strong>Toast after a request.</strong> Call <code>ui.Toast</code> before you write the body. It goes out in the{" "}
        <code>HX-Trigger</code> header and keeps any events you already set there.
      </p>
      <div className="my-6">
        <CodeTabs files={[toast]} />
      </div>
      <p>
        <strong>Dialog with a form.</strong> A native <code>&lt;dialog&gt;</code>, so focus and Escape just work. Re-render the form with errors,
        or close it from the handler once it saves.
      </p>
      <div className="my-6">
        <CodeTabs files={[dialog, invite]} />
      </div>
      <p>
        <strong>Loading.</strong> A button shows its spinner during its own htmx request. Nothing to wire.
      </p>
      <p>
        <strong>After a redirect.</strong> Render <code>@ui.Flash(msgs...)</code> anywhere in the page and the toasts show on load.
      </p>
      <p>
        <strong>Toast with an action.</strong> Add <code>{'Action: &ui.ToastAction{Label: "Undo", Event: "undo"}'}</code> and the button fires
        an <code>undo</code> event on <code>document</code>, ready for <code>{'hx-trigger="undo from:document"'}</code>. Or give it an <code>Href</code>.
      </p>
      <p>
        <strong>From JavaScript.</strong> Menus, tabs and dialogs work after any htmx swap, without re-init.
      </p>
      <div className="my-6">
        <CodeTabs files={[js]} />
      </div>

      <h2 id="example">Example app</h2>
      <p>
        A small team page: an invite dialog with server-side validation, a members table with a menu per row, pagination that keeps the URL,
        settings with switches and a slider, toasts and dark mode. About 400 lines of Go and templ.
      </p>
      <div className="my-6">
        <CodeTabs files={[run]} />
      </div>
      <p>
        Source: <a href={`${REPO}/tree/main/go/examples/app`}>go/examples/app</a>.
      </p>

      <h2 id="kit">What&rsquo;s in it</h2>
      <ul>
        {KIT.map(([group, list]) => (
          <li key={group}>
            <strong>{group}:</strong> {list}
          </li>
        ))}
      </ul>
      <p>
        Every component of the main kit, light and dark. See them all running with <code>go run ./examples/gallery</code>, and the props on{" "}
        <a href="https://pkg.go.dev/github.com/astabyteidn/asta-ui/go/ui">pkg.go.dev</a>. The motion lab (price charts, order books…) is React only
        for now. Not on Go? The same look ships as plain CSS: see <Link href="/css">HTML + CSS</Link>.
      </p>

      <h2 id="customise">Customise</h2>
      <ul>
        <li>
          Every component takes <code>Class</code> for extra classes and <code>Attrs</code> for any attribute: <code>hx-post</code>,{" "}
          <code>hx-target</code>, <code>aria-label</code>.
        </li>
        <li>
          Colours are CSS variables: <code>--paper</code>, <code>--ink</code>, <code>--mute</code>, <code>--brand</code> and friends. Override
          them after <code>Head</code> to rebrand.
        </li>
        <li>
          <code>asta.css</code> holds the classes the kit uses. For your own layout classes, load your own stylesheet next to it.
        </li>
        <li>
          Using <code>html/template</code>? Turn any component into <code>template.HTML</code> with <code>templ.ToGoHTML</code>.
        </li>
        <li>
          Group controls (radio, toggle group, segmented control) post with <code>{'hx-include="this"'}</code> on the group.
        </li>
        <li>
          <code>Class</code> adds classes, it doesn&rsquo;t merge them. To size a full-width control, wrap it in a sized <code>div</code>.
        </li>
        <li>
          templ strips <code>hx-on:*</code> from <code>Attrs</code>, since it is JavaScript. Write it in the markup instead, with{" "}
          <code>ui.ButtonClass(…)</code> for the look.
        </li>
      </ul>

      <h2 id="versions">Versions</h2>
      <p>
        The module is tagged <code>go/vX.Y.Z</code> with every release, so it matches the npm package and this site. See the{" "}
        <a href={`${REPO}/releases`}>releases</a>.
      </p>
    </DocPage>
  );
}
