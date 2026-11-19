package ui

import (
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func mustContain(t *testing.T, html string, want ...string) {
	t.Helper()
	for _, w := range want {
		if !strings.Contains(html, w) {
			t.Errorf("missing %q in:\n%s", w, html)
		}
	}
}

func TestSignInPostsAndShowsErrors(t *testing.T) {
	html := render(t, SignIn(SignInProps{Action: "/login", Email: "a@b.co", Errors: map[string]string{"password": "Too short.", "form": "No match."}, Class: "x-sign"}))
	mustContain(t, html, `id="sign-in"`, `hx-post="/login"`, `hx-target="#sign-in"`, `hx-swap="outerHTML"`, `value="a@b.co"`, "Too short.", "No match.", `data-asta-reveal`, "x-sign")
	done := render(t, SignIn(SignInProps{Action: "/login", Email: "a@b.co", Done: true}))
	if strings.Contains(done, "<form") {
		t.Error("done state should not render the form")
	}
	mustContain(t, done, "a@b.co")
}

func TestOnboardingIsServerDriven(t *testing.T) {
	html := render(t, Onboarding(OnboardingProps{Action: "/steps", Current: "b", Steps: []OnboardingStep{{ID: "a", Title: "One", Done: true}, {ID: "b", Title: "Two"}}}))
	mustContain(t, html, `hx-post="/steps"`, `{&#34;step&#34;:&#34;b&#34;}`, `data-asta-onboarding`, `id="onboarding-bar"`)
	all := render(t, Onboarding(OnboardingProps{Action: "/steps", Steps: []OnboardingStep{{ID: "a", Title: "One", Done: true}}}))
	mustContain(t, all, "data-asta-onboarding-done")
}

func TestPricingTogglesWithoutServer(t *testing.T) {
	html := render(t, Pricing(PricingProps{Plans: []PricingPlan{{Name: "Team", Monthly: 24, Yearly: 19}}, Yearly: true}))
	mustContain(t, html, `data-asta-pricing`, `type="radio"`, `value="yearly" checked`, `data-asta-pricing-pill`)
	if strings.Contains(html, "hx-") {
		t.Error("pricing should not talk to the server")
	}
}

func TestAIChatComposer(t *testing.T) {
	html := render(t, AIChat(AIChatProps{Action: "/chat", Suggestions: []string{"Hi"}, Messages: []AIChatMessage{{Role: "user", Content: "<b>x</b>"}}}))
	mustContain(t, html, `hx-post="/chat"`, `hx-target="#ai-chat-list"`, `hx-swap="beforeend"`, `name="prompt"`, `data-asta-chat-suggest="Hi"`, `&lt;b&gt;x&lt;/b&gt;`, `template data-asta-chat-pending`)
	poll := render(t, AIChatMessages(AIChatMessage{Role: "assistant", Content: "Hel", Poll: "/chat/1"}))
	mustContain(t, poll, `hx-get="/chat/1"`, `hx-swap="outerHTML"`)
	sse := render(t, AIChatMessages(AIChatMessage{Role: "assistant", Stream: "/chat/sse"}))
	mustContain(t, sse, `data-asta-chat-stream="/chat/sse"`)
}

func TestCheckoutTotalsAndRead(t *testing.T) {
	p := CheckoutProps{Action: "/pay", QuoteAction: "/quote", Items: []CheckoutItem{{ID: "a", Name: "Tee", Price: 10, Qty: 1}}, TaxRate: 0.1, PromoRate: 0.5}
	form := url.Values{"qty_a": {"300"}, "shipping": {"express"}, "email": {" a@b.co "}}
	r := httptest.NewRequest("POST", "/pay", strings.NewReader(form.Encode()))
	r.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	p = CheckoutRead(r, p)
	if p.Items[0].Qty != 99 || p.Values["email"] != "a@b.co" {
		t.Fatalf("read: qty %d email %q", p.Items[0].Qty, p.Values["email"])
	}
	tot := p.Totals()
	// 990 subtotal, 495 off, 14 express, 49.5 tax.
	if tot.Subtotal != 990 || tot.Discount != 495 || tot.Shipping != 14 || tot.Tax != 49.5 || tot.Total != 558.5 {
		t.Fatalf("totals %+v", tot)
	}
	html := render(t, Checkout(p))
	mustContain(t, html, `hx-post="/pay"`, `hx-post="/quote"`, `hx-trigger="asta:recalc"`, "$558.50", `name="qty_a"`)
	sum := render(t, CheckoutSummary(p))
	mustContain(t, sum, `hx-swap-oob="true"`, `id="checkout-summary"`)
}

func TestPropertiesPanel(t *testing.T) {
	html := render(t, PropertiesPanel(PropertiesPanelProps{Action: "/layer", Title: "Hero"}))
	mustContain(t, html, `hx-trigger="change"`, `hx-swap="none"`, "Hero")
	num := render(t, PropNumber(PropNumberProps{Name: "x", Label: "X", Value: 1.25, Precision: 1, HasMin: true}))
	mustContain(t, num, `name="x"`, `value="1.2"`, `data-min="0.000000"`, `data-asta-prop-scrub`)
	if strings.Contains(num, "data-max") {
		t.Error("no max set")
	}
	for in, want := range map[string]string{"#ABC": "#aabbcc", "2f54eb": "#2f54eb", "zzz": "#000000", "": "#000000"} {
		if got := propHex(in); got != want {
			t.Errorf("propHex(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestSettingsPanel(t *testing.T) {
	bar := render(t, SettingsPanel(SettingsPanelProps{Action: "/s"}))
	mustContain(t, bar, `id="settings"`, `hx-post="/s"`, `data-asta-settings-bar`, `type="reset"`)
	auto := render(t, SettingsPanel(SettingsPanelProps{Action: "/s", AutoSave: true}))
	mustContain(t, auto, `data-autosave`, `hx-trigger="change"`)
	if strings.Contains(auto, "data-asta-settings-bar") {
		t.Error("autosave has no bar")
	}
}

func TestTeamMembers(t *testing.T) {
	p := TeamMembersProps{
		Members:      []TeamMember{{ID: "1", Name: "Nadia Putri", Role: "owner", You: true}, {ID: "2", Name: "Rafi Hakim", Role: "member"}, {ID: "3", Name: "Dewi", Removed: true}},
		Invites:      []TeamInvite{{ID: "i1", Email: "s@a.co", Role: "viewer", Sent: "2d ago"}},
		InviteAction: "/invite", RoleAction: "/role", RemoveAction: "/remove", UndoAction: "/undo", RevokeAction: "/revoke",
		InviteError: "Bad email.",
	}
	html := render(t, TeamMembers(p))
	mustContain(t, html, `id="team"`, "2 members · 1 pending", `hx-post="/role"`, `{&#34;member&#34;:&#34;2&#34;}`, `hx-post="/undo"`, "Removed", "Bad email.", "Viewer · Sent 2d ago", `hx-post="/revoke"`, "asta-blk-count 5s")
	// The signed-in person can't change their own role.
	if strings.Count(html, `hx-post="/role"`) != 1 {
		t.Error("role picker should only post for other members")
	}
}
