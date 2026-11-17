"use client";

import { ValidatedTextarea } from "@/components/kit/variants/textarea-aui-007";

const rules = [
  { label: "At least 40 characters", test: (v: string) => v.trim().length >= 40 },
  { label: "Mentions what went wrong", test: (v: string) => /\b(broke|error|crash|fail|bug|wrong|slow)/i.test(v) },
  { label: "No email addresses", test: (v: string) => !/\S+@\S+\.\S+/.test(v) },
];

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md">
        <ValidatedTextarea label="Describe the problem" rules={rules} success="Thanks, that's enough for us to look into it." placeholder="Type a little, then click outside the field" />
      </div>
    </div>
  );
}
