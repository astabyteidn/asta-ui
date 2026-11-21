"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/kit/segmented-control";
import { Testimonials, type Testimonial } from "@/components/kit/testimonials";

const ITEMS: Testimonial[] = [
  { quote: "They shipped our checkout redesign in three weeks and conversion went up the first Monday.", name: "Maya Lindqvist", title: "Head of Product, Juniper Goods", rating: 5 },
  { quote: "The design system they set up is the first one our engineers actually use.", name: "Theo Marchetti", title: "CTO, Fieldnote", rating: 5 },
  { quote: "Clear weekly demos, no surprises on the invoice. That is rarer than it should be.", name: "Priya Raman", title: "Founder, Northpeak", rating: 5 },
  { quote: "Our dashboard finally loads before the coffee does.", name: "Jonas Weber", title: "Engineering lead, Tidewater", rating: 4 },
  { quote: "Every animation has a reason. Our support tickets about 'where did it go' dropped to zero.", name: "Lena Okafor", title: "Design director, Oakline", rating: 5 },
  { quote: "They pushed back on two of our ideas and were right both times.", name: "Samir Haddad", title: "COO, Brightmill", rating: 5 },
  { quote: "Handover docs were so good we onboarded a new hire from them alone.", name: "Hana Sato", title: "Product manager, Lumen Labs", rating: 5 },
  { quote: "Fast, calm and very detailed. We'd hire them again tomorrow.", name: "Diego Alvarez", title: "CEO, Coastline Travel", rating: 5 },
];

export default function TestimonialsDemo() {
  const [variant, setVariant] = useState<"marquee" | "grid">("marquee");
  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center gap-8 py-10">
      <div className="flex flex-col items-center gap-4 px-4 text-center">
        <h2 className="max-w-[520px] text-[28px] font-medium leading-tight tracking-[-0.04em]">Teams who build with Astabyte</h2>
        <SegmentedControl
          size="sm"
          label="Layout"
          value={variant}
          onChange={(v) => setVariant(v as "marquee" | "grid")}
          segments={[
            { value: "marquee", label: "Marquee" },
            { value: "grid", label: "Grid" },
          ]}
        />
      </div>
      <Testimonials items={ITEMS} variant={variant} className={variant === "grid" ? "max-w-[1040px] px-4" : ""} />
    </div>
  );
}
