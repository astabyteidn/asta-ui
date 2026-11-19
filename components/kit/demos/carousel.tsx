"use client";

import { Carousel } from "@/components/kit/carousel";

const QUOTES = [
  { text: "We moved our checkout over in a weekend. Conversion went up the first week.", name: "Maya Rahman", role: "Head of Product, design studio" },
  { text: "The components feel finished. We stopped arguing about spacing in review.", name: "Tomás Keller", role: "Design Lead, fintech startup" },
  { text: "Keyboard support out of the box saved us a full accessibility sprint.", name: "Ana Lindqvist", role: "Engineer, Parcel & Co" },
];

export default function CarouselDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md">
        <Carousel label="What customers say" autoplay={5000} loop>
          {QUOTES.map((q) => (
            <figure key={q.name} className="flex min-h-[220px] flex-col justify-between gap-8 rounded-[14px] bg-paper-2 p-6">
              <blockquote className="text-[18px] leading-snug tracking-[-0.02em] text-ink">“{q.text}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[12px] font-medium text-paper">
                  {q.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <span>
                  <span className="block text-[13.5px] font-medium text-ink">{q.name}</span>
                  <span className="block text-[12px] text-mute">{q.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
        <p className="mt-6 text-center text-[12.5px] text-mute">Swipe, drag or use the arrow keys. Hover to pause.</p>
      </div>
    </div>
  );
}
