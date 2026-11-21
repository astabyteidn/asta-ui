"use client";

import { useState } from "react";
import { ChartCard } from "@/components/kit/chart-card";
import { SegmentedControl } from "@/components/kit/segmented-control";

// A deterministic wobble, so the numbers look real but never change between renders.
const wave = (n: number, base: number, amp: number, seed: number, trend = 0) =>
  Array.from({ length: n }, (_, i) => Math.round(base + trend * i + amp * (Math.sin(i * 0.9 + seed) * 0.6 + Math.sin(i * 0.37 + seed * 2) * 0.4)));

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RANGES = {
  "7d": { labels: DAYS, now: wave(7, 6200, 1400, 1, 260), prev: wave(7, 5600, 1100, 4, 120), total: "$48,250", delta: 12.4 },
  "30d": { labels: Array.from({ length: 30 }, (_, i) => `Nov ${i + 1}`), now: wave(30, 5400, 1500, 2, 70), prev: wave(30, 5100, 1200, 5, 40), total: "$196,480", delta: 8.1 },
  "12m": { labels: MONTHS, now: wave(12, 120000, 26000, 3, 9000), prev: wave(12, 110000, 22000, 6, 5000), total: "$2.06M", delta: 21.7 },
};
type Range = keyof typeof RANGES;

const money = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(n >= 1e5 ? 0 : 1)}k` : `$${Math.round(n)}`);
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(Math.round(n)));

export default function ChartCardDemo() {
  const [range, setRange] = useState<Range>("7d");
  const [week, setWeek] = useState("this");
  const r = RANGES[range];
  const orders = week === "this" ? [182, 214, 196, 240, 268, 151, 129] : [160, 171, 202, 188, 230, 166, 118];

  return (
    <div className="flex min-h-[640px] w-full items-center justify-center p-3 sm:p-6">
      <div className="grid w-full max-w-[960px] gap-3 md:grid-cols-2">
        <ChartCard
          className="md:col-span-2"
          title="Revenue"
          value={r.total}
          delta={r.delta}
          deltaLabel="vs last period"
          type="area"
          label={`Revenue, ${range}`}
          labels={r.labels}
          series={[
            { label: "This period", data: r.now },
            { label: "Last period", data: r.prev },
          ]}
          format={money}
          height={220}
          actions={
            <SegmentedControl
              size="sm"
              label="Range"
              value={range}
              onChange={(v) => setRange(v as Range)}
              segments={[
                { value: "7d", label: "7D" },
                { value: "30d", label: "30D" },
                { value: "12m", label: "12M" },
              ]}
            />
          }
        />
        <ChartCard
          title="Orders"
          value={orders.reduce((a, b) => a + b, 0).toLocaleString("en-US")}
          delta={week === "this" ? 4.6 : -2.3}
          type="bar"
          label="Orders per day"
          labels={DAYS}
          series={[{ label: "Orders", data: orders }]}
          format={compact}
          height={170}
          actions={
            <SegmentedControl
              size="sm"
              label="Week"
              value={week}
              onChange={setWeek}
              segments={[
                { value: "last", label: "Last" },
                { value: "this", label: "This" },
              ]}
            />
          }
        />
        <ChartCard title="Active users" value="3,912" delta={-1.8} deltaLabel="this week" type="line" label="Daily active users" labels={DAYS} series={[{ label: "Users", data: [3640, 3820, 3710, 4050, 3980, 3480, 3912] }]} format={compact} height={170} />
      </div>
    </div>
  );
}
