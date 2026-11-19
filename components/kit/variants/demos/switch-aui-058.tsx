"use client";

import { useEffect, useRef } from "react";
import { SettingSwitch } from "@/components/kit/variants/switch-aui-058";

export default function Demo() {
  const box = useRef<HTMLDivElement>(null);
  // One hint after mount: the digest switch is flipped, so the save spinner and tick play once.
  useEffect(() => {
    const t = setTimeout(() => box.current?.querySelectorAll<HTMLButtonElement>("[role=switch]")[1]?.click(), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={box} className="flex min-h-[380px] w-full items-center justify-center p-5 sm:p-8">
      <SettingSwitch />
    </div>
  );
}
