import type { Metadata } from "next";
import Icon from "@/components/icons/Icon";
import { ICONS } from "@/components/icons/icons";
import IconGrid from "@/components/ui-site/IconGrid";

export const metadata: Metadata = {
  title: "Icons",
  description: "Astabyte Icons: a small set we draw ourselves. One grid, one stroke, a small move on hover. Copy any of them as SVG.",
};

const RULES = [
  ["24 grid, 1.75 stroke", "Round caps and joins. No fill, so they take the text colour on light and dark."],
  ["A move for each", "Put icon-hover on a parent and the icon plays its own motion on hover and focus."],
  ["Copy the SVG", "Click any icon. Paste it in React, HTML, Figma, anywhere."],
] as const;

/** Astabyte Icons. Its own thing, separate from the component kit. */
export default function Icons() {
  return (
    <div className="px-shell pt-10 sm:pt-16">
      <p className="label text-accent">Astabyte Icons · {Object.keys(ICONS).length} and counting</p>
      <h1 className="display mt-4 max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95]">Icons that move a little.</h1>
      <p className="mt-6 max-w-xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-normal text-ink-2">
        A small set we draw ourselves. Hover one to see it move. Click to copy the SVG.
      </p>

      <IconGrid />

      <section className="mt-16 grid gap-3 sm:grid-cols-3" aria-label="How they're drawn">
        {RULES.map(([t, d], i) => (
          <div key={t} className="rounded-xl bg-paper-2 p-6">
            <span className="label tabular-nums text-accent">§ {String(i + 1).padStart(2, "0")}</span>
            <p className="mt-6 flex items-center gap-2 text-[18px] font-medium tracking-[-0.01em]">{t}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-mute">{d}</p>
          </div>
        ))}
      </section>
      <p className="mt-8 flex items-center gap-2 text-[15px] text-mute">
        <Icon name="sparkle" className="h-4 w-4 text-brand" /> More icons, and ones that animate on their own, are on the way.
      </p>
    </div>
  );
}
