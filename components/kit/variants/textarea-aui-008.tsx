"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { DropdownMenu as Menu } from "radix-ui";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface PromptModel {
  id: string;
  label: string;
  detail?: string;
}

export interface PromptBoxProps {
  models: PromptModel[];
  defaultModel?: string;
  placeholder?: string;
  /** Rough token budget for the counter (≈ 4 characters per token). */
  maxTokens?: number;
  /** True while a response is being generated: the button becomes Stop. */
  busy?: boolean;
  onSubmit?: (prompt: { text: string; model: string }) => void;
  onStop?: () => void;
  className?: string;
}

const KEYFRAMES = `@keyframes aui-pop-in { from { opacity: 0; transform: translateY(-4px) scale(.97) } }
@keyframes aui-pop-out { to { opacity: 0; transform: translateY(-2px) scale(.98) } }
@keyframes aui-spin { to { transform: rotate(360deg) } }`;

/** aui-008 · A prompt box for AI features: model picker, token counter, and a Generate button that turns into Stop. */
export function PromptBox({ models, defaultModel, placeholder = "Ask anything…", maxTokens = 2000, busy = false, onSubmit, onStop, className }: PromptBoxProps) {
  const [text, setText] = useState("");
  const [model, setModel] = useState(defaultModel ?? models[0]?.id ?? "");
  const area = useRef<HTMLTextAreaElement>(null);
  const tokens = Math.ceil(text.length / 4);
  const over = tokens > maxTokens;
  const ready = text.trim().length > 0 && !over;
  const current = models.find((m) => m.id === model);

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const line = parseFloat(getComputedStyle(el).lineHeight) || 21;
    el.style.height = "auto";
    const min = line * 2;
    const max = line * 8;
    el.style.height = `${Math.min(max, Math.max(min, el.scrollHeight))}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [text]);

  function submit() {
    if (busy) return onStop?.();
    if (!ready) return;
    onSubmit?.({ text: text.trim(), model });
  }

  return (
    <div
      className={cx(
        "relative w-full rounded-2xl bg-paper p-3 transition-shadow duration-300 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_18px_48px_-24px_rgb(0_0_0/0.35)] focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent),0_18px_48px_-24px_rgb(0_0_0/0.35)] motion-reduce:transition-none",
        className,
      )}
    >
      <style>{KEYFRAMES}</style>
      <textarea
        ref={area}
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label="Prompt"
        readOnly={busy}
        className={cx("block w-full resize-none bg-transparent px-1 text-[15px] leading-[1.5] text-ink outline-none placeholder:text-mute transition-opacity duration-300", busy && "opacity-60")}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <Menu.Root>
          <Menu.Trigger
            aria-label={`Model: ${current?.label ?? "none"}`}
            className="group/m flex h-8 items-center gap-1.5 rounded-full bg-paper-2 pl-2 pr-2.5 text-[12.5px] font-medium text-ink-2 outline-none transition-colors hover:text-ink focus-visible:shadow-[0_0_0_2px_var(--color-brand)] data-[state=open]:text-ink"
          >
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
            {current?.label}
            <svg viewBox="0 0 16 16" className="h-3 w-3 text-mute transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-data-[state=open]/m:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="m4 6 4 4 4-4" />
            </svg>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content
              side="top"
              align="start"
              sideOffset={8}
              className="z-50 min-w-[220px] origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-xl bg-paper p-1 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_16px_40px_-16px_rgb(0_0_0/0.3)] data-[state=open]:animate-[aui-pop-in_.22s_cubic-bezier(.16,1,.3,1)_both] data-[state=closed]:animate-[aui-pop-out_.12s_ease-in_both] motion-reduce:!animate-none"
            >
              <Menu.RadioGroup value={model} onValueChange={setModel}>
                {models.map((m) => (
                  <Menu.RadioItem
                    key={m.id}
                    value={m.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none transition-colors duration-150 data-[highlighted]:bg-paper-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-ink">{m.label}</span>
                      {m.detail && <span className="block text-[11.5px] text-mute">{m.detail}</span>}
                    </span>
                    <Menu.ItemIndicator>
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m3.5 8.5 3 3 6-7" />
                      </svg>
                    </Menu.ItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>

        <div className="flex items-center gap-3">
          <span className={cx("text-[11.5px] tabular-nums transition-colors duration-300", over ? "text-[#e5484d]" : "text-mute")} aria-live="polite">
            {tokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!busy && !ready}
            className={cx(
              "relative flex h-8 items-center gap-1.5 overflow-hidden rounded-full px-3.5 text-[13px] font-medium transition-[background-color,color,transform,width] duration-300 ease-[cubic-bezier(.16,1,.3,1)] active:scale-95 motion-reduce:transition-none",
              busy ? "bg-paper-2 text-ink" : ready ? "bg-ink text-paper" : "bg-paper-2 text-mute",
            )}
          >
            {busy ? (
              <>
                <span className="relative grid h-3.5 w-3.5 place-items-center" aria-hidden>
                  <span className="absolute inset-0 rounded-full border-[1.5px] border-mute/30 border-t-ink animate-[aui-spin_.8s_linear_infinite] motion-reduce:animate-none" />
                  <span className="h-1.5 w-1.5 rounded-[1px] bg-ink" />
                </span>
                Stop
              </>
            ) : (
              <>
                Generate
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromptBox;
