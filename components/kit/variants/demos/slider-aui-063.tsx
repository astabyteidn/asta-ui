"use client";

import { useEffect, useState } from "react";
import { VolumeSlider } from "@/components/kit/variants/slider-aui-063";

export default function Demo() {
  const [volume, setVolume] = useState(64);
  const [touched, setTouched] = useState(false);
  // One hint after mount: volume dips low (waves drop away), then comes back up.
  useEffect(() => {
    if (touched) return;
    const a = setTimeout(() => setVolume(18), 1300);
    const b = setTimeout(() => setVolume(82), 2300);
    const c = setTimeout(() => setTouched(true), 2400);
    return () => [a, b, c].forEach(clearTimeout);
  }, [touched]);
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center p-5 sm:p-8">
      <VolumeSlider
        value={volume}
        onValueChange={(v) => {
          setTouched(true);
          setVolume(v);
        }}
      />
    </div>
  );
}
