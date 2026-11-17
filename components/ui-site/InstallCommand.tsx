"use client";

import { useState } from "react";
import { CopyIcon } from "./CodeTabs";

const RUNNERS = [
  { id: "npm", cmd: "npx shadcn@latest add" },
  { id: "pnpm", cmd: "pnpm dlx shadcn@latest add" },
  { id: "bun", cmd: "bunx --bun shadcn@latest add" },
] as const;

/** shadcn CLI command for one registry item, with a package-manager switch and copy. */
export default function InstallCommand({ url }: { url: string }) {
  const [runner, setRunner] = useState<(typeof RUNNERS)[number]["id"]>("npm");
  const [copied, setCopied] = useState(false);
  const cmd = `${RUNNERS.find((r) => r.id === runner)!.cmd} ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="ui-dark overflow-hidden rounded-[10px] bg-[#0e0e0f]">
      <div className="flex items-center justify-between gap-3 bg-paper-2 px-2 py-2">
        <div className="flex gap-0.5">
          {RUNNERS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRunner(r.id)}
              className={`h-8 px-3 font-mono text-[12px] transition-colors ${runner === r.id ? "bg-[#0e0f0d] text-ink" : "text-mute hover:text-ink"}`}
            >
              {r.id}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className={`btn btn-quiet btn-sm shrink-0 ${copied ? "btn-on" : ""}`}>
          <CopyIcon done={copied} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-5 font-mono text-[12.5px] leading-[1.6] text-ink">
        <code>
          <span className="select-none text-mute">$ </span>
          {cmd}
        </code>
      </pre>
    </div>
  );
}
