"use client";

import { DropdownMenu as Menu } from "radix-ui";
import type { ReactNode } from "react";
import { buttonClass, type ButtonVariant } from "@/components/kit/button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  /** Shown on the right, e.g. "⌘D". Display only. */
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}
export interface MenuGroup {
  label?: string;
  items: MenuItem[];
}

export interface DropdownMenuProps {
  /** Trigger content. */
  children: ReactNode;
  groups: MenuGroup[];
  align?: "start" | "end";
  variant?: ButtonVariant;
  className?: string;
  /** Accessible name for the trigger when its content is only an icon. */
  label?: string;
}

const KEYFRAMES = `@keyframes kit-menu-in { from { opacity: 0; transform: scale(.96) } }
@keyframes kit-menu-out { to { opacity: 0; transform: scale(.97) } }`;

/**
 * An action menu on Radix Dropdown Menu. It scales in from the trigger (the origin follows the side it
 * opened on) and flips when there is no room. Arrow keys, Home/End, type-ahead, Escape and focus return
 * come from Radix.
 */
export function DropdownMenu({ children, groups, align = "start", variant = "outline", className, label }: DropdownMenuProps) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger aria-label={label} className={cx(buttonClass({ variant }), "group/trigger data-[state=open]:bg-paper-2", className)}>
        {children}
        <svg
          viewBox="0 0 16 16"
          className="-mr-1 h-3.5 w-3.5 text-mute transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-data-[state=open]/trigger:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Content
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cx(
            "z-50 min-w-[232px] rounded-xl bg-paper p-1.5 outline-none",
            "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_12px_32px_-12px_rgb(0_0_0/0.28),0_4px_10px_-6px_rgb(0_0_0/0.12)]",
            "origin-[var(--radix-dropdown-menu-content-transform-origin)]",
            "data-[state=open]:animate-[kit-menu-in_.2s_cubic-bezier(.16,1,.3,1)_both] data-[state=closed]:animate-[kit-menu-out_.12s_ease-in_both] motion-reduce:!animate-none",
          )}
        >
          <style href="asta-dropdown-menu" precedence="asta">{KEYFRAMES}</style>
          {groups.map((g, gi) => (
            <Menu.Group key={gi}>
              {gi > 0 && <Menu.Separator className="mx-1 my-1.5 h-px bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]" />}
              {g.label && <Menu.Label className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-mute">{g.label}</Menu.Label>}
              {g.items.map((it) => (
                <Menu.Item
                  key={it.label}
                  disabled={it.disabled}
                  onSelect={it.onSelect}
                  className={cx(
                    "group/item flex h-9 w-full cursor-pointer select-none items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] outline-none transition-colors duration-150",
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
                    it.danger ? "text-[#e5484d] data-[highlighted]:bg-[#e5484d]/10" : "text-ink data-[highlighted]:bg-paper-2",
                  )}
                >
                  {it.icon && (
                    <span className={cx("inline-flex h-4 w-4 shrink-0 [&_svg]:h-4 [&_svg]:w-4", !it.danger && "text-mute group-data-[highlighted]/item:text-ink")}>
                      {it.icon}
                    </span>
                  )}
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.shortcut && <kbd className="font-sans text-[11.5px] tracking-wide text-mute">{it.shortcut}</kbd>}
                </Menu.Item>
              ))}
            </Menu.Group>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

export default DropdownMenu;
