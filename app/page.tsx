import Link from "next/link";
import CopyChip from "@/components/ui-site/CopyChip";
import LitText from "@/components/ui-site/LitText";
import SwapWord from "@/components/ui-site/SwapWord";
import Showcase from "@/components/ui-site/Showcase";
import KitGrid from "@/components/ui-site/KitGrid";
import UiGrid from "@/components/ui-site/UiGrid";
import { kitItems } from "@/lib/kit";
import { labBlocks } from "@/lib/lab";

// The showcase: specimens that read best on their own, one at a time.
const FEATURED = ["price-chart", "card-checkout", "add-to-cart", "order-book", "payment-status", "cart-drawer"];

const HEADLINE = ["Interfaces", "that", "feel"];
const FEELS = ["alive.", "tactile.", "weighty.", "playful.", "honest."];

const STORY =
  "Most UI kits look fine in a screenshot. Then you click around and nothing feels like anything. **These come out of client work at Astabyte.** A chart traders scrub all day. A card form that has to feel safe. A cart that makes one more item feel good. We tuned each one **until it moved like a real object,** and kept the code **short enough to read in one sitting.**";

export default function UiHome() {
  const bySlug = new Map(labBlocks.map((b) => [b.slug, b]));
  const picks = FEATURED.map((s) => bySlug.get(s)).filter((b) => b !== undefined);
  const stats: [string, string][] = [
    [String(kitItems.length), "components"],
    [String(labBlocks.length), "motion experiments"],
    ["3", "layers, atoms up"],
  ];

  return (
    <>
      <section className="px-shell pb-16 pt-12 sm:pb-20 sm:pt-20">
        <Link href="#kit" className="ui-rise btn btn-quiet btn-sm max-w-full !pl-1 font-normal text-ink-2">
          <span className="shrink-0 rounded-[5px] bg-accent px-2 font-mono text-[11.5px] uppercase leading-5 tracking-wider text-white">New</span>
          <span className="truncate">Tool dock, file card, workspace switcher and a properties panel</span>
          <span className="btn-arrow" />
        </Link>
        <h1 className="display mt-10 text-[clamp(2.9rem,7.4vw,7.2rem)] leading-[1.02]">
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
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
          <div>
            <p className="ui-rise max-w-xl text-[clamp(1.05rem,1.4vw,1.2rem)] leading-relaxed text-ink-2" style={{ animationDelay: "420ms" }}>
              A React kit built up from the smallest piece, plus a lab of motion experiments with physics and real resistance. Tuned by hand for{" "}
              <b className="font-semibold text-ink">pointer, touch and keys.</b> Add one with the shadcn CLI and the code is yours.
            </p>
            <div className="ui-rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "520ms" }}>
              <Link href="#kit" className="btn btn-primary btn-lg">
                Browse components <span className="btn-arrow down" />
              </Link>
              <Link href="/introduction" className="btn btn-quiet btn-lg">
                Read the docs
              </Link>
            </div>
          </div>
          <div className="ui-rise" style={{ animationDelay: "600ms" }}>
            <CopyChip text="pnpm dlx asta-ui@latest add button" label="pnpm dlx asta-ui add button" />
            <p className="mt-3 flex items-center gap-2 text-[13px] text-mute">
              <span className="kbd">Click</span> the framed word to swap it
            </p>
          </div>
        </div>

        <dl className="ui-rise mt-16 grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ animationDelay: "680ms" }}>
          {stats.map(([n, l]) => (
            <div key={l} className="rounded-xl bg-paper-2 px-5 py-4">
              <dt className="sr-only">{l}</dt>
              <dd>
                <span className="display block text-[clamp(1.8rem,3vw,2.6rem)] tabular-nums">{n}</span>
                <span className="mt-1 block text-[14px] text-mute">{l}</span>
              </dd>
            </div>
          ))}
          <div className="rounded-xl bg-paper-2 px-5 py-4">
            <dt className="sr-only">Stack</dt>
            <dd>
              <span className="display block text-[clamp(1.8rem,3vw,2.6rem)]">React 19</span>
              <span className="mt-1 block text-[14px] text-mute">Tailwind v4 · Radix or Base UI</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="px-shell" aria-labelledby="featured">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="label text-accent">§ 01 · Featured</p>
            <h2 id="featured" className="display mt-3 text-[clamp(2rem,4.4vw,3.6rem)]">Try one</h2>
          </div>
          <span className="hidden text-[15px] text-mute sm:block">Every stage is live: drag, type, hover</span>
        </div>
        <Showcase picks={picks} />
      </section>

      <section id="kit" className="mt-28 scroll-mt-8" aria-label="The kit">
        <div className="px-shell mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label text-accent">§ 02 · Atoms → Molecules → Organisms</p>
            <h2 className="display mt-3 text-[clamp(2rem,4.4vw,3.6rem)]">The kit</h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-mute sm:text-right">
            Built up from the smallest piece. Every demo is live: click, type and tab through them.
          </p>
        </div>
        <KitGrid />
      </section>

      <section className="px-shell mt-28" aria-label="Why we made these">
        <LitText text={STORY} className="mx-auto max-w-4xl text-[clamp(1.4rem,2.6vw,2.15rem)] font-medium leading-[1.3] tracking-[-0.02em]" />
        <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Physics, not tweens", "Springs, inertia and friction, so things settle the way objects do."],
            ["Every input", "Pointer, touch and keyboard each get a proper path, not an afterthought."],
            ["Copy or install", "Drop the file in your repo with one command, or pnpm add asta-ui and import it."],
            ["Yours to change", "Plain React + Tailwind v4. Read it, fork it, ship it."],
          ].map(([t, d], i) => (
            <div key={t} className="rounded-xl bg-paper-2 p-6">
              <span className="label tabular-nums text-accent">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-6 text-[18px] font-medium tracking-[-0.01em]">{t}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-mute">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="components" className="mt-28 scroll-mt-8">
        <div className="px-shell mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="label text-accent">§ 03 · Physics, springs, resistance</p>
            <h2 className="display mt-3 text-[clamp(2rem,4.4vw,3.6rem)]">Motion lab</h2>
          </div>
          <span className="hidden text-[15px] text-mute sm:block">Open one for code and install</span>
        </div>
        <UiGrid blocks={labBlocks} limit={6} />
      </section>

      <section className="px-shell mt-28" aria-label="Get started">
        <div className="relative overflow-hidden rounded-2xl bg-paper-2 px-6 py-14 text-center sm:px-12 sm:py-20">
          <p className="label text-accent">Get started</p>
          <h2 className="display mx-auto mt-4 max-w-[16ch] text-[clamp(2.2rem,5vw,4.4rem)] text-ink">Add your first component.</h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-ink-2">One command copies the file into your repo. Change it like any other code you own.</p>
          <div className="mx-auto mt-9 flex max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <CopyChip text="pnpm dlx asta-ui@latest init" label="pnpm dlx asta-ui init" />
            </div>
            <Link href="/installation" className="btn btn-primary btn-lg shrink-0 justify-center">
              Installation <span className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
