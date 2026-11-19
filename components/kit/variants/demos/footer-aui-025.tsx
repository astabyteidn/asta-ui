"use client";

import { MinimalFooter } from "@/components/kit/variants/footer-aui-025";

const POSTS = [
  { tag: "Engineering", title: "How we cut cold starts to 40 ms", date: "Nov 12", read: "6 min" },
  { tag: "Product", title: "Saved views are here, and they sync", date: "Nov 4", read: "3 min" },
  { tag: "Company", title: "Notes from our first year remote", date: "Oct 28", read: "8 min" },
];

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[880px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]">
        <section className="px-6 pb-8 pt-10 sm:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">From the journal</p>
          <h2 className="mt-3 max-w-[18ch] text-[34px] font-medium leading-[1.04] tracking-[-0.045em] text-ink sm:text-[40px]">Small notes on building calm software.</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {POSTS.map((p) => (
              <li key={p.title}>
                <a href="#" className="group/post flex h-full flex-col rounded-[12px] bg-paper-2 p-5 outline-none transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand/50">
                  <span className="text-[12px] font-medium text-brand">{p.tag}</span>
                  <span className="mt-2 text-[15px] font-medium leading-snug tracking-[-0.015em] text-ink">{p.title}</span>
                  <span className="mt-6 font-mono text-[11px] text-mute">
                    {p.date} · {p.read}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <MinimalFooter hint className="bg-paper" />
      </div>
    </div>
  );
}
