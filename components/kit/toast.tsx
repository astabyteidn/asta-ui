"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type ToastTone = "default" | "success" | "error";
export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it leaves on its own. Default 4000. */
  duration?: number;
}
interface ToastData extends ToastInput {
  id: string;
  leaving?: "down" | "left" | "right";
}

interface Ctx {
  toast: (t: ToastInput) => string;
  dismiss: (id: string) => void;
}
const ToastCtx = createContext<Ctx | null>(null);

/** `const { toast } = useToast(); toast({ title: "Saved", tone: "success" })` inside a `<Toaster>`. */
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <Toaster>");
  return ctx;
}

const GAP = 8;
const EASE = "cubic-bezier(.16,1,.3,1)";

export interface ToasterProps {
  children: ReactNode;
  /** How many stay visible in the stack. */
  max?: number;
  /** Position inside the nearest positioned parent instead of the viewport. */
  contained?: boolean;
}

/**
 * Provider + viewport. Toasts stack at the bottom right, tucked behind each other; hover or focus the
 * stack to fan it out (timers pause meanwhile). Swipe one sideways to dismiss it.
 */
export function Toaster({ children, max = 3, contained = false }: ToasterProps) {
  const [list, setList] = useState<ToastData[]>([]);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);
  const seq = useRef(0);

  const dismiss = useCallback((id: string, dir: ToastData["leaving"] = "down") => {
    setList((l) => l.map((t) => (t.id === id ? { ...t, leaving: dir } : t)));
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 260);
  }, []);
  const toast = useCallback((t: ToastInput) => {
    seq.current += 1;
    const id = `t${seq.current}`;
    setList((l) => [...l, { ...t, id }]);
    return id;
  }, []);
  const ctx = useMemo(() => ({ toast, dismiss: (id: string) => dismiss(id) }), [toast, dismiss]);

  const live = list.filter((t) => !t.leaving).reverse(); // newest first
  const front = live[0] ? heights[live[0].id] : undefined;
  const isOpen = expanded && live.length > 0;

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <section
        aria-label="Notifications"
        onPointerEnter={() => setExpanded(true)}
        onPointerLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setExpanded(false)}
        className={cx(contained ? "absolute" : "fixed", "bottom-4 left-4 right-4 z-40 sm:left-auto sm:w-[340px]")}
      >
        <ol aria-live="polite" className="relative">
          {list.map((t) => {
            const i = live.indexOf(t);
            let y = 0;
            if (i > 0) y = isOpen ? -live.slice(0, i).reduce((a, x) => a + (heights[x.id] ?? 64) + GAP, 0) : -i * 12;
            return (
              <Toast
                key={t.id}
                data={t}
                index={i}
                y={y}
                scale={isOpen || i <= 0 ? 1 : 1 - i * 0.05}
                hidden={i >= max}
                clamp={!isOpen && i > 0 ? front : undefined}
                paused={isOpen}
                onHeight={(h) => setHeights((m) => (m[t.id] === h ? m : { ...m, [t.id]: h }))}
                dismiss={dismiss}
              />
            );
          })}
        </ol>
      </section>
    </ToastCtx.Provider>
  );
}

const TONE: Record<ToastTone, { color: string; path: string } | null> = {
  default: null,
  success: { color: "#30a46c", path: "M4.5 8.5l2.2 2.2L11.5 5.5" },
  error: { color: "#e5484d", path: "M8 4.5v4M8 11h.01" },
};

function Toast({
  data,
  index,
  y,
  scale,
  hidden,
  clamp,
  paused,
  onHeight,
  dismiss,
}: {
  data: ToastData;
  index: number;
  y: number;
  scale: number;
  hidden: boolean;
  clamp?: number;
  paused: boolean;
  onHeight: (h: number) => void;
  dismiss: (id: string, dir: ToastData["leaving"]) => void;
}) {
  const onDismiss = (dir: ToastData["leaving"]) => dismiss(data.id, dir);
  const inner = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const left = useRef(data.duration ?? 4000);

  useLayoutEffect(() => {
    if (inner.current) onHeight(inner.current.offsetHeight);
  });
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);
  // Auto-dismiss, paused while the stack is fanned out.
  useEffect(() => {
    if (paused || data.leaving) return;
    const start = Date.now();
    const id = setTimeout(() => dismiss(data.id, "down"), left.current);
    return () => {
      clearTimeout(id);
      left.current = Math.max(800, left.current - (Date.now() - start));
    };
  }, [paused, data.leaving, data.id, dismiss]);

  const tone = TONE[data.tone ?? "default"];
  const leaving = data.leaving;
  const tx = leaving === "left" ? -380 : leaving === "right" ? 380 : dx;
  const ty = !shown ? 24 : leaving === "down" ? 16 : y;
  const off = !shown || leaving || hidden;

  return (
    <li
      role={data.tone === "error" ? "alert" : "status"}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, t: Date.now() };
        setDragging(true);
      }}
      onPointerMove={(e) => drag.current && setDx(e.clientX - drag.current.x)}
      onPointerUp={(e) => {
        if (!drag.current) return;
        const d = e.clientX - drag.current.x;
        const v = Math.abs(d) / Math.max(1, Date.now() - drag.current.t);
        drag.current = null;
        setDragging(false);
        if (Math.abs(d) > 90 || v > 0.6) onDismiss(d < 0 ? "left" : "right");
        else setDx(0);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
        setDx(0);
      }}
      className="absolute bottom-0 left-0 right-0 origin-bottom touch-pan-y select-none overflow-hidden rounded-xl bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_30px_-14px_rgb(0_0_0/0.35)] motion-reduce:!transition-none"
      style={{
        zIndex: 100 - Math.max(0, index),
        transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
        opacity: off ? 0 : dragging ? 1 - Math.min(0.7, Math.abs(dx) / 260) : 1,
        height: clamp,
        pointerEvents: off ? "none" : undefined,
        transition: dragging ? "none" : `transform .45s ${EASE}, opacity .3s ease, height .35s ${EASE}`,
      }}
    >
      <div ref={inner} className={cx("flex items-start gap-3 p-3.5 pr-3", clamp !== undefined && "opacity-0 transition-opacity")}>
        {tone && (
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: tone.color }}>
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={tone.path} />
            </svg>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium leading-5 tracking-[-0.01em] text-ink">{data.title}</p>
          {data.description && <p className="mt-0.5 text-[12.5px] leading-snug text-mute">{data.description}</p>}
        </div>
        {data.action ? (
          <button
            type="button"
            onClick={() => {
              data.action!.onClick();
              onDismiss("down");
            }}
            className="h-7 shrink-0 rounded-lg bg-ink px-2.5 text-[12px] font-medium text-paper outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            {data.action.label}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDismiss("down")}
            aria-label="Dismiss"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}

export default Toaster;
