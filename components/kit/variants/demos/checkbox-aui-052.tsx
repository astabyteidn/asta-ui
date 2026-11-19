"use client";

import { useEffect, useState } from "react";
import { CheckboxCard } from "@/components/kit/variants/checkbox-aui-052";

export default function Demo() {
  const [picked, setPicked] = useState(["notes", "audit"]);
  // One hint after mount: a third add-on gets picked, so the check draws and the total rolls.
  useEffect(() => {
    const t = setTimeout(() => setPicked((p) => (p.includes("guests") ? p : [...p, "guests"])), 1300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center p-5 sm:p-8">
      <CheckboxCard value={picked} onChange={setPicked} />
    </div>
  );
}
