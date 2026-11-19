"use client";

import { useState, type ReactNode } from "react";
import { FileCard } from "@/components/kit/file-card";
import { SegmentedControl } from "@/components/kit/segmented-control";

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 3v18M16 3v18M3 8h18M3 16h18" />
  </svg>
);
const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6.5h11v11H4zM15 10.5l5-3v9l-5-3" />
  </svg>
);

/** Little artboards drawn with tokens, standing in for real canvas thumbnails. */
const board = (children: ReactNode) => <div className="absolute inset-0 flex items-center justify-center gap-2 bg-paper-2 p-5">{children}</div>;

const FILES: { id: string; title: string; meta: string; video?: boolean; thumb: ReactNode; star?: boolean }[] = [
  {
    id: "a",
    title: "Summer launch kit",
    meta: "Edited 18 min ago",
    star: true,
    thumb: board(
      <>
        <span className="h-[70%] w-[30%] rounded-[3px] bg-brand" />
        <span className="flex h-[70%] w-[18%] items-end rounded-[3px] bg-ink p-1.5"><span className="h-1 w-3/4 rounded-full bg-paper/70" /></span>
        <span className="h-[40%] w-[34%] rounded-[3px] bg-paper shadow-[0_4px_12px_-6px_rgb(0_0_0/0.3)]" />
      </>,
    ),
  },
  { id: "b", title: "Product teaser", meta: "Edited 2 h ago", video: true, thumb: board(<span className="relative h-[72%] w-[80%] rounded-[3px] bg-ink"><span className="absolute bottom-2 left-2 right-2 h-1 rounded-full bg-paper/25"><span className="block h-full w-2/5 rounded-full bg-brand" /></span></span>) },
  { id: "c", title: "Story templates", meta: "Edited yesterday", thumb: board([0, 1, 2, 3].map((i) => <span key={i} className={`h-[78%] w-[16%] rounded-[3px] ${i === 1 ? "bg-brand" : "bg-paper shadow-[0_4px_12px_-6px_rgb(0_0_0/0.3)]"}`} />)) },
  { id: "d", title: "Newsletter header", meta: "Edited 3 d ago", thumb: board(<span className="flex h-[46%] w-[86%] items-center gap-2 rounded-[3px] bg-paper px-3 shadow-[0_4px_12px_-6px_rgb(0_0_0/0.3)]"><span className="h-6 w-6 rounded-full bg-brand" /><span className="h-1.5 w-1/2 rounded-full bg-ink/70" /></span>) },
  { id: "e", title: "Event recap reel", meta: "Edited 1 w ago", video: true, thumb: board([0, 1, 2].map((i) => <span key={i} className={`h-[50%] w-[24%] rounded-[3px] ${i === 2 ? "bg-brand" : "bg-ink/80"}`} />)) },
  { id: "f", title: "Pitch cover", meta: "Edited 2 w ago", thumb: board(<span className="flex h-[66%] w-[66%] flex-col justify-end gap-1 rounded-[3px] bg-brand p-2"><span className="h-1.5 w-2/3 rounded-full bg-paper" /><span className="h-1 w-1/3 rounded-full bg-paper/60" /></span>) },
];

export default function FileCardDemo() {
  const [view, setView] = useState("grid");
  const [stars, setStars] = useState(() => new Set(FILES.filter((f) => f.star).map((f) => f.id)));
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="flex min-h-[520px] w-full justify-center p-6 sm:p-10">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] text-mute">{opened ? `Opening “${opened}”` : `${FILES.length} files · ${stars.size} starred`}</p>
          <SegmentedControl size="sm" value={view} onChange={setView} segments={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]} />
        </div>
        <div className={view === "grid" ? "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mt-4 space-y-0.5"}>
          {FILES.map((f) => (
            <FileCard
              key={f.id}
              view={view as "grid" | "list"}
              title={f.title}
              meta={f.meta}
              icon={f.video ? <VideoIcon /> : <FileIcon />}
              thumbnail={f.thumb}
              starred={stars.has(f.id)}
              onStarChange={(on) => setStars((s) => { const n = new Set(s); if (on) n.add(f.id); else n.delete(f.id); return n; })}
              onOpen={() => setOpened(f.title)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
