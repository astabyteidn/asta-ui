// The real code behind the duration demos. The demos inject these strings, and the post shows them as-is.

export const DRAWER_CSS = `.dur-drawer .scrim {
  opacity: 0;
  transition: opacity var(--dur) var(--ease);
}
.dur-drawer .sheet {
  transform: translateX(104%);
  transition: transform var(--dur) var(--ease);
}
.dur-drawer[data-open="true"] .scrim { opacity: 1; }
.dur-drawer[data-open="true"] .sheet { transform: none; }

@media (prefers-reduced-motion: reduce) {
  .dur-drawer .sheet { transition: opacity 150ms linear; transform: none; opacity: 0; }
  .dur-drawer[data-open="true"] .sheet { opacity: 1; }
}`;

export const DRAWER_TSX = `const [open, setOpen] = useState(false);
const [dur, setDur] = useState(200); // ms, from the slider

<div
  className="dur-drawer"
  data-open={open}
  style={{ "--dur": \`\${dur}ms\`, "--ease": "cubic-bezier(.16, 1, .3, 1)" }}
>
  <button onClick={() => setOpen(true)}>Cart</button>
  <div className="scrim" onClick={() => setOpen(false)} />
  <aside className="sheet">…</aside>
</div>`;

export const DISTANCE_CSS = `/* Each piece gets a time that fits how far it travels. */
.dur-dist .tip   { --d: 150ms; transform: translateY(4px); }
.dur-dist .menu  { --d: 200ms; transform: translateY(-8px) scale(.96); }
.dur-dist .sheet { --d: 300ms; transform: translateX(104%); }

.dur-dist .tip,
.dur-dist .menu,
.dur-dist .sheet {
  opacity: 0;
  transition:
    opacity var(--d) var(--ease),
    transform var(--d) var(--ease);
}
/* "Same 300ms" mode: one duration for everything. */
.dur-dist[data-same="true"] :is(.tip, .menu, .sheet) { --d: 300ms; }

.dur-dist[data-open="true"] :is(.tip, .menu, .sheet) {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .dur-dist :is(.tip, .menu, .sheet) { transform: none; transition: opacity 150ms linear; }
}`;

export const EXIT_CSS = `.dur-exit .card {
  opacity: 0;
  transform: translateY(8px) scale(.97);
  /* Leaving: two thirds of the entrance. */
  transition:
    opacity var(--exit) var(--ease),
    transform var(--exit) var(--ease);
}
.dur-exit[data-open="true"] .card {
  opacity: 1;
  transform: none;
  /* Entering: the full 300ms. */
  transition-duration: 300ms;
}

@media (prefers-reduced-motion: reduce) {
  .dur-exit .card,
  .dur-exit[data-open="true"] .card { transform: none; transition-duration: 150ms; }
}`;
