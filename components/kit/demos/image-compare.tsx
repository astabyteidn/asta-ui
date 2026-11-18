"use client";

import { useState } from "react";
import { ImageCompare } from "@/components/kit/image-compare";

export default function ImageCompareDemo() {
  const [pos, setPos] = useState(50);

  return (
    <div className="flex min-h-[460px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-3">
        <ImageCompare
          value={pos}
          onValueChange={setPos}
          beforeLabel="Raw"
          afterLabel="Graded"
          label="Compare raw and graded photo"
          className="aspect-square"
          before={
            <img src="/lab/headphones.jpg" alt="Headphones, raw capture" draggable={false} className="pointer-events-none h-full w-full select-none object-cover [filter:grayscale(1)_contrast(.85)_brightness(1.06)]" />
          }
          after="/lab/headphones.jpg"
          afterAlt="Headphones, colour graded"
        />
        <div className="flex items-center justify-between px-1 text-[12.5px] text-mute">
          <span>studio-shot-04.jpg</span>
          <span className="tabular-nums">
            <span className="text-ink-2">{Math.round(pos)}%</span> raw
          </span>
        </div>
      </div>
    </div>
  );
}
