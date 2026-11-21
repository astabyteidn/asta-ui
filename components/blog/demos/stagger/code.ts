// The real code behind the stagger demos. The demos inject these strings, and the post shows them as-is.

export const LIST_CSS = `.stg-list li {
  animation: stg-list-in 300ms var(--ease) both;
  /* Row 0 starts at once, row 1 one step later, and so on. */
  animation-delay: calc(var(--i) * var(--step));
}
@keyframes stg-list-in {
  from { opacity: 0; transform: translateY(8px); }
}

@media (prefers-reduced-motion: reduce) {
  .stg-list li { animation-name: stg-list-fade; animation-delay: 0ms; }
}
@keyframes stg-list-fade {
  from { opacity: 0; }
}`;

export const LIST_TSX = `<ul className="stg-list" style={{ "--step": "40ms" }}>
  {rows.map((row, i) => (
    <li key={row.id} style={{ "--i": i }}>…</li>
  ))}
</ul>`;

export const ORDER_CSS = `/* Header, then content, then actions. 60ms apart. */
.stg-order [data-part] {
  animation: stg-order-in 300ms var(--ease) both;
  animation-delay: var(--at);
}
.stg-order [data-part="header"]  { --at: 0ms; }
.stg-order [data-part="content"] { --at: 60ms; }
.stg-order [data-part="actions"] { --at: 120ms; }

/* "All at once" mode, for comparison. */
.stg-order[data-mode="all"] [data-part] { --at: 0ms; }

@keyframes stg-order-in {
  from { opacity: 0; transform: translateY(6px); }
}

@media (prefers-reduced-motion: reduce) {
  .stg-order [data-part] { animation: none; }
}`;

export const CAP_CSS = `.stg-cap li {
  animation: stg-cap-in 300ms var(--ease) both;
  /* Only the first 6 items wait. Everything after
     starts with item 6, so the wait is never over 300ms. */
  animation-delay: calc(min(var(--i), var(--cap, 6)) * 50ms);
}
@keyframes stg-cap-in {
  from { opacity: 0; transform: scale(.94); }
}

@media (prefers-reduced-motion: reduce) {
  .stg-cap li { animation: none; }
}`;
