"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { FloatingNavbar } from "@/components/kit/variants/navbar-aui-010";

const FRAME =
  "relative w-full max-w-[920px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";

const SHOWS = [
  { date: "12 Sep – 30 Nov", title: "Fields in June", note: "Impressionist landscapes, 41 works", price: "€18" },
  { date: "4 Oct – 12 Jan", title: "Light on Water", note: "River scenes and studies", price: "€16" },
  { date: "Every Thursday", title: "Late opening", note: "Galleries open until 22:00", price: "Free" },
];
const at = (n: number) => ({ "--i": n }) as CSSProperties;

export default function Demo({ image = "/lab/art/poppies.webp", imageAlt = "Claude Monet, Poppy Field (1873): a red poppy meadow under a pale sky" }: { image?: string; imageAlt?: string }) {
  const page = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);

  // Hint once: scroll a little so the bar tucks in, then come back.
  useEffect(() => {
    const el = page.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = setTimeout(() => el.scrollTo({ top: 120, behavior: "smooth" }), 1600);
    const b = setTimeout(() => el.scrollTo({ top: 0, behavior: "smooth" }), 3200);
    const stop = () => {
      clearTimeout(a);
      clearTimeout(b);
    };
    el.addEventListener("wheel", stop, { passive: true, once: true });
    el.addEventListener("pointerdown", stop, { once: true });
    return () => {
      stop();
      el.removeEventListener("wheel", stop);
      el.removeEventListener("pointerdown", stop);
    };
  }, []);

  const parallax = (e: React.PointerEvent<HTMLElement>) => {
    const el = art.current;
    if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translate(${x * -14}px, ${y * -10}px)`;
  };

  return (
    <div className="flex w-full items-center justify-center p-3 sm:p-6">
      <style href="asta-demo-navbar-aui-010" precedence="asta">{`
        @keyframes demo-010-art { from { opacity: 0; transform: scale(1.06); } }
        @keyframes demo-010-rise { from { opacity: 0; transform: translateY(14px); } }
        .demo-010-art { animation: demo-010-art 1.4s cubic-bezier(.16,1,.3,1) both; }
        .demo-010-in { animation: demo-010-rise .8s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(350ms + var(--i, 0) * 60ms); }
        @media (prefers-reduced-motion: reduce) { .demo-010-art, .demo-010-in { animation: none; } }
      `}</style>
      <div className={FRAME}>
        <div ref={page} className="h-[360px] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <FloatingNavbar scrollRoot={page} />

          <section onPointerMove={parallax} className="relative -mt-[60px] flex h-[388px] items-end overflow-hidden @container sm:-mt-[64px]">
            <div ref={art} className="absolute -inset-4 transition-transform duration-700 ease-out">
              <img src={image} alt={imageAlt} loading="lazy" decoding="async" className="demo-010-art h-full w-full object-cover" />
            </div>
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.62),rgb(0_0_0/0.18)_55%,transparent)]" />
            <div className="relative w-full p-6 pb-7 text-white sm:px-10">
              <p style={at(0)} className="demo-010-in font-mono text-[11px] uppercase tracking-[0.08em] text-white/75">
                Now showing · Hall 2
              </p>
              <h1 style={at(1)} className="demo-010-in mt-3 max-w-[22ch] font-serif text-[clamp(1.9rem,4.6vw,2.5rem)] font-normal leading-[1.02] tracking-[-0.02em]">
                A summer that never quite ended.
              </h1>
              <div style={at(2)} className="demo-010-in mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13.5px] font-medium text-black transition-transform duration-300 hover:-translate-y-px">
                  Plan your visit
                </a>
                <p className="text-[13px] text-white/75">Open daily 10:00 – 18:00</p>
              </div>
            </div>
          </section>

          <section className="px-6 py-10 sm:px-10">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-[20px] font-medium tracking-[-0.02em] text-ink">This season</h2>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-[13px] font-medium text-brand">
                All exhibitions →
              </a>
            </div>
            <ul className="mt-4">
              {SHOWS.map((s) => (
                <li key={s.title} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 rounded-[10px] px-1 py-4 sm:grid-cols-[150px_1fr_auto]">
                  <span className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-mute sm:order-none">{s.date}</span>
                  <span className="col-span-2 sm:col-span-1">
                    <span className="block text-[15px] font-medium text-ink">{s.title}</span>
                    <span className="block text-[13px] text-mute">{s.note}</span>
                  </span>
                  <span className="row-start-1 text-right text-[14px] font-medium text-ink sm:row-auto">{s.price}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
