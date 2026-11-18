"use client";

import { useState } from "react";
import { FileUpload } from "@/components/kit/file-upload";

// No network here: progress is faked with uneven ticks, like a real upload.
const fakeUpload = (file: File, setProgress: (p: number) => void) =>
  new Promise<void>((resolve) => {
    let p = 0;
    const speed = Math.max(0.04, Math.min(0.22, 400_000 / Math.max(file.size, 1)));
    const tick = () => {
      p = Math.min(1, p + speed * (0.4 + Math.random()));
      setProgress(p);
      if (p >= 1) resolve();
      else setTimeout(tick, 120 + Math.random() * 160);
    };
    setTimeout(tick, 200);
  });

export default function FileUploadDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <p className="text-[14px] font-medium tracking-[-0.01em] text-ink">Brand assets</p>
          <p className="text-[12.5px] tabular-nums text-mute">{count} / 5 uploaded</p>
        </div>
        <FileUpload accept="image/png,image/jpeg,image/svg+xml,application/pdf" maxSize={5 * 1024 * 1024} maxFiles={5} hint="PNG, JPG, SVG or PDF · up to 5 MB" onUpload={fakeUpload} onChange={(files) => setCount(files.length)} />
        <p className="text-center text-[12.5px] text-mute">Drop files or press Enter to browse. Nothing leaves your device.</p>
      </div>
    </div>
  );
}
