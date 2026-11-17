"use client";

import { useState } from "react";
import { Button } from "@/components/kit/button";

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);
const Plus = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
    <path d="M8 3v10M3 8h10" />
  </svg>
);
const Heart = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
    <path d="M8 13.5S2 10 2 5.8A3 3 0 0 1 8 4.4a3 3 0 0 1 6 1.4C14 10 8 13.5 8 13.5Z" />
  </svg>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wider text-mute">{label}</span>
    <div className="flex flex-wrap items-center gap-2.5">{children}</div>
  </div>
);

export default function ButtonDemo() {
  const [saving, setSaving] = useState(false);
  const [liked, setLiked] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1600);
  };

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex flex-col gap-6">
        <Row label="Variant">
          <Button>Solid</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="link">Link</Button>
        </Row>
        <Row label="Size">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="Icons">
          <Button variant="accent" iconRight={<Arrow />} nudge>
            Get started
          </Button>
          <Button variant="outline" iconLeft={<Plus />}>
            New project
          </Button>
          <Button variant="soft" kbd="⌘K">
            Search
          </Button>
          <Button variant="outline" iconOnly aria-label="Like" aria-pressed={liked} onClick={() => setLiked((v) => !v)} className={liked ? "text-[#e5484d]" : ""}>
            <Heart />
          </Button>
        </Row>
        <Row label="Shape">
          <Button shape="pill" iconRight={<Arrow />} nudge>
            Launch app
          </Button>
          <Button shape="pill" variant="outline">
            Read docs
          </Button>
          <Button shape="pill" variant="soft" size="sm">
            Pill small
          </Button>
        </Row>
        <Row label="State">
          <Button loading={saving} onClick={save}>
            Save changes
          </Button>
          <Button variant="outline" loading>
            Loading
          </Button>
          <Button variant="accent" disabled>
            Disabled
          </Button>
        </Row>
      </div>
    </div>
  );
}
