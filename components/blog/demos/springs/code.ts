// The real code behind the spring demos. The demos run this same solver, and the post shows it as-is.

export const SPRING_TS = `// A spring with mass 1. x and target are in any unit, here "tabs".
export function spring(apply: (x: number) => void) {
  let x = 0, v = 0, target = 0;
  let k = 300, c = 30; // stiffness, damping
  let id = 0, last = 0;

  function frame(now: number) {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    // 4 small steps per frame keep stiff springs stable.
    for (let i = 0; i < 4; i++) {
      const a = -k * (x - target) - c * v;
      v += a * (dt / 4);
      x += v * (dt / 4);
    }
    const done = Math.abs(v) < 0.01 && Math.abs(x - target) < 0.001;
    if (done) { x = target; v = 0; }
    apply(x);
    id = done ? 0 : requestAnimationFrame(frame);
  }
  const start = () => {
    if (id) return;
    last = performance.now();
    id = requestAnimationFrame(frame);
  };

  return {
    to(t: number) { target = t; start(); }, // keeps v: no restart
    config(stiffness: number, damping: number) { k = stiffness; c = damping; },
    pause() { cancelAnimationFrame(id); id = 0; },
    resume() { if (x !== target || v !== 0) start(); },
    jump(t: number) { this.stop(); x = target = t; v = 0; apply(x); },
    stop() { cancelAnimationFrame(id); id = 0; },
  };
}`;

export const TABS_TSX = `const [{ s, pill }] = useState(() => {
  let el: HTMLElement | null = null;
  // One tab = 100% of the pill's own width. No layout reads.
  const s = spring((x) => el?.style.setProperty("--x", String(x)));
  return { s, pill: (node: HTMLElement | null) => void (el = node) };
});

useEffect(() => s.config(stiffness, damping), [s, stiffness, damping]);
useEffect(() => (paused ? s.pause() : s.resume()), [s, paused]);
useEffect(() => () => s.stop(), [s]); // cancel on unmount

<span ref={pill} className="pill"
  style={{ transform: "translateX(calc(var(--x, 0) * 100%))" }} />
{tabs.map((t, i) => <button onClick={() => s.to(i)}>{t}</button>)}`;

export const TRANSITION_CSS = `/* The CSS side of the race. On a new click the transition
   restarts from where the pill is, at speed zero. */
.spr-race .css .pill {
  transform: translateX(calc(var(--to) * 100%));
  transition: transform 300ms cubic-bezier(.16, 1, .3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .spr-race .pill { transition: none; }
}`;

export const LINEAR_CSS = `.spr-toast .toast {
  opacity: 0;
  transform: translateY(24px);
  /* Fallback for browsers without linear(): our ease-out. */
  transition:
    opacity 200ms ease-out,
    transform var(--dur) cubic-bezier(.16, 1, .3, 1);
}
@supports (transition-timing-function: linear(0, 1)) {
  .spr-toast .toast {
    /* The spring, sampled into points. See the demo for the full list. */
    transition-timing-function: ease-out, var(--spring);
  }
}
.spr-toast[data-open="true"] .toast { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .spr-toast .toast { transform: none; }
}`;

export const SAMPLE_TS = `// Turn a spring into a CSS linear() string and a duration.
function toLinear(k: number, c: number, points = 40) {
  let x = 0, v = 0, t = 0;
  const xs: number[] = [];
  const dt = 1 / 600;
  while (t < 3 && !(Math.abs(v) < 0.01 && Math.abs(1 - x) < 0.001)) {
    v += (-k * (x - 1) - c * v) * dt;
    x += v * dt;
    t += dt;
    xs.push(x);
  }
  const step = Math.max(1, Math.floor(xs.length / points));
  const out = xs.filter((_, i) => i % step === 0).map((x) => +x.toFixed(3));
  return { easing: \`linear(0, \${out.join(", ")}, 1)\`, ms: Math.round(t * 1000) };
}`;
