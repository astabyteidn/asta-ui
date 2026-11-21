// The real code behind the container query demos. The demos inject these strings, and the post shows them as-is.

export const CARD_CSS = `/* The slot is the container. The card inside asks how wide it is. */
.cq-slot {
  container: card / inline-size;
}

/* Default: the narrow layout. Old browsers get this one. */
.cq-card {
  display: grid;
  gap: 12px;
}
.cq-card .media { aspect-ratio: 16 / 9; }
.cq-card .desc,
.cq-card .specs { display: none; }

/* 360px and up: image beside the text. */
@container card (min-width: 360px) {
  .cq-card { grid-template-columns: 112px 1fr; align-items: start; }
  .cq-card .media { aspect-ratio: 1; }
  .cq-card .desc { display: block; }
}

/* 560px and up: bigger image, specs, price and button on one row. */
@container card (min-width: 560px) {
  .cq-card { grid-template-columns: 200px 1fr; gap: 20px; }
  .cq-card .specs { display: flex; }
  .cq-card .buy { flex-direction: row; align-items: center; justify-content: space-between; }
}`;

export const CHIPS_CSS = `/* The labels live in the same container, so CSS picks the active one. */
.cq-chips .compact { color: var(--color-brand); }
@container card (min-width: 360px) {
  .cq-chips .compact { color: inherit; }
  .cq-chips .row { color: var(--color-brand); }
}
@container card (min-width: 560px) {
  .cq-chips .row { color: inherit; }
  .cq-chips .wide { color: var(--color-brand); }
}`;

export const SLOTS_TSX = `// One component. Two slots. No props for "compact" or "wide".
<aside className="cq-slot">
  <ProductCard />
</aside>

<main className="cq-slot">
  <ProductCard />
</main>`;

export const UNITS_CSS = `.cq-stats {
  container-type: inline-size;
}

/* 1cqi = 1% of the container's width. */
.cq-stat {
  padding: clamp(12px, 6cqi, 32px);
  border-radius: clamp(8px, 3cqi, 16px);
}
.cq-stat .value {
  font-size: clamp(1.5rem, 11cqi, 3.5rem);
  line-height: 1;
}
.cq-stat .label {
  font-size: clamp(.75rem, 3.2cqi, 1rem);
}`;
