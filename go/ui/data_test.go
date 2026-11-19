package ui

import (
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestMonthGridStartsOnWeekStart(t *testing.T) {
	nov := time.Date(2026, 11, 19, 15, 0, 0, 0, time.UTC) // Nov 1 2026 is a Sunday
	for _, ws := range []time.Weekday{time.Monday, time.Sunday} {
		days := MonthGrid(nov, ws)
		if len(days) != 42 {
			t.Fatalf("got %d days, want 42", len(days))
		}
		if days[0].Weekday() != ws {
			t.Errorf("week start %v: grid starts on %v", ws, days[0].Weekday())
		}
		if days[0].After(time.Date(2026, 11, 1, 0, 0, 0, 0, time.UTC)) {
			t.Errorf("grid starts after the 1st: %v", days[0])
		}
	}
	if d := MonthGrid(nov, time.Monday)[0]; d.Format("2006-01-02") != "2026-10-26" {
		t.Errorf("Monday grid starts %s, want 2026-10-26", d.Format("2006-01-02"))
	}
}

func TestCalendarQuery(t *testing.T) {
	today := time.Date(2026, 11, 19, 0, 0, 0, 0, time.UTC)
	m, d := CalendarQuery(url.Values{"month": {"2027-02"}}, today)
	if m.Format("2006-01") != "2027-02" || d.Format("2006-01-02") != "2027-02-01" {
		t.Errorf("month=2027-02: got %v %v", m, d)
	}
	m, d = CalendarQuery(url.Values{"day": {"2026-12-05"}}, today)
	if m.Format("2006-01") != "2026-12" || d.Day() != 5 {
		t.Errorf("day=2026-12-05: got %v %v", m, d)
	}
	m, _ = CalendarQuery(url.Values{"month": {"junk"}}, today)
	if m.Format("2006-01") != "2026-11" {
		t.Errorf("bad month should fall back to today, got %v", m)
	}
}

func TestEventCalendarRendersMonth(t *testing.T) {
	html := render(t, EventCalendar(EventCalendarProps{
		ID: "cal", Month: time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC), Today: time.Date(2026, 2, 10, 0, 0, 0, 0, time.UTC),
		Events: []CalendarEvent{{ID: "a", Title: "Launch", Date: time.Date(2026, 2, 10, 0, 0, 0, 0, time.UTC)}},
	}))
	if n := strings.Count(html, `role="gridcell"`); n != 42 {
		t.Errorf("got %d cells, want 42", n)
	}
	for _, want := range []string{`data-day="2026-02-10"`, `aria-current="date"`, "Launch", `data-asta-cal-panel="2026-02-28"`} {
		if !strings.Contains(html, want) {
			t.Errorf("missing %s", want)
		}
	}
}

func TestDataTableHrefAndSortCycle(t *testing.T) {
	p := DataTableProps{ID: "t", URL: "/invoices", Params: url.Values{"status": {"open"}}}
	if got := DataTableHref(p, "kite", "client", "desc", 2); got != "/invoices?dir=desc&page=2&q=kite&sort=client&status=open" {
		t.Errorf("got %s", got)
	}
	if got := DataTableHref(DataTableProps{URL: "/x"}, "", "", "desc", 1); got != "/x" {
		t.Errorf("empty state: got %s", got)
	}
	html := render(t, DataTable(DataTableProps{ID: "t", URL: "/invoices", Sort: "client", Dir: "asc", Total: 0,
		Columns: []DataTableColumn{{Key: "client", Header: "Client", Sortable: true}}}))
	if !strings.Contains(html, `sort=client`) || !strings.Contains(html, `dir=desc`) {
		t.Error("ascending column should link to descending")
	}
	if !strings.Contains(html, `hx-select="#t"`) {
		t.Error("table should select itself from the response")
	}
}

func TestDataTableRowSelection(t *testing.T) {
	html := render(t, DataTable(DataTableProps{ID: "t", Selectable: true, SelectName: "pick", Total: 1, Columns: []DataTableColumn{{Key: "a", Header: "A"}}}))
	if !strings.Contains(html, "data-asta-dt-all") {
		t.Error("missing select-all")
	}
	row := render(t, DataTableRow(DataTableRowProps{ID: "r1"}))
	if strings.Contains(row, `type="checkbox"`) {
		t.Error("a row outside a selectable table should have no checkbox")
	}
}

func TestTreeViewLazyChildren(t *testing.T) {
	html := render(t, TreeView(TreeViewProps{Nodes: []TreeNode{
		{ID: "a", Label: "A", Folder: true, ChildrenURL: "/kids/a"},
		{ID: "b", Label: "B"},
	}, Selected: "b"}))
	for _, want := range []string{`role="tree"`, `hx-get="/kids/a"`, `hx-trigger="asta:expand once"`, `aria-expanded="false"`, `aria-selected="true"`} {
		if !strings.Contains(html, want) {
			t.Errorf("missing %s", want)
		}
	}
}

func TestKanbanMovePost(t *testing.T) {
	html := render(t, Kanban(KanbanProps{ID: "k", MoveURL: "/move",
		Columns: []KanbanColumn{{ID: "todo", Title: "To do"}},
		Cards:   []KanbanCard{{ID: "c1", Column: "todo", Title: "Card"}}}))
	for _, want := range []string{`hx-post="/move"`, `hx-trigger="asta:move"`, `data-asta-kanban-card="c1"`, `draggable="true"`, `name="position"`} {
		if !strings.Contains(html, want) {
			t.Errorf("missing %s", want)
		}
	}
}

func TestNotificationCenterGroupsAndCounts(t *testing.T) {
	now := time.Date(2026, 11, 19, 12, 0, 0, 0, time.UTC)
	html := render(t, NotificationCenter(NotificationCenterProps{Now: now, MarkReadURL: "/read", Notifications: []Notification{
		{ID: "1", Title: "One", Time: now.Add(-5 * time.Minute)},
		{ID: "2", Title: "Two", Time: now.Add(-25 * time.Hour), Read: true},
	}}))
	for _, want := range []string{"Today", "Yesterday", "5m", `aria-label="Notifications, 1 unread"`, `hx-post="/read"`} {
		if !strings.Contains(html, want) {
			t.Errorf("missing %s", want)
		}
	}
}

func TestMotionButtonConfirm(t *testing.T) {
	html := render(t, MotionButton(MotionButtonProps{Variant: "confirm", Timeout: 100}))
	if !strings.Contains(html, `data-stage="idle"`) || !strings.Contains(html, `data-timeout="500"`) {
		t.Errorf("confirm should start idle with a 500ms floor: %s", html)
	}
}
