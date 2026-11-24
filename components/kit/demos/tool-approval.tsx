"use client";

import { useState } from "react";
import { ToolApproval, type ToolCallRequest } from "@/components/kit/tool-approval";

const CALLS: ToolCallRequest[] = [
  {
    id: "c1",
    tool: "run_sql",
    kind: "sql",
    source: "Postgres · billing-prod",
    summary: "Count active subscriptions per plan for the migration report.",
    code: "select plan_id, count(*) as active\nfrom subscriptions\nwhere status = 'active'\ngroup by plan_id\norder by active desc;",
    risk: "read",
  },
  {
    id: "c2",
    tool: "edit_file",
    kind: "file",
    source: "astabyte/billing-service",
    summary: "Switch the Team plan to metered pricing.",
    diff: {
      file: "src/plans.ts",
      lines: [" export const team = {", "-  price: { seat: 1200 },", "+  price: { unit: 0.4, included: 50_000 },", "+  meter: \"api_requests\",", " };"],
    },
    risk: "write",
  },
  {
    id: "c3",
    tool: "run_sql",
    kind: "sql",
    source: "Postgres · billing-prod",
    summary: "Check that no Team account is left on seat pricing.",
    code: "select count(*) from subscriptions\nwhere plan_id = 'team' and price_model = 'seat';",
    risk: "read",
  },
  {
    id: "c4",
    tool: "send_email",
    kind: "mail",
    source: "Astabyte Mail",
    summary: "Tell Team admins about the new pricing.",
    args: { to: "Team plan admins (214)", subject: "Your plan moves to usage pricing on Jan 1", template: "pricing-change-v2" },
    risk: "destructive",
    note: "Sends to 214 people",
  },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ToolApprovalDemo() {
  const [round, setRound] = useState(0);

  // Pretend to run the tool. Denied calls don't run.
  const run = async (call: ToolCallRequest, decision: string) => {
    if (decision === "deny") return;
    await wait(call.kind === "sql" ? 700 + Math.random() * 600 : 1100);
  };

  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center gap-4 p-4 sm:p-10">
      <div className="w-full max-w-[520px]">
        <ToolApproval key={round} calls={CALLS} onDecide={run} />
      </div>
      <div className="flex w-full max-w-[520px] items-center justify-between gap-3 text-[12.5px] text-mute">
        <span>Focus the card, then Enter allows and Esc denies.</span>
        <button
          type="button"
          onClick={() => setRound((r) => r + 1)}
          className="shrink-0 rounded-md px-2 py-1 font-medium text-brand outline-none transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)] focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          Replay requests
        </button>
      </div>
    </div>
  );
}
