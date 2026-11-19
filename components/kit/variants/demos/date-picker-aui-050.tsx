"use client";

import { RangeDatePicker } from "@/components/kit/variants/date-picker-aui-050";

export default function Demo() {
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center px-3 py-6 sm:p-8">
      <RangeDatePicker className="max-w-[600px]" />
    </div>
  );
}
