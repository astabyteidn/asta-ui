"use client";

import { CenteredFooter } from "@/components/kit/variants/footer-aui-026";

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[880px] overflow-hidden rounded-[14px] bg-paper p-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <figure className="flex flex-col items-center px-6 pb-10 pt-9 text-center">
          <blockquote className="max-w-[40ch] text-[17px] leading-snug tracking-[-0.015em] text-ink sm:text-[19px]">
            “We moved our whole release process to Astabyte in a week. Shipping went from a Friday ritual to something nobody notices.”
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3 text-left">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-[12px] font-semibold text-ink">MR</span>
            <span>
              <span className="block text-[13.5px] font-medium text-ink">Maya Rahman</span>
              <span className="block text-[12px] text-mute">Head of Platform, Globex</span>
            </span>
          </figcaption>
        </figure>
        <CenteredFooter />
      </div>
    </div>
  );
}
