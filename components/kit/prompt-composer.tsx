"use client";

import { useEffect, useId, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface ComposerMention {
  id: string;
  label: string;
  type: "file" | "person" | "doc";
  /** Muted text on the right, e.g. a path or a role. */
  hint?: string;
}

export interface ComposerCommand {
  id: string;
  /** Without the slash, e.g. "summarize". */
  label: string;
  hint?: string;
}

export type ComposerPart = { type: "text"; text: string } | { type: "mention"; item: ComposerMention } | { type: "command"; item: ComposerCommand };

export interface ComposerMessage {
  /** Plain text with tokens written as @label and /label. */
  text: string;
  /** Text and tokens in order, for when you need the ids. */
  parts: ComposerPart[];
  files: File[];
}

export interface PromptComposerProps {
  onSend: (message: ComposerMessage) => void;
  /** Called by the Stop button and by Escape while `running`. */
  onStop?: () => void;
  /** The agent is working: Send turns into Stop and a light orbits the border. */
  running?: boolean;
  /** Offered when you type @. */
  mentions?: ComposerMention[];
  /** Offered when you type /. */
  commands?: ComposerCommand[];
  /** A slot in the toolbar, e.g. a `ModelPicker` with variant="chip" side="top". */
  model?: ReactNode;
  placeholder?: string;
  /** Accessible name of the field. Default "Message". */
  label?: string;
  /** `accept` for the file picker. */
  accept?: string;
  /** Bytes. Default 20 MB. */
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}

const KEYFRAMES = `@keyframes asta-pc-orbit { from { transform: translate(-50%, -50%) rotate(0turn) } to { transform: translate(-50%, -50%) rotate(1turn) } }
@keyframes asta-pc-fade { from { opacity: 0 } }
@keyframes asta-pc-chip { from { opacity: 0; transform: scale(.92) } }
.asta-pc-ring { -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude }
.asta-pc-field:focus { outline: none }
@media (prefers-reduced-motion: reduce) {
  .asta-pc, .asta-pc * { animation: none !important; transition-duration: 0s !important }
  .asta-pc-spin { background: color-mix(in srgb, var(--color-brand) 60%, transparent) !important }
}`;

const EASE = "cubic-bezier(.16,1,.3,1)";
const GLYPH: Record<string, string> = {
  file: "M9 2.5H5A1.5 1.5 0 0 0 3.5 4v8A1.5 1.5 0 0 0 5 13.5h6a1.5 1.5 0 0 0 1.5-1.5V6L9 2.5ZM9 2.5V6h3.5",
  doc: "M4.5 2.5h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM6 6h4M6 8.5h4M6 11h2.5",
  person: "M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 13.5c.6-2.2 2.3-3.5 4.5-3.5s3.9 1.3 4.5 3.5",
  command: "m10 3-4 10",
};
const svg = (d: string, cls = "h-3.5 w-3.5") =>
  `<svg viewBox="0 0 16 16" class="${cls} shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cx("shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

// Token chips live inside the contenteditable field, so they are plain DOM. Classes kept here for Tailwind.
const CHIP = "mx-px inline-flex items-center gap-1 whitespace-nowrap rounded-[5px] px-1.5 align-baseline text-[0.93em] font-medium leading-[1.5] [animation:asta-pc-chip_.2s_cubic-bezier(.16,1,.3,1)]";
const CHIP_MENTION = "bg-[color-mix(in_srgb,var(--color-brand)_11%,transparent)] text-brand";
const CHIP_COMMAND = "bg-ink text-paper";
const GROUPS: { type: ComposerMention["type"]; label: string }[] = [
  { type: "file", label: "Files" },
  { type: "person", label: "People" },
  { type: "doc", label: "Docs" },
];

const size = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`);
const initials = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

type Menu = { kind: "@" | "/"; query: string; x: number };
type Item = { kind: "@"; item: ComposerMention } | { kind: "/"; item: ComposerCommand };

/**
 * The input of an agent app. The field grows as you type. @ opens a mention menu for files, people and docs,
 * / opens commands, and a pick becomes a token chip that Backspace removes in one go. Attach files as chips,
 * put a model picker in the toolbar, and press Enter to send (Shift + Enter for a new line). While the agent
 * works, Send turns into Stop and a band of light orbits the border.
 */
export function PromptComposer({
  onSend,
  onStop,
  running = false,
  mentions = [],
  commands = [],
  model,
  placeholder = "Ask Astabyte to do something…",
  label = "Message",
  accept,
  maxFileSize = 20 * 1024 ** 2,
  disabled,
  className,
}: PromptComposerProps) {
  const [empty, setEmpty] = useState(true);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [active, setActive] = useState(0);
  const [files, setFiles] = useState<{ id: string; file: File }[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [drag, setDrag] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const ed = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const trig = useRef<{ node: Text; start: number } | null>(null);
  const dismissed = useRef<{ node: Text; start: number } | null>(null);
  const seq = useRef(0);
  const uid = useId();

  // The orbit only spins while the composer is on screen and the tab is visible.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = true;
    const sync = () => setOnScreen(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const items: Item[] = useMemo(() => {
    if (!menu) return [];
    const q = menu.query.toLowerCase();
    if (menu.kind === "/") return commands.filter((c) => c.label.toLowerCase().includes(q)).map((item) => ({ kind: "/" as const, item }));
    const hit = mentions.filter((m) => `${m.label} ${m.hint ?? ""}`.toLowerCase().includes(q));
    return GROUPS.flatMap((g) => hit.filter((m) => m.type === g.type)).map((item) => ({ kind: "@" as const, item }));
  }, [menu, mentions, commands]);
  const act = Math.min(active, Math.max(items.length - 1, 0));

  const sync = () => {
    const el = ed.current;
    if (el) setEmpty(!el.textContent && !el.querySelector("[data-token]"));
  };

  // Reads the field into text + tokens.
  const read = (): Omit<ComposerMessage, "files"> => {
    const parts: ComposerPart[] = [];
    let buf = "";
    const flush = () => {
      if (buf) parts.push({ type: "text", text: buf });
      buf = "";
    };
    const walk = (node: Node) => {
      node.childNodes.forEach((c) => {
        if (c.nodeType === 3) buf += (c as Text).data;
        else if (c instanceof HTMLElement && c.dataset.token) {
          flush();
          const id = c.dataset.id!;
          if (c.dataset.token === "/") {
            const item = commands.find((x) => x.id === id) ?? { id, label: c.dataset.label ?? id };
            parts.push({ type: "command", item });
          } else {
            const item = mentions.find((x) => x.id === id) ?? { id, label: c.dataset.label ?? id, type: "doc" as const };
            parts.push({ type: "mention", item });
          }
        } else if (c.nodeName === "BR") buf += "\n";
        else if (c instanceof HTMLElement) {
          if (buf && !buf.endsWith("\n")) buf += "\n";
          walk(c);
        }
      });
    };
    if (ed.current) walk(ed.current);
    flush();
    const text = parts
      .map((p) => (p.type === "text" ? p.text : p.type === "mention" ? `@${p.item.label}` : `/${p.item.label}`))
      .join("")
      .replace(/ /g, " ")
      .trim();
    return { text, parts };
  };

  // Looks at the text before the caret for an @ or / trigger.
  const detect = () => {
    const sel = getSelection();
    const n = sel?.anchorNode;
    if (!sel || !sel.isCollapsed || !n || n.nodeType !== 3 || !ed.current?.contains(n)) return setMenu(null);
    const before = (n as Text).data.slice(0, sel.anchorOffset);
    const m = before.match(/(?:^|\s)([@/])([^\s@/]{0,30})$/);
    const kind = m?.[1] as "@" | "/" | undefined;
    if (!m || !kind || !(kind === "@" ? mentions : commands).length) {
      trig.current = null;
      return setMenu(null);
    }
    const start = sel.anchorOffset - m[2].length - 1;
    if (dismissed.current?.node === n && dismissed.current.start === start) return setMenu(null);
    trig.current = { node: n as Text, start };
    const r = document.createRange();
    r.setStart(n, start);
    r.setEnd(n, start + 1);
    const box = root.current!.getBoundingClientRect();
    const w = Math.min(320, box.width);
    const x = Math.max(0, Math.min(r.getBoundingClientRect().left - box.left - 10, box.width - w));
    if (!menu || menu.kind !== kind || menu.query !== m[2]) setActive(0);
    setMenu({ kind, query: m[2], x });
  };

  const place = (node: Node, offset: number) => {
    const sel = getSelection();
    const r = document.createRange();
    r.setStart(node, offset);
    r.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(r);
  };

  const insert = (it: Item | undefined) => {
    const t = trig.current;
    const sel = getSelection();
    if (!it || !t || !sel?.anchorNode) return;
    const r = document.createRange();
    r.setStart(t.node, t.start);
    r.setEnd(sel.anchorNode, sel.anchorOffset);
    r.deleteContents();
    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.token = it.kind;
    chip.dataset.id = it.item.id;
    chip.dataset.label = it.item.label;
    chip.className = cx(CHIP, it.kind === "/" ? CHIP_COMMAND : CHIP_MENTION);
    chip.innerHTML = svg(GLYPH[it.kind === "/" ? "command" : (it.item as ComposerMention).type], "h-3 w-3");
    chip.append(it.item.label);
    r.insertNode(chip);
    const space = document.createTextNode(" ");
    chip.after(space);
    place(space, 1);
    trig.current = null;
    setMenu(null);
    sync();
    setStatus(`Added ${it.kind === "/" ? `command /${it.item.label}` : it.item.label}.`);
  };

  // The token right before (or after) the caret, if any.
  const nextToken = (dir: -1 | 1): HTMLElement | null => {
    const sel = getSelection();
    if (!sel?.isCollapsed || !sel.anchorNode) return null;
    const n = sel.anchorNode;
    const off = sel.anchorOffset;
    let sib: Node | null;
    if (n.nodeType === 3) {
      if (dir < 0 ? off > 0 : off < (n as Text).length) return null;
      sib = dir < 0 ? n.previousSibling : n.nextSibling;
    } else sib = n.childNodes[dir < 0 ? off - 1 : off] ?? null;
    while (sib && sib.nodeType === 3 && !(sib as Text).length) sib = dir < 0 ? sib.previousSibling : sib.nextSibling;
    return sib instanceof HTMLElement && sib.dataset.token ? sib : null;
  };

  const addFiles = (list: FileList | File[]) => {
    const ok: { id: string; file: File }[] = [];
    let msg = "";
    for (const file of Array.from(list)) {
      if (file.size > maxFileSize) msg = `${file.name} is ${size(file.size)}. Attach files under ${size(maxFileSize)}.`;
      else ok.push({ id: `f${seq.current++}`, file });
    }
    setError(msg);
    if (ok.length) {
      setFiles((f) => [...f, ...ok]);
      setStatus(`Attached ${ok.map((f) => f.file.name).join(", ")}.`);
    }
  };

  const send = () => {
    if (running || disabled) return;
    const msg = read();
    if (!msg.text && !files.length) return;
    onSend({ ...msg, files: files.map((f) => f.file) });
    if (ed.current) ed.current.innerHTML = "";
    setFiles([]);
    setError("");
    setMenu(null);
    sync();
    ed.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (menu) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length) setActive((act + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && items.length) {
        e.preventDefault();
        return insert(items[act]);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        dismissed.current = trig.current;
        return setMenu(null);
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      return send();
    }
    if (e.key === "Escape" && running) {
      e.preventDefault();
      return onStop?.();
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      const tok = nextToken(e.key === "Backspace" ? -1 : 1);
      if (!tok) return;
      e.preventDefault();
      const parent = tok.parentNode!;
      const at = Array.prototype.indexOf.call(parent.childNodes, tok);
      tok.remove();
      place(parent, at);
      sync();
      setStatus(`Removed ${tok.dataset.label}.`);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files.length) {
      e.preventDefault();
      return addFiles(e.clipboardData.files);
    }
    // Paste as plain text so no foreign markup lands in the field.
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!document.execCommand("insertText", false, text)) {
      const sel = getSelection();
      const r = sel?.rangeCount ? sel.getRangeAt(0) : null;
      if (!r) return;
      r.deleteContents();
      const node = document.createTextNode(text);
      r.insertNode(node);
      place(node, node.length);
    }
    sync();
  };

  const onDrop = (e: DragEvent<HTMLFormElement>) => {
    setDrag(false);
    if (!e.dataTransfer.files.length || disabled) return;
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const canSend = !empty || files.length > 0;
  const listId = `${uid}-menu`;
  const optId = (i: number) => `${uid}-o-${i}`;
  const groupOf = (it: Item) => (it.kind === "/" ? "Commands" : GROUPS.find((g) => g.type === it.item.type)!.label);

  return (
    <div ref={root} className={cx("asta-pc relative w-full", className)}>
      <style href="asta-prompt-composer" precedence="asta">{KEYFRAMES}</style>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {menu && (
        <div
          id={listId}
          role="listbox"
          aria-label={menu.kind === "@" ? "Mention" : "Commands"}
          onPointerDown={(e) => e.preventDefault()}
          className="absolute bottom-full z-50 mb-2 max-h-[280px] w-[320px] max-w-full overflow-y-auto overscroll-contain rounded-xl bg-paper p-1.5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_16px_40px_-12px_rgb(0_0_0/0.25),0_4px_10px_-6px_rgb(0_0_0/0.1)] [scrollbar-width:thin]"
          style={{ left: menu.x, animation: `asta-pc-fade .12s ${EASE}` }}
        >
          {items.length === 0 && <p className="px-2.5 py-5 text-center text-[12.5px] text-mute">Nothing matches “{menu.query}”</p>}
          {items.map((it, i) => {
            const group = groupOf(it);
            const head = i === 0 || group !== groupOf(items[i - 1]);
            const person = it.kind === "@" && it.item.type === "person";
            return (
              <div key={`${it.kind}${it.item.id}`} role="presentation">
                {head && (
                  <p role="presentation" className="px-2.5 pt-2 pb-1 font-mono text-[10.5px] uppercase tracking-wider text-mute">
                    {group}
                  </p>
                )}
                <div
                  id={optId(i)}
                  role="option"
                  aria-selected={i === act}
                  onPointerMove={() => i !== act && setActive(i)}
                  onClick={() => insert(it)}
                  className={cx("flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors duration-100", i === act ? "bg-paper-2 text-ink" : "text-ink-2")}
                >
                  {person ? (
                    <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-[9px] font-semibold text-paper">
                      {initials(it.item.label)}
                    </span>
                  ) : (
                    <span aria-hidden className={cx("grid h-5 w-5 shrink-0 place-items-center rounded-[5px]", it.kind === "/" ? "bg-ink text-paper" : "bg-paper-2 text-ink-2")}>
                      <Icon d={GLYPH[it.kind === "/" ? "command" : it.item.type]} className="h-3 w-3" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {it.kind === "/" && "/"}
                    {it.item.label}
                  </span>
                  {it.item.hint && <span className="max-w-[45%] shrink-0 truncate text-[12px] text-mute">{it.item.hint}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        onDragOver={(e) => {
          if (!disabled && e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDrag(true);
          }
        }}
        onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDrag(false)}
        onDrop={onDrop}
        className={cx(
          "relative flex flex-col rounded-[14px] bg-paper transition-shadow duration-200",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-16px_rgb(0_0_0/0.18)]",
          !running && "focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
          drag && "shadow-[inset_0_0_0_1.5px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
          disabled && "opacity-50",
        )}
      >
        {/* A band of light orbiting the border while the agent works: a rotating conic layer clipped to a 1.5px ring. */}
        <span aria-hidden className={cx("asta-pc-ring pointer-events-none absolute -inset-px overflow-hidden rounded-[15px] p-[1.5px] transition-opacity duration-500", running ? "opacity-100" : "opacity-0")}>
          <span
            className="asta-pc-spin absolute left-1/2 top-1/2 aspect-square w-[220%]"
            style={{
              background: "conic-gradient(from 0deg, transparent 0 52%, color-mix(in srgb, var(--color-brand) 25%, transparent) 70%, var(--color-brand) 92%, transparent 100%)",
              animation: `asta-pc-orbit 2.6s linear infinite ${running && onScreen ? "running" : "paused"}`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </span>

        {files.length > 0 && (
          <ul aria-label="Attached files" className="flex flex-wrap gap-1.5 px-3 pt-3">
            {files.map(({ id, file }) => (
              <li key={id} className="flex h-9 max-w-full items-center gap-2 rounded-lg bg-paper-2 pl-2 pr-1 text-[12.5px]" style={{ animation: `asta-pc-chip .22s ${EASE}` }}>
                <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-paper text-ink-2">
                  <Icon d={GLYPH.file} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 truncate font-medium text-ink sm:max-w-[180px]">{file.name}</span>
                <span className="shrink-0 tabular-nums text-mute">{size(file.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => {
                    setFiles((f) => f.filter((x) => x.id !== id));
                    setStatus(`Removed ${file.name}.`);
                    ed.current?.focus();
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-mute outline-none transition-colors hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <Icon d="m4.5 4.5 7 7M11.5 4.5l-7 7" className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative px-4 pt-3.5">
          {empty && (
            <span aria-hidden className="pointer-events-none absolute left-4 top-3.5 truncate pr-4 text-[16px] leading-relaxed text-mute sm:text-[14.5px]">
              {placeholder}
            </span>
          )}
          <div
            ref={ed}
            role="textbox"
            aria-multiline="true"
            aria-label={label}
            aria-placeholder={placeholder}
            aria-disabled={disabled || undefined}
            aria-autocomplete="list"
            aria-controls={menu ? listId : undefined}
            aria-activedescendant={menu && items.length ? optId(act) : undefined}
            contentEditable={!disabled}
            suppressContentEditableWarning
            spellCheck
            enterKeyHint="send"
            onInput={() => {
              sync();
              detect();
            }}
            onKeyDown={onKey}
            onKeyUp={(e) => (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") && detect()}
            onClick={detect}
            onBlur={() => setMenu(null)}
            onPaste={onPaste}
            className="asta-pc-field max-h-[200px] min-h-[52px] overflow-y-auto whitespace-pre-wrap break-words pb-2 text-[16px] leading-relaxed text-ink outline-none sm:text-[14.5px] [scrollbar-width:thin]"
          />
        </div>

        <div className="flex items-center gap-1 px-2 pb-2">
          <input
            ref={picker}
            type="file"
            multiple
            accept={accept}
            tabIndex={-1}
            className="sr-only"
            aria-hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={disabled}
            aria-label="Attach files"
            title="Attach files"
            onClick={() => picker.current?.click()}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-2 outline-none transition-colors duration-150 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-45"
          >
            <Icon d="M13 7.5 8.2 12.3a3 3 0 0 1-4.3-4.2l5-5a2 2 0 0 1 2.8 2.8l-5 5a1 1 0 0 1-1.4-1.4L9.8 5" />
          </button>
          {model}
          <span className="ml-auto" />
          {running ? (
            <button
              key="stop"
              type="button"
              onClick={onStop}
              aria-label="Stop the agent"
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-ink pl-2.5 pr-3 text-[13px] font-medium text-paper outline-none transition-transform duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              style={{ animation: `asta-pc-chip .22s ${EASE}` }}
            >
              <span aria-hidden className="h-2.5 w-2.5 rounded-[2px] bg-current" />
              Stop
            </button>
          ) : (
            <button
              key="send"
              type="submit"
              disabled={!canSend || disabled}
              aria-label="Send message"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white outline-none transition-[opacity,transform] duration-150 active:scale-95 disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              style={{ animation: `asta-pc-chip .22s ${EASE}` }}
            >
              <Icon d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
            </button>
          )}
        </div>
      </form>

      <p className={cx("mt-2 flex min-h-[18px] items-center gap-1.5 px-1 text-[12px]", error ? "font-medium text-ink" : "text-mute")} role={error ? "alert" : undefined}>
        {error ? (
          <>
            <Icon d="M8 2.5 14 13H2zM8 6.5v3M8 11.2h.01" className="h-3.5 w-3.5" />
            {error}
          </>
        ) : running ? (
          "Astabyte is working. Press Esc or Stop to end the run."
        ) : (
          <span className="hidden sm:inline">Enter to send · Shift + Enter for a new line · @ to mention · / for commands</span>
        )}
      </p>
    </div>
  );
}

export default PromptComposer;
