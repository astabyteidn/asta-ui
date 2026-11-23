"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/kit/button";
import { Citations, type CitationSource } from "@/components/kit/citations";

const SOURCES: CitationSource[] = [
  {
    title: "Q3 2026 self-serve revenue review",
    domain: "finance.astabyte.com",
    date: "Oct 2026",
    snippet: "Self-serve revenue reached $412K in Q3, up 23% on Q2. Annual plans made up 58% of new bookings, the highest share since launch.",
    quote: "up 23% on Q2",
  },
  {
    title: "Why usage-based pricing lifts expansion revenue",
    domain: "pricinglab.io",
    date: "Aug 2026",
    snippet: "Teams on metered plans expanded 1.4× faster in their first year, mostly because seats stopped being the thing people argued about.",
    quote: "expanded 1.4× faster in their first year",
  },
  {
    title: "Checkout funnel, September cohort",
    domain: "analytics.astabyte.com",
    date: "Sep 2026",
    snippet: "Moving the plan picker before sign-up cut checkout drop-off from 31% to 22% for new visitors on mobile.",
    quote: "cut checkout drop-off from 31% to 22%",
  },
  {
    title: "The state of B2B churn, 2026 edition",
    domain: "churnbench.report",
    date: "Jul 2026",
    snippet: "Median monthly logo churn for small-team SaaS sits at 3.1%. Products with an annual default land closer to 1.9%.",
    quote: "closer to 1.9%",
  },
  {
    title: "Support tickets tagged billing, Q3",
    domain: "help.astabyte.com",
    date: "Oct 2026",
    snippet: "Billing tickets fell 17% after the invoice page redesign, with refund requests down by a third.",
    quote: "Billing tickets fell 17%",
  },
];

const ANSWER = `Self-serve revenue grew 23% in Q3, to $412K, and annual plans now make up most new bookings [1]. That fits the wider pattern: teams on metered plans tend to expand faster in their first year [2].

The biggest single lift came from checkout. Showing the plan picker before sign-up cut mobile drop-off from 31% to 22% [3]. Churn is also trending toward the annual-plan benchmark [1, 4], and fewer billing tickets suggest the new invoice page helped [5].`;

export default function CitationsDemo() {
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const askAgain = () => {
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 1400);
  };

  return (
    <div className="flex min-h-[520px] w-full justify-center p-4 py-10 sm:p-10">
      <div className="flex w-full max-w-[640px] flex-col gap-5">
        <p className="self-end rounded-xl bg-paper-2 px-3.5 py-2.5 text-[14px] text-ink">How did self-serve revenue do in Q3?</p>
        <Citations text={ANSWER} sources={SOURCES} loading={loading} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-mute">Hover a number to preview it. Hover a source to find it in the text.</p>
          <Button size="xs" variant="ghost" onClick={askAgain} disabled={loading}>
            Ask again
          </Button>
        </div>
      </div>
    </div>
  );
}
