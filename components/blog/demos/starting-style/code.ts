// The real code behind the @starting-style demos. The demos inject these strings, and the post shows them as-is.

export const POPOVER_CSS = `.ss-pop .menu {
  opacity: 1;
  transform: none;
  transform-origin: top left;
  transition:
    opacity 200ms cubic-bezier(.16, 1, .3, 1),
    transform 200ms cubic-bezier(.16, 1, .3, 1),
    overlay 200ms allow-discrete,
    display 200ms allow-discrete;
}

/* Closed: where it goes on the way out. */
.ss-pop .menu:not(:popover-open) {
  opacity: 0;
  transform: translateY(-4px) scale(.96);
}

/* Just opened: where it comes from on the way in. */
@starting-style {
  .ss-pop .menu:popover-open {
    opacity: 0;
    transform: translateY(-4px) scale(.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ss-pop .menu,
  .ss-pop .menu:not(:popover-open) { transform: none; }
}`;

export const POPOVER_HTML = `<button popovertarget="sort">Sort by</button>

<div id="sort" popover class="menu">
  <button>Newest first</button>
  <button>Price, low to high</button>
  <button>Most popular</button>
</div>`;

export const DIALOG_CSS = `.ss-dialog dialog {
  opacity: 1;
  transform: none;
  transition:
    opacity 250ms cubic-bezier(.16, 1, .3, 1),
    transform 250ms cubic-bezier(.16, 1, .3, 1),
    overlay 250ms allow-discrete,
    display 250ms allow-discrete;
}
.ss-dialog dialog:not([open]) {
  opacity: 0;
  transform: translateY(8px) scale(.96);
}
@starting-style {
  .ss-dialog dialog[open] {
    opacity: 0;
    transform: translateY(8px) scale(.96);
  }
}

/* The backdrop fades with opacity, not background-color. */
.ss-dialog dialog::backdrop {
  background: rgb(10 10 10 / .35);
  opacity: 0;
  transition:
    opacity 250ms linear,
    overlay 250ms allow-discrete,
    display 250ms allow-discrete;
}
.ss-dialog dialog[open]::backdrop { opacity: 1; }
@starting-style {
  .ss-dialog dialog[open]::backdrop { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ss-dialog dialog,
  .ss-dialog dialog:not([open]) { transform: none; }
}`;

export const DIALOG_TSX = `const ref = useRef<HTMLDialogElement>(null);

<button onClick={() => ref.current?.showModal()}>Delete project</button>

<dialog ref={ref}>
  <form method="dialog">
    <p>Delete “Astabyte site”?</p>
    <button value="cancel">Cancel</button>
    <button value="delete">Delete</button>
  </form>
</dialog>`;

export const TOAST_CSS = `.ss-toasts li {
  opacity: 1;
  transform: none;
  transition:
    opacity 240ms cubic-bezier(.16, 1, .3, 1),
    transform 240ms cubic-bezier(.16, 1, .3, 1),
    display 240ms allow-discrete;
}

/* Added to the DOM: start here. */
@starting-style {
  .ss-toasts li {
    opacity: 0;
    transform: translateY(8px) scale(.98);
  }
}

/* hidden sets display: none. allow-discrete waits for the fade. */
.ss-toasts li[hidden] {
  opacity: 0;
  transform: translateX(16px);
}

@media (prefers-reduced-motion: reduce) {
  .ss-toasts li,
  .ss-toasts li[hidden] { transform: none; }
  @starting-style { .ss-toasts li { transform: none; } }
}`;

export const TOAST_TSX = `// No animation code. Add an item and CSS plays the entrance.
setToasts((t) => [{ id: Date.now(), text: "Saved" }, ...t]);

// To leave: set hidden, then remove it once the fade is done.
setGone((g) => [...g, id]);
setTimeout(() => remove(id), 240);

<li hidden={gone.includes(t.id)}>{t.text}</li>`;
