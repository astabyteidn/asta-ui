"use client";

import { useState } from "react";
import { NotesTextarea } from "@/components/kit/variants/textarea-aui-036";

const NOTES = `Astabyte site, kickoff with the studio team
- Hero: one headline, no carousel
- Case studies first, services second
- Rani owns copy, Dimas owns motion
- Review on Monday at 10:00`;

export default function Demo() {
  const [savedAt] = useState(() => Date.now() - 4 * 60 * 1000);
  return (
    <div className="flex min-h-[380px] w-full items-center justify-center bg-paper-2 p-5 sm:p-8">
      <NotesTextarea defaultValue={NOTES} savedAt={savedAt} rows={6} />
    </div>
  );
}
