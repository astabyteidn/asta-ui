"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { flushSync } from "react-dom";
import { useReplay } from "@/components/blog/DemoFrame";
import { Button } from "@/components/kit/button";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Slider } from "@/components/kit/slider";
import { LAYOUT_CSS, SHARED_CSS, TIMING_CSS } from "./code";

// Same helper as TRANSITION_TS in ./code.ts.
function transition(key: string, update: () => void) {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) {
    update();
    return;
  }
  root.dataset.vt = key;
  const t = document.startViewTransition(() => flushSync(update));
  t.finished.finally(() => {
    if (root.dataset.vt === key) delete root.dataset.vt;
  });
  return t;
}

/** A name prefix that is unique per demo instance, so two demos never share a view-transition-name. */
function useScope() {
  const scope = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (part: string, id: string) => `vt-${scope}-${part}-${id}`;
}

/** Replay runs the demo's own action once, through the same transition. */
function useReplayAction(action: () => void) {
  const n = useReplay();
  const [last, setLast] = useState(n);
  const [pending, setPending] = useState(false);
  if (last !== n) {
    setLast(n);
    setPending(true);
  }
  useEffect(() => {
    if (!pending) return;
    const id = requestAnimationFrame(() => {
      setPending(false);
      action();
    });
    return () => cancelAnimationFrame(id);
  }, [pending, action]);
}

const PHOTOS = [
  { id: "poppies", src: "/lab/art/poppies.webp", title: "Poppy field", meta: "Spring set · 12 photos" },
  { id: "parasol", src: "/lab/art/parasol.webp", title: "Parasol walk", meta: "Portraits · 8 photos" },
  { id: "wheat", src: "/lab/art/wheat.webp", title: "Wheat in July", meta: "Summer set · 20 photos" },
  { id: "bathers", src: "/lab/art/bathers.webp", title: "River bathers", meta: "Summer set · 9 photos" },
  { id: "hoarfrost", src: "/lab/art/hoarfrost.webp", title: "Hoarfrost", meta: "Winter set · 14 photos" },
  { id: "jatte", src: "/lab/art/grande-jatte.webp", title: "Sunday park", meta: "City set · 16 photos" },
];

/** Grid ↔ list. Each photo and title has its own name, so the browser morphs them between layouts. */
export function VtLayout() {
  const name = useScope();
  const [layout, setLayout] = useState("grid");
  const go = (v: string) => transition("vt-layout", () => setLayout(v));
  useReplayAction(() => go(layout === "grid" ? "list" : "grid"));
  const grid = layout === "grid";
  return (
    <div className="vt-layout flex h-full flex-col gap-4 p-5 sm:p-8">
      <style href="asta-blog-vt-layout" precedence="asta">
        {LAYOUT_CSS}
      </style>
      <SegmentedControl
        size="sm"
        label="Layout"
        value={layout}
        onChange={go}
        segments={[
          { value: "grid", label: "Grid" },
          { value: "list", label: "List" },
        ]}
        className="self-start"
      />
      <ul className={grid ? "grid grid-cols-3 gap-2" : "flex flex-col gap-1.5"}>
        {PHOTOS.map((p) => (
          <li key={p.id} className={grid ? "min-w-0" : "flex items-center gap-3 rounded-[10px] bg-paper-2 p-1.5 pr-3"}>
            <Image
              src={p.src}
              alt=""
              width={320}
              height={240}
              sizes={grid ? "(min-width: 640px) 200px, 30vw" : "64px"}
              loading="lazy"
              className={`aspect-[4/3] rounded-[8px] object-cover ${grid ? "w-full" : "w-12 shrink-0"}`}
              style={{ viewTransitionName: name("img", p.id) }}
            />
            <span className={grid ? "mt-1.5 block min-w-0" : "min-w-0 flex-1"}>
              <span className="block w-fit max-w-full truncate text-[13px] font-medium text-ink" style={{ viewTransitionName: name("title", p.id) }}>
                {p.title}
              </span>
              {!grid && <span className="block truncate text-[12px] text-mute">{p.meta}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A thumbnail grows into a detail card. The name moves from the thumbnail to the big image. */
export function VtShared() {
  const name = useScope();
  const hero = name("hero", "photo");
  const [picked, setPicked] = useState(0);
  const [open, setOpen] = useState(false);
  const openPhoto = (i: number) => {
    flushSync(() => setPicked(i));
    transition("vt-shared", () => setOpen(true));
  };
  const close = () => transition("vt-shared", () => setOpen(false));
  useReplayAction(() => (open ? close() : openPhoto(picked)));
  const p = PHOTOS[picked];
  return (
    <div className="vt-shared flex h-full flex-col p-5 sm:p-8">
      <style href="asta-blog-vt-shared" precedence="asta">
        {SHARED_CSS}
      </style>
      {!open ? (
        <ul className="grid grid-cols-3 gap-2">
          {PHOTOS.map((ph, i) => (
            <li key={ph.id}>
              <button type="button" onClick={() => openPhoto(i)} className="block w-full rounded-[8px] focus-visible:outline-2 focus-visible:outline-brand" aria-label={`Open ${ph.title}`}>
                <Image
                  src={ph.src}
                  alt=""
                  width={320}
                  height={240}
                  sizes="(min-width: 640px) 200px, 30vw"
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-[8px] object-cover"
                  style={{ viewTransitionName: i === picked ? hero : undefined }}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <article className="grid gap-4 sm:grid-cols-[1.3fr_1fr]">
          <Image
            src={p.src}
            alt={p.title}
            width={720}
            height={540}
            sizes="(min-width: 640px) 420px, 90vw"
            loading="eager"
            className="aspect-[4/3] w-full rounded-[12px] object-cover"
            style={{ viewTransitionName: hero }}
          />
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[12px] text-mute">{p.meta}</p>
            <h4 className="text-[18px] font-medium text-ink">{p.title}</h4>
            <p className="text-[14px] leading-relaxed text-ink-2">Shared with the Astabyte studio team. Prints ship in 3 to 5 days.</p>
            <Button size="sm" variant="outline" onClick={close} className="mt-2 self-start">
              Back to gallery
            </Button>
          </div>
        </article>
      )}
    </div>
  );
}

const PRODUCTS = [
  { id: "lamp", name: "Desk lamp", price: 64 },
  { id: "phones", name: "Studio headphones", price: 189 },
  { id: "cables", name: "Cable kit", price: 19 },
  { id: "stand", name: "Monitor stand", price: 79 },
];
type Sort = "name" | "price";

/** The same re-sort with the browser default timing, then with the house curve and your duration. */
export function VtTiming() {
  const name = useScope();
  const [curve, setCurve] = useState("house");
  const [duration, setDuration] = useState(600);
  const [sort, setSort] = useState<Sort>("name");
  const resort = () => {
    const next: Sort = sort === "name" ? "price" : "name";
    const root = document.documentElement;
    root.style.setProperty("--vt-duration", `${duration}ms`);
    transition(curve === "house" ? "vt-timing" : "vt-default", () => setSort(next))?.finished.finally(() => root.style.removeProperty("--vt-duration"));
  };
  useReplayAction(resort);
  const rows = [...PRODUCTS].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : a.price - b.price));
  return (
    <div className="vt-timing flex h-full flex-col gap-4 p-5 sm:p-8">
      <style href="asta-blog-vt-timing" precedence="asta">
        {TIMING_CSS}
      </style>
      <div className="flex flex-wrap items-end gap-3">
        <SegmentedControl
          size="sm"
          label="Timing"
          value={curve}
          onChange={setCurve}
          segments={[
            { value: "default", label: "Default 250ms" },
            { value: "house", label: "House curve" },
          ]}
        />
        <div className={`w-full min-w-40 sm:w-48 ${curve === "house" ? "" : "opacity-40"}`}>
          <div className="flex justify-between font-mono text-[12px] text-mute">
            <span id="vt-dur">Duration</span>
            <span className="tabular-nums">{duration}ms</span>
          </div>
          <Slider aria-labelledby="vt-dur" value={duration} onValueChange={setDuration} min={200} max={1200} step={100} format={(v) => `${v}ms`} />
        </div>
        <Button size="sm" onClick={resort} className="sm:ml-auto">
          Sort by {sort === "name" ? "price" : "name"}
        </Button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <li key={r.id} className="flex h-11 items-center justify-between rounded-[10px] bg-paper-2 px-3.5 text-[14px]" style={{ viewTransitionName: name("row", r.id) }}>
            <span className="text-ink">{r.name}</span>
            <span className="font-mono text-[13px] tabular-nums text-ink-2">${r.price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
