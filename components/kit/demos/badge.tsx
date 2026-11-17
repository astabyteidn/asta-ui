"use client";

import { useState } from "react";
import { Badge, CountBadge } from "@/components/kit/badge";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wider text-mute">{label}</span>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

const TAGS = ["Design", "React", "Motion", "Tailwind"];

export default function BadgeDemo() {
  const [tags, setTags] = useState(TAGS);
  const [inbox, setInbox] = useState(3);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="flex flex-col gap-6">
        <Row label="Solid">
          <Badge variant="solid">Neutral</Badge>
          <Badge variant="solid" tone="accent">New</Badge>
          <Badge variant="solid" tone="success">Paid</Badge>
          <Badge variant="solid" tone="warning">Pending</Badge>
          <Badge variant="solid" tone="danger">Failed</Badge>
        </Row>
        <Row label="Soft">
          <Badge>Draft</Badge>
          <Badge tone="accent">Beta</Badge>
          <Badge tone="success">Active</Badge>
          <Badge tone="warning">Review</Badge>
          <Badge tone="danger">Overdue</Badge>
        </Row>
        <Row label="Outline">
          <Badge variant="outline">v2.4.0</Badge>
          <Badge variant="outline" tone="accent" dot>
            Preview
          </Badge>
          <Badge variant="outline" tone="success" dot>
            Shipped
          </Badge>
        </Row>
        <Row label="Live">
          <Badge tone="success" pulse>
            Online
          </Badge>
          <Badge tone="accent" pulse>
            Deploying
          </Badge>
          <Badge variant="solid" tone="danger" pulse>
            Live
          </Badge>
        </Row>
        <Row label="Remove">
          {tags.map((t) => (
            <Badge key={t} variant="outline" onRemove={() => setTags((x) => x.filter((y) => y !== t))}>
              {t}
            </Badge>
          ))}
          {tags.length < TAGS.length && (
            <button type="button" onClick={() => setTags(TAGS)} className="text-[12px] text-mute underline-offset-4 hover:text-ink hover:underline">
              Reset
            </button>
          )}
        </Row>
        <Row label="Count">
          <button
            type="button"
            onClick={() => setInbox((n) => n + 1)}
            className="relative inline-flex h-10 items-center gap-2 rounded-lg bg-paper px-4 text-[14px] font-medium shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] outline-none transition-transform active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Inbox
            <CountBadge count={inbox} />
          </button>
          <span className="text-[12px] text-mute">Click to get mail</span>
        </Row>
      </div>
    </div>
  );
}
