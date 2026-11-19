"use client";

import { useEffect, useState } from "react";
import { SwatchRadio } from "@/components/kit/variants/radio-group-aui-057";

export default function Demo() {
  const [color, setColor] = useState("cobalt");
  // One hint after mount: the ring springs to Midnight, the name rolls and the icon re-colours.
  useEffect(() => {
    const t = setTimeout(() => setColor((c) => (c === "cobalt" ? "midnight" : c)), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-[340px] w-full items-center justify-center p-5 sm:p-8">
      <SwatchRadio value={color} onChange={setColor} />
    </div>
  );
}
