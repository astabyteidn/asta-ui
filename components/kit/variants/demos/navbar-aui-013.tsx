"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DocsNavbar } from "@/components/kit/variants/navbar-aui-013";

const FRAME =
  "relative w-full max-w-[920px] overflow-hidden rounded-[14px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]";
const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]";
const RESULTS = [
  { label: "Installation", where: "Getting started" },
  { label: "Theming tokens", where: "Core concepts" },
  { label: "Dialog", where: "Components" },
  { label: "What changed in v3.2", where: "Changelog" },
];
const at = (n: number) => ({ "--i": n }) as CSSProperties;

export default function Demo() {
  const [search, setSearch] = useState(false);
  const [version, setVersion] = useState("v3.2");
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!search) return;
    input.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && setSearch(false);
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [search]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-3 sm:p-6">
      <style href="asta-demo-navbar-aui-013" precedence="asta">{`
        @keyframes demo-013-rise { from { opacity: 0; transform: translateY(12px); } }
        @keyframes demo-013-pop { from { opacity: 0; transform: translateY(-6px) scale(.98); } }
        .demo-013-in { animation: demo-013-rise .7s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(250ms + var(--i, 0) * 55ms); }
        .demo-013-pop { animation: demo-013-pop .3s cubic-bezier(.16,1,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .demo-013-in, .demo-013-pop { animation: none; } }
      `}</style>
      <div className={FRAME}>
        <div className="h-[360px] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <DocsNavbar shortcut={false} openOnMount="Guides" onNavigate={(_, e) => e.preventDefault()} onSearch={() => setSearch(true)} onVersionChange={setVersion} />
          <article className="mx-auto max-w-[620px] px-5 pb-12 pt-12">
            <p style={at(0)} className="demo-013-in font-mono text-[11px] uppercase tracking-[0.08em] text-brand">
              Getting started · {version}
            </p>
            <h1 style={at(1)} className="demo-013-in mt-3 text-[clamp(1.9rem,4.4vw,2.4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink">
              Install Astabyte UI in two minutes.
            </h1>
            <p style={at(2)} className="demo-013-in mt-3 text-[14.5px] text-mute">
              One package, zero config, typed components and tokens.
            </p>
            <div style={at(3)} className="demo-013-in mt-5 flex flex-wrap items-center gap-2">
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-[13.5px] font-medium text-white transition-transform duration-300 hover:-translate-y-px active:scale-[.97]">
                Read the quick start
              </a>
              <button type="button" onClick={() => setCopied(true)} className={`inline-flex h-9 items-center gap-2 rounded-lg bg-paper px-3 font-mono text-[12.5px] text-ink transition-colors hover:bg-paper-2 ${RING}`}>
                <span className="text-mute">$</span> pnpm add asta-ui
                <span className="font-sans text-[11.5px] text-mute">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </article>
        </div>

        {search && (
          <div className="absolute inset-0 z-40 flex items-start justify-center bg-ink/15 p-4 pt-16 backdrop-blur-[2px]" onPointerDown={(e) => e.target === e.currentTarget && setSearch(false)}>
            <div role="dialog" aria-label="Search docs" className="demo-013-pop w-full max-w-md rounded-[12px] bg-paper p-1.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_24px_50px_-20px_rgb(0_0_0/0.35)]">
              <input ref={input} placeholder="Search the docs…" aria-label="Search the docs" className="h-11 w-full rounded-[9px] bg-paper-2 px-3 text-[14px] text-ink outline-none placeholder:text-mute" />
              <ul className="mt-1">
                {RESULTS.map((r) => (
                  <li key={r.label}>
                    <button type="button" onClick={() => setSearch(false)} className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[13.5px] text-ink hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:outline-none">
                      {r.label}
                      <span className="ml-auto text-[12px] text-mute">{r.where}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
