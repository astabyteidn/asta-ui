"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/kit/button";
import { TraceWaterfall, type TraceSpan } from "@/components/kit/trace-waterfall";

const RUN: TraceSpan[] = [
  { id: "run", name: "support-triage #4821", kind: "agent", start: 0, duration: 4820, output: "Refund issued and reply sent to the customer." },
  {
    id: "plan",
    parentId: "run",
    name: "Plan next step",
    kind: "llm",
    model: "Astra 2",
    start: 40,
    duration: 680,
    tokensIn: 1840,
    tokensOut: 212,
    cost: 0.0041,
    input: "Ticket #4821 from Lena Park:\n“I was charged twice for my Team plan this month. Can you refund one of them?”",
    output: "1. Look up the order and both charges.\n2. Check the refund policy.\n3. Refund the duplicate and draft a reply.",
  },
  { id: "kb", parentId: "run", name: "Search help center", kind: "retrieval", start: 760, duration: 480, input: 'query: "duplicate charge refund team plan"', output: "3 passages · best match: “Refunding a duplicate charge” (score 0.91)" },
  { id: "orders", parentId: "run", name: "orders.lookup", kind: "tool", start: 780, duration: 340, input: '{ "customer": "cus_8Hq2", "range": "30d" }', output: '{ "charges": ["ch_31A9 · $48.00", "ch_31B2 · $48.00"], "plan": "Team" }' },
  {
    id: "draft",
    parentId: "run",
    name: "Draft reply",
    kind: "llm",
    model: "Astra 2",
    start: 1300,
    duration: 1800,
    tokensIn: 3120,
    tokensOut: 486,
    cost: 0.0096,
    input: "Write a short, warm reply. Confirm the duplicate charge ch_31B2 will be refunded in 5–10 business days.",
    output: "Hi Lena, thanks for flagging this. You were charged twice on Nov 3. I've refunded the second charge of $48.00. It should reach your card in 5–10 business days.",
  },
  { id: "policy", parentId: "draft", name: "policy.check", kind: "tool", start: 1520, duration: 360, input: '{ "rule": "duplicate_charge", "amount": 48 }', output: '{ "allowed": true, "needs_approval": false }' },
  {
    id: "refund",
    parentId: "run",
    name: "payments.refund",
    kind: "tool",
    start: 3180,
    duration: 440,
    status: "error",
    error: "The card issuer declined the refund (code R05). The agent retried once.",
    input: '{ "charge": "ch_31B2", "amount": 4800 }',
    output: '{ "status": "declined", "code": "R05" }',
  },
  { id: "retry", parentId: "run", name: "payments.refund (retry)", kind: "tool", start: 3660, duration: 440, input: '{ "charge": "ch_31B2", "amount": 4800, "idempotency_key": "rf_4821_2" }', output: '{ "status": "succeeded", "refund": "re_77Kd" }' },
  {
    id: "sum",
    parentId: "run",
    name: "Summarise for support",
    kind: "llm",
    model: "Astra 2 Mini",
    start: 4140,
    duration: 640,
    tokensIn: 960,
    tokensOut: 128,
    cost: 0.0007,
    input: "Summarise what happened for the support team in two lines.",
    output: "Duplicate Team charge refunded (re_77Kd) after one issuer decline. Reply sent.",
  },
];

export default function TraceWaterfallDemo() {
  const [spans, setSpans] = useState(RUN);
  const [live, setLive] = useState(false);
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Replays the run in real time: each span appears when it starts and settles when it ends.
  const replay = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSpans([]);
    setLive(true);
    setStartedAt(Date.now());
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    for (const s of RUN) {
      at(s.start, () => setSpans((all) => [...all, { ...s, duration: undefined, output: undefined }]));
      at(s.start + s.duration!, () => setSpans((all) => all.map((x) => (x.id === s.id ? s : x))));
    }
    at(5000, () => setLive(false));
  };

  return (
    <div className="flex min-h-[560px] w-full flex-col items-center justify-center gap-3 p-4 sm:p-8">
      <div className="w-full max-w-[960px]">
        <TraceWaterfall title="support-triage · run 4821" spans={spans} live={live} startedAt={startedAt} defaultSelected="refund" />
      </div>
      <div className="flex items-center gap-3">
        <p className="text-[12.5px] text-mute">Click a span for its input and output. Arrow keys move and fold.</p>
        <Button size="xs" variant="outline" onClick={replay} disabled={live}>
          Replay live
        </Button>
      </div>
    </div>
  );
}
