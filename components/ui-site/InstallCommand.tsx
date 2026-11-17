"use client";

import { useState } from "react";
import { CopyIcon } from "./CodeTabs";
import { usePrimitive } from "./Primitive";

const SITE = "https://ui.astabyte.com";

const RUNNERS = [
  { id: "pnpm", x: "pnpm dlx" },
  { id: "npm", x: "npx" },
  { id: "bun", x: "bunx" },
  { id: "yarn", x: "yarn dlx" },
] as const;
type Runner = (typeof RUNNERS)[number]["id"];

/**
 * The install command, with a package-manager switch and copy. First our CLI (`asta-ui add <slug>`, plus `--base` when
 * Base UI is picked), then the same install with the plain shadcn CLI. The primitive parts are CSS-switched spans, so
 * the right command shows on first paint. `init` shows the one-time setup instead; `hasBase={false}` drops the flag
 * for items without primitives.
 */
export default function InstallCommand({ slugs = [], init = false, hasBase = true }: { slugs?: string[]; init?: boolean; hasBase?: boolean }) {
  const [runner, setRunner] = useState<Runner>("pnpm");
  const [copied, setCopied] = useState<"" | "cli" | "shadcn">("");
  const primitive = usePrimitive();
  const x = RUNNERS.find((r) => r.id === runner)!.x;
  const flag = hasBase || init;
  const verb = init ? "init" : `add ${slugs.join(" ")}`;
  const url = (p: string, s: string) => `${SITE}/r/${hasBase && p === "base" ? "base/" : ""}${s}.json`;
  const text = {
    cli: (p: string) => `${x} asta-ui@latest ${verb}${flag && p === "base" ? " --base" : ""}`,
    shadcn: (p: string) => (init ? `${x} shadcn@latest init` : `${x} shadcn@latest add ${slugs.map((s) => url(p, s)).join(" ")}`),
  };

  async function copy(which: "cli" | "shadcn") {
    try {
      await navigator.clipboard.writeText(text[which](primitive));
      setCopied(which);
      setTimeout(() => setCopied(""), 1600);
    } catch {}
  }

  return (
    <div className="ui-dark overflow-hidden rounded-[10px] bg-[#0e0e0f]">
      <div className="flex items-center justify-between gap-3 bg-paper-2 px-2 py-2">
        <div className="relative grid grid-cols-4 gap-0.5">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-[calc((100%-6px)/4)] bg-[#0e0f0d] transition-transform duration-500 ease-expo"
            style={{ transform: `translateX(calc(${RUNNERS.findIndex((r) => r.id === runner)} * (100% + 2px)))` }}
          />
          {RUNNERS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRunner(r.id)}
              aria-pressed={runner === r.id}
              className={`relative h-8 px-2.5 font-mono text-[13px] transition-colors duration-300 sm:px-3 ${runner === r.id ? "text-ink" : "text-mute hover:text-ink"}`}
            >
              {r.id}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => copy("cli")} className={`btn btn-quiet btn-sm shrink-0 ${copied === "cli" ? "btn-on" : ""}`}>
          <CopyIcon done={copied === "cli"} />
          <span className="ui-labels">
            <span data-on={copied !== "cli"}>Copy</span>
            <span data-on={copied === "cli"} aria-hidden={copied !== "cli"}>
              Copied
            </span>
          </span>
        </button>
      </div>
      <pre className="ui-cmd overflow-x-auto px-4 pb-3 pt-5 font-mono text-[13.5px] leading-[1.6] text-ink">
        <code key={runner} className="ui-swap inline-block">
          <span className="select-none text-mute">$ </span>
          {x} asta-ui@latest {verb}
          {flag && <span className="pv-inline pv-base text-accent"> --base</span>}
        </code>
      </pre>
      <div className="flex items-center gap-2 px-4 pb-4">
        <p className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12.5px] leading-[1.6] text-mute [scrollbar-width:none]">
          <span className="select-none font-sans">Or with the shadcn CLI: </span>
          <span key={runner} className="ui-swap inline-block">
            {x} shadcn@latest {init ? "init" : "add"}
            {slugs.map((s) => (
              <span key={s}>
                {" "}
                {SITE}/r/{hasBase && <span className="pv-inline pv-base">base/</span>}
                {s}.json
              </span>
            ))}
          </span>
        </p>
        <button
          type="button"
          onClick={() => copy("shadcn")}
          className="shrink-0 rounded-md p-1 text-mute transition-colors hover:text-ink"
          aria-label={copied === "shadcn" ? "Copied" : "Copy the shadcn command"}
          title="Copy the shadcn command"
        >
          <CopyIcon done={copied === "shadcn"} />
        </button>
      </div>
    </div>
  );
}
