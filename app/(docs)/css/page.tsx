import type { Metadata } from "next";
import CodeTabs from "@/components/ui-site/CodeTabs";
import { highlight } from "@/lib/ui-highlight";
import { VERSION } from "@/lib/version";
import DocPage from "../DocPage";

export const metadata: Metadata = {
  title: "HTML + CSS",
  description: "Astabyte UI as plain CSS classes and one small script. For Go html/template, htmx, Rails, Django, Laravel or plain HTML. No React, no build.",
};

const REPO = "https://github.com/astabyteidn/asta-ui";
const CDN = `https://cdn.jsdelivr.net/npm/asta-ui@${VERSION}/css`;

async function block(name: string, code: string, lang: string) {
  return { name, path: `${name}-${lang}-${code.length}`, code, html: await highlight(code, `x.${lang}`) };
}

// Temporary: the docs site serves the current release unversioned. It may move or go away.
const TEMP = "https://ui.astabyte.com/cdn";

const LINK_TEMP = `<link rel="stylesheet" href="${TEMP}/asta.css">
<script src="${TEMP}/asta.js" defer></script>`;

const LINK = `<link rel="stylesheet" href="${CDN}/asta.css">
<script src="${CDN}/asta.js" defer></script>`;

const NPM = `npm install asta-ui`;

const TW = `@import "tailwindcss";
@import "asta-ui/css/tokens.css";
@import "asta-ui/css/components.css";`;

const TW_JS = `<script src="/node_modules/asta-ui/css/asta.js" defer></script>`;

const BUTTONS = `<button class="asta-btn asta-btn-accent"><span class="asta-btn-label">Save</span></button>
<button class="asta-btn asta-btn-outline asta-btn-sm"><span class="asta-btn-label">Cancel</span></button>
<a class="asta-btn asta-btn-ghost" href="/docs"><span class="asta-btn-label">Docs</span></a>

<button class="asta-btn asta-btn-accent" hx-post="/save">
  <span class="asta-btn-label">Save</span>
  <span class="asta-btn-spinner" aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </span>
</button>`;

const FIELD = `<div class="asta-field">
  <div class="asta-field-head">
    <label class="asta-label" for="email">Email</label>
  </div>
  <label class="asta-input">
    <input class="asta-input-control" id="email" name="email" type="email" placeholder="you@astabyte.com">
  </label>
  <p class="asta-hint">We never share it.</p>
</div>`;

const FIELD_ERROR = `<label class="asta-input">
  <input class="asta-input-control" name="handle" value="astabyte" aria-invalid="true">
</label>
<p class="asta-error" role="alert">That handle is taken.</p>`;

const CONTROLS = `<div class="asta-select">
  <select class="asta-select-control" name="plan">
    <option value="" disabled hidden selected>Choose a plan</option>
    <option>Starter</option>
    <option>Pro</option>
  </select>
  <svg class="asta-select-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m4 6 4 4 4-4" /></svg>
</div>

<label class="asta-checkbox">
  <span class="asta-checkbox-box">
    <input type="checkbox" class="asta-checkbox-input" name="updates" checked>
    <svg class="asta-checkbox-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M3.5 8.5l3 3 6-7" /></svg>
    <span class="asta-checkbox-dash"></span>
  </span>
  <span><span class="asta-checkbox-label">Email me updates</span></span>
</label>

<label class="asta-switch">
  <span><span class="asta-switch-label">Deploy alerts</span></span>
  <span class="asta-switch-track">
    <input type="checkbox" role="switch" class="asta-switch-input" name="alerts">
    <span class="asta-switch-thumb"></span>
  </span>
</label>`;

const DIALOG = `<button class="asta-btn asta-btn-accent" data-asta-open="invite">
  <span class="asta-btn-label">Invite</span>
</button>

<dialog id="invite" class="asta-dialog" aria-labelledby="invite-title">
  <button type="button" class="asta-dialog-close" data-asta-close aria-label="Close">
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 3l8 8M11 3 3 11" /></svg>
  </button>
  <h2 id="invite-title" class="asta-dialog-title">Invite to Astabyte</h2>
  <p class="asta-dialog-desc">They get an email with a link.</p>
  <form class="asta-dialog-body" hx-post="/invite" hx-target="this" hx-swap="outerHTML">
    <label class="asta-input"><input class="asta-input-control" name="email" type="email"></label>
    <div class="asta-dialog-footer">
      <button type="button" class="asta-btn asta-btn-ghost" data-asta-close><span class="asta-btn-label">Cancel</span></button>
      <button class="asta-btn asta-btn-accent"><span class="asta-btn-label">Send invite</span></button>
    </div>
  </form>
</dialog>`;

const MENU = `<div class="asta-menu" data-asta-menu>
  <button type="button" class="asta-btn asta-btn-outline asta-menu-trigger"
    data-asta-menu-trigger aria-haspopup="menu" aria-expanded="false">
    Actions
    <svg class="asta-menu-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 6 4 4 4-4" /></svg>
  </button>
  <div role="menu" hidden tabindex="-1" class="asta-menu-panel">
    <button type="button" role="menuitem" tabindex="-1" class="asta-menu-item">
      <span class="asta-menu-item-text">Rename</span><kbd class="asta-menu-shortcut">R</kbd>
    </button>
    <div role="separator" class="asta-menu-separator"></div>
    <button type="button" role="menuitem" tabindex="-1" class="asta-menu-item asta-menu-item-danger"
      hx-delete="/projects/astabyte">
      <span class="asta-menu-item-text">Delete</span>
    </button>
  </div>
</div>`;

const TABS = `<div class="asta-tabs" data-asta-tabs>
  <div role="tablist" aria-label="Project" class="asta-tabs-list">
    <span class="asta-tabs-line" aria-hidden="true"></span>
    <span class="asta-tabs-indicator" data-asta-tab-indicator aria-hidden="true"></span>
    <button type="button" role="tab" class="asta-tab" id="tab-a" aria-controls="panel-a" aria-selected="true">Overview</button>
    <button type="button" role="tab" class="asta-tab" id="tab-b" aria-controls="panel-b" aria-selected="false" tabindex="-1">
      Activity <span class="asta-tab-count">3</span>
    </button>
  </div>
  <div role="tabpanel" class="asta-tabs-panel" id="panel-a" aria-labelledby="tab-a" tabindex="0">…</div>
  <div role="tabpanel" class="asta-tabs-panel" id="panel-b" aria-labelledby="tab-b" tabindex="0" hidden
    hx-get="/projects/astabyte/activity" hx-trigger="asta:show once">…</div>
</div>`;

const TABLE = `<div class="asta-table-wrap">
  <div class="asta-table-scroll">
    <table class="asta-table">
      <thead>
        <tr>
          <th class="asta-th" scope="col">Client</th>
          <th class="asta-th asta-th-right" scope="col">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr class="asta-tr">
          <td class="asta-td">Astabyte Studio</td>
          <td class="asta-td asta-td-right">$1,200.00</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;

const HTMX = `<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.4/dist/htmx.min.js" defer></script>`;

const GO_TPL = `{{range .Members}}
<tr class="asta-tr">
  <td class="asta-td">{{.Name}}</td>
  <td class="asta-td asta-td-right">{{.Role}}</td>
</tr>
{{end}}

<label class="asta-input">
  <input class="asta-input-control" name="email" value="{{.Email}}"
    {{if .EmailErr}}aria-invalid="true"{{end}}>
</label>
{{with .EmailErr}}<p class="asta-error" role="alert">{{.}}</p>{{end}}`;

const DJANGO = `{% for m in members %}
<tr class="asta-tr">
  <td class="asta-td">{{ m.name }}</td>
  <td class="asta-td asta-td-right">{{ m.role }}</td>
</tr>
{% endfor %}

<label class="asta-input">
  <input class="asta-input-control" name="email" value="{{ form.email.value|default:'' }}"
    {% if form.email.errors %}aria-invalid="true"{% endif %}>
</label>
{% for e in form.email.errors %}<p class="asta-error" role="alert">{{ e }}</p>{% endfor %}`;

const ERB = `<% @members.each do |m| %>
<tr class="asta-tr">
  <td class="asta-td"><%= m.name %></td>
  <td class="asta-td asta-td-right"><%= m.role %></td>
</tr>
<% end %>

<label class="asta-input">
  <input class="asta-input-control" name="email" value="<%= @user.email %>"
    <%= 'aria-invalid="true"' if @user.errors[:email].any? %>>
</label>`;

const TOAST_JS = `asta.toast({ title: "Saved", tone: "success" })
asta.toast({ title: "Deleted", action: { label: "Undo", event: "undo" } })
asta.open("invite")
asta.close("invite")`;

const TOAST_GO = `func save(w http.ResponseWriter, r *http.Request) {
	// …save…
	w.Header().Set("HX-Trigger", \`{"asta:toast": {"title": "Saved", "tone": "success"}}\`)
	w.WriteHeader(http.StatusNoContent)
}`;

const FLASH = `<template data-asta-toast='[{"title": "Welcome back"}]'></template>`;

const THEME = `:root {
  --brand: #0f766e;   /* your accent */
  --paper: #ffffff;   /* page ground */
}
.dark {
  --brand: #2dd4bf;
}`;

const DARK = `<html class="dark">`;

const GROUPS: [string, string][] = [
  ["Core", "asta-btn, asta-input, asta-field, asta-textarea, asta-select, asta-checkbox, asta-radio, asta-switch, asta-slider, asta-badge, asta-count, asta-dialog, asta-menu, asta-tabs, asta-table"],
  ["Display", "asta-avatar, asta-avatar-group, asta-kbd, asta-spinner, asta-tooltip, asta-skeleton, asta-progress, asta-alert, asta-breadcrumb, asta-pagination, asta-accordion, asta-stat-card, asta-empty-state"],
  ["Forms", "asta-rating, asta-copy-button, asta-toggle-group, asta-range-slider, asta-color-picker, asta-inline-edit, asta-segmented, asta-number-input, asta-tag-input, asta-date-picker, asta-combobox, asta-file-upload, asta-otp-input, asta-password, asta-sr-only"],
  ["Overlays and navigation", "asta-drawer, asta-popover, asta-hover-card, asta-context-menu, asta-dropdown, asta-cmd, asta-navbar, asta-sidebar, asta-ws, asta-footer, asta-announcement, asta-stepper, asta-tool-dock"],
  ["Data", "asta-motion-button, asta-timeline-root, asta-carousel-root, asta-tree-view, asta-file-card, asta-file-row, asta-image-compare, asta-data-table, asta-kanban-root, asta-comments-root, asta-event-calendar, asta-notification-center"],
  ["Blocks", "asta-ai-chat, asta-sign-in, asta-onboarding, asta-plans, asta-checkout-form, asta-properties, asta-settings-panel, asta-team-members"],
];

export default async function CssPage() {
  const files = await Promise.all([
    block("index.html", LINK_TEMP, "html"),
    block("index.html", LINK, "html"),
    block("Terminal", NPM, "sh"),
    block("app.css", TW, "css"),
    block("index.html", TW_JS, "html"),
    block("buttons.html", BUTTONS, "html"),
    block("field.html", FIELD, "html"),
    block("error.html", FIELD_ERROR, "html"),
    block("controls.html", CONTROLS, "html"),
    block("dialog.html", DIALOG, "html"),
    block("menu.html", MENU, "html"),
    block("tabs.html", TABS, "html"),
    block("table.html", TABLE, "html"),
    block("index.html", HTMX, "html"),
    block("members.html", GO_TPL, "html"),
    block("members.html", DJANGO, "html"),
    block("members.html.erb", ERB, "html"),
    block("Console", TOAST_JS, "tsx"),
    block("handlers.go", TOAST_GO, "go"),
    block("page.html", FLASH, "html"),
    block("app.css", THEME, "css"),
    block("index.html", DARK, "html"),
  ]);
  const [linkTemp, link, npm, tw, twJs, buttons, field, fieldError, controls, dialog, menu, tabs, table, htmx, goTpl, django, erb, toastJs, toastGo, flash, theme, dark] = files;

  return (
    <DocPage
      title="HTML + CSS"
      lead="The kit as plain CSS classes and one small script. For any stack that renders HTML: Go, Django, Rails, Laravel, htmx or a static page. No React, no build step."
      toc={[
        { id: "why", title: "Why" },
        { id: "install", title: "Install" },
        { id: "components", title: "Components" },
        { id: "server", title: "Server templates" },
        { id: "htmx", title: "htmx" },
        { id: "toasts", title: "Toasts" },
        { id: "classes", title: "Class names" },
        { id: "theming", title: "Theming" },
        { id: "versions", title: "Versions" },
      ]}
      next={{ href: "/prompts", title: "Prompts" }}
    >
      <h2 id="why">Why</h2>
      <p>You render HTML on the server and want the Astabyte look. This is for you.</p>
      <ul>
        <li>Works with Go html/template, htmx, Rails, Django, Laravel or a plain HTML file.</li>
        <li>Same look as the React kit, light and dark.</li>
        <li>
          Menus, dialogs, tabs and toasts run on <code>asta.js</code>. It wires itself with event delegation, so markup swapped in by htmx just works.
        </li>
      </ul>

      <h2 id="install">Install</h2>
      <p>
        <strong>Quick start.</strong> Two lines in your <code>&lt;head&gt;</code>. The stylesheet is already built and minified.
      </p>
      <div className="my-6">
        <CodeTabs files={[linkTemp]} />
      </div>
      <p role="note" className="rounded-[10px] bg-paper-2 p-4">
        <strong>Temporary:</strong> this link may move or go away. For production, pin a version from jsDelivr:
      </p>
      <div className="my-6">
        <CodeTabs files={[link]} />
      </div>
      <p>
        <strong>With your own Tailwind v4 build.</strong> Install the package and import the tokens and the components. Your utilities still work
        next to the kit classes, and they win over them.
      </p>
      <div className="my-6">
        <CodeTabs files={[npm, tw, twJs]} />
      </div>
      <p>
        Serve <code>asta.js</code> from wherever your app keeps static files. <code>components.css</code> already tells Tailwind to scan it, so the
        classes it adds to toasts and menus get built.
      </p>

      <h2 id="components">Components</h2>
      <p>
        Every class starts with <code>asta-</code>. Keep the <code>data-asta-*</code>, <code>role</code> and <code>aria-*</code> attributes from the
        snippets. That is what <code>asta.js</code> looks for.
      </p>

      <h3>Buttons</h3>
      <p>
        Pick a variant and a size. The label goes in <code>asta-btn-label</code>, so the spinner can sit on top during an htmx request.
      </p>
      <div className="my-6">
        <CodeTabs files={[buttons]} />
      </div>

      <h3>Form field</h3>
      <p>
        A label, the control, then a hint or an error. Set <code>aria-invalid=&quot;true&quot;</code> on the input and the field turns red.
      </p>
      <div className="my-6">
        <CodeTabs files={[field, fieldError]} />
      </div>

      <h3>Select, checkbox, switch</h3>
      <p>Native controls underneath, so forms post as usual.</p>
      <div className="my-6">
        <CodeTabs files={[controls]} />
      </div>

      <h3>Dialog</h3>
      <p>
        A native <code>&lt;dialog&gt;</code>. Any element with <code>data-asta-open=&quot;id&quot;</code> opens it. <code>data-asta-close</code>{" "}
        closes it. Escape and a click on the backdrop close it too.
      </p>
      <div className="my-6">
        <CodeTabs files={[dialog]} />
      </div>

      <h3>Menu</h3>
      <p>Arrow keys, Escape and outside clicks are handled. The menu flips above the trigger when there is no room below.</p>
      <div className="my-6">
        <CodeTabs files={[menu]} />
      </div>

      <h3>Tabs</h3>
      <p>
        The indicator slides to the selected tab. A hidden panel gets an <code>asta:show</code> event the first time it opens, ready for{" "}
        <code>hx-trigger</code>.
      </p>
      <div className="my-6">
        <CodeTabs files={[tabs]} />
      </div>

      <h3>Table</h3>
      <div className="my-6">
        <CodeTabs files={[table]} />
      </div>

      <h2 id="server">Server templates</h2>
      <p>
        There is nothing to install on the server. Loop over your data and print the classes. For an error, set <code>aria-invalid</code> and
        render an <code>asta-error</code> line. Every component page has the full markup in its &quot;HTML + CSS&quot; step.
      </p>
      <div className="my-6">
        <CodeTabs files={[{ ...goTpl, name: "Go html/template" }, { ...django, name: "Django" }, { ...erb, name: "Rails (ERB)" }]} />
      </div>

      <h2 id="htmx">htmx</h2>
      <p>
        Load htmx next to <code>asta.js</code>. Nothing else to set up: <code>asta.js</code> listens on <code>document</code>, so menus, dialogs and
        tabs in swapped-in markup work without re-init.
      </p>
      <div className="my-6">
        <CodeTabs files={[htmx]} />
      </div>
      <ul>
        <li>
          A button with <code>asta-btn-spinner</code> shows it while its request runs (<code>htmx-request</code>).
        </li>
        <li>
          A tab panel gets <code>asta:show</code> the first time it opens, so <code>hx-trigger=&quot;asta:show once&quot;</code> loads it lazily.
        </li>
        <li>
          Send toasts from the server with <code>HX-Trigger</code> (below).
        </li>
      </ul>

      <h2 id="toasts">Toasts</h2>
      <p>
        <strong>From JavaScript.</strong> <code>asta.js</code> puts one function on <code>window.asta</code>.
      </p>
      <div className="my-6">
        <CodeTabs files={[toastJs]} />
      </div>
      <p>
        <strong>From the server.</strong> Send an <code>HX-Trigger</code> header with an <code>asta:toast</code> event. Any language works. Here is Go:
      </p>
      <div className="my-6">
        <CodeTabs files={[toastGo]} />
      </div>
      <p>
        <strong>After a redirect.</strong> Put a template in the page and the toasts show on load.
      </p>
      <div className="my-6">
        <CodeTabs files={[flash]} />
      </div>

      <h2 id="classes">Class names</h2>
      <ul>
        <li>
          A component is <code>asta-&lt;name&gt;</code>. Its parts are <code>asta-&lt;name&gt;-&lt;part&gt;</code>.
        </li>
        <li>
          Variants and sizes are extra classes on the root: <code>asta-btn asta-btn-accent asta-btn-sm</code>.
        </li>
        <li>
          States come from attributes: <code>aria-selected</code>, <code>aria-invalid</code>, <code>data-open</code>, <code>disabled</code>.
        </li>
      </ul>
      <ul>
        {GROUPS.map(([group, list]) => (
          <li key={group}>
            <strong>{group}:</strong> {list}
          </li>
        ))}
      </ul>
      <p>
        A few roots pair with a class <code>asta.js</code> styles, like <code>asta-timeline asta-timeline-root</code> or{" "}
        <code>asta-kanban asta-kanban-root</code>. Keep both. Toasts have no markup to write: <code>asta.js</code> builds them.
      </p>
      <p>
        Every class has a short markup example in its source file: <a href={`${REPO}/tree/main/packages/asta-ui/css/src`}>packages/asta-ui/css/src</a>.
      </p>

      <h2 id="theming">Theming</h2>
      <p>
        Colours are CSS variables. Override them after the stylesheet to rebrand. Put <code>class=&quot;dark&quot;</code> on <code>&lt;html&gt;</code>{" "}
        for dark mode.
      </p>
      <div className="my-6">
        <CodeTabs files={[theme, dark]} />
      </div>
      <p>
        The kit classes live in the <code>components</code> layer. Any plain CSS you write, or any utility class, wins over them without{" "}
        <code>!important</code>.
      </p>

      <h2 id="versions">Versions</h2>
      <p>
        Pin the version in the URL, like <code>asta-ui@{VERSION}</code>. A bare <code>asta-ui</code> follows the latest release and can change under
        you. The CSS ships with every npm release, next to the React package. See the <a href={`${REPO}/releases`}>releases</a>.
      </p>
    </DocPage>
  );
}
