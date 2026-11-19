// Command gallery renders every Astabyte UI component on one page, in light and dark, for checking by eye.
//
//	templ generate && go run ./examples/gallery   # http://localhost:8081
package main

import (
	"flag"
	"log"
	"net/http"
	"os"

	"github.com/a-h/templ"

	ui "github.com/astabyteidn/asta-ui/go/ui"
)

func main() {
	addr := flag.String("addr", ":8081", "listen address")
	flag.Parse()
	if p := os.Getenv("PORT"); p != "" {
		*addr = ":" + p
	}
	mux := http.NewServeMux()
	mux.Handle(ui.Prefix, ui.Handler())
	mux.Handle("GET /{$}", templ.Handler(page()))
	// Demo endpoints for components that load or post with htmx.
	mux.HandleFunc("POST /demo/toast", func(w http.ResponseWriter, r *http.Request) {
		ui.Toast(w, ui.ToastMsg{Title: "Saved", Tone: "success"})
		w.WriteHeader(http.StatusNoContent)
	})
	routes(mux)
	log.Printf("Astabyte UI gallery on http://localhost%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}

// routes collects the demo handlers each gallery section registers in its own file.
func routes(mux *http.ServeMux) {
	for _, r := range demoRoutes {
		mux.HandleFunc(r.pattern, r.handler)
	}
}

type demoRoute struct {
	pattern string
	handler http.HandlerFunc
}

// demoRoutes is appended to from init() in the section files.
var demoRoutes []demoRoute
