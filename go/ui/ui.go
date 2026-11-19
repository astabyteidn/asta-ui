// Package ui is Astabyte UI for Go and htmx.
//
// The components are templ components. Their CSS, a small script and htmx are embedded in the package,
// so your app still builds to one binary. Mount the files once and put Head in your layout:
//
//	mux.Handle(ui.Prefix, ui.Handler())
//
//	<head>@ui.Head()</head>
package ui

import (
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"encoding/json"
	"io/fs"
	"net/http"
	"strings"

	"github.com/a-h/templ"
)

// Version of Astabyte UI this package ships. It matches the asta-ui npm package.
const Version = "0.8.0"

// Prefix is the path Handler serves the embedded files under. Change it before you call Handler.
var Prefix = "/_asta/"

//go:embed assets/asta.css assets/asta.js assets/htmx.min.js
var embedded embed.FS

// Assets holds asta.css, asta.js and htmx.min.js, in case you want to serve them yourself.
var Assets, _ = fs.Sub(embedded, "assets")

// hashes maps each embedded file to a short hash of its content, used as the cache key in its URL.
var hashes = func() map[string]string {
	m := map[string]string{}
	for _, name := range []string{"asta.css", "asta.js", "htmx.min.js"} {
		b, _ := embedded.ReadFile("assets/" + name)
		sum := sha256.Sum256(b)
		m[name] = hex.EncodeToString(sum[:5])
	}
	return m
}()

// Handler serves the embedded files. Their URLs carry a hash of the content, so browsers may cache them for a year.
func Handler() http.Handler {
	files := http.StripPrefix(Prefix, http.FileServerFS(Assets))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, Prefix)
		if v := r.URL.Query().Get("v"); v != "" && v == hashes[name] {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=300")
		}
		files.ServeHTTP(w, r)
	})
}

// AssetURL returns the cache-busting URL of an embedded file, e.g. AssetURL("asta.css").
func AssetURL(name string) string {
	if h, ok := hashes[name]; ok {
		return Prefix + name + "?v=" + h
	}
	return Prefix + name
}

// Toast shows a toast after an htmx request. Call it before you write the body.
// Several calls in one response show several toasts.
func Toast(w http.ResponseWriter, t ToastMsg) {
	trigger(w, "asta:toast", t, true)
}

// OpenDialog opens the dialog with this id after an htmx request.
func OpenDialog(w http.ResponseWriter, id string) {
	trigger(w, "asta:open", map[string]string{"id": id}, false)
}

// CloseDialog closes the dialog with this id after an htmx request, e.g. once a form inside it saved.
func CloseDialog(w http.ResponseWriter, id string) {
	trigger(w, "asta:close", map[string]string{"id": id}, false)
}

// ToastMsg is what Toast shows. Tone is "default", "success" or "error". Duration is in milliseconds (default 4000).
type ToastMsg struct {
	Title       string       `json:"title"`
	Description string       `json:"description,omitempty"`
	Tone        string       `json:"tone,omitempty"`
	Duration    int          `json:"duration,omitempty"`
	Action      *ToastAction `json:"action,omitempty"`
}

// ToastAction is a small button in the toast, e.g. Undo. It follows Href, or dispatches Event on document
// (with Detail as the event detail) so htmx can react: hx-trigger="undo from:document". Either way the toast closes.
type ToastAction struct {
	Label  string `json:"label"`
	Href   string `json:"href,omitempty"`
	Event  string `json:"event,omitempty"`
	Detail any    `json:"detail,omitempty"`
}

// trigger merges an event into the HX-Trigger header, keeping events other code already set.
func trigger(w http.ResponseWriter, name string, detail any, list bool) {
	events := map[string]any{}
	if cur := w.Header().Get("HX-Trigger"); cur != "" {
		if json.Unmarshal([]byte(cur), &events) != nil {
			events = map[string]any{}
			for _, n := range strings.Split(cur, ",") {
				if n = strings.TrimSpace(n); n != "" {
					events[n] = true
				}
			}
		}
	}
	if list {
		prev, _ := events[name].([]any)
		events[name] = append(prev, detail)
	} else {
		events[name] = detail
	}
	b, _ := json.Marshal(events)
	w.Header().Set("HX-Trigger", string(b))
}

// cx joins class names, skipping empty ones.
func cx(parts ...string) string {
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p != "" {
			out = append(out, p)
		}
	}
	return strings.Join(out, " ")
}

// pick returns m[key], or m[def] when key is empty or unknown.
func pick(m map[string]string, key, def string) string {
	if v, ok := m[key]; ok && key != "" {
		return v
	}
	return m[def]
}

// when returns s if ok, else "".
func when(ok bool, s string) string {
	if ok {
		return s
	}
	return ""
}

// or returns a, or b when a is empty.
func or(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

// attrs returns a non-nil copy of a, so components can add to it without touching the caller's map.
func attrs(a templ.Attributes) templ.Attributes {
	out := templ.Attributes{}
	for k, v := range a {
		out[k] = v
	}
	return out
}
