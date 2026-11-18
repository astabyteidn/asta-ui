"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Avatar } from "@/components/kit/avatar";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const CURVE = "cubic-bezier(.16,1,.3,1)";
const GAP = 8; // matches gap-2 on the lists

export interface KanbanColumn {
  id: string;
  title: string;
}
export interface KanbanCard {
  id: string;
  column: string;
  title: string;
  tag?: string;
  assignee?: string;
  due?: string;
}
export interface KanbanProps {
  columns: KanbanColumn[];
  defaultCards: KanbanCard[];
  /** Called with the new order after every drop. */
  onChange?: (cards: KanbanCard[]) => void;
  className?: string;
}

interface ColGeo {
  id: string;
  left: number;
  right: number;
  top: number;
  ids: string[];
  box: Record<string, { top: number; h: number }>;
}
interface Drag {
  id: string;
  from: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
  target: { col: string; index: number };
  geo: ColGeo[];
  dropping?: boolean;
}

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Put `card` into `col` at `index` (counted among that column's cards). */
function place(cards: KanbanCard[], card: KanbanCard, col: string, index: number) {
  const rest = cards.filter((c) => c.id !== card.id);
  const inCol = rest.filter((c) => c.column === col);
  const before = inCol[index];
  const at = before ? rest.indexOf(before) : inCol.length ? rest.indexOf(inCol[inCol.length - 1]) + 1 : rest.length;
  rest.splice(at, 0, { ...card, column: col });
  return rest;
}

/** How far a card is pushed while something is dragged: up to close the hole it left, down to open the gap. */
function shiftOf(d: Drag, g: ColGeo, id: string) {
  const D = d.h + GAP;
  const i = g.ids.indexOf(id);
  const src = g.id === d.from ? g.ids.indexOf(d.id) : -1;
  const after = src >= 0 && i > src;
  const compact = after ? i - 1 : i;
  return (after ? -D : 0) + (g.id === d.target.col && compact >= d.target.index ? D : 0);
}

/** Top of the gap in the target column, in list coordinates. */
function gapTop(d: Drag, g: ColGeo) {
  const D = d.h + GAP;
  const src = g.id === d.from ? g.ids.indexOf(d.id) : -1;
  const adj = (id: string) => (src >= 0 && g.ids.indexOf(id) > src ? -D : 0);
  const compact = g.ids.filter((id) => id !== d.id);
  if (d.target.index < compact.length) {
    const id = compact[d.target.index];
    return g.box[id].top + adj(id);
  }
  const last = compact[compact.length - 1];
  return last ? g.box[last].top + adj(last) + g.box[last].h + GAP : 0;
}

function CardBody({ card }: { card: KanbanCard }) {
  return (
    <>
      <p className="text-[13.5px] leading-snug text-ink">{card.title}</p>
      {(card.tag || card.assignee || card.due) && (
        <div className="mt-3 flex items-center gap-2 text-[11.5px] text-mute">
          {card.tag && <span className="rounded-md bg-paper-2 px-1.5 leading-5">{card.tag}</span>}
          {card.due && <span className="tabular-nums">{card.due}</span>}
          {card.assignee && <Avatar name={card.assignee} size="xs" className="ml-auto" />}
        </div>
      )}
    </>
  );
}

const cardCls =
  "rounded-[10px] bg-paper p-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_9%,transparent),0_1px_2px_rgb(0_0_0/0.04)]";

/**
 * A board with columns of cards. Drag a card with the pointer and the gap opens where it will land.
 * With the keyboard: focus a card, press Space to pick it up, arrows to move it, Space to drop and
 * Escape to cancel. Counts follow along and every move is announced.
 */
export function Kanban({ columns, defaultCards, onChange, className }: KanbanProps) {
  const [cards, setCards] = useState(defaultCards);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [picked, setPicked] = useState<{ id: string; origin: KanbanCard[] } | null>(null);
  const [msg, setMsg] = useState("");
  const hintId = useId();

  const root = useRef<HTMLDivElement>(null);
  const lists = useRef(new Map<string, HTMLElement>());
  const els = useRef(new Map<string, HTMLElement>());
  const press = useRef<{ id: string; sx: number; sy: number } | null>(null);
  const flip = useRef<Map<string, DOMRect> | null>(null);
  const refocus = useRef<string | null>(null);
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  const inCol = (list: KanbanCard[], col: string) => list.filter((c) => c.column === col);
  const titleOf = (col: string) => columns.find((c) => c.id === col)?.title ?? col;
  const where = (list: KanbanCard[], id: string) => {
    const card = list.find((c) => c.id === id)!;
    const col = inCol(list, card.column);
    return `${titleOf(card.column)}, position ${col.indexOf(card) + 1} of ${col.length}`;
  };

  // FLIP for keyboard moves: cards glide from where they were to where they are now.
  useLayoutEffect(() => {
    const from = flip.current;
    flip.current = null;
    if (from && !reduced()) {
      from.forEach((r, id) => {
        const el = els.current.get(id);
        if (!el) return;
        const n = el.getBoundingClientRect();
        const dx = r.left - n.left;
        const dy = r.top - n.top;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 340, easing: CURVE });
      });
    }
    // Moving to another column re-mounts the card, so put focus back on it.
    const id = picked?.id ?? refocus.current;
    refocus.current = null;
    if (id && document.activeElement !== els.current.get(id)) els.current.get(id)?.focus();
  }, [cards, picked]);

  /* ---------- pointer ---------- */

  const start = (e: PointerEvent, card: KanbanCard) => {
    const board = root.current!.getBoundingClientRect();
    const geo = columns.map((c) => {
      const r = lists.current.get(c.id)!.getBoundingClientRect();
      const ids = inCol(cards, c.id).map((k) => k.id);
      const box = Object.fromEntries(ids.map((id) => [id, { top: els.current.get(id)!.offsetTop, h: els.current.get(id)!.offsetHeight }]));
      return { id: c.id, left: r.left - board.left, right: r.right - board.left, top: r.top - board.top, ids, box };
    });
    const r = els.current.get(card.id)!.getBoundingClientRect();
    const index = geo.find((g) => g.id === card.column)!.ids.indexOf(card.id);
    setDrag({
      id: card.id,
      from: card.column,
      x: r.left - board.left,
      y: r.top - board.top,
      w: r.width,
      h: r.height,
      ox: e.clientX - r.left,
      oy: e.clientY - r.top,
      target: { col: card.column, index },
      geo,
    });
  };

  const move = (e: PointerEvent, d: Drag) => {
    const board = root.current!.getBoundingClientRect();
    const x = e.clientX - board.left - d.ox;
    const y = e.clientY - board.top - d.oy;
    const px = e.clientX - board.left;
    const g =
      d.geo.find((c) => px >= c.left && px <= c.right) ??
      d.geo.reduce((a, b) => (Math.abs((a.left + a.right) / 2 - px) < Math.abs((b.left + b.right) / 2 - px) ? a : b));
    // Compare the card's centre with the midpoints of the cards left in that column.
    const cy = y + d.h / 2 - g.top;
    const closing: Drag = { ...d, target: { col: "", index: 0 } }; // only the shift that closes the hole
    const compact = g.ids.filter((id) => id !== d.id);
    let index = compact.length;
    for (let i = 0; i < compact.length; i++) {
      const b = g.box[compact[i]];
      const top = b.top + shiftOf(closing, g, compact[i]);
      if (cy < top + b.h / 2) {
        index = i;
        break;
      }
    }
    setDrag({ ...d, x, y, target: { col: g.id, index } });
  };

  const commit = (d: Drag) => {
    const card = cards.find((c) => c.id === d.id)!;
    const next = place(cards, card, d.target.col, d.target.index);
    setCards(next);
    setDrag(null);
    setMsg(`Dropped ${card.title} in ${where(next, card.id)}.`);
    onChange?.(next);
  };

  const drop = (d: Drag) => {
    if (reduced()) return commit(d);
    const g = d.geo.find((c) => c.id === d.target.col)!;
    setDrag({ ...d, x: g.left, y: g.top + gapTop(d, g), dropping: true });
    setTimeout(() => commit(d), 260);
  };

  // Put a keyboard pick-up back where it started, like Escape.
  const cancelPick = (focus: boolean) => {
    const p = pickedRef.current;
    if (!p) return;
    pickedRef.current = null;
    const card = p.origin.find((c) => c.id === p.id)!;
    flip.current = new Map([...els.current].map(([id, el]) => [id, el.getBoundingClientRect()]));
    if (focus) refocus.current = p.id;
    setCards(p.origin);
    setPicked(null);
    setMsg(`Cancelled. ${card.title} is back in ${where(p.origin, p.id)}.`);
  };

  const pointer = {
    down: (e: PointerEvent<HTMLElement>, card: KanbanCard) => {
      if (picked) return cancelPick(false);
      if (e.button !== 0 || drag) return;
      press.current = { id: card.id, sx: e.clientX, sy: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    move: (e: PointerEvent<HTMLElement>, card: KanbanCard) => {
      const p = press.current;
      if (!p || p.id !== card.id) return;
      if (drag) {
        if (!drag.dropping) move(e, drag);
      } else if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 4) start(e, card);
    },
    up: () => {
      press.current = null;
      if (drag && !drag.dropping) drop(drag);
    },
    cancel: () => {
      press.current = null;
      if (drag && !drag.dropping) setDrag(null);
    },
  };

  /* ---------- keyboard ---------- */

  const keyMove = (card: KanbanCard, dx: number, dy: number) => {
    const ci = columns.findIndex((c) => c.id === card.column);
    const nci = Math.min(columns.length - 1, Math.max(0, ci + dx));
    const col = columns[nci].id;
    const here = inCol(cards, card.column).indexOf(card);
    const others = inCol(cards, col).filter((c) => c.id !== card.id);
    const index = dx ? Math.min(here, others.length) : Math.min(others.length, Math.max(0, here + dy));
    if (col === card.column && index === here) return;
    flip.current = new Map([...els.current].map(([id, el]) => [id, el.getBoundingClientRect()]));
    const next = place(cards, card, col, index);
    setCards(next);
    setMsg(`${card.title}: ${where(next, card.id)}.`);
  };

  const onKey = (e: KeyboardEvent, card: KanbanCard) => {
    const held = picked?.id === card.id;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (held) {
        setPicked(null);
        setMsg(`Dropped ${card.title} in ${where(cards, card.id)}.`);
        onChange?.(cards);
      } else if (!picked) {
        setPicked({ id: card.id, origin: cards });
        setMsg(`Picked up ${card.title}. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
      }
      return;
    }
    if (!held) return;
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (dir) {
      e.preventDefault();
      keyMove(card, dir[0], dir[1]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelPick(true);
    }
  };

  // Focus leaving the held card cancels the pick-up. Moves re-mount or reorder the card and focus
  // comes back in the layout effect, so check after that has run.
  const onBlur = (id: string) => {
    if (pickedRef.current?.id !== id) return;
    setTimeout(() => {
      if (pickedRef.current?.id === id && document.activeElement !== els.current.get(id)) cancelPick(false);
    });
  };

  const dragged = drag ? cards.find((c) => c.id === drag.id) : undefined;

  return (
    <div className={cx("w-full overflow-x-auto", className)}>
      <style href="asta-kanban" precedence="asta">{`
        @keyframes kit-kb-lift { to { transform: rotate(1.5deg) scale(1.03); box-shadow: 0 18px 36px -14px rgb(0 0 0 / .28); } }
        @keyframes kit-kb-land { from { transform: rotate(1.5deg) scale(1.03); box-shadow: 0 18px 36px -14px rgb(0 0 0 / .28); } }
        @keyframes kit-kb-fade { from { opacity: 0; } }
        @keyframes kit-kb-count { from { opacity: 0; transform: translateY(4px); } }
        @media (prefers-reduced-motion: reduce) { .kit-kb, .kit-kb * { animation: none !important; transition-duration: 0s !important; } }
      `}</style>
      <p id={hintId} className="sr-only">
        Press Space to pick up a card. Use the arrow keys to move it, Space to drop, Escape to cancel.
      </p>
      <p className="sr-only" aria-live="polite">
        {msg}
      </p>

      <div ref={root} className="kit-kb relative grid min-w-[620px] gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((col) => {
          const list = inCol(cards, col.id);
          const g = drag?.geo.find((c) => c.id === col.id);
          const count = list.length - (drag?.from === col.id ? 1 : 0) + (drag?.target.col === col.id ? 1 : 0);
          return (
            <section key={col.id} aria-label={col.title} className="flex min-h-[340px] flex-col rounded-xl bg-paper-2 p-2">
              <header className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
                <h4 className="text-[13px] font-medium text-ink">{col.title}</h4>
                <span key={count} className="text-[12px] tabular-nums text-mute" style={{ animation: `kit-kb-count .4s ${CURVE}` }}>
                  {count}
                </span>
              </header>
              <ul
                ref={(el) => {
                  if (el) lists.current.set(col.id, el);
                }}
                className="relative flex flex-1 flex-col gap-2"
              >
                {drag && g && drag.target.col === col.id && (
                  <li
                    key={`gap-${col.id}`}
                    aria-hidden
                    className={cx(
                      "pointer-events-none absolute inset-x-0 top-0 rounded-[10px] bg-[color-mix(in_srgb,var(--color-brand)_5%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_28%,transparent)] transition-transform duration-300",
                      EASE,
                    )}
                    style={{ height: drag.h, transform: `translateY(${gapTop(drag, g)}px)`, animation: `kit-kb-fade .25s ${CURVE}` }}
                  />
                )}
                {list.map((card) => {
                  const held = picked?.id === card.id;
                  const hidden = drag?.id === card.id;
                  const dy = drag && g ? shiftOf(drag, g, card.id) : 0;
                  return (
                    <li
                      key={card.id}
                      ref={(el) => {
                        if (!el) return;
                        els.current.set(card.id, el);
                        return () => {
                          if (els.current.get(card.id) === el) els.current.delete(card.id);
                        };
                      }}
                      tabIndex={0}
                      aria-roledescription="draggable card"
                      aria-describedby={hintId}
                      data-picked={held || undefined}
                      onPointerDown={(e) => pointer.down(e, card)}
                      onPointerMove={(e) => pointer.move(e, card)}
                      onPointerUp={pointer.up}
                      onPointerCancel={pointer.cancel}
                      onKeyDown={(e) => onKey(e, card)}
                      onBlur={() => onBlur(card.id)}
                      className={cx(
                        cardCls,
                        "relative cursor-grab touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                        drag && "transition-transform duration-300",
                        EASE,
                        hidden && "opacity-0",
                        held && "z-10 scale-[1.02] !shadow-[inset_0_0_0_1.5px_var(--color-brand),0_14px_30px_-14px_rgb(0_0_0/0.3)] transition-[scale,box-shadow] duration-300",
                      )}
                      style={dy ? { transform: `translateY(${dy}px)` } : undefined}
                    >
                      <CardBody card={card} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {/* The card under the pointer. */}
        {drag && dragged && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-30"
            style={{
              width: drag.w,
              transform: `translate3d(${drag.x}px, ${drag.y}px, 0)`,
              transition: drag.dropping ? `transform .26s ${CURVE}` : "none",
            }}
          >
            <div
              className={cx(cardCls, "cursor-grabbing")}
              style={{ animation: drag.dropping ? `kit-kb-land .26s ${CURVE} both` : `kit-kb-lift .22s ${CURVE} both` }}
            >
              <CardBody card={dragged} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Kanban;
