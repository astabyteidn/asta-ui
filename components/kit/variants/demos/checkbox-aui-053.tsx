"use client";

import { useEffect, useState } from "react";
import { TaskCheckbox } from "@/components/kit/variants/checkbox-aui-053";

export default function Demo() {
  const [done, setDone] = useState(["brief"]);
  // One hint after mount: the first task gets ticked, struck through and moves to the done pile.
  useEffect(() => {
    const t = setTimeout(() => setDone((d) => (d.includes("copy") ? d : [...d, "copy"])), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center p-5 sm:p-8">
      <TaskCheckbox done={done} onChange={setDone} />
    </div>
  );
}
