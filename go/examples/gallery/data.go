package main

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	ui "github.com/astabyteidn/asta-ui/go/ui"
)

func init() {
	demoRoutes = append(demoRoutes,
		demoRoute{"GET /demo/data/table", dataTable},
		demoRoute{"POST /demo/data/table/archive", dataArchive},
		demoRoute{"GET /demo/data/calendar", dataCalendar},
		demoRoute{"GET /demo/data/tree/{id}", dataTree},
		demoRoute{"POST /demo/data/kanban", dataKanban},
		demoRoute{"POST /demo/data/star", dataNoContent},
		demoRoute{"POST /demo/data/notifications", dataNoContent},
		demoRoute{"POST /demo/data/comments", dataComment},
		demoRoute{"POST /demo/data/comments/like", dataNoContent},
	)
}

// The demo state lives in memory, shared by everyone viewing the gallery.
var dataMu sync.Mutex

type invoice struct {
	ID, Client, Status string
	Amount             int // cents
	Due                time.Time
}

var dataInvoices = func() []invoice {
	clients := []string{"Northshore Labs", "Kite & Co", "Bluefin Studio", "Harbor Health", "Oak Street Cafe", "Lumen Works", "Pine Analytics", "Riverbank Legal", "Atlas Freight", "Juniper Dental", "Copper Mill", "Saffron Kitchen"}
	status := []string{"Paid", "Open", "Overdue", "Paid", "Draft"}
	base := time.Date(2026, 11, 1, 0, 0, 0, 0, time.UTC)
	out := make([]invoice, 0, 37)
	for i := 0; i < 37; i++ {
		out = append(out, invoice{
			ID:     fmt.Sprintf("INV-%04d", 1040+i),
			Client: clients[(i*7)%len(clients)],
			Status: status[(i*3)%len(status)],
			Amount: 12000 + (i*7919)%480000,
			Due:    base.AddDate(0, 0, (i*5)%45-10),
		})
	}
	return out
}()

// dtView is one page of the invoice table.
type dtView struct {
	q, sort, dir string
	page, total  int
	rows         []invoice
}

const dtPageSize = 8

func dataTableView(r *http.Request) dtView {
	v := dtView{q: strings.TrimSpace(r.URL.Query().Get("q")), sort: r.URL.Query().Get("sort"), dir: r.URL.Query().Get("dir")}
	v.page, _ = strconv.Atoi(r.URL.Query().Get("page"))
	dataMu.Lock()
	rows := make([]invoice, 0, len(dataInvoices))
	for _, inv := range dataInvoices {
		if v.q == "" || strings.Contains(strings.ToLower(inv.Client+" "+inv.ID+" "+inv.Status), strings.ToLower(v.q)) {
			rows = append(rows, inv)
		}
	}
	dataMu.Unlock()
	less := map[string]func(a, b invoice) bool{
		"client": func(a, b invoice) bool { return a.Client < b.Client },
		"amount": func(a, b invoice) bool { return a.Amount < b.Amount },
		"due":    func(a, b invoice) bool { return a.Due.Before(b.Due) },
	}[v.sort]
	if less == nil {
		v.sort, v.dir = "", ""
	} else {
		sort.SliceStable(rows, func(i, j int) bool {
			if v.dir == "desc" {
				return less(rows[j], rows[i])
			}
			return less(rows[i], rows[j])
		})
	}
	v.total = len(rows)
	pages := max(1, (v.total+dtPageSize-1)/dtPageSize)
	v.page = min(max(v.page, 1), pages)
	start := (v.page - 1) * dtPageSize
	v.rows = rows[start:min(start+dtPageSize, v.total)]
	return v
}

func dataTable(w http.ResponseWriter, r *http.Request) {
	dataInvoiceTable(dataTableView(r)).Render(r.Context(), w)
}

// dataArchive removes the selected invoices and shows the table again.
func dataArchive(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	drop := map[string]bool{}
	for _, id := range r.PostForm["ids"] {
		drop[id] = true
	}
	dataMu.Lock()
	kept := dataInvoices[:0:0]
	for _, inv := range dataInvoices {
		if !drop[inv.ID] {
			kept = append(kept, inv)
		}
	}
	if len(kept) > 0 {
		dataInvoices = kept
	}
	dataMu.Unlock()
	ui.Toast(w, ui.ToastMsg{Title: fmt.Sprintf("Archived %d", len(drop)), Tone: "success"})
	dataInvoiceTable(dataTableView(r)).Render(r.Context(), w)
}

func money(cents int) string {
	s := strconv.Itoa(cents / 100)
	for i := len(s) - 3; i > 0; i -= 3 {
		s = s[:i] + "," + s[i:]
	}
	return "$" + s + "." + fmt.Sprintf("%02d", cents%100)
}

// Calendar

func dataCalendar(w http.ResponseWriter, r *http.Request) {
	today := dataToday()
	month, day := ui.CalendarQuery(r.URL.Query(), today)
	dataEventCalendar(month, day, today).Render(r.Context(), w)
}

func dataToday() time.Time {
	n := time.Now().UTC()
	return time.Date(n.Year(), n.Month(), n.Day(), 0, 0, 0, 0, time.UTC)
}

// dataEvents makes a few events for any month, plus two on today.
func dataEvents(month, today time.Time) []ui.CalendarEvent {
	at := func(d int) time.Time { return time.Date(month.Year(), month.Month(), d, 0, 0, 0, 0, time.UTC) }
	ev := []ui.CalendarEvent{
		{ID: "e1", Title: "Design review", Date: at(3), Time: "10:00"},
		{ID: "e2", Title: "Ship v2.4", Date: at(8), Time: "16:00", Accent: true, Note: "Release notes in the wiki"},
		{ID: "e3", Title: "Client call", Date: at(12), Time: "09:30"},
		{ID: "e4", Title: "Team lunch", Date: at(12), Time: "12:30"},
		{ID: "e5", Title: "Quarterly planning", Date: at(17), Time: "13:00", Accent: true},
		{ID: "e6", Title: "Invoice run", Date: at(24), Time: "08:00"},
	}
	if month.Year() == today.Year() && month.Month() == today.Month() {
		ev = append(ev,
			ui.CalendarEvent{ID: "t1", Title: "Standup", Date: today, Time: "09:15"},
			ui.CalendarEvent{ID: "t2", Title: "Astabyte launch prep", Date: today, Time: "15:00", Accent: true, Note: "Final copy check"},
		)
	}
	return ev
}

// Tree

func dataTree(w http.ResponseWriter, r *http.Request) {
	time.Sleep(450 * time.Millisecond) // so the loading row shows
	id := r.PathValue("id")
	nodes := []ui.TreeNode{
		{ID: id + "/htmx", Label: "htmx", Folder: true, ChildrenURL: "/demo/data/tree/" + id + "-htmx"},
		{ID: id + "/templ", Label: "templ", Meta: "v0.3"},
		{ID: id + "/tailwind", Label: "tailwindcss", Meta: "v4.1"},
	}
	ui.TreeItems(ui.TreeItemsProps{Nodes: nodes, Level: 2 + strings.Count(id, "-")}).Render(r.Context(), w)
}

// Kanban

var dataBoard = []ui.KanbanCard{
	{ID: "k1", Column: "todo", Title: "Write the pricing page copy", Tag: "Copy", Assignee: "Maya Chen", Due: "Nov 24"},
	{ID: "k2", Column: "todo", Title: "Audit image sizes", Tag: "Perf", Assignee: "Leo Park"},
	{ID: "k3", Column: "todo", Title: "Dark mode for charts", Tag: "Design", Assignee: "Ana Ruiz", Due: "Nov 28"},
	{ID: "k4", Column: "doing", Title: "Checkout flow in htmx", Tag: "Build", Assignee: "Sam Lee", Due: "Nov 21"},
	{ID: "k5", Column: "doing", Title: "Onboarding emails", Tag: "Copy", Assignee: "Maya Chen"},
	{ID: "k6", Column: "done", Title: "Set up the design tokens", Tag: "Design", Assignee: "Ana Ruiz"},
	{ID: "k7", Column: "done", Title: "Deploy preview builds", Tag: "Ops", Assignee: "Leo Park"},
}

func dataBoardCards() []ui.KanbanCard {
	dataMu.Lock()
	defer dataMu.Unlock()
	return append([]ui.KanbanCard(nil), dataBoard...)
}

// dataKanban moves card to column at position, the way a real handler would.
func dataKanban(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	card, col := r.PostForm.Get("card"), r.PostForm.Get("column")
	pos, _ := strconv.Atoi(r.PostForm.Get("position"))
	dataMu.Lock()
	var moved *ui.KanbanCard
	rest := make([]ui.KanbanCard, 0, len(dataBoard))
	for _, c := range dataBoard {
		if c.ID == card {
			c.Column = col
			moved = &c
		} else {
			rest = append(rest, c)
		}
	}
	if moved != nil {
		at, n := len(rest), 0
		for i, c := range rest {
			if c.Column == col {
				if n == pos {
					at = i
					break
				}
				n++
				at = i + 1
			}
		}
		rest = append(rest[:at], append([]ui.KanbanCard{*moved}, rest[at:]...)...)
		dataBoard = rest
	}
	dataMu.Unlock()
	w.WriteHeader(http.StatusNoContent)
}

// Comments

var dataCommentSeq = 100

func dataComment(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	body := strings.TrimSpace(r.PostForm.Get("body"))
	if body == "" {
		http.Error(w, "empty", http.StatusBadRequest)
		return
	}
	dataMu.Lock()
	dataCommentSeq++
	id := "c" + strconv.Itoa(dataCommentSeq)
	dataMu.Unlock()
	c := ui.Comment{ID: id, Author: dataMe, Time: "now", Body: body, New: true}
	ui.CommentEntry(ui.CommentEntryProps{Comment: c, Parent: r.PostForm.Get("parent"), LikeURL: "/demo/data/comments/like"}).Render(r.Context(), w)
}

var dataMe = ui.CommentAuthor{Name: "Sam Lee"}

func dataNoContent(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }

// Gallery helpers

func dataEmptyRequest() *http.Request {
	r, _ := http.NewRequest("GET", "/demo/data/table", nil)
	return r
}

func dataTone(status string) string {
	switch status {
	case "Paid":
		return "success"
	case "Overdue":
		return "danger"
	case "Open":
		return "accent"
	}
	return "neutral"
}

var dataPalettes = [][3]string{
	{"#2f6bff", "#7aa7ff", "#c9dbff"},
	{"#0f172a", "#2f6bff", "#5b8cff"},
	{"#e8eefc", "#a9c1ff", "#2f6bff"},
	{"#3a3f4b", "#8a93a6", "#d5d9e2"},
}

func dataArtID(n int) string { return "data-art-" + strconv.Itoa(n%len(dataPalettes)) }

func dataNum(n int) string { return strconv.Itoa(n) }

func dataFiles() []ui.TreeNode {
	return []ui.TreeNode{
		{ID: "src", Label: "src", Folder: true, Expanded: true, Children: []ui.TreeNode{
			{ID: "src/app", Label: "app", Folder: true, Expanded: true, Children: []ui.TreeNode{
				{ID: "src/app/page", Label: "page.templ", Meta: "2 KB"},
				{ID: "src/app/layout", Label: "layout.templ", Meta: "1 KB"},
			}},
			{ID: "src/ui", Label: "ui", Folder: true, Children: []ui.TreeNode{
				{ID: "src/ui/button", Label: "button.templ"},
				{ID: "src/ui/table", Label: "table.templ"},
			}},
			{ID: "src/main", Label: "main.go", Meta: "4 KB"},
		}},
		{ID: "vendor", Label: "vendor", Folder: true, ChildrenURL: "/demo/data/tree/vendor"},
		{ID: "readme", Label: "README.md"},
		{ID: "secrets", Label: ".env", Disabled: true},
	}
}

func dataNotes() []ui.Notification {
	now := time.Now()
	return []ui.Notification{
		{ID: "n1", Title: "Maya Chen commented on Pricing page", Body: "Can we try the yearly toggle on the left?", Time: now.Add(-4 * time.Minute), Actor: "Maya Chen"},
		{ID: "n2", Title: "Deploy finished", Body: "astabyte.com is live with build 1042.", Time: now.Add(-52 * time.Minute)},
		{ID: "n3", Title: "Leo Park assigned you a task", Body: "Audit image sizes", Time: now.Add(-3 * time.Hour), Actor: "Leo Park", Read: true},
		{ID: "n4", Title: "Invoice INV-1044 was paid", Time: now.Add(-26 * time.Hour)},
		{ID: "n5", Title: "Ana Ruiz shared Brand guide.pdf", Time: now.Add(-30 * time.Hour), Actor: "Ana Ruiz", Read: true},
	}
}
