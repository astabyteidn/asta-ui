"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReplay } from "@/components/blog/DemoFrame";
import { Button } from "@/components/kit/button";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Slider } from "@/components/kit/slider";
import { STEPS_CSS } from "./code";

// Same functions as FLIP_TS in ./code.ts.
const EASE = "cubic-bezier(.16, 1, .3, 1)";

function measure(list: HTMLElement) {
  const rects = new Map<string, DOMRect>();
  for (const el of Array.from(list.children) as HTMLElement[]) {
    rects.set(el.dataset.id!, el.getBoundingClientRect());
  }
  return rects;
}

function play(list: HTMLElement, first: Map<string, DOMRect>, duration = 500) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = Array.from(list.children) as HTMLElement[];
  items.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  const last = items.map((el) => el.getBoundingClientRect());
  items.forEach((el, i) => {
    const from = first.get(el.dataset.id!);
    if (!from) return;
    const dx = from.left - last[i].left;
    const dy = from.top - last[i].top;
    if (!dx && !dy) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration, easing: EASE });
  });
}

type Task = { id: string; title: string; due: number; priority: 1 | 2 | 3 };
const TASKS: Task[] = [
  { id: "notes", title: "Write release notes", due: 24, priority: 2 },
  { id: "tax", title: "Fix checkout tax rounding", due: 22, priority: 1 },
  { id: "pricing", title: "Review the pricing page", due: 28, priority: 3 },
  { id: "emails", title: "Ship onboarding emails", due: 23, priority: 2 },
  { id: "docs", title: "Update API key docs", due: 26, priority: 3 },
];
type SortKey = "due" | "priority" | "name";
const sorted = (t: Task[], key: SortKey) =>
  [...t].sort((a, b) => (key === "due" ? a.due - b.due : key === "priority" ? a.priority - b.priority || a.due - b.due : a.title.localeCompare(b.title)));
const PRIORITY = { 1: "High", 2: "Medium", 3: "Low" } as const;

/** A task list that re-sorts with FLIP. Every row reads its position once before and once after. */
export function FlipReorder() {
  const list = useRef<HTMLUListElement>(null);
  const first = useRef<Map<string, DOMRect> | null>(null);
  const [tasks, setTasks] = useState(TASKS);
  const [key, setKey] = useState<SortKey | "manual">("manual");
  const [duration, setDuration] = useState(500);
  const n = useReplay();

  const change = (next: (t: Task[]) => Task[], k: SortKey | "manual") => {
    if (list.current) first.current = measure(list.current);
    setTasks(next);
    setKey(k);
  };
  // Replay: back to the original order, animated with the same FLIP.
  useEffect(() => {
    if (!n) return;
    const id = requestAnimationFrame(() => {
      if (list.current) first.current = measure(list.current);
      setTasks(TASKS);
      setKey("manual");
    });
    return () => cancelAnimationFrame(id);
  }, [n]);

  useLayoutEffect(() => {
    if (list.current && first.current) play(list.current, first.current, duration);
    first.current = null;
  }, [tasks, duration]);

  return (
    <div className="flex h-full flex-col gap-5 p-5 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          size="sm"
          label="Sort by"
          value={key}
          onChange={(v) => change((t) => (v === "manual" ? TASKS : sorted(t, v as SortKey)), v as SortKey | "manual")}
          segments={[
            { value: "manual", label: "Manual" },
            { value: "due", label: "Due date" },
            { value: "priority", label: "Priority" },
            { value: "name", label: "Name" },
          ]}
        />
        <Button size="sm" variant="soft" onClick={() => change((t) => [...t].sort(() => Math.random() - 0.5), "manual")}>
          Shuffle
        </Button>
        <div className="ml-auto w-full min-w-40 sm:w-48">
          <div className="flex justify-between font-mono text-[12px] text-mute">
            <span id="flip-dur">Duration</span>
            <span className="tabular-nums">{duration}ms</span>
          </div>
          <Slider aria-labelledby="flip-dur" value={duration} onValueChange={setDuration} min={200} max={1200} step={100} format={(v) => `${v}ms`} />
        </div>
      </div>
      <ul ref={list} className="flex flex-col gap-1.5">
        {tasks.map((t) => (
          <li key={t.id} data-id={t.id} className="flex h-11 items-center gap-3 rounded-[10px] bg-paper-2 px-3.5 text-[14px]">
            <span className={`h-2 w-2 shrink-0 rounded-full ${t.priority === 1 ? "bg-brand" : t.priority === 2 ? "bg-ink/50" : "bg-ink/20"}`} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-ink">{t.title}</span>
            <span className="hidden font-mono text-[12px] text-mute sm:inline">{PRIORITY[t.priority]}</span>
            <span className="w-14 text-right font-mono text-[12px] tabular-nums text-mute">Nov {t.due}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Product = { id: string; name: string; cat: "Audio" | "Desk" | "Travel"; price: number };
const PRODUCTS: Product[] = [
  { id: "phones", name: "Studio headphones", cat: "Audio", price: 189 },
  { id: "lamp", name: "Desk lamp", cat: "Desk", price: 64 },
  { id: "pouch", name: "Travel pouch", cat: "Travel", price: 28 },
  { id: "buds", name: "Wireless earbuds", cat: "Audio", price: 129 },
  { id: "stand", name: "Monitor stand", cat: "Desk", price: 79 },
  { id: "tote", name: "Carry-on tote", cat: "Travel", price: 96 },
  { id: "speaker", name: "Desk speaker", cat: "Audio", price: 149 },
  { id: "cables", name: "Cable kit", cat: "Travel", price: 19 },
];

/** A product grid that filters with FLIP: cards that stay glide to their new cell, new ones fade in. */
export function FlipFilter() {
  const grid = useRef<HTMLUListElement>(null);
  const first = useRef<Map<string, DOMRect> | null>(null);
  const [filter, setFilter] = useState("All");
  const n = useReplay();
  const pick = (f: string) => {
    if (grid.current) first.current = measure(grid.current);
    setFilter(f);
  };
  useEffect(() => {
    if (!n) return;
    const id = requestAnimationFrame(() => {
      if (grid.current) first.current = measure(grid.current);
      setFilter("All");
    });
    return () => cancelAnimationFrame(id);
  }, [n]);

  useLayoutEffect(() => {
    const el = grid.current;
    const from = first.current;
    if (!el || !from) return;
    play(el, from);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const card of Array.from(el.children) as HTMLElement[]) {
        if (from.has(card.dataset.id!)) continue;
        card.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: EASE, delay: 120, fill: "backwards" });
      }
    }
    first.current = null;
  }, [filter]);

  const shown = PRODUCTS.filter((p) => filter === "All" || p.cat === filter);
  return (
    <div className="flex h-full flex-col gap-5 p-5 sm:p-8">
      <SegmentedControl
        size="sm"
        label="Category"
        value={filter}
        onChange={pick}
        segments={["All", "Audio", "Desk", "Travel"].map((c) => ({ value: c, label: c }))}
        className="self-start"
      />
      <ul ref={grid} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {shown.map((p) => (
          <li key={p.id} data-id={p.id} className="flex h-24 flex-col justify-between rounded-[12px] bg-paper-2 p-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-mute">{p.cat}</span>
            <span>
              <span className="block truncate text-[14px] font-medium text-ink">{p.name}</span>
              <span className="block font-mono text-[12px] tabular-nums text-ink-2">${p.price}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEP_ITEMS = [
  { id: "inbox", title: "Reply to support inbox" },
  { id: "invoice", title: "Send November invoices" },
  { id: "standup", title: "Post the standup notes" },
  { id: "ship", title: "Ship Astabyte v1.0" },
];
const PINNED = [STEP_ITEMS[3], ...STEP_ITEMS.slice(0, 3)];
const STEPS = ["first", "last", "invert", "play"] as const;
const START = "Press Next step. The last task gets pinned to the top, one FLIP step at a time.";

/** FLIP slowed down to one step per click, with the numbers for each step. */
export function FlipSteps() {
  const list = useRef<HTMLUListElement>(null);
  const first = useRef(new Map<string, number>());
  const [order, setOrder] = useState(STEP_ITEMS);
  const [step, setStep] = useState(0);
  const [shift, setShift] = useState<Record<string, number>>({});
  const [note, setNote] = useState(START);
  const n = useReplay();
  const [seen, setSeen] = useState(n);

  const reset = () => {
    setOrder(STEP_ITEMS);
    setStep(0);
    setShift({});
    setNote(START);
  };
  if (seen !== n) {
    setSeen(n);
    reset();
  }

  // Positions relative to the list, read once per step.
  const tops = () => {
    const box = list.current!;
    const top = box.getBoundingClientRect().top;
    const out = new Map<string, number>();
    for (const el of Array.from(box.children) as HTMLElement[]) out.set(el.dataset.id!, Math.round(el.getBoundingClientRect().top - top));
    return out;
  };

  function next() {
    if (step === 0) {
      first.current = tops();
      setStep(1);
      setNote(`First: “Ship Astabyte v1.0” sits at y = ${first.current.get("ship")}px. Every row is measured once.`);
    } else if (step === 1) {
      flushSync(() => {
        setOrder(PINNED);
        setStep(2);
      });
      const last = tops();
      setNote(`Last: the DOM changed and the row jumped to y = ${last.get("ship")}px. No animation yet.`);
      setShift(Object.fromEntries([...last].map(([id, y]) => [id, (first.current.get(id) ?? y) - y])));
    } else if (step === 2) {
      setStep(3);
      setNote(`Invert: translateY(${shift.ship}px) puts it back where it was. On screen, nothing changed.`);
    } else if (step === 3) {
      setStep(4);
      setNote("Play: the transform goes to none over 800ms. The browser only moves pixels, no layout per frame.");
    } else reset();
  }

  return (
    <div className="flip-steps flex h-full flex-col gap-5 p-5 sm:p-8" data-step={step === 4 ? "play" : STEPS[step - 1] ?? "ready"}>
      <style href="asta-blog-flip-steps" precedence="asta">
        {STEPS_CSS}
      </style>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={next}>
          {step === 4 ? "Start over" : "Next step"}
        </Button>
        <ol className="flex gap-1 font-mono text-[12px]">
          {STEPS.map((s, i) => (
            <li key={s} className={`rounded-[6px] px-2 py-1 capitalize ${step === i + 1 ? "bg-brand text-paper" : step > i + 1 ? "bg-paper-2 text-ink" : "bg-paper-2 text-mute"}`}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </div>
      <p className="min-h-[2.75rem] text-[14px] leading-snug text-ink-2" aria-live="polite">
        {note}
      </p>
      <ul ref={list} className="flex flex-col gap-1.5">
        {order.map((t) => (
          <li
            key={t.id}
            data-id={t.id}
            className={`row flex h-11 items-center rounded-[10px] px-3.5 text-[14px] ${t.id === "ship" ? "bg-brand/10 text-brand" : "bg-paper-2 text-ink"}`}
            style={step === 3 && shift[t.id] ? { transform: `translateY(${shift[t.id]}px)` } : undefined}
          >
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
