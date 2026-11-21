"use client";

import { Activity, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from "react";
import { baseDemos } from "@/components/kit/base/demos";
import { kitDemos } from "@/components/kit/demos";
import { variantDemos } from "@/components/kit/variants";
import { labComponents } from "@/components/lab/components";
import { useMotionEpoch } from "./MotionPause";
import { usePrimitive } from "./Primitive";

const noop = () => () => {};

/**
 * Mounts a live component while it's near the viewport and unmounts it once it's well out of view, so only the demos
 * you can see are animating. It remembers the height it rendered at and keeps that space while unmounted, so scrolling
 * past a demo never collapses it and the page never jumps. `eager` mounts it as soon as the page hydrates (component
 * pages); `ssr` renders it on the server too. Either way the placeholder crossfades into the component, and items with
 * a Base UI build swap to it when Base UI is the picked primitive (same crossfade, same size). While motion is paused
 * the demo is shown as a still (useFreeze).
 */
function useNearMount(eager: boolean, ssr: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [held, setHeld] = useState<number | null>(null);
  // false on the server and during hydration, true right after: no hydration mismatch, no effect-driven state.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  useEffect(() => {
    const el = ref.current;
    if (!el || eager || ssr) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "900px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [eager, ssr]);
  const on = ssr || (eager ? hydrated : near);
  // Remember the rendered height, so the slot keeps its size after the demo unmounts.
  useEffect(() => {
    const el = inner.current;
    if (!on || !el) return;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (h > 0) setHeld(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [on]);
  return { ref, inner, on, held };
}

/** Points `url(#id)` and `href="#id"` in the copy at the copy's own (renamed) ids, so gradients and clips still resolve. */
function renameIds(nodes: Element[]) {
  const ids = new Map<string, string>();
  for (const n of nodes) {
    if (!n.id) continue;
    ids.set(n.id, `${n.id}-still`);
    n.id = `${n.id}-still`;
  }
  if (!ids.size) return;
  for (const n of nodes) {
    for (const attr of Array.from(n.attributes)) {
      if (attr.name === "id" || !attr.value.includes("#")) continue;
      let v = attr.value;
      for (const [a, b] of ids) v = v.split(`url(#${a})`).join(`url(#${b})`).split(`url("#${a}")`).join(`url("#${b}")`);
      if (v.startsWith("#") && ids.has(v.slice(1))) v = `#${ids.get(v.slice(1))}`;
      if (v !== attr.value) attr.value = v;
    }
  }
}

/**
 * Copies `el` into `host` as a still frame: the same DOM, inert and hidden from assistive tech, with every running
 * animation re-created on the copy and paused at its current time. Canvases, scroll offsets and SVG/video timelines
 * carry over too.
 */
function freezeInto(el: HTMLElement, host: HTMLElement) {
  const copy = el.cloneNode(true) as HTMLElement;
  copy.classList.add("ui-still");
  copy.removeAttribute("data-instant");
  copy.setAttribute("aria-hidden", "true");
  copy.inert = true;
  const from: Element[] = [el, ...el.querySelectorAll("*")];
  const to: Element[] = [copy, ...copy.querySelectorAll("*")];
  renameIds(to);
  host.replaceChildren(copy);
  const index = new Map(from.map((n, i) => [n, i]));
  for (const a of el.getAnimations({ subtree: true })) {
    const fx = a.effect as KeyframeEffect | null;
    const i = fx?.target ? index.get(fx.target) : undefined;
    if (!fx || i === undefined || a.currentTime === null) continue;
    try {
      const b = to[i].animate(fx.getKeyframes(), { ...fx.getTiming(), pseudoElement: fx.pseudoElement ?? undefined, composite: fx.composite });
      b.pause();
      b.currentTime = a.currentTime;
    } catch {}
  }
  from.forEach((n, i) => {
    const t = to[i];
    if (n.scrollTop || n.scrollLeft) t.scrollTo(n.scrollLeft, n.scrollTop);
    try {
      if (n instanceof HTMLCanvasElement) (t as HTMLCanvasElement).getContext("2d")?.drawImage(n, 0, 0);
      else if (n instanceof HTMLVideoElement) {
        (t as HTMLVideoElement).pause();
        (t as HTMLVideoElement).currentTime = n.currentTime;
      } else if (n instanceof SVGSVGElement) {
        (t as SVGSVGElement).pauseAnimations();
        (t as SVGSVGElement).setCurrentTime(n.getCurrentTime());
      }
    } catch {}
  });
}

/**
 * Pause motion (MotionPause) turns the demo into a still: a copy frozen at the current frame takes its place, and the
 * live tree sits in a hidden <Activity>, which keeps its state but stops its effects, so its timers and loops stop.
 * Play brings the live tree back and its effects start again. A demo that mounts while paused renders once with CSS
 * motion skipped to the end (`data-instant`), then freezes, so the still shows it settled rather than at its first frame.
 */
function useFreeze(inner: RefObject<HTMLDivElement | null>, on: boolean) {
  const epoch = useMotionEpoch();
  const still = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  const [frozenAt, setFrozenAt] = useState(0);
  useEffect(() => {
    if (!on) played.current = false;
    else if (document.documentElement.dataset.motion !== "paused") played.current = true;
  }, [on, epoch]);
  useLayoutEffect(() => {
    const el = inner.current;
    const host = still.current;
    if (!epoch) return void host?.replaceChildren();
    if (!on || frozenAt === epoch || !el || !host) return;
    if (!played.current) el.setAttribute("data-instant", "");
    // Two frames after the demo has content: demos load lazily, so one that mounts while paused may still be empty.
    let raf = 0;
    const take = () => {
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          freezeInto(el, host);
          setFrozenAt(epoch);
        });
      });
    };
    const mo = new MutationObserver(() => {
      if (!el.firstElementChild) return;
      mo.disconnect();
      take();
    });
    if (el.firstElementChild) take();
    else mo.observe(el, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      el.removeAttribute("data-instant");
    };
  }, [epoch, on, frozenAt, inner]);
  return { still, frozen: on && epoch !== 0 && frozenAt === epoch };
}

export function Live({ slug, eager = false, ssr = false }: { slug: string; eager?: boolean; ssr?: boolean }) {
  const { ref, inner, on, held } = useNearMount(eager, ssr);
  const { still, frozen } = useFreeze(inner, on);
  const primitive = usePrimitive();
  const base = primitive === "base" ? baseDemos[slug] : undefined;
  const C = base ?? labComponents[slug] ?? kitDemos[slug] ?? variantDemos[slug];
  return (
    <div ref={ref} className="relative h-full w-full" style={!on && held ? { minHeight: held } : undefined}>
      {on && C ? (
        <>
          <div ref={inner} key={base ? "base" : "radix"} className={`ui-live-in relative h-full w-full ${frozen ? "hidden" : ""}`} data-primitive={base ? "base" : undefined}>
            <Activity mode={frozen ? "hidden" : "visible"}>
              <C />
            </Activity>
          </div>
          <div aria-hidden className="ui-live-ph absolute inset-0 bg-ink/[0.03]" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-ink/[0.025]" />
      )}
      <div ref={still} className={frozen ? "contents" : "hidden"} />
    </div>
  );
}

/** Same near-viewport mounting as `Live`, for any children (the blog demos). */
export function LiveSlot({ children }: { children: ReactNode }) {
  const { ref, inner, on, held } = useNearMount(false, false);
  const { still, frozen } = useFreeze(inner, on);
  return (
    <div ref={ref} className="relative h-full w-full" style={!on && held ? { minHeight: held } : undefined}>
      {on ? (
        <>
          <div ref={inner} className={`ui-live-in relative h-full w-full ${frozen ? "hidden" : ""}`}>
            <Activity mode={frozen ? "hidden" : "visible"}>{children}</Activity>
          </div>
          <div aria-hidden className="ui-live-ph absolute inset-0 bg-ink/[0.03]" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-ink/[0.025]" />
      )}
      <div ref={still} className={frozen ? "contents" : "hidden"} />
    </div>
  );
}

/** A surface with a soft blue light that follows the pointer. */
export function Spot({ className = "", style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - r.left}px`);
        el.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }}
      style={style}
      className={`spot group relative overflow-hidden rounded-xl bg-paper-2 ${className}`}
    >
      {children}
    </div>
  );
}
