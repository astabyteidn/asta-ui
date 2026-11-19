package ui

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/a-h/templ"
)

func TestToastMergesIntoHXTrigger(t *testing.T) {
	w := httptest.NewRecorder()
	w.Header().Set("HX-Trigger", "itemSaved")
	Toast(w, ToastMsg{Title: "Saved", Tone: "success"})
	Toast(w, ToastMsg{Title: "Synced"})
	CloseDialog(w, "invite")

	var got map[string]any
	if err := json.Unmarshal([]byte(w.Header().Get("HX-Trigger")), &got); err != nil {
		t.Fatalf("HX-Trigger is not JSON: %v", err)
	}
	if got["itemSaved"] != true {
		t.Errorf("existing event was dropped: %v", got)
	}
	toasts, _ := got["asta:toast"].([]any)
	if len(toasts) != 2 {
		t.Fatalf("want 2 toasts, got %v", got["asta:toast"])
	}
	if first := toasts[0].(map[string]any); first["title"] != "Saved" || first["tone"] != "success" {
		t.Errorf("first toast = %v", first)
	}
	if c, _ := got["asta:close"].(map[string]any); c["id"] != "invite" {
		t.Errorf("asta:close = %v", got["asta:close"])
	}
}

func TestHandlerServesVersionedAssets(t *testing.T) {
	h := Handler()
	for _, name := range []string{"asta.css", "asta.js", "htmx.min.js"} {
		r := httptest.NewRequest(http.MethodGet, AssetURL(name), nil)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		if w.Code != http.StatusOK || w.Body.Len() == 0 {
			t.Fatalf("%s: status %d, %d bytes", name, w.Code, w.Body.Len())
		}
		if cc := w.Header().Get("Cache-Control"); !strings.Contains(cc, "immutable") {
			t.Errorf("%s: Cache-Control = %q", name, cc)
		}
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest(http.MethodGet, Prefix+"asta.js?v="+Version, nil))
	if cc := w.Header().Get("Cache-Control"); strings.Contains(cc, "immutable") {
		t.Errorf("a stale cache key must not be immutable, got %q", cc)
	}
	w = httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest(http.MethodGet, Prefix+"input.css", nil))
	if w.Code != http.StatusNotFound {
		t.Errorf("source files must not be served, got %d", w.Code)
	}
}

func TestVersionMatchesScript(t *testing.T) {
	js := mustRead(t, "asta.js")
	if !bytes.Contains(js, []byte(`version: "`+Version+`"`)) {
		t.Errorf("asta.js does not carry version %s; run bun run go", Version)
	}
}

func mustRead(t *testing.T, name string) []byte {
	t.Helper()
	b, err := embedded.ReadFile("assets/" + name)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func render(t *testing.T, c templ.Component) string {
	t.Helper()
	var b strings.Builder
	if err := c.Render(context.Background(), &b); err != nil {
		t.Fatal(err)
	}
	return b.String()
}

func TestButtonRendersLinkAndAttrs(t *testing.T) {
	html := render(t, Button(ButtonProps{Href: "/docs", Variant: "accent"}))
	if !strings.HasPrefix(html, "<a ") || !strings.Contains(html, `href="/docs"`) || !strings.Contains(html, "bg-brand") {
		t.Errorf("link button = %s", html)
	}
	html = render(t, Button(ButtonProps{Type: "submit", Attrs: templ.Attributes{"hx-post": "/save"}}))
	if !strings.Contains(html, `type="submit"`) || !strings.Contains(html, `hx-post="/save"`) {
		t.Errorf("button = %s", html)
	}
}

func TestFlashEscapesJSON(t *testing.T) {
	html := render(t, Flash(ToastMsg{Title: `<script>alert(1)</script>`}))
	if strings.Contains(html, "<script>alert") {
		t.Errorf("toast title was not escaped: %s", html)
	}
}

func TestToastAction(t *testing.T) {
	w := httptest.NewRecorder()
	Toast(w, ToastMsg{Title: "Removed", Action: &ToastAction{Label: "Undo", Event: "undo", Detail: map[string]int{"id": 3}}})
	h := w.Header().Get("HX-Trigger")
	if !strings.Contains(h, `"action":{"label":"Undo","event":"undo","detail":{"id":3}}`) {
		t.Errorf("HX-Trigger = %s", h)
	}
}
