"use client";

import { useEffect, useState } from "react";
import { IconSwitch } from "@/components/kit/variants/switch-aui-059";

export default function Demo() {
  const [on, setOn] = useState(true);
  const [hinted, setHinted] = useState(false);
  // One hint after mount: notifications pause, so the slash draws through the bell.
  useEffect(() => {
    if (hinted) return;
    const t = setTimeout(() => {
      setOn(false);
      setHinted(true);
    }, 1400);
    return () => clearTimeout(t);
  }, [hinted]);
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center p-5 sm:p-8">
      <IconSwitch
        checked={on}
        onCheckedChange={(v) => {
          setHinted(true);
          setOn(v);
        }}
      />
    </div>
  );
}
