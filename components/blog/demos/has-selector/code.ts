// The real code behind the :has() demos. The demos inject these strings, and the post shows them as-is.

export const FIELD_CSS = `.has-field {
  --ease: cubic-bezier(.16, 1, .3, 1);
  --line: color-mix(in srgb, var(--color-ink) 14%, transparent);
}
.has-field .field {
  border-radius: 9px;
  box-shadow: inset 0 0 0 1px var(--line);
  transition: box-shadow 200ms var(--ease);
}

/* The wrapper reacts to the input inside it. */
.has-field .field:has(input:focus-visible) {
  box-shadow: inset 0 0 0 1px var(--color-brand), 0 0 0 3px color-mix(in srgb, var(--color-brand) 18%, transparent);
}
.has-field .field:has(input:user-invalid) {
  box-shadow: inset 0 0 0 1.5px var(--color-ink);
}

/* The hint and the check sit in the wrapper too. */
.has-field .hint,
.has-field .ok {
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 200ms var(--ease), transform 200ms var(--ease);
}
.has-field .field:has(input:user-invalid) + .hint,
.has-field .field:has(input:valid:not(:placeholder-shown)) .ok {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .has-field .hint, .has-field .ok { transform: none; }
}`;

export const FIELD_HTML = `<label class="field">
  <span>Work email</span>
  <input type="email" required placeholder="you@astabyte.com" />
  <span class="ok">✓</span>
</label>
<p class="hint">Use an address like name@company.com</p>`;

export const PLANS_CSS = `.has-plans {
  --ease: cubic-bezier(.16, 1, .3, 1);
  --line: color-mix(in srgb, var(--color-ink) 14%, transparent);
}
.has-plans .plan {
  box-shadow: inset 0 0 0 1px var(--line);
  transition: box-shadow 200ms var(--ease), transform 200ms var(--ease);
}
.has-plans .plan:has(input:checked) {
  box-shadow: inset 0 0 0 2px var(--color-brand);
}
.has-plans .plan:has(input:focus-visible) {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

/* The summary reads the choice from anywhere in the form. */
.has-plans .note {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 250ms var(--ease), transform 250ms var(--ease);
}
.has-plans:has(#plan-team:checked) .note-team,
.has-plans:has(#plan-solo:checked) .note-solo {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .has-plans .note { transform: none; }
}`;

export const BULK_CSS = `.has-bulk {
  --ease: cubic-bezier(.16, 1, .3, 1);
  counter-reset: picked;
}
.has-bulk tr:has(input:checked) {
  background: color-mix(in srgb, var(--color-brand) 7%, transparent);
}

/* Count the picked rows with a CSS counter. No JavaScript. */
.has-bulk tbody input:checked {
  counter-increment: picked;
}
.has-bulk .count::before {
  content: counter(picked) " selected";
}

/* The action bar only appears once a row is picked. */
.has-bulk .bar {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 250ms var(--ease), transform 250ms var(--ease);
}
.has-bulk:has(tbody input:checked) .bar {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

/* No :has()? Keep the bar visible so the actions still work. */
@supports not selector(:has(*)) {
  .has-bulk .bar { opacity: 1; transform: none; pointer-events: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .has-bulk .bar { transform: none; }
}`;
