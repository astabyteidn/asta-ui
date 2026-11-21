"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { usePaused, useReducedMotion, useReplay } from "@/components/blog/DemoFrame";
import Icon from "@/components/icons/Icon";
import { Button } from "@/components/kit/button";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Slider } from "@/components/kit/slider";
import { LINEAR_CSS, TRANSITION_CSS } from "./code";

/** The same solver as SPRING_TS in ./code. Mass 1, 4 sub-steps per frame, the loop runs only while moving. */
function spring(apply: (x: number) => void) {
  let x = 0;
  let v = 0;
  let target = 0;
  let k = 300;
  let c = 30;
  let id = 0;
  let last = 0;
  function frame(now: number) {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    for (let i = 0; i < 4; i++) {
      const a = -k * (x - target) - c * v;
      v += a * (dt / 4);
      x += v * (dt / 4);
    }
    const done = Math.abs(v) < 0.01 && Math.abs(x - target) < 0.001;
    if (done) {
      x = target;
      v = 0;
    }
    apply(x);
    id = done ? 0 : requestAnimationFrame(frame);
  }
  const start = () => {
    if (id) return;
    last = performance.now();
    id = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(id);
    id = 0;
  };
  return {
    to(t: number) {
      target = t;
      start();
    },
    config(stiffness: number, damping: number) {
      k = stiffness;
      c = damping;
    },
    pause: stop,
    resume() {
      if (x !== target || v !== 0) start();
    },
    jump(t: number) {
      stop();
      x = target = t;
      v = 0;
      apply(x);
    },
    stop,
  };
}

/** One spring driving a pill. Pauses offscreen, cancels on unmount, jumps under reduced motion. */
function usePill(stiffness: number, damping: number) {
  const [{ s, pill }] = useState(() => {
    let el: HTMLElement | null = null;
    // One tab = 100% of the pill's own width. No layout reads.
    const s = spring((x) => el?.style.setProperty("--x", String(x)));
    return { s, pill: (node: HTMLElement | null) => void (el = node) };
  });
  const paused = usePaused();
  const reduce = useReducedMotion();
  useEffect(() => s.config(stiffness, damping), [s, stiffness, damping]);
  useEffect(() => (paused ? s.pause() : s.resume()), [s, paused]);
  useEffect(() => () => s.stop(), [s]);
  const to = useCallback((i: number) => (reduce ? s.jump(i) : s.to(i)), [s, reduce]);
  return { pill, s, to };
}

/** Simulate a 0 → 1 spring: how long until it settles, and how far past 1 it goes. */
function measure(k: number, c: number) {
  let x = 0;
  let v = 0;
  let t = 0;
  let max = 0;
  const dt = 1 / 600;
  while (t < 3 && !(Math.abs(v) < 0.01 && Math.abs(1 - x) < 0.001)) {
    v += (-k * (x - 1) - c * v) * dt;
    x += v * dt;
    t += dt;
    max = Math.max(max, x);
  }
  const over = Math.max(0, (max - 1) * 100);
  return { ms: Math.round(t * 1000), over: over < 10 ? over.toFixed(1) : String(Math.round(over)) };
}

const TABS = ["Overview", "Activity", "Billing"];
const ring = "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_12px_28px_-14px_rgb(0_0_0/0.25)]";

function TabBar({ pill, active, onPick, label }: { pill: (node: HTMLElement | null) => void; active: number; onPick: (i: number) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="relative grid grid-cols-3 rounded-[10px] bg-paper-2 p-1">
      <span className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)]">
        <span ref={pill} className={`pill block h-full rounded-[7px] bg-paper ${ring}`} style={{ transform: "translateX(calc(var(--x, 0) * 100%))" }} />
      </span>
      {TABS.map((t, i) => (
        <button key={t} type="button" role="tab" aria-selected={i === active} onClick={() => onPick(i)} className={`relative h-9 text-[13.5px] font-medium transition-colors ${i === active ? "text-ink" : "text-mute hover:text-ink"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

const PRESETS: Record<string, [number, number]> = { Snappy: [300, 30], Gentle: [120, 20], Bouncy: [220, 12] };

/** A spring with stiffness and damping sliders, on a real tab bar. */
export function SpringTabs() {
  const [k, setK] = useState(300);
  const [c, setC] = useState(30);
  const [active, setActive] = useState(0);
  const { pill, s, to } = usePill(k, c);
  const m = useMemo(() => measure(k, c), [k, c]);
  const pick = (i: number) => {
    setActive(i);
    to(i);
  };
  // Replay: back to the first tab, then spring to the last.
  const n = useReplay();
  useEffect(() => {
    if (!n) return;
    s.jump(0);
    const id = requestAnimationFrame(() => {
      setActive(2);
      s.to(2);
    });
    return () => cancelAnimationFrame(id);
  }, [n, s]);
  return (
    <div className="grid h-full gap-6 p-5 sm:grid-cols-[1fr_1.2fr] sm:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(PRESETS).map(([name, [pk, pc]]) => (
            <Button
              key={name}
              size="xs"
              variant={pk === k && pc === c ? "solid" : "soft"}
              onClick={() => {
                setK(pk);
                setC(pc);
              }}
            >
              {name}
            </Button>
          ))}
        </div>
        <div>
          <div className="flex justify-between font-mono text-[12px] text-mute">
            <span id="spr-k">stiffness</span>
            <span className="tabular-nums">{k}</span>
          </div>
          <Slider aria-labelledby="spr-k" value={k} onValueChange={setK} min={60} max={500} step={10} />
        </div>
        <div>
          <div className="flex justify-between font-mono text-[12px] text-mute">
            <span id="spr-c">damping</span>
            <span className="tabular-nums">{c}</span>
          </div>
          <Slider aria-labelledby="spr-c" value={c} onValueChange={setC} min={5} max={60} step={1} />
        </div>
        <p className="font-mono text-[12px] text-ink">
          settles in <span className="tabular-nums text-brand">{m.ms}ms</span> · overshoot <span className="tabular-nums">{m.over}%</span>
        </p>
      </div>
      <div className="flex flex-col justify-center gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium">Astabyte Workspace</span>
          <span className="label text-mute">Click the tabs</span>
        </div>
        <TabBar pill={pill} active={active} onPick={pick} label="Workspace sections" />
        <div className="flex flex-col gap-2 rounded-[10px] bg-paper-2 p-4">
          <div className="h-2.5 w-2/3 rounded-full bg-paper" />
          <div className="h-2.5 w-1/2 rounded-full bg-paper" />
        </div>
      </div>
    </div>
  );
}

const BURST = [2, 0, 2, 1, 2, 0];

/** Spring vs CSS transition, fed the same fast clicks. */
export function SpringRace() {
  const [to, setTo] = useState(0);
  const { pill, s, to: springTo } = usePill(300, 30);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const go = (i: number) => {
    setTo(i);
    springTo(i);
  };
  const burst = () => {
    timers.current.forEach(clearTimeout);
    timers.current = BURST.map((i, j) => setTimeout(() => go(i), j * 140));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // Replay: back to the first tab, then the same 6 fast clicks.
  const n = useReplay();
  useEffect(() => {
    if (!n) return;
    const ts = [0, ...BURST].map((i, j) =>
      setTimeout(() => {
        setTo(i);
        if (j === 0) s.jump(0);
        else springTo(i);
      }, j * 140),
    );
    return () => ts.forEach(clearTimeout);
  }, [n, s, springTo]);
  return (
    <div className="spr-race flex h-full flex-col gap-5 p-5 sm:p-8" style={{ "--to": to } as CSSProperties}>
      <style href="asta-blog-spr-race" precedence="asta">
        {TRANSITION_CSS}
      </style>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={burst}>
          Click 6 times fast
        </Button>
        <span className="label text-mute">Or click any tab, fast</span>
      </div>
      <div>
        <p className="mb-2 font-mono text-[12px] text-brand">spring · stiffness 300 · damping 30</p>
        <TabBar pill={pill} active={to} onPick={go} label="Spring tabs" />
      </div>
      <div className="css">
        <p className="mb-2 font-mono text-[12px] text-ink">transition · 300ms ease-out</p>
        <div role="tablist" aria-label="CSS tabs" className="relative grid grid-cols-3 rounded-[10px] bg-paper-2 p-1">
          <span className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)]">
            <span className={`pill block h-full rounded-[7px] bg-paper ${ring}`} />
          </span>
          {TABS.map((t, i) => (
            <button key={t} type="button" role="tab" aria-selected={i === to} onClick={() => go(i)} className={`relative h-9 text-[13.5px] font-medium transition-colors ${i === to ? "text-ink" : "text-mute hover:text-ink"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Sample a 0 → 1 spring into a CSS linear() string. Same as SAMPLE_TS in ./code. */
function toLinear(k: number, c: number, points = 40) {
  let x = 0;
  let v = 0;
  let t = 0;
  const xs: number[] = [];
  const dt = 1 / 600;
  while (t < 3 && !(Math.abs(v) < 0.01 && Math.abs(1 - x) < 0.001)) {
    v += (-k * (x - 1) - c * v) * dt;
    x += v * dt;
    t += dt;
    xs.push(x);
  }
  const step = Math.max(1, Math.floor(xs.length / points));
  const out = xs.filter((_, i) => i % step === 0).map((y) => +y.toFixed(3));
  return { easing: `linear(0, ${out.join(", ")}, 1)`, ms: Math.round(t * 1000), count: out.length + 2 };
}

/** A toast that enters with a spring written as CSS linear(). No JS runs during the animation. */
export function SpringToast() {
  const [preset, setPreset] = useState("Snappy");
  const [open, setOpen] = useState(false);
  const lin = useMemo(() => toLinear(...PRESETS[preset]), [preset]);
  // Replay: hide the toast, wait until it is gone, then show it again.
  const n = useReplay();
  useEffect(() => {
    if (!n) return;
    const id = requestAnimationFrame(() => setOpen(false));
    const t = setTimeout(() => setOpen(true), 500);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [n]);
  // Show the toast once, the first time the demo is on screen.
  const paused = usePaused();
  const shown = useRef(false);
  useEffect(() => {
    if (paused || shown.current) return;
    const t = setTimeout(() => {
      shown.current = true;
      setOpen(true);
    }, 400);
    return () => clearTimeout(t);
  }, [paused]);
  return (
    <div className="spr-toast grid h-full gap-6 p-5 sm:grid-cols-[1fr_1fr] sm:p-8" data-open={open} style={{ "--spring": lin.easing, "--dur": `${lin.ms}ms` } as CSSProperties}>
      <style href="asta-blog-spr-toast" precedence="asta">
        {LINEAR_CSS}
      </style>
      <div className="flex min-w-0 flex-col gap-4">
        <SegmentedControl size="sm" label="Spring" value={preset} onChange={setPreset} segments={Object.keys(PRESETS).map((p) => ({ value: p, label: p }))} className="self-start" />
        <Button size="sm" variant="outline" className="self-start" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide toast" : "Show toast"}
        </Button>
        <p className="font-mono text-[12px] text-ink">
          <span className="tabular-nums text-brand">{lin.ms}ms</span> · <span className="tabular-nums">{lin.count}</span> points
        </p>
        <p className="line-clamp-3 break-all font-mono text-[11px] leading-relaxed text-mute">{lin.easing}</p>
      </div>
      <div className="relative flex min-h-[150px] items-end justify-center overflow-hidden rounded-[10px] bg-paper-2 p-4">
        <div className={`toast flex w-full max-w-[280px] items-center gap-3 rounded-[10px] bg-paper px-3.5 py-3 ${ring}`} aria-hidden={!open}>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white">
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium">Saved to Astabyte Drive</p>
            <p className="truncate text-[12px] text-mute">Q4 report.pdf · 2.4 MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
