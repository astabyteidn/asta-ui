import Link from "next/link";
import CopyChip from "@/components/ui-site/CopyChip";
import LitText from "@/components/ui-site/LitText";
import { Live, Spot } from "@/components/ui-site/Live";
import SwapWord from "@/components/ui-site/SwapWord";
import KitGrid from "@/components/ui-site/KitGrid";
import UiGrid from "@/components/ui-site/UiGrid";
import { kitItems } from "@/lib/kit";
import { labBlocks } from "@/lib/lab";

// Bento: the specimens that read best at a glance, with their grid spans.
const FEATURED: { slug: string; span: string }[] = [
  { slug: "price-chart", span: "md:col-span-5 md:row-span-2" },
  { slug: "order-book", span: "md:col-span-3 md:row-span-2" },
  { slug: "card-checkout", span: "md:col-span-4 md:row-span-2" },
  { slug: "add-to-cart", span: "md:col-span-4" },
  { slug: "payment-status", span: "md:col-span-4" },
  { slug: "candlestick", span: "md:col-span-5 md:row-span-2" },
  { slug: "cart-drawer", span: "md:col-span-3 md:row-span-2" },
];

const HEADLINE = ["Interfaces", "that", "feel"];
const FEELS = ["alive.", "tactile.", "weighty.", "playful.", "honest."];

const STORY =
  "Most UI kits look fine in a screenshot. Then you click around and nothing feels like anything. **These come out of client work at Astabyte.** A chart traders scrub all day. A card form that has to feel safe. A cart that makes one more item feel good. We tuned each one **until it moved like a real object,** and kept the code **short enough to read in one sitting.**";

export default function UiHome() {
  const bySlug = new Map(labBlocks.map((b) => [b.slug, b]));

  return (
    <>
      <section className="px-shell grid grid-cols-1 gap-12 pb-14 pt-12 sm:pt-20 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:gap-16">
        <div>
          <Link href="#kit" className="ui-rise btn btn-quiet btn-sm max-w-full !pl-1 font-normal text-ink-2">
            <span className="shrink-0 rounded-[5px] bg-accent px-2 font-mono text-[11.5px] uppercase leading-5 tracking-wider text-white">New</span>
            <span className="truncate">The kit: {kitItems.length} building blocks, from buttons to a navbar</span>
            <span className="btn-arrow" />
          </Link>
          <h1 className="display mt-12 max-w-[13ch] text-[clamp(2.9rem,7.4vw,7.2rem)] leading-[1.02]">
            <span className="sr-only">Interfaces that feel alive.</span>
            {HEADLINE.map((w, i) => (
              <span key={w} className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-hidden>
                <span className="ui-word mr-[0.24em] inline-block" style={{ animationDelay: `${120 + i * 70}ms` }}>
                  {w}
                </span>
              </span>
            ))}
            <span className="inline-block pb-[0.14em] pt-[0.3em] align-bottom">
              <span className="ui-word inline-block" style={{ animationDelay: "330ms" }}>
                <SwapWord words={FEELS} />
              </span>
            </span>
          </h1>
          <p className="ui-rise mt-8 max-w-xl text-[clamp(1.05rem,1.4vw,1.2rem)] leading-relaxed text-ink-2" style={{ animationDelay: "420ms" }}>
            A React kit built up from the smallest piece, plus a lab of motion experiments with physics and real resistance. Tuned by hand for{" "}
            <b className="font-semibold text-ink">pointer, touch and keys.</b> Add one with the shadcn CLI and the code is yours.
          </p>
          <div className="ui-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "520ms" }}>
            <Link href="#kit" className="btn btn-primary btn-lg">
              Browse components <span className="btn-arrow down" />
            </Link>
            <Link href="/introduction" className="btn btn-quiet btn-lg">
              Read the docs
            </Link>
          </div>
        </div>

        {/* Spec readout: the studio's instrument / spec-sheet habit, in the ui site's palette. */}
        <dl className="ui-rise rounded-xl bg-paper-2 p-5 text-[14px]" style={{ animationDelay: "600ms" }}>
          <p className="label mb-4 flex justify-between text-mute">
            Spec sheet <span className="tabular-nums text-accent">AB-UI</span>
          </p>
          {[
            ["Kit", `${kitItems.length} components`],
            ["Motion lab", `${labBlocks.length} experiments`],
            ["Layers", "Atoms · Molecules · Organisms"],
            ["Stack", "React 19 · Tailwind v4"],
            ["Install", "CLI, npm or copy"],
            ["Licence", "Yours to change"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-1.5">
              <dt className="text-mute">{k}</dt>
              <dd className="text-right text-ink">{v}</dd>
            </div>
          ))}
          <div className="mt-4">
            <CopyChip text="pnpm dlx asta-ui@latest add button" label="pnpm dlx asta-ui add button" />
          </div>
          <p className="mt-4 flex items-center gap-2 text-[13px] text-mute">
            <span className="kbd">Click</span> the framed word to swap it
          </p>
        </dl>
      </section>

      <section className="px-shell" aria-label="Featured components">
        <div className="grid auto-rows-[300px] grid-cols-1 gap-3 md:auto-rows-[260px] md:grid-cols-8">
          {FEATURED.map(({ slug, span }, n) => {
            const hit = bySlug.get(slug);
            if (!hit) return null;
            return (
              <Spot key={slug} className={`ui-dark ui-rise ${span}`} style={{ animationDelay: `${560 + n * 60}ms` }}>
                <Live slug={slug} />
                <Link
                  href={`/${slug}`}
                  className="btn btn-sm absolute right-3 top-3 z-10 bg-paper/80 text-ink backdrop-blur before:bg-signal hover:text-on-signal"
                >
                  {hit.title}
                  <span className="btn-arrow" />
                </Link>
              </Spot>
            );
          })}
        </div>
      </section>

      <section id="kit" className="mt-24 scroll-mt-8" aria-label="The kit">
        <div className="px-shell mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label text-accent">Atoms → Molecules → Organisms</p>
            <h2 className="display mt-3 text-[clamp(2rem,4.4vw,3.6rem)]">The kit</h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-mute sm:text-right">
            Built up from the smallest piece. Every demo is live: click, type and tab through them.
          </p>
        </div>
        <KitGrid />
      </section>

      <div className="ui-marquee mt-16 overflow-hidden py-6" aria-hidden>
        <div className="ui-marquee-track flex w-max gap-10">
          {[...labBlocks, ...labBlocks].map((b, i) => (
            <span key={i} className="display flex items-center gap-10 whitespace-nowrap text-[clamp(1.8rem,3.4vw,3rem)] text-ink/25">
              {b.title}
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>
          ))}
        </div>
      </div>

      <section className="px-shell mt-24" aria-label="Why we made these">
        <LitText text={STORY} className="mx-auto max-w-4xl text-[clamp(1.4rem,2.6vw,2.15rem)] font-medium leading-[1.3] tracking-[-0.02em]" />
      </section>

      <section className="px-shell mt-20 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Why">
        {[
          ["Physics, not tweens", "Springs, inertia and friction, so things settle the way objects do."],
          ["Every input", "Pointer, touch and keyboard each get a proper path, not an afterthought."],
          ["Copy or install", "Drop the file in your repo with one command, or pnpm add asta-ui and import it."],
          ["Yours to change", "Plain React + Tailwind v4. Read it, fork it, ship it."],
        ].map(([t, d], i) => (
          <div key={t} className="rounded-xl bg-paper-2 p-6">
            <span className="label tabular-nums text-accent">§ {String(i + 1).padStart(2, "0")}</span>
            <p className="mt-6 text-[18px] font-medium tracking-[-0.01em]">{t}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-mute">{d}</p>
          </div>
        ))}
      </section>

      <section id="components" className="mt-24 scroll-mt-8">
        <div className="px-shell mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="label text-accent">Physics, springs, resistance</p>
            <h2 className="display mt-3 text-[clamp(2rem,4.4vw,3.6rem)]">Motion lab</h2>
          </div>
          <span className="hidden text-[15px] text-mute sm:block">Open one for code and install</span>
        </div>
        <UiGrid blocks={labBlocks} />
      </section>
    </>
  );
}
