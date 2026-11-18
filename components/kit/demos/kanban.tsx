"use client";

import { Kanban, type KanbanCard } from "@/components/kit/kanban";

const COLUMNS = [
  { id: "todo", title: "To do" },
  { id: "doing", title: "In progress" },
  { id: "done", title: "Done" },
];

const CARDS: KanbanCard[] = [
  { id: "c1", column: "todo", title: "Write the onboarding email", tag: "Growth", assignee: "Rani Pratama", due: "Nov 21" },
  { id: "c2", column: "todo", title: "Audit empty states", tag: "Design", assignee: "Dimas Arya" },
  { id: "c3", column: "todo", title: "Rate limit the export endpoint", tag: "API", due: "Nov 24" },
  { id: "c4", column: "doing", title: "New pricing page", tag: "Web", assignee: "Sekar Ayu", due: "Nov 20" },
  { id: "c5", column: "doing", title: "Invoice PDF layout", tag: "Billing", assignee: "Rani Pratama" },
  { id: "c6", column: "done", title: "Move search to the command palette", tag: "Web", assignee: "Dimas Arya" },
];

export default function KanbanDemo() {
  return (
    <div className="flex min-h-[420px] w-full flex-col items-center justify-center gap-3 p-4 sm:p-8">
      <div className="w-full max-w-[860px]">
        <Kanban columns={COLUMNS} defaultCards={CARDS} />
      </div>
      <p className="text-[12.5px] text-mute">Drag a card, or focus one and press Space, then the arrow keys.</p>
    </div>
  );
}
