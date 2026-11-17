"use client";

import { useState } from "react";
import { CopyIcon } from "./CodeTabs";
import { usePrimitive } from "./Primitive";

const PMS = [
  { id: "pnpm", add: "pnpm add" },
  { id: "npm", add: "npm install" },
  { id: "bun", add: "bun add" },
  { id: "yarn", add: "yarn add" },
] as const;
type Pm = (typeof PMS)[number]["id"];

/**
 * `pnpm add asta-ui` plus the primitive package for the picked build (radix-ui or @base-ui/react), with a
 * package-manager switch and copy. `hasBase={false}` (no primitives) installs the package alone.
 */
export default function PackageCommand({ hasBase = true }: { hasBase?: boolean }) {
  const [pm, setPm] = useState<Pm>("pnpm");
  const [copied, setCopied] = useState(false);
  const primitive = usePrimitive();
  const add = PMS.find((p) => p.id === pm)!.add;
  const text = `${add} asta-ui${hasBase ? (primitive === "base" ? " @base-ui/react" : " radix-ui") : ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="ui-dark overflow-hidden rounded-[10px] bg-[#0e0e0f]">
      <div className="flex items-center justify-between gap-3 bg-paper-2 px-2 py-2">
        <div className="relative grid grid-cols-4 gap-0.5">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-[calc((100%-6px)/4)] bg-[#0e0f0d] transition-transform duration-500 ease-expo"
            style={{ transform: `translateX(calc(${PMS.findIndex((p) => p.id === pm)} * (100% + 2px)))` }}
          />
          {PMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPm(p.id)}
              aria-pressed={pm === p.id}
              className={`relative h-8 px-2.5 font-mono text-[13px] transition-colors duration-300 sm:px-3 ${pm === p.id ? "text-ink" : "text-mute hover:text-ink"}`}
            >
              {p.id}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className={`btn btn-quiet btn-sm shrink-0 ${copied ? "btn-on" : ""}`}>
          <CopyIcon done={copied} />
          <span className="ui-labels">
            <span data-on={!copied}>Copy</span>
            <span data-on={copied} aria-hidden={!copied}>
              Copied
            </span>
          </span>
        </button>
      </div>
      <pre className="ui-cmd overflow-x-auto px-4 pb-4 pt-5 font-mono text-[13.5px] leading-[1.6] text-ink">
        <code key={pm} className="ui-swap inline-block">
          <span className="select-none text-mute">$ </span>
          {add} asta-ui
          {hasBase && (
            <>
              <span className="pv-inline pv-radix"> radix-ui</span>
              <span className="pv-inline pv-base"> @base-ui/react</span>
            </>
          )}
        </code>
      </pre>
    </div>
  );
}
