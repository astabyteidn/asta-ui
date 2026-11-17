"use client";

import { useState } from "react";
import { TagInput } from "@/components/kit/tag-input";

const IDEAS = ["Motion", "Tailwind", "Accessibility", "Design systems"];

export default function TagInputDemo() {
  const [tags, setTags] = useState(["React", "Next.js", "TypeScript"]);

  return (
    <div className="relative flex min-h-[420px] w-full flex-col items-center justify-center gap-5 p-6 sm:p-10">
      <TagInput label="Skills" value={tags} onChange={setTags} max={6} placeholder="Add a skill" className="max-w-md" />
      <div className="flex max-w-md flex-wrap items-center justify-center gap-1.5">
        <span className="text-[12px] text-mute">Try:</span>
        {IDEAS.map((t) => (
          <button
            key={t}
            type="button"
            disabled={tags.length >= 6}
            onClick={() => !tags.some((x) => x.toLowerCase() === t.toLowerCase()) && setTags([...tags, t])}
            className="h-7 rounded-md px-2.5 text-[12px] text-ink-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-40"
          >
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
}
