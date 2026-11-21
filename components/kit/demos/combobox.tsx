"use client";

import { useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/kit/combobox";

function Initials({ name }: { name: string }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-[9px] font-semibold text-brand">
      {name
        .split(" ")
        .map((p) => p[0])
        .join("")}
    </span>
  );
}

const people = ["Maya Lindqvist", "Jonah Reyes", "Priya Natarajan", "Theo Marchetti", "Hana Okafor", "Lucas Brandt", "Sofia Alvarez"];
const assignees: ComboboxOption[] = people.map((n, i) => ({ value: n.toLowerCase().replace(" ", "-"), label: n, icon: <Initials name={n} />, hint: i === 3 ? "Away" : undefined, disabled: i === 3 }));

const labels: ComboboxOption[] = [
  { value: "bug", label: "Bug", hint: "24" },
  { value: "feature", label: "Feature", hint: "61" },
  { value: "design", label: "Design", hint: "17" },
  { value: "docs", label: "Documentation", hint: "9" },
  { value: "perf", label: "Performance", hint: "12" },
  { value: "a11y", label: "Accessibility", hint: "6" },
  { value: "billing", label: "Billing", hint: "4" },
];

export default function ComboboxDemo() {
  const [owner, setOwner] = useState<string | null>("priya-natarajan");
  const [tags, setTags] = useState<string[]>(["feature", "design"]);

  return (
    <div className="flex min-h-[420px] w-full items-start justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <p className="text-[12px] text-mute">ENG-482</p>
          <p className="mt-0.5 text-[15px] font-medium tracking-[-0.01em] text-ink">Saved filters reset after sign-in</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium tracking-[-0.01em] text-ink">Assignee</p>
          <Combobox label="Assignee" placeholder="Search people…" options={assignees} value={owner} onChange={setOwner} emptyText="No one by that name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium tracking-[-0.01em] text-ink">Labels</p>
          <Combobox multiple label="Labels" placeholder="Add labels…" options={labels} value={tags} onChange={setTags} />
        </div>
        <p className="text-center text-[12.5px] text-mute">Type to filter, arrows to move, Enter to pick, ⌫ removes the last label.</p>
      </div>
    </div>
  );
}
