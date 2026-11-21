"use client";

import { useEffect, useRef, useState } from "react";
import { useReplay } from "@/components/blog/DemoFrame";
import { Button, buttonClass } from "@/components/kit/button";
import { DIALOG_CSS, POPOVER_CSS, TOAST_CSS } from "./code";

const SORTS = ["Newest first", "Price, low to high", "Price, high to low", "Most popular"];
const PANEL = "rounded-[10px] bg-paper p-1 text-ink shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_12px_28px_-14px_rgb(0_0_0/0.25)]";

/** A native popover. CSS plays both the entrance and the exit. */
export function PopoverDemo() {
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState(0);
  const n = useReplay();

  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    // Top-layer elements sit outside the stage, so place the menu under its button when it opens.
    const place = (e: Event) => {
      if ((e as ToggleEvent).newState !== "open" || !button.current) return;
      const r = button.current.getBoundingClientRect();
      el.style.top = `${r.bottom + scrollY + 6}px`;
      el.style.left = `${r.left + scrollX}px`;
    };
    el.addEventListener("beforetoggle", place);
    return () => el.removeEventListener("beforetoggle", place);
  }, []);

  // Replay opens the menu, so the entrance plays.
  useEffect(() => {
    if (n) menu.current?.showPopover();
  }, [n]);

  return (
    <div className="ss-pop flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:gap-4 sm:p-8">
      <style href="asta-blog-ss-pop" precedence="asta">
        {POPOVER_CSS}
      </style>
      <button ref={button} type="button" popoverTarget="ss-sort" className={buttonClass({ variant: "outline", size: "sm" })}>
        Sort: {SORTS[pick]}
      </button>
      <p className="text-[13px] text-mute">Click outside or press Esc to close it. Both ways animate.</p>
      <div ref={menu} id="ss-sort" popover="auto" className={`menu absolute inset-auto m-0 w-56 ${PANEL}`}>
        {SORTS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setPick(i);
              menu.current?.hidePopover();
            }}
            className={`flex h-9 w-full items-center rounded-[7px] px-3 text-left text-[14px] hover:bg-paper-2 ${i === pick ? "text-brand" : "text-ink"}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A modal dialog with a backdrop that fades in and out. */
export function DialogDemo() {
  const ref = useRef<HTMLDialogElement>(null);
  const [last, setLast] = useState("");
  const n = useReplay();
  useEffect(() => {
    if (n) ref.current?.showModal();
  }, [n]);
  return (
    <div className="ss-dialog flex h-full flex-col items-start justify-center gap-3 p-5 sm:p-8">
      <style href="asta-blog-ss-dialog" precedence="asta">
        {DIALOG_CSS}
      </style>
      <div className="flex w-full max-w-sm items-center justify-between gap-4 rounded-[12px] bg-paper-2 p-4">
        <span>
          <span className="block text-[14px] font-medium text-ink">Astabyte site</span>
          <span className="block text-[13px] text-mute">{last === "delete" ? "Deleted. Not really, it’s a demo." : "Edited 2 hours ago"}</span>
        </span>
        <Button variant="outline" size="sm" onClick={() => ref.current?.showModal()}>
          Delete
        </Button>
      </div>
      <dialog ref={ref} onClose={() => setLast(ref.current?.returnValue ?? "")} className="m-auto w-[min(92vw,380px)] rounded-[14px] bg-paper p-6 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]">
        <form method="dialog">
          <p className="text-[17px] font-medium tracking-[-0.01em]">Delete “Astabyte site”?</p>
          <p className="mt-2 text-[14px] leading-relaxed text-mute">The project and its 12 pages go away for good. You can’t undo this.</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="submit" variant="soft" size="sm" value="cancel">
              Cancel
            </Button>
            <Button type="submit" variant="solid" size="sm" value="delete">
              Delete
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

type Toast = { id: number; text: string };
const TEXTS = ["Changes saved", "Invite sent to Dana", "Invoice #1042 paid", "Export ready", "Link copied"];

/** Toasts that enter with @starting-style and leave with [hidden]. No animation code. */
export function ToastDemo() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [gone, setGone] = useState<number[]>([]);
  const next = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Ids still on screen, newest first. A ref, so fast clicks see the latest list.
  const live = useRef<number[]>([]);

  const dismiss = (id: number) => {
    if (!live.current.includes(id)) return;
    live.current = live.current.filter((x) => x !== id);
    setGone((g) => [...g, id]);
    timers.current.push(
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
        setGone((g) => g.filter((x) => x !== id));
      }, 260),
    );
  };
  const add = () => {
    const id = ++next.current;
    live.current = [id, ...live.current];
    setToasts((t) => [{ id, text: TEXTS[id % TEXTS.length] }, ...t]);
    if (live.current.length > 3) dismiss(live.current[live.current.length - 1]);
  };

  // Replay adds a toast, so the entrance plays.
  const addRef = useRef(add);
  useEffect(() => {
    addRef.current = add;
  });
  const n = useReplay();
  useEffect(() => {
    if (n) addRef.current();
  }, [n]);

  return (
    <div className="ss-toasts flex h-full flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-8">
      <style href="asta-blog-ss-toasts" precedence="asta">
        {TOAST_CSS}
      </style>
      <Button size="sm" onClick={add} className="self-start">
        Add a toast
      </Button>
      <ul className="flex w-full max-w-sm flex-col gap-2 sm:ml-auto" aria-live="polite">
        {toasts.map((t) => (
          <li key={t.id} hidden={gone.includes(t.id)} className={`flex items-center justify-between gap-3 py-2.5 pl-4 pr-2 ${PANEL}`}>
            <span className="flex items-center gap-2.5 text-[14px]">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
              {t.text}
            </span>
            <Button variant="ghost" size="xs" onClick={() => dismiss(t.id)} aria-label={`Dismiss ${t.text}`}>
              Dismiss
            </Button>
          </li>
        ))}
        {!toasts.length && <li className="rounded-[10px] bg-paper-2 px-4 py-3 text-[13px] text-mute">No toasts yet. Add one.</li>}
      </ul>
    </div>
  );
}
