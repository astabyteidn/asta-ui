"use client";

import { TextareaField } from "@/components/kit/variants/textarea-aui-001";

export default function Demo() {

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md">
        <TextareaField
          label="Project brief"
          hint="What are you building, and who is it for?"
          maxLength={200}
          optional
          defaultValue="A booking app for small climbing gyms. Members reserve a slot, staff see who is coming."
        />
      </div>
    </div>
  );
}
