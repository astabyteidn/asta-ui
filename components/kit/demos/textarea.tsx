"use client";

import { Textarea } from "@/components/kit/textarea";

export default function TextareaDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-md flex-col gap-2">
        <label htmlFor="brief" className="text-[13px] font-medium text-ink">
          Project brief
        </label>
        <Textarea
          id="brief"
          limit={160}
          maxRows={8}
          placeholder="What are you building, and who is it for?"
          defaultValue="A booking app for small climbing gyms. Members reserve a slot, staff see who's coming. It should feel quick on a phone."
        />
        <p className="text-[12.5px] text-mute">It grows as you type. Keep it under 160 characters.</p>
      </div>
    </div>
  );
}
