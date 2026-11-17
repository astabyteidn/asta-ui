"use client";

import { AutoGrowTextarea } from "@/components/kit/variants/textarea-aui-002";

export default function Demo() {

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md">
        <label htmlFor="notes" className="mb-1.5 block text-[13px] font-medium text-ink">
          Release notes
        </label>
        <AutoGrowTextarea id="notes" minRows={2} maxRows={7} placeholder="Press Enter a few times and watch it grow…" defaultValue={"Faster search.\nDark mode for the editor."} />
        <p className="mt-1.5 text-[12.5px] text-mute">Grows from 2 to 7 rows, then scrolls.</p>
      </div>
    </div>
  );
}
