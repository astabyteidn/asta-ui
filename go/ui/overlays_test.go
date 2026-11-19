package ui

import (
	"context"
	"io"
	"strings"
	"testing"

	"github.com/a-h/templ"
)

func ovText(s string) templ.Component {
	return templ.ComponentFunc(func(_ context.Context, w io.Writer) error {
		_, err := io.WriteString(w, s)
		return err
	})
}

func ovHas(t *testing.T, html string, want ...string) {
	t.Helper()
	for _, w := range want {
		if !strings.Contains(html, w) {
			t.Errorf("missing %q in:\n%s", w, html)
		}
	}
}

func ovWith(c templ.Component, child templ.Component) templ.Component {
	return templ.ComponentFunc(func(ctx context.Context, w io.Writer) error {
		return c.Render(templ.WithChildren(ctx, child), w)
	})
}

func TestOverlaysNoColorTokens(t *testing.T) {
	html := render(t, Sidebar(SidebarProps{Groups: []SidebarGroup{{Items: []SidebarItem{{ID: "a", Label: "A"}}}}}))
	if strings.Contains(html, "--color-") {
		t.Error("use var(--ink) style tokens, not var(--color-*)")
	}
}

func TestDrawerSideAndAutoOpen(t *testing.T) {
	html := render(t, Drawer(DrawerProps{ID: "d", Side: "bottom", Title: "Share", Open: true}))
	ovHas(t, html, `<dialog`, `id="d"`, `data-side="bottom"`, `data-asta-autoopen`, `data-asta-drawer-handle`, `aria-labelledby="d-title"`, `data-asta-close`)
	if strings.Contains(render(t, Drawer(DrawerProps{ID: "d", Side: "bottom", NoDrag: true})), "data-asta-drawer-handle") {
		t.Error("NoDrag should drop the handle")
	}
	if !strings.Contains(render(t, Drawer(DrawerProps{ID: "d", Side: "nope"})), `data-side="right"`) {
		t.Error("unknown side should fall back to right")
	}
}

func TestPopoverAndHoverCard(t *testing.T) {
	ovHas(t, render(t, Popover(PopoverProps{ID: "p", Side: "top", Arrow: true})), `popover="auto"`, `data-asta-popover`, `data-side="top"`, `data-asta-arrow`)
	if PopoverTarget("p")["popovertarget"] != "p" {
		t.Error("PopoverTarget")
	}
	ovHas(t, render(t, HoverCard(HoverCardProps{ID: "h", OpenDelay: 300})), `popover="manual"`, `data-asta-hovercard`, `data-open-delay="300"`)
	if HoverCardTarget("h")["data-asta-hovercard-for"] != "h" {
		t.Error("HoverCardTarget")
	}
}

func TestDropdownCheckboxRadioSub(t *testing.T) {
	items := templ.Join(
		MenuCheckbox(MenuCheckboxProps{Name: "f", Value: "x", Checked: true}),
		MenuRadio(MenuRadioProps{Name: "sort", Value: "date"}),
		ovWith(MenuSub(MenuSubProps{Label: "More"}), MenuItem(MenuItemProps{})),
	)
	html := render(t, ovWith(DropdownMenu(DropdownMenuProps{ID: "m", Label: "View", Align: "end"}), items))
	ovHas(t, html, `data-asta-dropdown`, `data-align="end"`, `data-asta-dropdown-trigger`, `aria-haspopup="menu"`,
		`role="menuitemcheckbox"`, `aria-checked="true"`, `name="f" value="x"`,
		`role="menuitemradio"`, `data-group="sort"`, `data-asta-menu-sub`, `data-asta-mpanel`)
	// An unchecked radio's hidden input is disabled so it doesn't post.
	if !strings.Contains(render(t, MenuRadio(MenuRadioProps{Name: "s", Value: "v"})), "disabled") {
		t.Error("unchecked radio input should be disabled")
	}
}

func TestContextMenu(t *testing.T) {
	html := render(t, ovWith(ContextMenu(ContextMenuProps{ID: "c", Menu: MenuItem(MenuItemProps{}), LongPress: 400}), ovText("area")))
	ovHas(t, html, `data-asta-context-menu`, `data-long-press="400"`, `role="menu"`, "area")
}

func TestCommandPaletteServerSearch(t *testing.T) {
	html := render(t, CommandPalette(CommandPaletteProps{ID: "k", Search: "/search"}))
	ovHas(t, html, `data-asta-command`, `data-server`, `hx-get="/search"`, `hx-target="#k-list"`, `id="k-list"`, `data-hotkey="k"`)
	ovHas(t, render(t, CommandItem(CommandItemProps{Label: "Inbox", Keywords: "mail", Href: "/inbox"})),
		`role="option"`, `data-keywords="mail"`, `href="/inbox"`, `data-asta-command-label`)
}

func TestNavbar(t *testing.T) {
	html := render(t, Navbar(NavbarProps{ID: "n", Items: []NavItem{
		{Label: "Product", Menu: &NavMenu{Tiles: []NavTile{{Title: "A", Href: "/a"}}}},
		{Label: "Pricing", Href: "/pricing"},
	}, CTA: NavLink{Label: "Start", Href: "/start"}}))
	ovHas(t, html, `data-asta-navbar`, `data-asta-nav-trigger="0"`, `aria-controls="n-panel"`, `data-asta-nav-panel="0"`, `href="/pricing"`, `data-asta-nav-burger`, `data-asta-nav-sheet`)
}

func TestSidebarActiveAndRail(t *testing.T) {
	html := render(t, Sidebar(SidebarProps{Collapsed: true, Active: "b", Groups: []SidebarGroup{{Items: []SidebarItem{{ID: "a", Label: "A"}, {ID: "b", Label: "B", Href: "/b", Badge: 3}}}}}))
	ovHas(t, html, `data-collapsed`, `data-auto-rail`, `data-asta-sidebar-item="b"`, `aria-current="page"`, `href="/b"`, `>3<`)
	if strings.Count(html, `aria-current="page"`) != 1 {
		t.Error("exactly one item should be current")
	}
}

func TestWorkspaceSwitcher(t *testing.T) {
	html := render(t, WorkspaceSwitcher(WorkspaceSwitcherProps{Name: "ws", Current: "b", Workspaces: []Workspace{{ID: "a", Name: "Alpha"}, {ID: "b", Name: "Beta", Plan: "Pro"}}}))
	ovHas(t, html, `data-asta-ws`, `data-match`, `role="menuitemradio"`, `data-ws-name="Beta"`, `name="ws" value="b"`)
	if !strings.Contains(html, `data-ws-name-out class="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">Beta`) {
		t.Error("trigger should show the current workspace")
	}
}

func TestFooterNewsletter(t *testing.T) {
	html := render(t, Footer(FooterProps{Wordmark: "Ab", Subscribe: "/sub", Columns: []FooterColumn{{Heading: "Product", Links: []NavLink{{Label: "Kit", Href: "/kit"}}}}}))
	ovHas(t, html, `data-asta-newsletter`, `hx-post="/sub"`, `name="email"`, `data-asta-wordmark`, `href="/kit"`)
	if strings.Count(html, "data-l ") != 2 {
		t.Error("one span per wordmark letter")
	}
	if strings.Contains(render(t, Newsletter(NewsletterProps{})), "hx-post") {
		t.Error("no Action: no hx-post")
	}
}

func TestAnnouncementBar(t *testing.T) {
	if render(t, AnnouncementBar(AnnouncementBarProps{})) != "" {
		t.Error("no messages renders nothing")
	}
	html := render(t, AnnouncementBar(AnnouncementBarProps{StorageKey: "k", Interval: 3000, Messages: []AnnouncementMessage{{Text: "One"}, {Text: "Two", Href: "/x"}}}))
	ovHas(t, html, `data-asta-announce`, `data-storage-key="k"`, `data-interval="3000"`, `data-state="cur"`, `data-asta-announce-close`, "Learn more")
	if strings.Contains(render(t, AnnouncementBar(AnnouncementBarProps{NoDismiss: true, Messages: []AnnouncementMessage{{Text: "a"}}})), "data-asta-announce-close") {
		t.Error("NoDismiss hides close")
	}
}

func TestStepperStates(t *testing.T) {
	html := render(t, Stepper(StepperProps{Current: 1, Steps: []Step{{Title: "A"}, {Title: "B"}, {Title: "C"}}}))
	ovHas(t, html, `data-step="1"`, `data-count="3"`, `data-state="done"`, `data-state="current"`, `data-state="todo"`, `aria-current="step"`)
	if !strings.Contains(render(t, Stepper(StepperProps{Current: 9, Steps: []Step{{Title: "A"}}})), "data-complete") {
		t.Error("Current past the end means complete")
	}
	if StepGoTo(2)["data-asta-step-goto"] != "2" {
		t.Error("StepGoTo")
	}
}

func TestToolDock(t *testing.T) {
	html := render(t, ToolDock(ToolDockProps{Name: "tool", Tools: []DockTool{{ID: "a", Label: "A", Disabled: true}, {Separator: true}, {ID: "b", Label: "B", Shortcut: "B"}}}))
	ovHas(t, html, `role="toolbar"`, `data-hotkeys`, `data-tool="b"`, `aria-keyshortcuts="B"`, `name="tool" value="b"`)
	if strings.Count(html, `aria-pressed="true"`) != 1 {
		t.Error("first enabled tool should be pressed")
	}
}
