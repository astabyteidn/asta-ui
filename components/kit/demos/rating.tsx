"use client";

import { useState } from "react";
import { Rating } from "@/components/kit/rating";

const WORDS = ["Tap a star", "Not for me", "Could be better", "It was fine", "Really good", "Loved it"];

const REVIEWS = [
  { name: "Maya R.", stars: 5, text: "Clear lessons, and the exercises actually stick." },
  { name: "Tomás K.", stars: 4.5, text: "Great pace. The last module felt a bit rushed." },
];

export default function RatingDemo() {
  const [stars, setStars] = useState(0);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="rounded-xl bg-paper-2 p-5">
          <p className="text-[12px] text-mute">Motion Design Basics · Lesson 12 of 12</p>
          <p className="mt-1 text-[15px] font-medium tracking-[-0.01em] text-ink">How was this course?</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <Rating label="Rate this course" value={stars} onChange={setStars} />
            <span className="text-[13px] text-ink-2">{WORDS[Math.ceil(stars)]}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-medium tabular-nums tracking-[-0.03em] text-ink">4.7</span>
            <Rating readOnly size="sm" value={4.5} allowHalf label="Average rating" />
            <span className="text-[12.5px] text-mute">1,284 reviews</span>
          </div>
          {REVIEWS.map((r) => (
            <div key={r.name} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-ink">{r.name}</span>
                <Rating readOnly size="sm" value={r.stars} allowHalf label={`${r.name}'s rating`} />
              </div>
              <p className="text-[13px] leading-relaxed text-ink-2">{r.text}</p>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4">
            <p className="text-[14px] text-ink-2">Half stars</p>
            <Rating label="Rate with half stars" size="sm" allowHalf defaultValue={3.5} />
          </div>
        </div>

        <p className="text-center text-[12.5px] text-mute">Hover to preview, click to rate, click again to clear. Arrow keys work too.</p>
      </div>
    </div>
  );
}
