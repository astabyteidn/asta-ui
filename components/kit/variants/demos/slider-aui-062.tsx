"use client";

import { useEffect, useState } from "react";
import { StepSlider } from "@/components/kit/variants/slider-aui-062";

export default function Demo() {
  const [step, setStep] = useState(2);
  // One hint after mount: the thumb snaps one step up with a little overshoot.
  useEffect(() => {
    const t = setTimeout(() => setStep((s) => (s === 2 ? 4 : s)), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-[340px] w-full items-center justify-center p-5 sm:p-8">
      <StepSlider value={step} onValueChange={setStep} />
    </div>
  );
}
