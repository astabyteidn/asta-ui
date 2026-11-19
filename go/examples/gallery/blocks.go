package main

import (
	"fmt"
	"net/http"
	"net/mail"
	"strings"
	"sync"
	"time"

	"github.com/astabyteidn/asta-ui/go/ui"
)

// In-memory demo state for the blocks section. One shared copy per process is enough for a gallery.

var blkMu sync.Mutex

func init() {
	demoRoutes = append(demoRoutes,
		demoRoute{"POST /demo/blocks/chat", blkChat},
		demoRoute{"GET /demo/blocks/chat/stream", blkChatStream},
		demoRoute{"POST /demo/blocks/sign-in", blkSignIn},
		demoRoute{"POST /demo/blocks/onboarding", blkOnboarding},
		demoRoute{"POST /demo/blocks/checkout", blkCheckout},
		demoRoute{"POST /demo/blocks/checkout/quote", blkCheckoutQuote},
		demoRoute{"POST /demo/blocks/settings", blkSettings},
		demoRoute{"POST /demo/blocks/properties", blkProperties},
		demoRoute{"POST /demo/blocks/team/{action}", blkTeam},
	)
}

/* ---------- AI chat ---------- */

var blkReplies = map[string]string{
	"summarise": "This week the team shipped the new checkout, fixed two sign-in bugs and closed 14 support tickets. Conversion is up 3% on last week.",
	"draft":     "Hi there, thanks for trying Astabyte. Your workspace is ready. Reply to this email if anything feels off and we'll help.",
	"explain":   "htmx sends your message with a normal POST, then appends the reply to the list. The words you see arrive over Server-Sent Events.",
}

func blkReply(q string) string {
	l := strings.ToLower(q)
	for k, v := range blkReplies {
		if strings.Contains(l, k) {
			return v
		}
	}
	return "You asked: “" + q + "”. This is a demo, so the answer is canned, but it streams in the same way a real model's would."
}

func blkChat(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.FormValue("prompt"))
	if q == "" {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	stream := "/demo/blocks/chat/stream?q=" + urlQuery(q)
	_ = ui.AIChatMessages(ui.AIChatMessage{Role: "assistant", Stream: stream}).Render(r.Context(), w)
}

func blkChatStream(w http.ResponseWriter, r *http.Request) {
	f, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	words := strings.SplitAfter(blkReply(r.URL.Query().Get("q")), " ")
	time.Sleep(350 * time.Millisecond)
	for _, word := range words {
		select {
		case <-r.Context().Done():
			return
		case <-time.After(45 * time.Millisecond):
		}
		fmt.Fprintf(w, "data: %s\n\n", word)
		f.Flush()
	}
	fmt.Fprint(w, "event: done\ndata: \n\n")
	f.Flush()
}

func urlQuery(s string) string {
	r := strings.NewReplacer("%", "%25", "&", "%26", "+", "%2B", " ", "+", "#", "%23", "?", "%3F", "=", "%3D")
	return r.Replace(s)
}

/* ---------- Sign-in ---------- */

func blkSignInProps() ui.SignInProps {
	return ui.SignInProps{
		Subtitle:   "Use any email and the password astabyte.",
		Action:     "/demo/blocks/sign-in",
		ForgotHref: "#sign-in",
		SignUpHref: "#sign-in",
		Remember:   true,
		Providers: []ui.SignInProvider{
			{Name: "google", Href: "#sign-in"},
			{Name: "github", Href: "#sign-in"},
		},
		SignOutHref: "/#blocks-sign-in",
	}
}

func blkSignIn(w http.ResponseWriter, r *http.Request) {
	p := blkSignInProps()
	p.Email = strings.TrimSpace(r.FormValue("email"))
	p.RememberChecked = r.FormValue("remember") != ""
	pw := r.FormValue("password")
	errs := map[string]string{}
	if _, err := mail.ParseAddress(p.Email); err != nil || !strings.Contains(p.Email, "@") {
		errs["email"] = "Enter a valid email."
	}
	if len(pw) < 8 {
		errs["password"] = "Use at least 8 characters."
	}
	if len(errs) == 0 && pw != "astabyte" {
		errs["form"] = "That email and password don't match."
	}
	time.Sleep(400 * time.Millisecond)
	if len(errs) > 0 {
		p.Errors = errs
	} else {
		p.Done = true
	}
	_ = ui.SignIn(p).Render(r.Context(), w)
}

/* ---------- Onboarding ---------- */

var blkSteps = []ui.OnboardingStep{
	{ID: "profile", Title: "Add your profile", Description: "A name and photo help your team know who's who.", Action: "Save profile", Duration: "1 min"},
	{ID: "invite", Title: "Invite your team", Description: "Astabyte works best with the people you build with. Invite as many as you like.", Action: "Send invites", Duration: "2 min"},
	{ID: "project", Title: "Create a project", Description: "Start from a template or a blank page. You can rename it later.", Action: "Create project", Duration: "1 min"},
	{ID: "connect", Title: "Connect GitHub", Description: "Link a repository to preview every pull request.", Action: "Connect", Duration: "30 sec"},
}

var blkDone = map[string]bool{"profile": true}

func blkOnboardingProps() ui.OnboardingProps {
	blkMu.Lock()
	defer blkMu.Unlock()
	steps := make([]ui.OnboardingStep, len(blkSteps))
	cur := ""
	for i, s := range blkSteps {
		s.Done = blkDone[s.ID]
		if !s.Done && cur == "" {
			cur = s.ID
		}
		steps[i] = s
	}
	return ui.OnboardingProps{
		Title:       "Get started with Astabyte",
		Subtitle:    "Four steps and your workspace is ready.",
		Steps:       steps,
		Current:     cur,
		Action:      "/demo/blocks/onboarding",
		FinishHref:  "#blocks-onboarding",
		FinishLabel: "Open workspace",
	}
}

func blkOnboarding(w http.ResponseWriter, r *http.Request) {
	step := r.FormValue("step")
	time.Sleep(350 * time.Millisecond)
	blkMu.Lock()
	if step == "reset" {
		blkDone = map[string]bool{}
	} else {
		blkDone[step] = true
	}
	blkMu.Unlock()
	_ = ui.Onboarding(blkOnboardingProps()).Render(r.Context(), w)
}

/* ---------- Checkout ---------- */

func blkCheckoutProps() ui.CheckoutProps {
	return ui.CheckoutProps{
		Action:      "/demo/blocks/checkout",
		QuoteAction: "/demo/blocks/checkout/quote",
		Items: []ui.CheckoutItem{
			{ID: "tee", Name: "Astabyte tee", Variant: "Oat · M", Price: 32, Qty: 1},
			{ID: "cap", Name: "Field cap", Variant: "Black", Price: 24, Qty: 2},
		},
		TaxRate: 0.11,
		Values:  map[string]string{"country": "ID", "shipping": "standard"},
	}
}

// blkPromo applies the demo promo code WELCOME10.
func blkPromo(r *http.Request, p ui.CheckoutProps) ui.CheckoutProps {
	code := strings.ToUpper(strings.TrimSpace(r.FormValue("promo")))
	switch code {
	case "":
	case "WELCOME10":
		p.PromoCode, p.PromoRate = code, 0.10
	default:
		p.PromoMessage = "That code isn't valid. Try WELCOME10."
	}
	return p
}

func blkCheckoutQuote(w http.ResponseWriter, r *http.Request) {
	p := blkPromo(r, ui.CheckoutRead(r, blkCheckoutProps()))
	_ = ui.CheckoutSummary(p).Render(r.Context(), w)
}

func blkCheckout(w http.ResponseWriter, r *http.Request) {
	p := blkPromo(r, ui.CheckoutRead(r, blkCheckoutProps()))
	v := p.Values
	errs := map[string]string{}
	if _, err := mail.ParseAddress(v["email"]); err != nil {
		errs["email"] = "Enter a valid email."
	}
	for k, msg := range map[string]string{"name": "Enter your name.", "address": "Enter a street address.", "city": "Enter a city.", "postal": "Enter a postal code."} {
		if v[k] == "" {
			errs[k] = msg
		}
	}
	if n := strings.ReplaceAll(v["cardNumber"], " ", ""); len(n) < 15 {
		errs["cardNumber"] = "Enter the full card number."
	}
	if len(strings.ReplaceAll(v["cardExpiry"], " ", "")) != 5 {
		errs["cardExpiry"] = "Use MM / YY."
	}
	if len(v["cardCvc"]) < 3 {
		errs["cardCvc"] = "3 or 4 digits."
	}
	time.Sleep(600 * time.Millisecond)
	if len(errs) > 0 {
		p.Errors = errs
	} else {
		p.Done = true
	}
	_ = ui.Checkout(p).Render(r.Context(), w)
}

/* ---------- Settings and properties ---------- */

func blkSettings(w http.ResponseWriter, r *http.Request) {
	time.Sleep(500 * time.Millisecond)
	ui.Toast(w, ui.ToastMsg{Title: "Settings saved", Tone: "success"})
	w.WriteHeader(http.StatusNoContent)
}

func blkProperties(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	name := r.Header.Get("HX-Trigger-Name")
	desc := ""
	if name != "" {
		desc = name + " = " + r.FormValue(name)
	}
	ui.Toast(w, ui.ToastMsg{Title: "Layer updated", Description: desc, Duration: 1600})
	w.WriteHeader(http.StatusNoContent)
}

/* ---------- Team members ---------- */

var (
	blkMembers = []ui.TeamMember{
		{ID: "m1", Name: "Nadia Putri", Email: "nadia@astabyte.com", Role: "owner", You: true},
		{ID: "m2", Name: "Rafi Hakim", Email: "rafi@astabyte.com", Role: "admin"},
		{ID: "m3", Name: "Dewi Lestari", Email: "dewi@astabyte.com", Role: "member"},
		{ID: "m4", Name: "Bima Santoso", Email: "bima@astabyte.com", Role: "viewer"},
	}
	blkInvites = []ui.TeamInvite{
		{ID: "i1", Email: "sari@astabyte.com", Role: "member", Sent: "2d ago"},
	}
	blkInviteN = 1
)

func blkTeamProps() ui.TeamMembersProps {
	return ui.TeamMembersProps{
		ID:           "team",
		Members:      append([]ui.TeamMember(nil), blkMembers...),
		Invites:      append([]ui.TeamInvite(nil), blkInvites...),
		InviteAction: "/demo/blocks/team/invite",
		RoleAction:   "/demo/blocks/team/role",
		RemoveAction: "/demo/blocks/team/remove",
		UndoAction:   "/demo/blocks/team/undo",
		ResendAction: "/demo/blocks/team/resend",
		RevokeAction: "/demo/blocks/team/revoke",
	}
}

func blkTeam(w http.ResponseWriter, r *http.Request) {
	blkMu.Lock()
	// A removed person stays restorable only for the one answer that shows Undo.
	kept := blkMembers[:0]
	for _, m := range blkMembers {
		if !m.Removed {
			kept = append(kept, m)
		}
	}
	member, invite := r.FormValue("member"), r.FormValue("invite")
	if r.PathValue("action") == "undo" {
		if blkLastRemoved != nil && blkLastRemoved.ID == member {
			at := min(blkLastIndex, len(kept))
			kept = append(kept[:at], append([]ui.TeamMember{*blkLastRemoved}, kept[at:]...)...)
			blkLastRemoved = nil
		}
	}
	blkMembers = kept
	var resent string
	var newInvites map[string]bool
	errMsg, okMsg, emailsBack := "", "", ""
	switch r.PathValue("action") {
	case "role":
		for i := range blkMembers {
			if blkMembers[i].ID == member && !blkMembers[i].You {
				blkMembers[i].Role = r.FormValue("role")
			}
		}
	case "remove":
		for i, m := range blkMembers {
			if m.ID == member && !m.You {
				cp := m
				blkLastRemoved = &cp
				blkLastIndex = i
				m.Removed = true
				blkMembers[i] = m
			}
		}
	case "resend":
		resent = invite
	case "revoke":
		out := blkInvites[:0]
		for _, inv := range blkInvites {
			if inv.ID != invite {
				out = append(out, inv)
			}
		}
		blkInvites = out
	case "invite":
		raw := r.FormValue("emails")
		role := r.FormValue("role")
		fields := strings.FieldsFunc(raw, func(c rune) bool { return c == ',' || c == ' ' || c == '\n' || c == ';' })
		var add []string
		for _, e := range fields {
			e = strings.ToLower(strings.TrimSpace(e))
			if _, err := mail.ParseAddress(e); err != nil || !strings.Contains(e, "@") {
				errMsg = e + " doesn't look like an email."
				break
			}
			for _, m := range blkMembers {
				if m.Email == e {
					errMsg = e + " is already on the team."
				}
			}
			for _, inv := range blkInvites {
				if inv.Email == e {
					errMsg = e + " already has an invite."
				}
			}
			if errMsg != "" {
				break
			}
			add = append(add, e)
		}
		if len(fields) == 0 {
			errMsg = "Add at least one email."
		}
		if errMsg != "" {
			emailsBack = raw
		} else {
			newInvites = map[string]bool{}
			for _, e := range add {
				blkInviteN++
				id := fmt.Sprintf("i%d", blkInviteN)
				blkInvites = append(blkInvites, ui.TeamInvite{ID: id, Email: e, Role: role, Sent: "just now"})
				newInvites[id] = true
			}
			label := map[string]string{"owner": "Owner", "admin": "Admin", "member": "Member", "viewer": "Viewer"}[role]
			okMsg = fmt.Sprintf("Invited %d %s as %s.", len(add), map[bool]string{true: "person", false: "people"}[len(add) == 1], label)
		}
	}
	p := blkTeamProps()
	p.InviteError, p.InviteMessage, p.InviteEmails = errMsg, okMsg, emailsBack
	if r.PathValue("action") == "invite" {
		p.InviteRole = r.FormValue("role")
	}
	for i := range p.Invites {
		p.Invites[i].Resent = p.Invites[i].ID == resent
		p.Invites[i].New = newInvites[p.Invites[i].ID]
	}
	blkMu.Unlock()
	time.Sleep(250 * time.Millisecond)
	_ = ui.TeamMembers(p).Render(r.Context(), w)
}

var (
	blkLastRemoved *ui.TeamMember
	blkLastIndex   int
)
