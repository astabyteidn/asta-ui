"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { AutoHideNavbar } from "@/components/kit/variants/navbar-aui-014";

const FRAME =
  "relative w-full max-w-[920px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const TITLE = "The case for slower software";
const at = (n: number) => ({ "--i": n }) as CSSProperties;

const P = [
  "Every product team I have worked with measured speed. Time to first byte, time to merge, time to ship. Nobody measured how long a decision took to settle, and that is the number that decided whether the work lasted.",
  "Slow software is not software that loads slowly. It is software that was allowed to sit for a week before anyone called it done. The rough edges show up on day three, not on day one, and most of us have already moved on by then.",
  "The teams that shipped the calmest products shared one habit. They wrote the change, used it for a few days, and only then wrote the announcement. It cost them almost nothing, and it caught the things a review never does.",
  "A week of living with a feature is cheap. Rolling it back after a launch post, a support macro and three blog mentions is not.",
  "None of this needs a process. It needs a calendar with a little air in it, and a rule that the person who built a thing is the first one to live with it.",
];

export default function Demo() {
  const page = useRef<HTMLDivElement>(null);

  // One hint: scroll into the essay so the header hands over, then come back up. Any wheel or touch cancels it.
  useEffect(() => {
    const el = page.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let off = false;
    const stop = () => {
      off = true;
    };
    const go = (top: number) => !off && el.scrollTo({ top, behavior: "smooth" });
    const timers = [setTimeout(() => go(380), 1500), setTimeout(() => go(0), 3600)];
    el.addEventListener("wheel", stop, { passive: true, once: true });
    el.addEventListener("pointerdown", stop, { once: true });
    return () => {
      timers.forEach(clearTimeout);
      el.removeEventListener("wheel", stop);
      el.removeEventListener("pointerdown", stop);
    };
  }, []);

  return (
    <div className="flex w-full items-center justify-center p-3 sm:p-6">
      <style href="asta-demo-navbar-aui-014" precedence="asta">{`
        @keyframes demo-014-rise { from { opacity: 0; transform: translateY(12px); } }
        .demo-014-in { animation: demo-014-rise .7s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(250ms + var(--i, 0) * 60ms); }
        @media (prefers-reduced-motion: reduce) { .demo-014-in { animation: none; } }
      `}</style>
      <div className={FRAME}>
        <div ref={page} className="h-[360px] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <AutoHideNavbar scrollRoot={page} title={TITLE} titleAt={180} />
          <article className="mx-auto max-w-[600px] px-5 pb-20 pt-9 sm:px-6">
            <p style={at(0)} className="demo-014-in font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
              Essay · <span className="text-brand">Craft</span> · 7 min read
            </p>
            <h1 style={at(1)} className="demo-014-in mt-4 text-[clamp(1.9rem,4.6vw,2.5rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-ink">
              {TITLE}.
            </h1>
            <p style={at(2)} className="demo-014-in mt-3 text-[15px] leading-[1.55] text-ink-2">
              Why the best tools I use were allowed to sit for a week before anyone called them finished.
            </p>
            <div style={at(3)} className="demo-014-in mt-5 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[12px] font-semibold text-paper">IR</span>
              <span className="flex flex-col">
                <span className="text-[13.5px] font-medium text-ink">Ines Romero</span>
                <span className="text-[12px] text-mute">14 Nov 2026</span>
              </span>
              <span className="ml-auto flex gap-2">
                <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-8 items-center rounded-lg bg-brand px-3 text-[13px] font-medium text-white transition-transform duration-300 hover:-translate-y-px active:scale-[.97]">
                  Follow
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="hidden h-8 items-center rounded-lg bg-paper-2 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,var(--color-paper-2))] sm:inline-flex">
                  Listen · 7:12
                </a>
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-5 text-[15px] leading-[1.7] text-ink-2">
              <p className="first-letter:float-left first-letter:mr-2 first-letter:text-[52px] first-letter:font-semibold first-letter:leading-[0.9] first-letter:tracking-[-0.04em] first-letter:text-ink">{P[0]}</p>
              <p>{P[1]}</p>
              <blockquote className="my-4 pl-5 text-[24px] font-medium leading-[1.25] tracking-[-0.03em] text-ink shadow-[inset_2px_0_0_var(--color-brand)]">
                “The rough edges show up on day three. Ship on day five.”
              </blockquote>
              <p>{P[2]}</p>
              <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.02em] text-ink">A calendar with air in it</h2>
              <p>{P[3]}</p>
              <p>{P[4]}</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
