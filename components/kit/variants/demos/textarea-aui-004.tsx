"use client";

import { FloatingLabelTextarea } from "@/components/kit/variants/textarea-aui-004";

export default function Demo() {

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-3">
          <FloatingLabelTextarea label="Delivery instructions" rows={3} />
          <FloatingLabelTextarea label="Gift message" rows={3} defaultValue="Happy birthday! See you on Saturday." />
        </div>
      </div>
    </div>
  );
}
