"use client";

import { useLayoutEffect, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface ChatComposerProps {
  placeholder?: string;
  /** Called with the text and attached files when the user sends (button or ⌘/Ctrl + Enter). */
  onSend?: (message: { text: string; files: File[] }) => void;
  /** `accept` for the attach button, e.g. "image/*,.pdf". */
  accept?: string;
  maxRows?: number;
  disabled?: boolean;
  className?: string;
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** aui-003 · A chat composer: grows as you type, takes attachments as chips, sends on ⌘/Ctrl + Enter. */
export function ChatComposer({ placeholder = "Write a message…", onSend, accept, maxRows = 6, disabled, className }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [mac] = useState(isMac);
  const ready = !disabled && (text.trim().length > 0 || files.length > 0);

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const line = parseFloat(getComputedStyle(el).lineHeight) || 21;
    el.style.height = "auto";
    const max = line * maxRows;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [text, maxRows]);

  function send() {
    if (!ready) return;
    onSend?.({ text: text.trim(), files });
    setText("");
    setFiles([]);
    area.current?.focus();
  }

  return (
    <div
      className={cx(
        "w-full rounded-2xl bg-paper p-2 transition-shadow duration-200 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent),0_12px_32px_-18px_rgb(0_0_0/0.25)] focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent),0_12px_32px_-18px_rgb(0_0_0/0.25)] motion-reduce:transition-none",
        disabled && "opacity-60",
        className,
      )}
    >
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 px-1.5 pb-2 pt-1" aria-label="Attachments">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex h-7 items-center gap-1.5 rounded-lg bg-paper-2 pl-2.5 pr-1 text-[12.5px] text-ink-2 animate-[aui-chip_.3s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none"
            >
              <span className="max-w-[160px] truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}
                className="grid h-5 w-5 place-items-center rounded-md text-mute transition-colors hover:bg-paper hover:text-ink"
                aria-label={`Remove ${f.name}`}
              >
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={area}
        rows={1}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={placeholder}
        aria-label="Message"
        className="block max-h-none w-full resize-none bg-transparent px-2.5 py-2 text-[14px] leading-[1.5] text-ink outline-none placeholder:text-mute"
      />
      <div className="flex items-center justify-between gap-2 pt-1">
        <input
          ref={picker}
          type="file"
          multiple
          accept={accept}
          hidden
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []);
            if (list.length) setFiles((all) => [...all, ...list]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => picker.current?.click()}
          className="grid h-8 w-8 place-items-center rounded-lg text-mute transition-colors hover:bg-paper-2 hover:text-ink"
          aria-label="Attach files"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="m13.5 7.5-5.4 5.4a3.2 3.2 0 0 1-4.5-4.5l5.6-5.6a2.1 2.1 0 0 1 3 3L6.6 11.4a1 1 0 0 1-1.5-1.5l5-5" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11.5px] text-mute sm:inline">{mac ? "⌘" : "Ctrl"} + Enter</span>
          <button
            type="button"
            onClick={send}
            disabled={!ready}
            aria-label="Send"
            className={cx(
              "grid h-8 w-8 place-items-center rounded-lg transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] active:scale-90 motion-reduce:transition-none",
              ready ? "bg-ink text-paper" : "bg-paper-2 text-mute",
            )}
          >
            <svg viewBox="0 0 16 16" className={cx("h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", ready && "-translate-y-px")} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
            </svg>
          </button>
        </div>
      </div>
      <style href="asta-textarea-aui-003" precedence="asta">{`@keyframes aui-chip { from { opacity: 0; transform: scale(.9) } }`}</style>
    </div>
  );
}

export default ChatComposer;
