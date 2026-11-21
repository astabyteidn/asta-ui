// The real code behind the FLIP demos. The demos run the same functions (see ./demos.tsx), and the post shows these strings.

export const FLIP_TS = `const EASE = "cubic-bezier(.16, 1, .3, 1)";

// First: read where every item is now, before the change.
export function measure(list: HTMLElement) {
  const rects = new Map<string, DOMRect>();
  for (const el of Array.from(list.children) as HTMLElement[]) {
    rects.set(el.dataset.id!, el.getBoundingClientRect());
  }
  return rects;
}

// Last, Invert, Play: call right after the DOM changed.
export function play(list: HTMLElement, first: Map<string, DOMRect>, duration = 500) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = Array.from(list.children) as HTMLElement[];
  // Stop any running FLIP, so Last is the real layout.
  items.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  // Last: one read per item, once per change. Never per frame.
  const last = items.map((el) => el.getBoundingClientRect());
  items.forEach((el, i) => {
    const from = first.get(el.dataset.id!);
    if (!from) return;
    // Invert: how far back is First from Last?
    const dx = from.left - last[i].left;
    const dy = from.top - last[i].top;
    if (!dx && !dy) return;
    // Play: start at First, glide to Last. Transform only.
    el.animate(
      [{ transform: \`translate(\${dx}px, \${dy}px)\` }, { transform: "none" }],
      { duration, easing: EASE },
    );
  });
}`;

export const REORDER_TSX = `const list = useRef<HTMLUListElement>(null);
const first = useRef<Map<string, DOMRect> | null>(null);

function sortBy(key: SortKey) {
  first.current = measure(list.current!); // First
  setTasks((t) => sorted(t, key));
}

// Runs after React wrote the new order, before the browser paints.
useLayoutEffect(() => {
  if (first.current) play(list.current!, first.current, duration);
  first.current = null;
}, [tasks]);

<ul ref={list}>
  {tasks.map((t) => <li key={t.id} data-id={t.id}>…</li>)}
</ul>`;

export const FILTER_TSX = `useLayoutEffect(() => {
  const grid = gridRef.current!;
  if (!first.current) return;
  play(grid, first.current); // items that stayed glide to their new cell
  // Items that just appeared have no First. Fade them in instead.
  for (const el of Array.from(grid.children) as HTMLElement[]) {
    if (first.current.has(el.dataset.id!)) continue;
    el.animate(
      [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }],
      { duration: 300, easing: EASE, delay: 120 },
    );
  }
  first.current = null;
}, [filter]);`;

export const STEPS_CSS = `.flip-steps .row {
  transition: none;
}
/* Only the Play step animates. */
.flip-steps[data-step="play"] .row {
  transition: transform 800ms cubic-bezier(.16, 1, .3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .flip-steps[data-step="play"] .row { transition: none; }
}`;
