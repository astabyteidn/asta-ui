"use client";

import { useEffect, useState } from "react";
import { SegmentRadio } from "@/components/kit/variants/radio-group-aui-056";

export default function Demo() {
  const [range, setRange] = useState("1w");
  // One hint after mount: the thumb slides to 1M, the chart redraws and the figure rolls.
  useEffect(() => {
    const t = setTimeout(() => setRange((r) => (r === "1w" ? "1m" : r)), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center p-5 sm:p-8">
      <SegmentRadio value={range} onChange={setRange} />
    </div>
  );
}
