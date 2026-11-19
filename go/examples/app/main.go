// Command app is a small team settings page built with Astabyte UI, templ and htmx.
// Everything (HTML, CSS, JS, htmx) is inside the binary:
//
//	templ generate && go build ./examples/app && ./app -addr :8080
package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"os"
	"slices"
	"strconv"
	"strings"
	"sync"

	"github.com/a-h/templ"

	ui "github.com/astabyteidn/asta-ui/go/ui"
)

const pageSize = 5

type Member struct {
	ID     int
	Name   string
	Email  string
	Role   string
	Status string // "active" or "invited"
}

type Settings struct {
	Notify bool
	Digest bool
	Seats  float64
	Plan   string
}

// store is an in-memory team. It resets when the binary restarts.
type store struct {
	mu       sync.Mutex
	next     int
	members  []Member
	settings Settings
}

func newStore() *store {
	s := &store{settings: Settings{Notify: true, Seats: 12, Plan: "team"}}
	for _, m := range [][3]string{
		{"Ayu Lestari", "ayu@astabyte.com", "Owner"},
		{"Nadia Putri", "nadia@astabyte.com", "Admin"},
		{"Raka Pratama", "raka@astabyte.com", "Member"},
		{"Sekar Ayu", "sekar@astabyte.com", "Member"},
		{"Dimas Arya", "dimas@astabyte.com", "Member"},
		{"Laras Wening", "laras@astabyte.com", "Viewer"},
		{"Bima Sakti", "bima@astabyte.com", "Viewer"},
	} {
		s.add(m[0], m[1], m[2], "active")
	}
	return s
}

func (s *store) add(name, email, role, status string) {
	s.next++
	s.members = append(s.members, Member{ID: s.next, Name: name, Email: email, Role: role, Status: status})
}

type membersView struct {
	Members []Member
	Page    int
	Pages   int
	Total   int
	Invited int
}

func (s *store) view(page int) membersView {
	s.mu.Lock()
	defer s.mu.Unlock()
	pages := max(1, (len(s.members)+pageSize-1)/pageSize)
	page = min(max(page, 1), pages)
	lo := (page - 1) * pageSize
	hi := min(lo+pageSize, len(s.members))
	invited := 0
	for _, m := range s.members {
		if m.Status == "invited" {
			invited++
		}
	}
	return membersView{Members: slices.Clone(s.members[lo:hi]), Page: page, Pages: pages, Total: len(s.members), Invited: invited}
}

type inviteForm struct {
	Name, Email, Role string
	Errors            map[string]string
}

var roles = []string{"Admin", "Member", "Viewer"}

func main() {
	addr := flag.String("addr", ":8080", "listen address")
	flag.Parse()
	if p := os.Getenv("PORT"); p != "" {
		*addr = ":" + p
	}

	s := newStore()
	mux := http.NewServeMux()
	mux.Handle(ui.Prefix, ui.Handler())

	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		// Pagination links load into #members with htmx and push /?page=N, so a reload still works.
		if r.Header.Get("HX-Target") == "members" {
			render(w, r, membersSection(s.view(pageOf(r))))
			return
		}
		s.mu.Lock()
		set := s.settings
		s.mu.Unlock()
		render(w, r, page(s.view(pageOf(r)), set, inviteForm{Role: "Member"}))
	})

	mux.HandleFunc("GET /members", func(w http.ResponseWriter, r *http.Request) {
		render(w, r, membersSection(s.view(pageOf(r))))
	})

	mux.HandleFunc("POST /invite", func(w http.ResponseWriter, r *http.Request) {
		f := inviteForm{
			Name:   strings.TrimSpace(r.FormValue("name")),
			Email:  strings.ToLower(strings.TrimSpace(r.FormValue("email"))),
			Role:   r.FormValue("role"),
			Errors: map[string]string{},
		}
		if f.Name == "" {
			f.Errors["name"] = "Add a name."
		}
		if a, err := mail.ParseAddress(f.Email); err != nil || a.Address != f.Email {
			f.Errors["email"] = "That doesn't look like an email."
		}
		if !slices.Contains(roles, f.Role) {
			f.Errors["role"] = "Pick a role."
		}
		s.mu.Lock()
		if slices.ContainsFunc(s.members, func(m Member) bool { return m.Email == f.Email }) {
			f.Errors["email"] = "Already on the team."
		}
		if len(f.Errors) == 0 {
			s.add(f.Name, f.Email, f.Role, "invited")
		}
		s.mu.Unlock()

		if len(f.Errors) > 0 {
			render(w, r, inviteFormView(f))
			return
		}
		w.Header().Set("HX-Trigger", "members-changed")
		ui.CloseDialog(w, "invite")
		ui.Toast(w, ui.ToastMsg{Title: "Invite sent", Description: "We emailed " + f.Email + ".", Tone: "success"})
		render(w, r, inviteFormView(inviteForm{Role: "Member"}))
	})

	mux.HandleFunc("POST /members/{id}/role", func(w http.ResponseWriter, r *http.Request) {
		role := r.FormValue("role")
		name, ok := s.update(r.PathValue("id"), func(m *Member) bool {
			if !slices.Contains(roles, role) || m.Role == "Owner" {
				return false
			}
			m.Role = role
			return true
		})
		if !ok {
			ui.Toast(w, ui.ToastMsg{Title: "Can't change that role", Tone: "error"})
		} else {
			ui.Toast(w, ui.ToastMsg{Title: name + " is now " + strings.ToLower(role)})
		}
		render(w, r, membersSection(s.view(pageOf(r))))
	})

	mux.HandleFunc("DELETE /members/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, _ := strconv.Atoi(r.PathValue("id"))
		s.mu.Lock()
		i := slices.IndexFunc(s.members, func(m Member) bool { return m.ID == id && m.Role != "Owner" })
		var name string
		if i >= 0 {
			name = s.members[i].Name
			s.members = slices.Delete(s.members, i, i+1)
		}
		s.mu.Unlock()
		if i < 0 {
			ui.Toast(w, ui.ToastMsg{Title: "Can't remove the owner", Tone: "error"})
		} else {
			ui.Toast(w, ui.ToastMsg{Title: "Removed " + name})
		}
		render(w, r, membersSection(s.view(pageOf(r))))
	})

	mux.HandleFunc("POST /settings", func(w http.ResponseWriter, r *http.Request) {
		seats, _ := strconv.ParseFloat(r.FormValue("seats"), 64)
		plan := r.FormValue("plan")
		if plan != "starter" && plan != "team" && plan != "scale" {
			plan = "team"
		}
		s.mu.Lock()
		s.settings = Settings{Notify: r.FormValue("notify") != "", Digest: r.FormValue("digest") != "", Seats: min(max(seats, 1), 50), Plan: plan}
		s.mu.Unlock()
		ui.Toast(w, ui.ToastMsg{Title: "Settings saved", Tone: "success"})
		w.WriteHeader(http.StatusNoContent)
	})

	log.Printf("Astabyte UI example on http://localhost%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}

// update runs fn on the member with this id. It returns the member's name and whether fn applied.
func (s *store) update(id string, fn func(*Member) bool) (string, bool) {
	n, _ := strconv.Atoi(id)
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.members {
		if s.members[i].ID == n {
			return s.members[i].Name, fn(&s.members[i])
		}
	}
	return "", false
}

func pageOf(r *http.Request) int {
	p, _ := strconv.Atoi(r.FormValue("page"))
	return p
}

func pageHref(p int) string { return fmt.Sprintf("/?page=%d", p) }

func render(w http.ResponseWriter, r *http.Request, c templ.Component) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := c.Render(r.Context(), w); err != nil {
		log.Printf("render: %v", err)
	}
}
