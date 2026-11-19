package main

import (
	"fmt"
	"html"
	"net/http"
	"sort"
	"strings"
	"time"
)

func init() {
	demoRoutes = append(demoRoutes,
		demoRoute{"POST /demo/forms/echo", formsEcho},
		demoRoute{"POST /demo/forms/otp", formsOTP},
		demoRoute{"POST /demo/forms/save", formsSave},
	)
}

// formsEcho shows the posted fields, so the demos prove they post like plain forms.
func formsEcho(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(16 << 20); err != nil && err != http.ErrNotMultipart {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	var parts []string
	keys := make([]string, 0, len(r.PostForm))
	for k := range r.PostForm {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		parts = append(parts, k+"="+strings.Join(r.PostForm[k], ","))
	}
	if r.MultipartForm != nil {
		for k, fs := range r.MultipartForm.File {
			names := make([]string, len(fs))
			for i, f := range fs {
				names[i] = fmt.Sprintf("%s (%d B)", f.Filename, f.Size)
			}
			parts = append(parts, k+"="+strings.Join(names, ","))
		}
	}
	if len(parts) == 0 {
		parts = []string{"(nothing)"}
	}
	fmt.Fprint(w, html.EscapeString(strings.Join(parts, "  ")))
}

// formsOTP checks the demo code.
func formsOTP(w http.ResponseWriter, r *http.Request) {
	if r.FormValue("code") == "246810" {
		fmt.Fprint(w, `<span class="text-ink">Code accepted.</span>`)
		return
	}
	fmt.Fprint(w, `<span class="text-[#e5484d]">That code didn't work. Try 246810.</span>`)
}

// formsSave pretends to save an inline edit. "fail" fails, so the error state can be seen.
func formsSave(w http.ResponseWriter, r *http.Request) {
	time.Sleep(400 * time.Millisecond)
	if strings.EqualFold(strings.TrimSpace(r.FormValue("project")), "fail") {
		http.Error(w, "nope", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
