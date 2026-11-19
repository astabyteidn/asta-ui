package ui

import (
	"strings"
	"testing"
)

func has(t *testing.T, name, html string, want ...string) {
	t.Helper()
	for _, w := range want {
		if !strings.Contains(html, w) {
			t.Errorf("%s: missing %q in\n%s", name, w, html)
		}
	}
}

func TestCopyButtonCarriesValueAndStatus(t *testing.T) {
	h := render(t, CopyButton(CopyButtonProps{Value: "ab_123", Class: "x-copy"}))
	has(t, "copy", h, `data-asta-copy="ab_123"`, `aria-label="Copy"`, `data-asta-copy-status`, "x-copy")
}

func TestSegmentedControlDefaultsToFirst(t *testing.T) {
	h := render(t, SegmentedControl(SegmentedControlProps{Name: "view", Segments: []Segment{{Value: "a", Label: "A"}, {Value: "b", Label: "B"}}}))
	has(t, "segmented", h, `role="radiogroup"`, `data-asta-segmented`, `name="view" value="a" checked`)
	if strings.Contains(h, `value="b" checked`) {
		t.Errorf("segmented: b should not be checked")
	}
}

func TestToggleGroupModes(t *testing.T) {
	opts := []ToggleOption{{Value: "b", Label: "Bold"}, {Value: "i", Label: "Italic"}}
	single := render(t, ToggleGroup(ToggleGroupProps{Name: "s", Options: opts, Value: "i", AllowEmpty: true}))
	has(t, "toggle single", single, `type="radio"`, `data-asta-toggle="single"`, `data-allow-empty`, `value="i" checked`)
	multi := render(t, ToggleGroup(ToggleGroupProps{Name: "m", Options: opts, Multiple: true, Values: []string{"b", "i"}}))
	has(t, "toggle multi", multi, `type="checkbox"`, `role="group"`, `value="b" checked`, `value="i" checked`)
}

func TestNumberInputClampsAndPosts(t *testing.T) {
	h := render(t, NumberInput(NumberInputProps{Name: "n", Value: 50, Min: 1, Max: 10}))
	has(t, "number", h, `type="hidden"`, `name="n"`, `value="10"`, `data-max="10"`, `role="spinbutton"`, `aria-valuenow="10"`)
}

func TestOtpInputBoxes(t *testing.T) {
	h := render(t, OtpInput(OtpInputProps{Name: "code", Length: 4, Value: "12", Error: true}))
	if n := strings.Count(h, "data-asta-otp-box "); n != 4 {
		t.Errorf("otp: %d boxes, want 4", n)
	}
	has(t, "otp", h, `autocomplete="one-time-code"`, `maxlength="4"`, `aria-invalid="true"`, "asta-otp-shake", `name="code"`)
}

func TestPasswordInputRules(t *testing.T) {
	h := render(t, PasswordInput(PasswordInputProps{Name: "pw"}))
	if n := strings.Count(h, "data-asta-password-rule="); n != len(DefaultPasswordRules) {
		t.Errorf("password: %d rules, want %d", n, len(DefaultPasswordRules))
	}
	has(t, "password", h, `type="password"`, `autocomplete="new-password"`, `data-asta-password-toggle`)
}

func TestTagInputPostsEachTag(t *testing.T) {
	h := render(t, TagInput(TagInputProps{Name: "tag", Value: []string{"go", "templ"}, Max: 2}))
	has(t, "tags", h, `name="tag" value="go"`, `name="tag" value="templ"`, "2/2", "Limit reached", "data-asta-tags-tpl")
}

func TestRangeSliderTwoInputs(t *testing.T) {
	h := render(t, RangeSlider(RangeSliderProps{Names: [2]string{"lo", "hi"}, Value: [2]float64{20, 80}}))
	has(t, "range", h, `name="lo"`, `name="hi"`, `value="20"`, `value="80"`, `max="100"`)
}

func TestRatingHalfAndReadOnly(t *testing.T) {
	h := render(t, Rating(RatingProps{Name: "r", Value: 2.5, AllowHalf: true}))
	has(t, "rating", h, `value="2.5" checked`, `data-fill="half"`, `value="0"`)
	ro := render(t, Rating(RatingProps{Value: 4, ReadOnly: true}))
	has(t, "rating ro", ro, `role="img"`)
	if strings.Contains(ro, `type="radio"`) {
		t.Errorf("read-only rating should not render radios")
	}
}

func TestColorPickerCustomValue(t *testing.T) {
	if got := ParseHex("ABC"); got != "#aabbcc" {
		t.Errorf("ParseHex = %q", got)
	}
	if got := ParseHex("nope"); got != "" {
		t.Errorf("ParseHex(nope) = %q", got)
	}
	h := render(t, ColorPicker(ColorPickerProps{Name: "c", Value: "#123456"}))
	has(t, "color", h, `data-asta-color-custom`, `value="#123456" checked`)
}

func TestComboboxSingleAndMultiple(t *testing.T) {
	opts := []ComboboxOption{{Value: "a", Label: "Alpha"}, {Value: "b", Label: "Beta"}}
	s := render(t, Combobox(ComboboxProps{Name: "x", Options: opts, Value: "b"}))
	has(t, "combo", s, `role="combobox"`, `role="listbox"`, `data-asta-combo-value`, `value="b"`, `value="Beta"`)
	m := render(t, Combobox(ComboboxProps{Name: "x", Options: opts, Multiple: true, Values: []string{"a"}}))
	has(t, "combo multi", m, `data-asta-combo="multiple"`, `data-asta-combo-chip="a"`, `name="x" value="a"`)
}

func TestDatePickerFormatsValue(t *testing.T) {
	h := render(t, DatePicker(DatePickerProps{Name: "d", Value: "2026-11-24"}))
	has(t, "date", h, "Nov 24, 2026", `name="d"`, `value="2026-11-24"`, `aria-haspopup="dialog"`)
	r := render(t, DatePicker(DatePickerProps{Name: "r", Range: true}))
	has(t, "date range", r, `data-asta-date="range"`)
}

func TestFileUploadLimits(t *testing.T) {
	if got := FormatBytes(5 << 20); got != "5.0 MB" {
		t.Errorf("FormatBytes = %q", got)
	}
	h := render(t, FileUpload(FileUploadProps{Name: "f", Accept: ".pdf", MaxFiles: 2}))
	has(t, "upload", h, `type="file"`, `name="f"`, `accept=".pdf"`, "multiple", `data-max-files="2"`)
}

func TestInlineEditCarriesSavedValue(t *testing.T) {
	h := render(t, InlineEdit(InlineEditProps{Name: "n", Label: "Name", Value: "Astabyte", Required: true}))
	has(t, "inline", h, `data-saved="Astabyte"`, `name="n"`, `data-required`, `aria-label="Name: Astabyte. Edit"`)
}
