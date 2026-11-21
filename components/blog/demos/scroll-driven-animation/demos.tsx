"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { useReplay } from "@/components/blog/DemoFrame";
import { GALLERY_CSS, PROGRESS_CSS, REVEAL_CSS } from "./code";

const noop = () => () => {};
/** True when the browser runs scroll-driven animations. Server render assumes yes. */
function useSupports(query: string) {
  return useSyncExternalStore(noop, () => CSS.supports(query), () => true);
}

/** Replay scrolls the box back to the start, so the timeline runs again under your own scroll. */
function useReplayScroll(box: RefObject<HTMLElement | null>, axis: "top" | "left" = "top") {
  const n = useReplay();
  useEffect(() => {
    if (!n || !box.current) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.current.scrollTo({ [axis]: 0, behavior: reduce ? "auto" : "smooth" });
  }, [n, box, axis]);
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="font-mono text-[12px] text-mute">
      {ok ? label : "Not supported here. You see the static fallback."}
    </span>
  );
}

const SECTIONS = [
  {
    h: "What changed in Astabyte 2.4",
    p: [
      "Invoices now send on the first of the month at 09:00 in the client's time zone. Before, they went out at midnight UTC, which landed in some inboxes on the wrong day.",
      "The billing page loads in 380ms on a mid-range phone, down from 1.2 seconds. Most of the win came from rendering the plan table on the server.",
    ],
  },
  {
    h: "Team seats",
    p: [
      "Owners can now invite up to 25 people per workspace on the Studio plan. Each invite expires after 7 days, and you can resend it from the members list.",
      "Removed members keep read access to comments they wrote, so threads stay readable after someone leaves.",
    ],
  },
  {
    h: "Exports",
    p: [
      "CSV exports include the project tag and the invoice number. Large exports over 10,000 rows run in the background and arrive by email.",
      "We dropped the old XLS export. It was used by 0.4% of workspaces in the last 90 days.",
    ],
  },
  {
    h: "Fixes",
    p: [
      "Dates in the activity feed no longer shift by a day for teams east of UTC+10.",
      "The search box keeps your query when you switch between projects.",
    ],
  },
];

/** A reading-progress bar driven by the article box's own scroll. No scroll listener. */
export function SdaProgress() {
  const box = useRef<HTMLDivElement>(null);
  const ok = useSupports("animation-timeline: scroll()");
  useReplayScroll(box);
  return (
    <div className="sda-progress flex h-full flex-col gap-3 p-5 sm:p-8">
      <style href="asta-blog-sda-progress" precedence="asta">
        {PROGRESS_CSS}
      </style>
      <Status ok={ok} label="Scroll the article. The bar follows the scroll position." />
      <div ref={box} className="relative h-64 overflow-y-auto overscroll-contain rounded-[12px] bg-paper-2" tabIndex={0} aria-label="Release notes">
        <div className="sticky top-0 z-10 h-1 bg-paper-2">
          <div className="bar h-full bg-brand" />
        </div>
        <article className="px-5 pb-6 pt-4">
          <p className="font-mono text-[12px] text-mute">Release notes · Nov 21</p>
          {SECTIONS.map((s) => (
            <section key={s.h} className="mt-5">
              <h4 className="text-[16px] font-medium text-ink">{s.h}</h4>
              {s.p.map((t) => (
                <p key={t} className="mt-2 text-[14px] leading-relaxed text-ink-2">
                  {t}
                </p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

const ORDERS = [
  { id: "AB-2041", item: "Studio plan, annual", who: "Lina Park", total: 1188 },
  { id: "AB-2042", item: "Extra seats × 5", who: "Omar Haddad", total: 300 },
  { id: "AB-2043", item: "Design review", who: "Sara Lindqvist", total: 640 },
  { id: "AB-2044", item: "Starter plan, monthly", who: "Kenji Mori", total: 29 },
  { id: "AB-2045", item: "Brand kit", who: "Ana Costa", total: 450 },
  { id: "AB-2046", item: "Studio plan, monthly", who: "Tom Becker", total: 99 },
  { id: "AB-2047", item: "Extra storage, 200 GB", who: "Priya Nair", total: 48 },
  { id: "AB-2048", item: "Onboarding session", who: "Diego Ruiz", total: 220 },
];

/** Cards fade and rise as they enter the scroll box. Each card has its own view() timeline. */
export function SdaReveal() {
  const box = useRef<HTMLUListElement>(null);
  const ok = useSupports("animation-timeline: view()");
  useReplayScroll(box);
  return (
    <div className="sda-reveal flex h-full flex-col gap-3 p-5 sm:p-8">
      <style href="asta-blog-sda-reveal" precedence="asta">
        {REVEAL_CSS}
      </style>
      <Status ok={ok} label="Scroll the orders. Each card rises as it enters." />
      <ul ref={box} className="flex h-64 flex-col gap-2 overflow-y-auto overscroll-contain rounded-[12px] bg-paper-2 p-2" tabIndex={0} aria-label="Recent orders">
        {ORDERS.map((o) => (
          <li key={o.id} className="card flex items-center gap-3 rounded-[10px] bg-paper px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-ink">{o.item}</span>
              <span className="block truncate text-[12px] text-mute">
                {o.who} · {o.id}
              </span>
            </span>
            <span className="font-mono text-[13px] tabular-nums text-ink">${o.total.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PHOTOS = [
  { src: "/lab/art/poppies.webp", alt: "Poppy field", w: 1200, h: 887 },
  { src: "/lab/art/parasol.webp", alt: "Woman with a parasol", w: 900, h: 1115 },
  { src: "/lab/art/wheat.webp", alt: "Wheat field", w: 1200, h: 954 },
  { src: "/lab/art/bathers.webp", alt: "Bathers by a river", w: 1200, h: 796 },
  { src: "/lab/art/hoarfrost.webp", alt: "Hoarfrost on trees", w: 1055, h: 742 },
  { src: "/lab/art/grande-jatte.webp", alt: "Park by the river", w: 1200, h: 798 },
];

/** A named scroll-timeline: the bar sits outside the track, so it uses timeline-scope to find it. */
export function SdaGallery() {
  const track = useRef<HTMLDivElement>(null);
  const ok = useSupports("(animation-timeline: view()) and (timeline-scope: none)");
  useReplayScroll(track, "left");
  return (
    <div className="sda-gallery flex h-full flex-col gap-3 p-5 sm:p-8">
      <style href="asta-blog-sda-gallery" precedence="asta">
        {GALLERY_CSS}
      </style>
      <Status ok={ok} label="Swipe or scroll sideways. The bar and the focus follow." />
      <div ref={track} className="track flex gap-3 overscroll-x-contain rounded-[12px] pb-1" tabIndex={0} aria-label="Gallery">
        {/* Spacers let the first and last photo reach the centre. */}
        <span aria-hidden className="w-[15%] shrink-0 sm:w-[28%]" />
        {PHOTOS.map((p, i) => (
          <figure key={p.src} className="photo relative h-48 w-[70%] shrink-0 snap-center overflow-hidden rounded-[10px] bg-paper-2 sm:w-[44%]">
            <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(min-width: 640px) 320px, 70vw" loading="lazy" className="h-full w-full object-cover" />
            <figcaption className="absolute bottom-2 left-2 rounded-[6px] bg-paper/85 px-2 py-0.5 font-mono text-[11px] text-ink">
              {i + 1} / {PHOTOS.length}
            </figcaption>
          </figure>
        ))}
        <span aria-hidden className="w-[15%] shrink-0 sm:w-[28%]" />
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-paper-2">
        <div className="bar h-full rounded-full bg-brand" />
      </div>
    </div>
  );
}
