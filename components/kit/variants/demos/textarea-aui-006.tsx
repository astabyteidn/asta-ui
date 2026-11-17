"use client";

import { MentionTextarea } from "@/components/kit/variants/textarea-aui-006";

const people = [
  { value: "maya", label: "Maya Chen", detail: "Design" },
  { value: "omar", label: "Omar Haddad", detail: "Engineering" },
  { value: "lena", label: "Lena Park", detail: "Product" },
  { value: "theo", label: "Theo Martin", detail: "Support" },
];
const commands = [
  { value: "assign", label: "/assign", detail: "Give this task to someone" },
  { value: "due", label: "/due", detail: "Set a due date" },
  { value: "label", label: "/label", detail: "Add a label" },
  { value: "estimate", label: "/estimate", detail: "Add an estimate" },
];

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-start justify-center p-6 pt-16 sm:p-10 sm:pt-16">
      <div className="w-full max-w-md">
        <label htmlFor="comment" className="mb-1.5 block text-[13px] font-medium text-ink">
          Comment
        </label>
        <MentionTextarea id="comment" rows={3} suggestions={{ "@": people, "/": commands }} placeholder="Type @ to mention or / for a command" />
        <p className="mt-1.5 text-[12.5px] text-mute">↑ ↓ to move, Enter or Tab to insert, Esc to close.</p>
      </div>
    </div>
  );
}
