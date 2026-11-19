package main

import (
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/astabyteidn/asta-ui/go/ui"
)

func init() {
	demoRoutes = append(demoRoutes,
		demoRoute{"GET /demo/overlays/search", overlaysSearch},
		demoRoute{"POST /demo/overlays/subscribe", overlaysSubscribe},
	)
}

var ovDocs = []string{
	"Getting started", "Install with Go", "Theming and dark mode", "Buttons", "Dialogs and drawers",
	"Menus and submenus", "Command palette", "Forms that post", "htmx recipes", "Motion and reduced motion",
	"Navbar", "Sidebar", "Tables", "Toasts", "Accessibility notes",
}

// ovSearch is a plain substring search over the demo docs list. Empty q lists the first five.
func ovSearch(q string) []string {
	q = strings.ToLower(strings.TrimSpace(q))
	var out []string
	for _, d := range ovDocs {
		if q == "" && len(out) == 5 {
			break
		}
		if q == "" || strings.Contains(strings.ToLower(d), q) {
			out = append(out, d)
		}
	}
	return out
}

// overlaysSearch answers the server-search command palette.
func overlaysSearch(w http.ResponseWriter, r *http.Request) {
	time.Sleep(120 * time.Millisecond)
	_ = ovSearchResults(r.URL.Query().Get("q")).Render(r.Context(), w)
}

// overlaysSubscribe pretends to sign up an email. Addresses at example.com fail, so the error state can be seen.
func overlaysSubscribe(w http.ResponseWriter, r *http.Request) {
	time.Sleep(600 * time.Millisecond)
	email := r.FormValue("email")
	if _, err := mail.ParseAddress(email); err != nil || strings.HasSuffix(email, "@example.com") {
		http.Error(w, "no", http.StatusUnprocessableEntity)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func ovNavItems() []ui.NavItem {
	return []ui.NavItem{
		{Label: "Product", Menu: &ui.NavMenu{Width: 560, Tiles: []ui.NavTile{
			{Title: "Analytics", Description: "See what people do, without cookies.", Href: "#navbar", Preview: "chart"},
			{Title: "Inbox", Description: "Every inquiry in one list.", Href: "#navbar", Preview: "list"},
			{Title: "API", Description: "Typed, versioned, documented.", Href: "#navbar", Preview: "code"},
			{Title: "CMS", Description: "Edit the site without a deploy.", Href: "#navbar", Preview: "list"},
		}}},
		{Label: "Resources", Menu: &ui.NavMenu{Width: 620, Columns: []ui.NavColumn{
			{Heading: "Learn", Links: []ui.NavTile{{Title: "Docs", Href: "#navbar"}, {Title: "Guides", Href: "#navbar"}, {Title: "Changelog", Href: "#navbar"}}},
			{Heading: "Company", Links: []ui.NavTile{{Title: "About", Href: "#navbar"}, {Title: "Work", Href: "#navbar"}, {Title: "Contact", Href: "#navbar"}}},
		}, Feature: &ui.NavFeature{Title: "Astabyte UI 0.7", Description: "Go templ components are here.", Href: "#navbar", CTA: "Read the notes"}}},
		{Label: "Pricing", Href: "#navbar"},
	}
}
