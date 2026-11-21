"use client";

import { Popover } from "@base-ui/react/popover";
import { Select as S } from "@base-ui/react/select";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  hint?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Adds a filter box at the top of the list. */
  searchable?: boolean;
  label?: string;
  size?: "sm" | "md";
  /** Form field name (submits the value with a form). */
  name?: string;
  disabled?: boolean;
  className?: string;
}

const trigger = (size: "sm" | "md") =>
  cx(
    "group/sel flex w-full items-center gap-2 bg-paper text-left outline-none transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-45",
    "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)]",
    "data-[popup-open]:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_18%,transparent)]",
    size === "sm" ? "h-8 rounded-md px-2.5 text-[13px]" : "h-10 rounded-lg px-3 text-[14px]",
  );

const panel = (origin: string) =>
  cx(
    "overflow-hidden rounded-xl bg-paper p-1 outline-none",
    "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-8px_rgb(0_0_0/0.22),0_4px_8px_-4px_rgb(0_0_0/0.08)]",
    origin,
    "transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(.16,1,.3,1)] data-[starting-style]:opacity-0 data-[starting-style]:[transform:translateY(-4px)_scale(.97)]",
    "data-[ending-style]:opacity-0 data-[ending-style]:scale-[.98] data-[ending-style]:duration-[120ms] data-[ending-style]:ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:!transition-none",
  );

const row = "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] text-ink-2 outline-none transition-colors duration-150";

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 text-mute transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-data-[popup-open]/sel:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={cx("h-4 w-4 shrink-0 text-brand transition-opacity", on ? "opacity-100" : "opacity-0")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

function Shown({ option, placeholder }: { option?: SelectOption; placeholder: string }) {
  return (
    <>
      {option?.icon && <span className="inline-flex shrink-0 text-ink-2 [&_svg]:h-4 [&_svg]:w-4">{option.icon}</span>}
      <span className={cx("min-w-0 flex-1 truncate", option ? "text-ink" : "text-mute")}>{option?.label ?? placeholder}</span>
    </>
  );
}

/**
 * A select. Without `searchable` it is Base UI Select: arrows, Home/End, type-ahead, Escape, form support
 * and collision handling. With `searchable` it is a Base UI Popover holding a filter box and a listbox.
 */
export function Select(props: SelectProps) {
  return props.searchable ? <SearchSelect {...props} /> : <PlainSelect {...props} />;
}

function PlainSelect({ options, value, defaultValue, onChange, placeholder = "Select…", label, size = "md", name, disabled, className }: SelectProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);
  return (
    <S.Root
      value={current ?? null}
      onValueChange={(v) => {
        if (v == null) return;
        const next = String(v);
        if (value === undefined) setInner(next);
        onChange?.(next);
      }}
      name={name}
      disabled={disabled}
    >
      <S.Trigger aria-label={label} className={cx(trigger(size), className)}>
        <Shown option={selected} placeholder={placeholder} />
        <S.Icon className="flex">
          <Chevron />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Positioner alignItemWithTrigger={false} sideOffset={6} collisionPadding={8} className="z-50 outline-none">
        <S.Popup className={cx(panel("origin-[var(--transform-origin)]"), "w-[var(--anchor-width)]")}>
          <S.List className="max-h-60 overflow-y-auto outline-none [scrollbar-width:thin]">
            {options.map((o) => (
              <S.Item key={o.value} value={o.value} disabled={o.disabled} className={cx(row, "data-[highlighted]:bg-paper-2 data-[highlighted]:text-ink data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40")}>
                {o.icon && <span className="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4">{o.icon}</span>}
                <span className="min-w-0 flex-1 truncate">
                  <S.ItemText>{o.label}</S.ItemText>
                </span>
                {o.hint && <span className="text-[12px] text-mute">{o.hint}</span>}
                <Check on={o.value === current} />
              </S.Item>
            ))}
          </S.List>
        </S.Popup>
        </S.Positioner>
      </S.Portal>
    </S.Root>
  );
}

function SearchSelect({ options, value, defaultValue, onChange, placeholder = "Select…", label, size = "md", name, disabled, className }: SelectProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uid = useId();

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? options.filter((o) => o.label.toLowerCase().includes(t)) : options;
  }, [options, q]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const show = (v: boolean) => {
    setOpen(v);
    if (v) {
      setQ("");
      setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    }
  };
  const pick = (o: SelectOption | undefined) => {
    if (!o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    onChange?.(o.value);
    setOpen(false);
  };
  const move = (from: number, step: number) => {
    let n = from;
    for (let k = 0; k < shown.length; k++) {
      n = Math.min(shown.length - 1, Math.max(0, n + step));
      if (!shown[n]?.disabled) break;
    }
    return n;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => move(a, 1));
    else if (e.key === "ArrowUp") setActive((a) => move(a, -1));
    else if (e.key === "Home") setActive(move(-1, 1));
    else if (e.key === "End") setActive(move(shown.length, -1));
    else if (e.key === "Enter") pick(shown[active]);
    else return;
    e.preventDefault();
  };

  return (
    <Popover.Root open={open} onOpenChange={(v) => show(v)}>
      <Popover.Trigger aria-label={label} aria-haspopup="listbox" disabled={disabled} className={cx(trigger(size), className)}>
        <Shown option={selected} placeholder={placeholder} />
        <Chevron />
      </Popover.Trigger>
      {name && <input type="hidden" name={name} value={current ?? ""} />}
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={6} collisionPadding={8} className="z-50 outline-none">
        <Popover.Popup initialFocus={search} onKeyDown={onKey} className={cx(panel("origin-[var(--transform-origin)]"), "w-[var(--anchor-width)]")}>
          <div className="mb-1 flex items-center gap-2 rounded-lg bg-paper-2 px-2.5">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              ref={search}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search…"
              aria-label="Search options"
              role="combobox"
              aria-expanded
              aria-controls={`${uid}-list`}
              aria-activedescendant={shown[active] ? `${uid}-o-${active}` : undefined}
              className="h-9 min-w-0 flex-1 bg-transparent text-[16px] sm:text-[14px] text-ink outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
          <ul ref={listRef} id={`${uid}-list`} role="listbox" aria-label={label} className="max-h-60 overflow-y-auto outline-none [scrollbar-width:thin]">
            {shown.map((o, i) => (
              <li
                key={o.value}
                id={`${uid}-o-${i}`}
                data-i={i}
                role="option"
                aria-selected={o.value === current}
                aria-disabled={o.disabled || undefined}
                onPointerMove={() => !o.disabled && setActive(i)}
                onClick={() => pick(o)}
                className={cx(row, i === active && !o.disabled && "bg-paper-2 text-ink", o.disabled && "cursor-not-allowed opacity-40")}
              >
                {o.icon && <span className="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4">{o.icon}</span>}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="text-[12px] text-mute">{o.hint}</span>}
                <Check on={o.value === current} />
              </li>
            ))}
            {shown.length === 0 && <li className="px-2.5 py-6 text-center text-[13px] text-mute">No matches</li>}
          </ul>
        </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default Select;
