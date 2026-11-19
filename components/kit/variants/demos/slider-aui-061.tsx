"use client";

import { useEffect, useState } from "react";
import { BubbleSlider } from "@/components/kit/variants/slider-aui-061";

export default function Demo() {
  const [budget, setBudget] = useState(2400);
  // One hint after mount: the thumb glides up and the bubble digits roll.
  useEffect(() => {
    const t = setTimeout(() => setBudget((b) => (b === 2400 ? 6200 : b)), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-[340px] w-full items-center justify-center p-5 sm:p-8">
      <BubbleSlider value={budget} onValueChange={setBudget} />
    </div>
  );
}
