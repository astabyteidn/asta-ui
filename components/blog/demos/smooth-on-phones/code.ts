// The real code behind the smooth-on-phones demos. The demos run these, and the post shows them as-is.

export const LANES_CSS = `.smooth-lanes .track {
  container-type: inline-size;
}
.smooth-lanes .dot {
  transform: translateX(calc((100cqw - 100%) * var(--p, 0)));
}

/* Lane 1: a CSS animation on transform. The compositor runs it. */
.smooth-lanes .css .dot {
  animation: smooth-slide 1600ms cubic-bezier(.65, 0, .35, 1) infinite alternate;
}
@keyframes smooth-slide {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(100cqw - 100%)); }
}

@media (prefers-reduced-motion: reduce) {
  .smooth-lanes .css .dot { animation: none; }
}`;

export const LANES_TS = `// Lane 2: the same motion, driven from JavaScript.
// Every frame needs the main thread. Block it and the dot stops.
function loop(now: number) {
  const t = (now % 3200) / 1600;          // 0 → 2
  const p = t < 1 ? t : 2 - t;            // there and back
  dot.style.setProperty("--p", String(ease(p)));
  id = requestAnimationFrame(loop);
}
let id = requestAnimationFrame(loop);

// The button: 1000ms of busy work, like a heavy render or a big JSON parse.
function block() {
  const end = performance.now() + 1000;
  while (performance.now() < end) {
    /* busy */
  }
}`;

export const PAUSE_TS = `// Run a loop only while it can be seen.
useEffect(() => {
  let id = 0;
  let inView = false;
  const run = () => {
    if (id || !inView || document.hidden) return;
    const tick = () => {
      draw();                                   // your frame
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(id);
    id = 0;
  };
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) run(); else stop();
  });
  const onVis = () => (document.hidden ? stop() : run());
  io.observe(card);
  document.addEventListener("visibilitychange", onVis);
  return () => {
    stop();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
  };
}, []);`;
