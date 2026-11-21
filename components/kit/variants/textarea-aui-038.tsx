"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const LH = 22;
const PAD = 14;
const CSS = `
@keyframes aui038-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui038-menu { from { opacity: 0; transform: translateY(-4px) scale(.97) } to { opacity: 1; transform: none } }
@keyframes aui038-ok { from { opacity: 0; transform: scale(.5) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui038 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui038-rise .6s ${EASE} ${i * 55}ms both` });

export interface SnippetLanguage {
  id: string;
  label: string;
  /** File name shown in the title bar for this language. */
  file: string;
}

export const SNIPPET_LANGUAGES: SnippetLanguage[] = [
  { id: "ts", label: "TypeScript", file: "middleware.ts" },
  { id: "rust", label: "Rust", file: "main.rs" },
  { id: "go", label: "Go", file: "main.go" },
  { id: "py", label: "Python", file: "app.py" },
  { id: "sql", label: "SQL", file: "query.sql" },
];

export interface SnippetTextareaProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  languages?: SnippetLanguage[];
  language?: string;
  defaultLanguage?: string;
  onLanguageChange?: (id: string) => void;
  /** Spaces per indent. */
  tabSize?: number;
  /** Visible lines before it scrolls. */
  rows?: number;
  label?: string;
  className?: string;
}

const KW =
  /^(?:export|import|from|function|return|const|let|var|if|else|for|while|async|await|new|class|type|interface|fn|pub|mut|impl|struct|use|match|func|package|def|elif|in|not|and|or|select|where|join|on|group|by|order|limit|insert|update|delete|true|false|null|None|nil|self)$/i;

/** A tiny monochrome highlighter: keywords bright, strings blue, comments dim. */
function tokens(code: string, lang: string) {
  const comment = lang === "py" ? "#.*" : lang === "sql" ? "--.*" : "\\/\\/.*";
  const re = new RegExp(`(${comment})|` + /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/.source, "g");
  const out: { t: string; k?: "c" | "s" | "n" | "k" | "f" }[] = [];
  let last = 0;
  for (const m of code.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: code.slice(last, i) });
    const [w, c, str, num, id] = m;
    const next = code[i + w.length];
    out.push({ t: w, k: c ? "c" : str ? "s" : num ? "n" : id && KW.test(id) ? "k" : id && next === "(" ? "f" : undefined });
    last = i + w.length;
  }
  if (last < code.length) out.push({ t: code.slice(last) });
  return out;
}

const TONE = {
  c: "text-paper/35 italic",
  s: "text-[color-mix(in_srgb,var(--color-brand)_55%,var(--color-paper))]",
  n: "text-[color-mix(in_srgb,var(--color-brand)_55%,var(--color-paper))]",
  k: "text-paper font-medium",
  f: "text-paper",
};

/** Insert text through the editing pipeline so undo keeps working. */
function insert(el: HTMLTextAreaElement, text: string) {
  el.focus();
  if (!document.execCommand?.("insertText", false, text)) el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
}

/**
 * aui-038 · A dark code snippet field with quiet highlighting. Signature: a gutter of line numbers and an active-line band that track the caret
 * while you scroll, Tab and Shift + Tab indent whole selections, Enter keeps the indent, and a language chip switches the file.
 */
export function SnippetTextarea({
  value,
  defaultValue = "",
  onChange,
  languages = SNIPPET_LANGUAGES,
  language,
  defaultLanguage,
  onLanguageChange,
  tabSize = 2,
  rows = 8,
  label = "Code snippet",
  className,
}: SnippetTextareaProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const code = value ?? inner;
  const [innerLang, setInnerLang] = useState(defaultLanguage ?? languages[0]?.id);
  const lang = languages.find((l) => l.id === (language ?? innerLang)) ?? languages[0];
  const [pos, setPos] = useState({ line: 1, col: 1 });
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [copied, setCopied] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLPreElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const escaped = useRef(false);
  const copyT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lines = code.split("\n").length;
  const unit = " ".repeat(tabSize);

  useEffect(() => () => clearTimeout(copyT.current), []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Gutter and band follow the scroll with transforms, no layout work.
  const paint = (line: number) => {
    const el = area.current;
    if (!el) return;
    const top = el.scrollTop;
    if (gutter.current) gutter.current.style.transform = `translateY(${-top}px)`;
    if (shade.current) shade.current.style.transform = `translate(${-el.scrollLeft}px, ${-top}px)`;
    if (band.current) band.current.style.transform = `translateY(${(line - 1) * LH - top}px)`;
  };

  const track = () => {
    const el = area.current;
    if (!el) return;
    const before = el.value.slice(0, el.selectionStart);
    const line = before.split("\n").length;
    const col = el.selectionStart - before.lastIndexOf("\n");
    setPos((p) => (p.line === line && p.col === col ? p : { line, col }));
    paint(line);
  };

  const set = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === "Escape") {
      escaped.current = true;
      return;
    }
    if (e.key === "Tab" && !escaped.current) {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end, value: v } = el;
      const from = v.lastIndexOf("\n", s - 1) + 1;
      const multi = v.slice(s, end).includes("\n");
      if (!e.shiftKey && !multi) return insert(el, unit);
      const to = end;
      const block = v.slice(from, to);
      const next = block
        .split("\n")
        .map((l) => (e.shiftKey ? l.replace(new RegExp(`^ {1,${tabSize}}`), "") : unit + l))
        .join("\n");
      el.setSelectionRange(from, to);
      insert(el, next);
      el.setSelectionRange(from, from + next.length);
      return;
    }
    escaped.current = false;
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const v = el.value;
      const from = v.lastIndexOf("\n", el.selectionStart - 1) + 1;
      const line = v.slice(from, el.selectionStart);
      const indent = line.match(/^\s*/)?.[0] ?? "";
      const extra = /[{[(:]\s*$/.test(line) ? unit : "";
      insert(el, "\n" + indent + extra);
    }
  };

  const choose = (i: number) => {
    const l = languages[i];
    if (!l) return;
    if (language === undefined) setInnerLang(l.id);
    onLanguageChange?.(l.id);
    setOpen(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(copyT.current);
      copyT.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      area.current?.select();
    }
  };

  return (
    <div
      className={cx(
        "aui038 w-full max-w-[520px] rounded-[14px] bg-ink text-paper shadow-[0_1px_2px_rgb(0_0_0/0.08),0_24px_48px_-24px_rgb(0_0_0/0.55)]",
        className,
      )}
    >
      <style href="asta-textarea-aui-038" precedence="asta">{CSS}</style>
      <div className="flex items-center gap-3 px-3.5 py-2.5" style={rise(0)}>
        <span aria-hidden className="hidden gap-1.5 min-[420px]:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-paper/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-paper/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-paper/20" />
        </span>
        <label htmlFor={id} className="min-w-0 flex-1 truncate font-mono text-[12px] text-paper/60">
          <span className="sr-only">{label}, </span>
          {lang?.file}
        </label>
        <div ref={menu} className="relative">
          <button
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-controls={`${id}-list`}
            aria-expanded={open}
            aria-label={`Language: ${lang?.label}`}
            onClick={() => {
              setHi(Math.max(0, languages.indexOf(lang)));
              setOpen((o) => !o);
            }}
            onKeyDown={(e) => {
              if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                e.preventDefault();
                setHi(Math.max(0, languages.indexOf(lang)));
                setOpen(true);
                return;
              }
              if (!open) return;
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setHi((h) => (h + (e.key === "ArrowDown" ? 1 : -1) + languages.length) % languages.length);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                choose(hi);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              } else if (e.key === "Tab") setOpen(false);
            }}
            aria-activedescendant={open ? `${id}-opt-${hi}` : undefined}
            className="flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[12px] font-medium text-paper outline-none shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_16%,transparent)] transition-[background-color,transform] duration-200 hover:bg-paper/10 active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            {lang?.label}
            <svg viewBox="0 0 16 16" className={cx("h-3 w-3 text-paper/60 transition-transform duration-300", open && "rotate-180")} style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m4 6 4 4 4-4" />
            </svg>
          </button>
          {open && (
            <ul
              id={`${id}-list`}
              role="listbox"
              aria-label="Language"
              className="absolute right-0 top-[calc(100%+6px)] z-20 w-40 origin-top-right rounded-[10px] bg-paper p-1 text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_16px_32px_-12px_rgb(0_0_0/0.4)]"
              style={{ animation: `aui038-menu .22s ${EASE} both` }}
            >
              {languages.map((l, i) => (
                <li
                  key={l.id}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={l.id === lang?.id}
                  onPointerEnter={() => setHi(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={cx("flex h-8 cursor-pointer items-center justify-between rounded-[7px] px-2.5 text-[13px] transition-colors", i === hi && "bg-paper-2")}
                >
                  {l.label}
                  {l.id === lang?.id && (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m3.5 8.5 3 3 6-7" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="grid h-7 w-7 place-items-center rounded-[7px] text-paper/60 outline-none transition-[background-color,color,transform] duration-200 hover:bg-paper/10 hover:text-paper active:scale-90 focus-visible:ring-2 focus-visible:ring-brand"
        >
          {copied ? (
            <svg key="ok" viewBox="0 0 16 16" className="h-3.5 w-3.5 text-paper" style={{ animation: `aui038-ok .3s ${EASE} both` }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m3.5 8.5 3 3 6-7" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" />
              <path d="M10.5 3.5v-.3A1.7 1.7 0 0 0 8.8 1.5H4.2a1.7 1.7 0 0 0-1.7 1.7v4.6a1.7 1.7 0 0 0 1.7 1.7h.3" />
            </svg>
          )}
        </button>
      </div>

      <div className="relative mx-1.5 overflow-hidden rounded-[10px] bg-paper/[0.04]" style={{ ...rise(1), height: rows * LH + PAD * 2 }}>
        <div ref={band} aria-hidden className="pointer-events-none absolute inset-x-0 bg-paper/[0.06] will-change-transform" style={{ top: PAD, height: LH, transform: `translateY(${(pos.line - 1) * LH}px)` }}>
          <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-brand" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-11 overflow-hidden">
          <div ref={gutter} className="will-change-transform" style={{ paddingTop: PAD }}>
            {Array.from({ length: lines }, (_, i) => (
              <div key={i} className={cx("pr-3 text-right font-mono text-[12px] tabular-nums transition-colors duration-150", i + 1 === pos.line ? "text-paper" : "text-paper/30")} style={{ height: LH, lineHeight: `${LH}px` }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <pre
          ref={shade}
          aria-hidden
          className="pointer-events-none absolute inset-0 m-0 overflow-visible whitespace-pre pl-[52px] pr-4 font-mono text-[16px] sm:text-[12.5px] text-paper/75 will-change-transform"
          style={{ lineHeight: `${LH}px`, paddingTop: PAD, paddingBottom: PAD, tabSize }}
        >
          {tokens(code, lang?.id ?? "").map((tk, i) => (tk.k ? <span key={i} className={TONE[tk.k]}>{tk.t}</span> : tk.t))}
          {"\n"}
        </pre>
        <textarea
          ref={area}
          id={id}
          value={code}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-describedby={`${id}-help`}
          onChange={(e) => {
            set(e.target.value);
            track();
          }}
          onKeyDown={onKey}
          onKeyUp={track}
          onClick={track}
          onSelect={track}
          onFocus={track}
          onScroll={() => paint(pos.line)}
          className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent pl-[52px] pr-4 font-mono text-[16px] sm:text-[12.5px] text-transparent caret-paper outline-none selection:bg-brand/40 selection:text-transparent"
          style={{ lineHeight: `${LH}px`, paddingTop: PAD, paddingBottom: PAD, tabSize }}
        />
      </div>

      <div id={`${id}-help`} className="flex items-center justify-between gap-3 px-3.5 py-2.5 font-mono text-[11px] text-paper/45" style={rise(2)}>
        <span className="tabular-nums">
          Ln {pos.line}, Col {pos.col}
        </span>
        <span className="hidden sm:inline">Tab indents · Esc then Tab leaves</span>
        <span>Spaces: {tabSize}</span>
      </div>
    </div>
  );
}

export default SnippetTextarea;
