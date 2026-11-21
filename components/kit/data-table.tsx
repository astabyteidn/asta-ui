"use client";

import { useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-table-row { from { opacity: 0; transform: translateY(6px) } }`;
const EASE = "cubic-bezier(.16,1,.3,1)";

export interface DataTableColumn<T> {
  /** A field of the row, or any id when you render the cell yourself. */
  key: string;
  header: ReactNode;
  /** Custom cell. Defaults to the field's value as text. */
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  /** What to sort by when the field isn't a plain string or number. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "center" | "right";
  /** CSS width, e.g. "120px" or "30%". */
  width?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** A stable id per row (used for selection). */
  getRowId: (row: T) => string;
  /** Show checkboxes and a select-all. */
  selectable?: boolean;
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Show a search box. Matches any column's text, or your own `filter`. */
  searchable?: boolean;
  searchPlaceholder?: string;
  filter?: (row: T, query: string) => boolean;
  /** Rows per page. 0 shows everything. */
  pageSize?: number;
  /** Right side of the toolbar. Gets the selected rows. */
  actions?: (selected: T[]) => ReactNode;
  /** Shown when there is no data at all. */
  empty?: ReactNode;
  /** Scroll height of the body. The header sticks while you scroll. */
  maxHeight?: number | string;
  /** Accessible name for the table. */
  label?: string;
  className?: string;
}

type Sort = { key: string; dir: "asc" | "desc" } | null;

const field = (row: unknown, key: string) => (row as Record<string, unknown>)[key];

function Check({ state, onToggle, label }: { state: boolean | "mixed"; onToggle: () => void; label: string }) {
  const on = state === true;
  const mixed = state === "mixed";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state}
      aria-label={label}
      onClick={onToggle}
      className={cx(
        "relative grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] outline-none transition-[background-color,box-shadow,transform] duration-200 active:scale-90",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        on || mixed
          ? "bg-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.2)]"
          : "bg-paper shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)] hover:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_40%,transparent)]",
      )}
    >
      <svg viewBox="0 0 16 16" className="col-start-1 row-start-1 h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path
          d="M3.5 8.5l3 3 6-7"
          pathLength={1}
          strokeDasharray="1"
          className="transition-[stroke-dashoffset] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
          style={{ strokeDashoffset: on ? 0 : 1, transitionDuration: on ? "380ms" : "120ms" }}
        />
      </svg>
      <span aria-hidden className={cx("col-start-1 row-start-1 h-[2.2px] w-2 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", mixed ? "scale-x-100" : "scale-x-0")} />
    </button>
  );
}

const ALIGN = { left: "text-left justify-start", center: "text-center justify-center", right: "text-right justify-end" } as const;

const Chevron = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={dir === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"} />
  </svg>
);

/**
 * A data table: click a header to sort (ascending, descending, off), search across columns, select rows
 * with a select-all that covers the current page, and page through. Rows slide in on every sort, search or
 * page change, the header sticks while the body scrolls, and an empty search says so.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  selectable,
  selected,
  defaultSelected = [],
  onSelectedChange,
  searchable,
  searchPlaceholder = "Search…",
  filter,
  pageSize = 8,
  actions,
  empty,
  maxHeight,
  label,
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>(null);
  const [page, setPage] = useState(0);
  const [inner, setInner] = useState<string[]>(defaultSelected);
  // Only ids still in `data` count. Stale ones drop out on the next change.
  const present = new Set(data.map(getRowId));
  const picked = new Set((selected ?? inner).filter((id) => present.has(id)));

  const setPicked = (next: Set<string>) => {
    const ids = [...next];
    if (selected === undefined) setInner(ids);
    onSelectedChange?.(ids);
  };

  const q = query.trim().toLowerCase();
  const rows = q
    ? data.filter((r) => (filter ? filter(r, q) : columns.some((c) => String(field(r, c.key) ?? "").toLowerCase().includes(q))))
    : data;

  const sortCol = sort && columns.find((c) => c.key === sort.key);
  const sorted = sortCol
    ? [...rows].sort((a, b) => {
        const va = sortCol.sortValue ? sortCol.sortValue(a) : (field(a, sortCol.key) as string | number);
        const vb = sortCol.sortValue ? sortCol.sortValue(b) : (field(b, sortCol.key) as string | number);
        const d = typeof va === "number" && typeof vb === "number" ? va - vb : String(va ?? "").localeCompare(String(vb ?? ""), undefined, { numeric: true });
        return sort!.dir === "asc" ? d : -d;
      })
    : rows;

  const size = pageSize > 0 ? pageSize : Math.max(1, sorted.length);
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const pg = Math.min(page, pages - 1);
  const view = sorted.slice(pg * size, pg * size + size);

  const pageIds = view.map(getRowId);
  const onPage = pageIds.filter((id) => picked.has(id)).length;
  const allState: boolean | "mixed" = onPage === 0 ? false : onPage === pageIds.length ? true : "mixed";

  const toggleAll = () => {
    const next = new Set(picked);
    if (allState === true) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    setPicked(next);
  };
  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const cycle = (key: string) => {
    setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
    setPage(0);
  };

  const selectedRows = data.filter((r) => picked.has(getRowId(r)));
  // Changing this remounts the body so the rows animate in again.
  const pass = `${sort?.key ?? ""}:${sort?.dir ?? ""}:${pg}:${q}`;
  const cols = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cx("flex w-full flex-col gap-3", className)}>
      <style href="asta-data-table" precedence="asta">{KEYFRAMES}</style>

      {(searchable || actions) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-paper px-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-shadow duration-200 focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)] sm:max-w-[280px]">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                <circle cx="7" cy="7" r="4.5" />
                <path d="m10.5 10.5 3 3" />
              </svg>
              <input
                type="search"
                name="q"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder.replace(/…$/, "")}
                className="h-full min-w-0 flex-1 bg-transparent text-[16px] sm:text-[13.5px] text-ink outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
              />
            </label>
          )}
          {actions && <div className="ml-auto flex items-center gap-2">{actions(selectedRows)}</div>}
        </div>
      )}

      {/* The ring sits on an overlay so the sticky header and row fills can't paint over it. */}
      <div className="relative rounded-xl bg-paper after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-xl after:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
        <div className="overflow-auto rounded-xl" style={{ maxHeight }}>
          <table aria-label={label} className="w-full border-separate border-spacing-0 text-[13.5px]">
            <thead>
              <tr>
                {selectable && (
                  <th scope="col" className="sticky top-0 z-10 w-11 bg-paper-2 py-2.5 pl-4 pr-1">
                    <Check state={allState} onToggle={toggleAll} label={allState === true ? "Deselect all rows on this page" : "Select all rows on this page"} />
                  </th>
                )}
                {columns.map((c) => {
                  const active = sort?.key === c.key;
                  const align = ALIGN[c.align ?? "left"];
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : c.sortable ? "none" : undefined}
                      style={{ width: c.width }}
                      className={cx("sticky top-0 z-10 whitespace-nowrap bg-paper-2 px-4 py-2.5 text-[12px] font-medium text-mute", align)}
                    >
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => cycle(c.key)}
                          className={cx(
                            "group/sort -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 outline-none transition-colors duration-150 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50",
                            active && "text-ink",
                            c.align === "right" && "flex-row-reverse",
                          )}
                        >
                          {c.header}
                          <svg
                            viewBox="0 0 16 16"
                            className={cx(
                              "h-3 w-3 transition-[transform,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
                              active ? "opacity-100" : "opacity-0 group-hover/sort:opacity-40 group-focus-visible/sort:opacity-40",
                              active && sort!.dir === "desc" && "rotate-180",
                            )}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7" />
                          </svg>
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody key={pass}>
              {view.length === 0 ? (
                <tr>
                  <td colSpan={cols} className="px-4 py-14 text-center">
                    {q ? (
                      <div className="mx-auto flex max-w-[260px] flex-col items-center gap-1.5">
                        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-paper-2 text-mute">
                          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                            <circle cx="7" cy="7" r="4.5" />
                            <path d="m10.5 10.5 3 3M5.5 7h3" />
                          </svg>
                        </span>
                        <p className="mt-1.5 text-[14px] font-medium text-ink">No matches</p>
                        <p className="text-[13px] text-mute">Nothing matches “{query.trim()}”.</p>
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          className="mt-2 h-8 rounded-md px-3 text-[13px] font-medium text-ink outline-none shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-colors hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      (empty ?? <p className="text-[13.5px] text-mute">No rows yet.</p>)
                    )}
                  </td>
                </tr>
              ) : (
                view.map((row, i) => {
                  const id = getRowId(row);
                  const on = picked.has(id);
                  return (
                    <tr
                      key={id}
                      className={cx("group/row transition-colors duration-150 motion-reduce:!animate-none", on ? "bg-[color-mix(in_srgb,var(--color-brand)_7%,transparent)]" : "hover:bg-[color-mix(in_srgb,var(--color-ink)_3%,transparent)]")}
                      style={{ animation: `asta-table-row .42s ${EASE} ${Math.min(i, 12) * 28}ms both` }}
                    >
                      {selectable && (
                        <td className="py-3 pl-4 pr-1 align-middle">
                          <Check state={on} onToggle={() => toggle(id)} label={`Select row ${pg * size + i + 1}`} />
                        </td>
                      )}
                      {columns.map((c) => (
                        <td key={c.key} className={cx("whitespace-nowrap px-4 py-3 align-middle text-ink-2", ALIGN[c.align ?? "left"], c.align === "right" && "tabular-nums")}>
                          {c.cell ? c.cell(row) : String(field(row, c.key) ?? "")}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[12.5px] text-mute">
        <p className="tabular-nums" aria-live="polite">
          {selectable && picked.size > 0 ? (
            <>
              <span className="font-medium text-ink">{picked.size}</span> selected
              <button type="button" onClick={() => setPicked(new Set())} className="ml-2 rounded px-1 text-ink-2 underline-offset-2 outline-none hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-brand/50">
                Clear
              </button>
            </>
          ) : sorted.length > 0 ? (
            <>
              {pg * size + 1}–{Math.min(sorted.length, pg * size + size)} of {sorted.length}
            </>
          ) : (
            "0 rows"
          )}
        </p>
        {pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={pg === 0}
              onClick={() => setPage(pg - 1)}
              className="grid h-7 w-7 place-items-center rounded-md text-ink-2 outline-none transition-[background-color,transform,opacity] hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
            >
              <Chevron dir="left" />
            </button>
            <span className="min-w-[70px] text-center tabular-nums">
              Page <span className="text-ink">{pg + 1}</span> of {pages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={pg >= pages - 1}
              onClick={() => setPage(pg + 1)}
              className="grid h-7 w-7 place-items-center rounded-md text-ink-2 outline-none transition-[background-color,transform,opacity] hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
            >
              <Chevron dir="right" />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

export default DataTable;
