"use client";

import { useState } from "react";
import { EmptyState, type EmptyStateVariant } from "@/components/kit/empty-state";
import { SegmentedControl } from "@/components/kit/segmented-control";

const plus = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
    <path d="M8 3.5v9M3.5 8h9" />
  </svg>
);

export default function EmptyStateDemo() {
  const [variant, setVariant] = useState<EmptyStateVariant>("no-data");

  return (
    <div className="flex min-h-[440px] w-full flex-col items-center justify-center gap-5 p-4 sm:p-8">
      <SegmentedControl
        label="Variant"
        size="sm"
        value={variant}
        onChange={(v) => setVariant(v as EmptyStateVariant)}
        segments={[
          { value: "no-data", label: "No data" },
          { value: "no-results", label: "No results" },
          { value: "error", label: "Error" },
        ]}
      />
      <div className="w-full max-w-[480px] rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
        {/* The key replays the drawing when the variant changes. */}
        {variant === "no-data" && (
          <EmptyState key="no-data" title="No projects yet" description="Projects keep your files and people in one place." primary={{ label: "New project", icon: plus }} secondary={{ label: "Import" }} />
        )}
        {variant === "no-results" && <EmptyState key="no-results" variant="no-results" query="quarterly report" primary={{ label: "Clear search" }} />}
        {variant === "error" && <EmptyState key="error" variant="error" primary={{ label: "Try again" }} secondary={{ label: "Status page", href: "#" }} />}
      </div>
    </div>
  );
}
