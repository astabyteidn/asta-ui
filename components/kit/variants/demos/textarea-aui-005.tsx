"use client";

import { MarkdownTextarea } from "@/components/kit/variants/textarea-aui-005";

export default function Demo() {

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md">
        <MarkdownTextarea rows={5} aria-label="Comment" name="comment" placeholder="Write a comment…" defaultValue={"Shipped the new onboarding.\nSelect a word and press ⌘B."} />
      </div>
    </div>
  );
}
