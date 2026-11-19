"use client";

import { useState } from "react";
import { ToolDock, type DockTool } from "@/components/kit/tool-dock";

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const TOOLS: (DockTool | "separator")[] = [
  { id: "move", label: "Move", shortcut: "V", icon: svg("M5 3.5 18 10l-5.6 1.9L10 17.5z") },
  { id: "hand", label: "Hand", shortcut: "H", icon: svg("M8 11V6.5a1.5 1.5 0 0 1 3 0V11m0-1.5V5a1.5 1.5 0 0 1 3 0v5.5m0-4a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4.6 15a1.5 1.5 0 0 1 2.3-1.9L8 14.5") },
  "separator",
  { id: "frame", label: "Frame", shortcut: "F", icon: svg("M8 3v18M16 3v18M3 8h18M3 16h18") },
  { id: "rect", label: "Rectangle", shortcut: "R", icon: svg("M4.5 5.5h15v13h-15z") },
  { id: "ellipse", label: "Ellipse", shortcut: "O", icon: svg("M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15z") },
  { id: "pen", label: "Pen", shortcut: "P", icon: svg("m12 19 7-7-3.5-3.5-7 7L7 19zM15.5 8.5 13 3 5 9l2.5 2.5") },
  { id: "text", label: "Text", shortcut: "T", icon: svg("M5 6V4.5h14V6M12 4.5v15M9 19.5h6") },
  "separator",
  { id: "comment", label: "Comment", shortcut: "C", icon: svg("M5 5.5h14v10H10l-4 3.5v-3.5H5z") },
];

const HINT: Record<string, string> = {
  move: "Click a layer to select it. Drag to move.",
  hand: "Drag to pan around the canvas.",
  frame: "Drag to draw a frame. Layers inside it are clipped.",
  rect: "Drag to draw a rectangle. Hold Shift for a square.",
  ellipse: "Drag to draw an ellipse. Hold Shift for a circle.",
  pen: "Click to add points. Close the path on the first point.",
  text: "Click anywhere to start typing.",
  comment: "Click to leave a comment for your team.",
};

export default function ToolDockDemo() {
  const [tool, setTool] = useState("move");
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-10">
      <div className="relative flex h-[340px] w-full max-w-2xl flex-col items-center justify-between overflow-hidden rounded-[14px] bg-paper-2 p-5">
        <p className="text-center text-[13px] text-ink-2">{HINT[tool]}</p>
        <div className="grid h-28 w-44 place-items-center rounded-[6px] bg-paper text-[12px] text-mute shadow-[0_10px_30px_-18px_rgb(0_0_0/0.4)]">Frame 1</div>
        <ToolDock tools={TOOLS} value={tool} onChange={setTool} />
      </div>
    </div>
  );
}
