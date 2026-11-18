"use client";

import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface UploadItem {
  id: string;
  file: File;
  /** 0 to 1. */
  progress: number;
  status: "uploading" | "done" | "error";
}

export interface FileUploadProps {
  /** Same format as the input's `accept`: "image/*", "application/pdf", ".csv". */
  accept?: string;
  /** Largest file in bytes. */
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  /**
   * Upload one file and report progress (0–1) as you go. Throw to mark it failed. Without it, files are
   * added as done straight away. The signal aborts when the row is removed or replaced.
   */
  onUpload?: (file: File, setProgress: (progress: number) => void, signal: AbortSignal) => Promise<void>;
  /** Called with every file that finished uploading, whenever that list changes. */
  onChange?: (files: File[]) => void;
  /** Main line in the drop zone. */
  label?: ReactNode;
  /** Small line under it. Defaults to the accepted types and size limit. */
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
}

const KEYFRAMES = `@keyframes kit-upload-row { from { opacity: 0; transform: translateY(8px) } }
@keyframes kit-upload-msg { from { opacity: 0; transform: translateY(-3px) } }`;

export const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`);

const matches = (file: File, accept?: string) => {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : type === a));
};

const ext = (name: string) => {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1, i + 5).toUpperCase() : "FILE";
};

let seq = 0;

/**
 * A drop zone and a file list. Drag files over it (it lifts and turns blue), or click / press Enter to
 * browse. Each file gets a row with a progress bar and a remove button. `accept`, `maxSize` and `maxFiles`
 * reject what doesn't fit and say why.
 */
export function FileUpload({ accept, maxSize, maxFiles, multiple = true, onUpload, onChange, label, hint, disabled, className }: FileUploadProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const depth = useRef(0);
  const picker = useRef<HTMLInputElement>(null);
  const uid = useId();

  // Report finished files whenever that set changes.
  const done = items.filter((i) => i.status === "done");
  const doneKey = done.map((i) => i.id).join();
  const reported = useRef("");
  useEffect(() => {
    if (doneKey === reported.current) return;
    reported.current = doneKey;
    onChange?.(items.filter((i) => i.status === "done").map((i) => i.file));
  }, [doneKey, items, onChange]);

  // Progress arrives later, so it updates through a functional setState.
  const patch = (id: string, change: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)));

  // One controller per row in flight. Removing a row aborts it and its callbacks are ignored.
  const runs = useRef(new Map<string, AbortController>());
  const stop = (id: string) => {
    runs.current.get(id)?.abort();
    runs.current.delete(id);
  };
  useEffect(() => {
    const live = runs.current;
    return () => live.forEach((c) => c.abort());
  }, []);

  const run = (item: UploadItem) => {
    if (!onUpload) return;
    stop(item.id);
    const ctrl = new AbortController();
    runs.current.set(item.id, ctrl);
    const alive = () => !ctrl.signal.aborted;
    let last = 0;
    onUpload(
      item.file,
      (p) => {
        if (!alive()) return;
        const v = Math.max(0, Math.min(1, p));
        // Never move backwards, and skip tiny steps to keep renders cheap.
        if (v - last < 0.01 && v < 1) return;
        last = v;
        patch(item.id, { progress: v });
      },
      ctrl.signal,
    )
      .then(() => alive() && patch(item.id, { progress: 1, status: "done" }))
      .catch(() => alive() && patch(item.id, { status: "error" }))
      .finally(() => {
        if (runs.current.get(item.id) === ctrl) runs.current.delete(item.id);
      });
  };

  const add = (list: FileList | File[]) => {
    if (disabled) return;
    const files = Array.from(list);
    if (!files.length) return;
    // A single-file input replaces what is there, so only a multiple list counts existing rows.
    const room = maxFiles ? Math.max(0, maxFiles - (multiple ? items.length : 0)) : Infinity;
    const rejected: string[] = [];
    const ok: File[] = [];
    for (const f of multiple ? files : files.slice(0, 1)) {
      if (!matches(f, accept)) rejected.push(`${f.name} isn't an accepted file type.`);
      else if (maxSize && f.size > maxSize) rejected.push(`${f.name} is over ${formatBytes(maxSize)}.`);
      else if (ok.length >= room) rejected.push(`Only ${maxFiles} file${maxFiles === 1 ? "" : "s"} allowed.`);
      else ok.push(f);
    }
    setError(rejected.length ? (rejected.length === 1 ? rejected[0] : `${rejected[0]} ${rejected.length - 1} more skipped.`) : null);
    if (!ok.length) return;
    const fresh: UploadItem[] = ok.map((file) => ({ id: `f${++seq}`, file, progress: onUpload ? 0 : 1, status: onUpload ? "uploading" : "done" }));
    if (!multiple) items.forEach((i) => stop(i.id));
    setItems(multiple ? [...items, ...fresh] : fresh);
    fresh.forEach(run);
  };

  const remove = (id: string) => {
    stop(id);
    setItems(items.filter((i) => i.id !== id));
    setError(null);
  };

  const retry = (item: UploadItem) => {
    const again = { ...item, progress: 0, status: "uploading" as const };
    setItems((list) => list.map((i) => (i.id === item.id ? again : i)));
    run(again);
  };

  const browse = () => !disabled && picker.current?.click();

  const onDrag = (e: DragEvent, kind: "enter" | "leave" | "over" | "drop") => {
    e.preventDefault();
    if (disabled) return;
    if (kind === "enter") {
      depth.current += 1;
      setOver(true);
    } else if (kind === "leave") {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    } else if (kind === "over") {
      e.dataTransfer.dropEffect = "copy";
    } else {
      depth.current = 0;
      setOver(false);
      add(e.dataTransfer.files);
    }
  };

  const limits = [accept?.split(",").map((a) => a.trim().replace(/^\./, "").replace("/*", "").replace(/^\w+\//, "").toUpperCase()).join(", "), maxSize && `up to ${formatBytes(maxSize)}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cx("flex w-full flex-col", className)}>
      <style href="asta-file-upload" precedence="asta">{KEYFRAMES}</style>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={`${uid}-hint${error ? ` ${uid}-err` : ""}`}
        onClick={browse}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            browse();
          }
        }}
        onDragEnter={(e) => onDrag(e, "enter")}
        onDragLeave={(e) => onDrag(e, "leave")}
        onDragOver={(e) => onDrag(e, "over")}
        onDrop={(e) => onDrag(e, "drop")}
        className={cx(
          "group/drop relative flex cursor-pointer select-none flex-col items-center justify-center gap-3 rounded-xl px-6 py-9 text-center outline-none",
          "transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:ring-2 focus-visible:ring-brand/50 motion-reduce:transition-none",
          over
            ? "-translate-y-1 bg-[color-mix(in_srgb,var(--color-brand)_6%,var(--color-paper))] shadow-[inset_0_0_0_1.5px_var(--color-brand),0_14px_30px_-14px_color-mix(in_srgb,var(--color-brand)_55%,transparent)]"
            : "bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_18%,transparent)]",
          disabled && "pointer-events-none opacity-45",
        )}
      >
        <span
          className={cx(
            "flex h-11 w-11 items-center justify-center rounded-[10px] bg-paper transition-[transform,color,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent),0_2px_6px_-2px_rgb(0_0_0/0.12)]",
            over ? "-translate-y-0.5 scale-105 text-brand" : "text-ink-2 group-hover/drop:-translate-y-0.5",
          )}
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M10 13V4M6.5 7.5 10 4l3.5 3.5" />
            <path d="M4 12.5v2A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-2" />
          </svg>
        </span>
        <div>
          <p className="text-[14px] font-medium tracking-[-0.01em] text-ink">
            {over ? "Drop to upload" : (label ?? (
              <>
                Drop files here or <span className="text-brand">browse</span>
              </>
            ))}
          </p>
          <p id={`${uid}-hint`} className="mt-1 text-[12.5px] text-mute">
            {hint ?? (limits || "Any file")}
          </p>
        </div>
        <input
          ref={picker}
          type="file"
          tabIndex={-1}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p key={error} id={`${uid}-err`} role="alert" className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-ink animate-[kit-upload-msg_.3s_cubic-bezier(.16,1,.3,1)_both]">
          <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5M8 11h0" />
          </svg>
          {error}
        </p>
      )}

      {items.length > 0 && (
        <ul aria-label="Files" className="mt-3 flex flex-col gap-1.5">
          {items.map((it) => {
            const pct = Math.round(it.progress * 100);
            return (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded-[10px] bg-paper p-2.5 pr-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent)] animate-[kit-upload-row_.38s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:!animate-none"
              >
                <span
                  aria-hidden
                  className={cx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9.5px] font-semibold tracking-[0.02em] transition-colors duration-300",
                    it.status === "done" ? "bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] text-brand" : "bg-paper-2 text-ink-2",
                  )}
                >
                  {ext(it.file.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[13px] font-medium text-ink">{it.file.name}</p>
                    <p className="shrink-0 text-[12px] tabular-nums text-mute" aria-live="polite">
                      {it.status === "uploading" ? `${pct}%` : it.status === "error" ? "Failed" : formatBytes(it.file.size)}
                    </p>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${it.file.name} upload`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    className={cx(
                      "relative mt-1.5 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] transition-opacity duration-500",
                      it.status === "done" && "opacity-0",
                    )}
                  >
                    <span
                      className={cx(
                        "absolute inset-0 origin-left rounded-full transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
                        it.status === "error" ? "bg-ink-2" : "bg-brand",
                      )}
                      style={{ transform: `scaleX(${it.progress})` }}
                    />
                  </div>
                </div>
                {it.status === "error" && (
                  <button
                    type="button"
                    onClick={() => retry(it)}
                    className="h-7 shrink-0 rounded-md px-2 text-[12px] font-medium text-ink outline-none transition-colors hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label={`Remove ${it.file.name}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-mute outline-none transition-[background-color,color,transform] duration-150 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-90"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default FileUpload;
