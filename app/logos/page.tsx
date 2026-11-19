import type { Metadata } from "next";
import { LOGO_CATEGORIES, LOGOS } from "@/components/logos/logos";
import LogoGrid from "@/components/ui-site/LogoGrid";

export const metadata: Metadata = {
  title: "Logos",
  description: "Logos of well-known tools, frameworks and brands as clean SVG. Search, pick mono or brand colour, click to copy the SVG or a React component.",
};

/** Brand logos to copy. Separate from Astabyte Icons, which we draw ourselves. */
export default function Logos() {
  return (
    <div className="px-shell pt-10 sm:pt-16">
      <p className="label text-accent">
        Logos · {LOGOS.length} brands · {LOGO_CATEGORIES.length} groups
      </p>
      <h1 className="display mt-4 max-w-3xl text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95]">Logos, ready to paste.</h1>
      <p className="mt-6 max-w-xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-normal text-ink-2">
        The tools and brands you put in a footer or a stack list. Click one to copy the SVG.
      </p>

      <LogoGrid />

      <p className="mt-16 max-w-2xl text-[14px] leading-relaxed text-mute">
        Logos are trademarks of their owners. Showing one here does not mean they endorse us. Use them to point at a product, and follow each brand&apos;s own guidelines. Paths come from{" "}
        <a href="https://simpleicons.org" className="text-ink-2 underline decoration-[color-mix(in_srgb,currentColor_30%,transparent)] underline-offset-4 hover:text-ink">
          Simple Icons
        </a>{" "}
        (CC0).
      </p>
    </div>
  );
}
