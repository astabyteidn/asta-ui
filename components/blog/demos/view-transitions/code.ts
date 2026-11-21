// The real code behind the View Transitions demos. The demos run the same helper (see ./demos.tsx) and inject these strings.

export const TRANSITION_TS = `import { flushSync } from "react-dom";

// key scopes the CSS: :root[data-vt="<key>"] only matches while this demo runs.
export function transition(key: string, update: () => void) {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Fallback: no API, or the user asked for less motion. Just update the DOM.
  if (!document.startViewTransition || reduce) {
    update();
    return;
  }
  root.dataset.vt = key;
  // The browser snapshots the old view, runs the callback, then snapshots the new one.
  // flushSync makes React write the DOM inside the callback, not later.
  const t = document.startViewTransition(() => flushSync(update));
  t.finished.finally(() => {
    if (root.dataset.vt === key) delete root.dataset.vt;
  });
  return t;
}`;

export const LAYOUT_CSS = `:root[data-vt="vt-layout"]::view-transition-group(*) {
  animation-duration: 450ms;
  animation-timing-function: cubic-bezier(.16, 1, .3, 1);
}`;

export const LAYOUT_TSX = `// One unique name per photo and per demo instance.
const scope = useId().replace(/[^a-zA-Z0-9]/g, "");
const name = (part: string, id: string) => \`vt-\${scope}-\${part}-\${id}\`;

<SegmentedControl
  value={layout}
  onChange={(v) => transition("vt-layout", () => setLayout(v))}
  segments={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]}
/>

{photos.map((p) => (
  <li key={p.id}>
    <Image style={{ viewTransitionName: name("img", p.id) }} … />
    <span style={{ viewTransitionName: name("title", p.id) }}>{p.title}</span>
  </li>
))}`;

export const SHARED_TSX = `// Only one element may hold a name at a time.
// The picked thumbnail holds it, then hands it to the big image.
const hero = \`vt-\${scope}-hero\`;

function openPhoto(i: number) {
  flushSync(() => setPicked(i)); // name the thumbnail before the old snapshot
  transition("vt-shared", () => setOpen(true));
}

{!open ? (
  photos.map((p, i) => (
    <button onClick={() => openPhoto(i)}>
      <Image style={{ viewTransitionName: i === picked ? hero : undefined }} … />
    </button>
  ))
) : (
  <article>
    <Image style={{ viewTransitionName: hero }} … />
    <button onClick={() => transition("vt-shared", () => setOpen(false))}>Back</button>
  </article>
)}`;

export const SHARED_CSS = `:root[data-vt="vt-shared"]::view-transition-group(*) {
  animation-duration: 500ms;
  animation-timing-function: cubic-bezier(.16, 1, .3, 1);
}
/* Keep the photo's aspect while it grows, instead of stretching. */
:root[data-vt="vt-shared"]::view-transition-old(*),
:root[data-vt="vt-shared"]::view-transition-new(*) {
  height: 100%;
  object-fit: cover;
}`;

export const TIMING_TSX = `const root = document.documentElement;
root.style.setProperty("--vt-duration", \`\${duration}ms\`);
transition(curve === "house" ? "vt-timing" : "vt-default", () => setSort(next))
  ?.finished.finally(() => root.style.removeProperty("--vt-duration"));`;

export const TIMING_CSS = `/* Browser default: 250ms, ease. Ours, only while this demo runs: */
:root[data-vt="vt-timing"]::view-transition-group(*) {
  animation-duration: var(--vt-duration, 500ms);
  animation-timing-function: cubic-bezier(.16, 1, .3, 1);
}
/* The cross-fade of old and new runs in the first 60% of the move. */
:root[data-vt="vt-timing"]::view-transition-old(*),
:root[data-vt="vt-timing"]::view-transition-new(*) {
  animation-duration: calc(var(--vt-duration, 500ms) * .6);
  animation-timing-function: cubic-bezier(.16, 1, .3, 1);
}`;
