// The real code behind the easing demos. The demos inject these strings, and the post shows them as-is.

export const RACE_CSS = `.ease-race .track {
  container-type: inline-size;
}
.ease-race .dot {
  animation: ease-race-go 1000ms both 300ms;
}
.ease-race .out    .dot { animation-timing-function: cubic-bezier(.16, 1, .3, 1); }
.ease-race .in-out .dot { animation-timing-function: cubic-bezier(.65, 0, .35, 1); }
.ease-race .linear .dot { animation-timing-function: linear; }

@keyframes ease-race-go {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(100cqw - 100%)); }
}

@media (prefers-reduced-motion: reduce) {
  .ease-race .dot { animation: none; transform: translateX(calc(100cqw - 100%)); }
}`;

export const MENU_CSS = `.ease-menu .panel {
  transform-origin: top left;
  transition:
    opacity 300ms var(--ease),
    transform 300ms var(--ease);
}
.ease-menu .panel[data-open="false"] {
  opacity: 0;
  transform: translateY(-4px) scale(.96);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .ease-menu .panel { transition: opacity 150ms linear; }
  .ease-menu .panel[data-open="false"] { transform: none; }
}`;

export const MENU_TSX = `const EASE = {
  "ease-out": "cubic-bezier(.16, 1, .3, 1)",
  "ease-in-out": "cubic-bezier(.65, 0, .35, 1)",
  "ease-in": "cubic-bezier(.7, 0, .84, 0)",
  linear: "linear",
};

<div className="ease-menu" style={{ "--ease": EASE[curve] }}>
  <button onClick={() => setOpen(!open)}>Sort by</button>
  <div className="panel" data-open={open}>…</div>
</div>`;

export const BEZIER_TS = `// x is time, y is progress. Find the t where x(t) = time, then return y(t).
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (time: number) => {
    let lo = 0, hi = 1, t = time;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (at(x1, x2, t) < time) lo = t; else hi = t;
    }
    return at(y1, y2, t);
  };
}

const easeOut = bezier(.16, 1, .3, 1);
easeOut(0.25); // ≈ 0.83: a quarter of the time, 83% of the way`;
