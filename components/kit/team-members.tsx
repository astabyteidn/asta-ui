"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Avatar } from "@/components/kit/avatar";
import { Button } from "@/components/kit/button";
import { Select } from "@/components/kit/select";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  src?: string;
  /** The signed-in person. Their role is locked and they can't be removed. */
  you?: boolean;
}

export interface TeamMemberInvite {
  id: string;
  email: string;
  role: string;
  /** Already formatted, e.g. "2d ago". */
  sent?: string;
}

export interface TeamMemberRoleOption {
  value: string;
  label: string;
  hint?: string;
}

export interface TeamMembersProps {
  defaultMembers: TeamMember[];
  defaultInvites?: TeamMemberInvite[];
  roles?: TeamMemberRoleOption[];
  /** Role picked for new invites. Defaults to the last role. */
  defaultInviteRole?: string;
  /** Send invites. Reject to keep the addresses and show an error. */
  onInvite?: (emails: string[], role: string) => Promise<unknown> | void;
  onRoleChange?: (memberId: string, role: string) => void;
  /** Called once the undo window has passed. */
  onRemove?: (memberId: string) => void;
  onRevoke?: (inviteId: string) => void;
  onResend?: (inviteId: string) => void;
  /** How long a removal can be undone, in ms. */
  undoMs?: number;
  title?: string;
  className?: string;
}

const DEFAULT_ROLES: TeamMemberRoleOption[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const KEYFRAMES = `@keyframes kit-tm-in { from { opacity: 0; transform: translateY(6px) } }
@keyframes kit-tm-chip { from { opacity: 0; transform: scale(.85) } }
@keyframes kit-tm-swap { from { opacity: 0; transform: translateX(-6px) } }
@keyframes kit-tm-count { from { transform: scaleX(1) } to { transform: scaleX(0) } }
@media (prefers-reduced-motion: reduce) { .kit-tm, .kit-tm * { animation: none !important; transition-duration: 0s !important; } }`;

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
let seq = 0;
const uid = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Glides rows to their new place when the list changes. Call `snap()` right before the state update. */
function useFlip(deps: unknown[]) {
  const els = useRef(new Map<string, HTMLElement>());
  const before = useRef<Map<string, DOMRect> | null>(null);
  const snap = () => {
    before.current = new Map([...els.current].map(([k, el]) => [k, el.getBoundingClientRect()]));
  };
  useLayoutEffect(() => {
    const from = before.current;
    before.current = null;
    if (!from || reduced()) return;
    from.forEach((r, k) => {
      const el = els.current.get(k);
      if (!el) return;
      const dy = r.top - el.getBoundingClientRect().top;
      if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 380, easing: CURVE });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const reg = (k: string) => (el: HTMLElement | null) => {
    if (el) els.current.set(k, el);
    else els.current.delete(k);
  };
  return { snap, reg };
}

/* ---------- email chips ---------- */

interface Chip {
  id: string;
  email: string;
  problem?: string;
}

function EmailChips({
  chips,
  onChange,
  taken,
  disabled,
  label,
  describedBy,
  invalid,
}: {
  chips: Chip[];
  onChange: (chips: Chip[]) => void;
  taken: (email: string) => string | undefined;
  disabled?: boolean;
  label: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [text, setText] = useState("");
  const [armed, setArmed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  const add = (raw: string) => {
    const parts = raw.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    const have = new Set(chips.map((c) => c.email));
    const next = [...chips];
    for (const email of parts) {
      if (have.has(email)) continue;
      have.add(email);
      next.push({ id: uid(), email, problem: !EMAIL.test(email) ? "not a valid email" : taken(email) });
    }
    onChange(next);
    setText("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " " || e.key === ";" || (e.key === "Tab" && text.trim())) {
      if (!text.trim()) return;
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && chips.length) {
      // First press highlights the last chip, the second removes it.
      e.preventDefault();
      if (armed) {
        onChange(chips.slice(0, -1));
        setArmed(false);
      } else setArmed(true);
    } else setArmed(false);
  };

  return (
    <div
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          input.current?.focus();
        }
      }}
      className={cx(
        "flex min-h-10 flex-1 flex-wrap items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] transition-shadow duration-200 focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {chips.map((c, i) => {
        const hot = armed && i === chips.length - 1;
        return (
          <span
            key={c.id}
            className={cx(
              "inline-flex h-7 max-w-full items-center gap-1 rounded-md pl-2 pr-0.5 text-[12.5px] transition-shadow duration-200",
              c.problem ? "text-mute outline outline-1 -outline-offset-1 outline-dashed outline-[color-mix(in_srgb,var(--color-ink)_35%,transparent)]" : "bg-paper-2 text-ink",
              hot && "shadow-[inset_0_0_0_1.5px_var(--color-brand)]",
            )}
            style={{ animation: `kit-tm-chip .3s ${CURVE}` }}
            title={c.problem ? `${c.email}: ${c.problem}` : undefined}
          >
            <span className={cx("truncate", c.problem && "line-through decoration-[color-mix(in_srgb,var(--color-ink)_35%,transparent)]")}>{c.email}</span>
            {c.problem && <span className="sr-only">, {c.problem}</span>}
            <button
              type="button"
              aria-label={`Remove ${c.email}`}
              onClick={() => {
                onChange(chips.filter((x) => x.id !== c.id));
                input.current?.focus();
              }}
              className="grid h-5 w-5 place-items-center rounded text-mute outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                <path d="M3 3l6 6M9 3 3 9" />
              </svg>
            </button>
          </span>
        );
      })}
      <input
        ref={input}
        id={id}
        name="emails"
        type="email"
        multiple
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={text}
        disabled={disabled}
        placeholder={chips.length ? "" : "name@company.com, another@company.com"}
        onChange={(e) => {
          setText(e.target.value);
          setArmed(false);
        }}
        onKeyDown={onKey}
        onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
          const t = e.clipboardData.getData("text");
          if (/[\s,;]/.test(t.trim())) {
            e.preventDefault();
            add(text + t);
          }
        }}
        onBlur={() => {
          setArmed(false);
          if (text.trim()) add(text);
        }}
        className="h-7 min-w-[140px] flex-1 bg-transparent px-1 text-[16px] sm:text-[13.5px] text-ink outline-none placeholder:text-mute"
      />
    </div>
  );
}

/* ---------- the list ---------- */

const iconBtn =
  "grid h-8 w-8 shrink-0 place-items-center rounded-md text-mute outline-none transition-colors duration-200 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-30";

/**
 * A team list: avatar, name, email and a role picker per person. Invite several people at once by typing
 * or pasting addresses; bad or duplicate ones are flagged before you send. Removing someone leaves an
 * Undo row for a few seconds. Pending invites can be resent or revoked.
 */
export function TeamMembers({
  defaultMembers,
  defaultInvites = [],
  roles = DEFAULT_ROLES,
  defaultInviteRole,
  onInvite,
  onRoleChange,
  onRemove,
  onRevoke,
  onResend,
  undoMs = 5000,
  title = "Team",
  className,
}: TeamMembersProps) {
  const [members, setMembers] = useState(defaultMembers);
  const [invites, setInvites] = useState(defaultInvites);
  const [chips, setChips] = useState<Chip[]>([]);
  const [inviteRole, setInviteRole] = useState(defaultInviteRole ?? roles[roles.length - 1]?.value ?? "");
  const [sending, setSending] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const inviteMsgId = useId();
  const [removing, setRemoving] = useState<string[]>([]);
  const [resent, setResent] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const removingRef = useRef(removing);
  const onRemoveRef = useRef(onRemove);
  const listHead = useRef<HTMLHeadingElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    removingRef.current = removing;
    onRemoveRef.current = onRemove;
  });

  // On unmount: clear timers and commit removals still waiting, so the parent hears about them.
  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    return () => {
      alive.current = false;
      t.forEach((x) => clearTimeout(x));
      t.clear();
      removingRef.current.forEach((id) => onRemoveRef.current?.(id));
    };
  }, []);

  const memberFlip = useFlip([members]);
  const inviteFlip = useFlip([invites]);

  // Where focus should go after the next render (rows swap between their normal and Undo states).
  const root = useRef<HTMLDivElement>(null);
  const refocus = useRef<string | null>(null);
  const setRefocus = (k: string) => {
    refocus.current = k;
  };
  useLayoutEffect(() => {
    const k = refocus.current;
    if (!k) return;
    refocus.current = null;
    root.current?.querySelector<HTMLElement>(`[data-tm-focus="${k}"]`)?.focus();
  });

  const roleLabel = (v: string) => roles.find((r) => r.value === v)?.label ?? v;
  const taken = (email: string) =>
    members.some((m) => m.email.toLowerCase() === email) ? "already on the team" : invites.some((i) => i.email.toLowerCase() === email) ? "already invited" : undefined;

  // An email that stops being taken (invite revoked, member removed) makes its chip valid again.
  const freeChip = (email: string, problem: string) => {
    const e = email.toLowerCase();
    setChips((cs) => (cs.some((c) => c.email === e && c.problem === problem) ? cs.map((c) => (c.email === e && c.problem === problem ? { ...c, problem: undefined } : c)) : cs));
  };

  /* remove + undo */

  const finalize = (id: string) => {
    timers.current.delete(id);
    const gone = members.find((m) => m.id === id);
    const name = gone?.name;
    if (gone) freeChip(gone.email, "already on the team");
    const hadFocus = !!document.activeElement?.closest(`[data-tm-row="${id}"]`);
    memberFlip.snap();
    setMembers((all) => all.filter((m) => m.id !== id));
    setRemoving((r) => r.filter((x) => x !== id));
    onRemoveRef.current?.(id);
    if (name) setStatus(`${name} removed.`);
    if (hadFocus) listHead.current?.focus();
  };

  const remove = (m: TeamMember) => {
    setRemoving((r) => [...r, m.id]);
    setStatus(`${m.name} will be removed. Press Undo to keep them.`);
    setRefocus(`undo-${m.id}`);
    timers.current.set(
      m.id,
      setTimeout(() => finalize(m.id), undoMs),
    );
  };

  const undo = (m: TeamMember) => {
    clearTimeout(timers.current.get(m.id));
    timers.current.delete(m.id);
    setRemoving((r) => r.filter((x) => x !== m.id));
    setStatus(`${m.name} kept.`);
    setRefocus(`remove-${m.id}`);
  };

  const changeRole = (m: TeamMember, role: string) => {
    setMembers((all) => all.map((x) => (x.id === m.id ? { ...x, role } : x)));
    onRoleChange?.(m.id, role);
    setStatus(`${m.name} is now ${roleLabel(role)}.`);
  };

  /* invites */

  const good = chips.filter((c) => !c.problem);
  const bad = chips.length - good.length;

  // Invite stays enabled. Pressing it with nothing valid explains what to fix and puts focus back in the field.
  const send = async () => {
    if (sending) return;
    if (!good.length || bad) {
      if (!bad) setInviteMsg("Add an email address first, like name@company.com.");
      root.current?.querySelector<HTMLInputElement>('[data-tm-focus="invite-input"] input')?.focus();
      return;
    }
    const emails = good.map((c) => c.email);
    setSending(true);
    setInviteMsg("");
    try {
      await onInvite?.(emails, inviteRole);
      if (!alive.current) return;
      inviteFlip.snap();
      setInvites((all) => [...emails.map((email) => ({ id: uid(), email, role: inviteRole, sent: "just now" })), ...all]);
      setChips([]);
      const msg = `Invited ${emails.length === 1 ? emails[0] : `${emails.length} people`} as ${roleLabel(inviteRole)}.`;
      setInviteMsg(msg);
      setStatus(msg);
    } catch {
      if (!alive.current) return;
      setInviteMsg("Couldn't send the invites. Try again.");
      setStatus("Couldn't send the invites.");
    } finally {
      if (alive.current) setSending(false);
    }
  };

  const revoke = (inv: TeamMemberInvite) => {
    const i = invites.findIndex((x) => x.id === inv.id);
    const next = invites[i + 1] ?? invites[i - 1];
    inviteFlip.snap();
    setInvites((all) => all.filter((x) => x.id !== inv.id));
    onRevoke?.(inv.id);
    freeChip(inv.email, "already invited");
    setStatus(`Invite to ${inv.email} revoked.`);
    setRefocus(next ? `revoke-${next.id}` : "invite-input");
  };

  const resend = (inv: TeamMemberInvite) => {
    onResend?.(inv.id);
    setResent((r) => [...r, inv.id]);
    setStatus(`Invite sent again to ${inv.email}.`);
    clearTimeout(timers.current.get(`resend-${inv.id}`));
    timers.current.set(
      `resend-${inv.id}`,
      setTimeout(() => {
        timers.current.delete(`resend-${inv.id}`);
        setResent((r) => r.filter((x) => x !== inv.id));
      }, 2200),
    );
  };

  const count = members.length - removing.length;

  return (
    <div ref={root} className={cx("kit-tm w-full", className)}>
      <style href="asta-team-members" precedence="asta">{KEYFRAMES}</style>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      <header className="flex items-baseline justify-between gap-4">
        <h3 className="text-[17px] font-medium tracking-[-0.02em] text-ink">{title}</h3>
        <p className="text-[12.5px] tabular-nums text-mute">
          {count} member{count === 1 ? "" : "s"}
          {invites.length > 0 && ` · ${invites.length} pending`}
        </p>
      </header>

      {/* invite */}
      <form
        className="mt-5 rounded-[12px] bg-paper-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1" data-tm-focus="invite-input" tabIndex={-1} onFocus={(e) => {
              if (e.target === e.currentTarget) e.currentTarget.querySelector("input")?.focus();
            }}>
            <EmailChips
              chips={chips}
              onChange={(next) => {
                setChips(next);
                if (next.length) setInviteMsg("");
              }}
              taken={taken}
              disabled={sending}
              label="Email addresses to invite"
              describedBy={inviteMsgId}
              invalid={bad > 0}
            />
          </div>
          <div className="flex gap-2">
            <Select label="Role for new invites" name="role" size="md" options={roles} value={inviteRole} onChange={setInviteRole} disabled={sending} className="w-[124px] bg-paper" />
            <Button type="submit" variant="accent" loading={sending}>
              Invite
            </Button>
          </div>
        </div>
        <p id={inviteMsgId} className="mt-2 min-h-4 px-1 text-[12px] text-mute" aria-live="polite">
          {bad > 0 ? `Remove ${bad} address${bad > 1 ? "es" : ""} that can't be invited.` : inviteMsg || "Separate addresses with a comma, space or Enter."}
        </p>
      </form>

      {/* members */}
      <h4 ref={listHead} tabIndex={-1} className="mt-7 mb-1 px-1 text-[12px] font-medium text-mute outline-none">
        Members
      </h4>
      <ul>
        {members.map((m) => {
          const gone = removing.includes(m.id);
          return (
            <li key={m.id} ref={memberFlip.reg(m.id)} data-tm-row={m.id} className="relative">
              {gone ? (
                <div className="relative flex h-[60px] items-center gap-3 overflow-hidden rounded-[10px] bg-paper-2 px-3" style={{ animation: `kit-tm-swap .35s ${CURVE}` }}>
                  <p className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                    Removed <span className="text-ink">{m.name}</span>
                  </p>
                  <Button data-tm-focus={`undo-${m.id}`} variant="ghost" size="xs" onClick={() => undo(m)} className="text-brand hover:text-brand">
                    Undo
                  </Button>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand/40"
                    style={{ animation: `kit-tm-count ${undoMs}ms linear forwards` }}
                  />
                </div>
              ) : (
                <div className="flex h-[60px] items-center gap-3 rounded-[10px] px-1 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-paper-2)_55%,transparent)] sm:px-3">
                  <Avatar name={m.name} src={m.src} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[13.5px] text-ink">
                      <span className="truncate">{m.name}</span>
                      {m.you && <span className="shrink-0 rounded-md bg-paper-2 px-1.5 text-[11px] leading-5 text-mute">You</span>}
                    </p>
                    <p className="truncate text-[12.5px] text-mute">{m.email}</p>
                  </div>
                  <Select
                    label={`Role for ${m.name}`}
                    size="sm"
                    options={roles}
                    value={m.role}
                    onChange={(v) => changeRole(m, v)}
                    disabled={m.you}
                    className="w-[112px]"
                  />
                  <button
                    type="button"
                    data-tm-focus={`remove-${m.id}`}
                    aria-label={`Remove ${m.name}`}
                    title={m.you ? "You can't remove yourself" : `Remove ${m.name}`}
                    disabled={m.you}
                    onClick={() => remove(m)}
                    className={iconBtn}
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* pending invites */}
      {invites.length > 0 && (
        <>
          <h4 className="mt-7 mb-1 px-1 text-[12px] font-medium text-mute">Pending invites</h4>
          <ul>
            {invites.map((inv) => {
              const again = resent.includes(inv.id);
              return (
                <li key={inv.id} ref={inviteFlip.reg(inv.id)} className="flex h-[52px] items-center gap-3 px-1 sm:px-3" style={{ animation: `kit-tm-in .4s ${CURVE}` }}>
                  <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] text-mute">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
                      <rect x="2" y="3.5" width="12" height="9" rx="1.6" />
                      <path d="m2.5 4.5 5.5 4 5.5-4" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] text-ink">{inv.email}</p>
                    <p className="truncate text-[12px] text-mute">
                      {roleLabel(inv.role)}
                      {inv.sent && ` · Sent ${inv.sent}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => !again && resend(inv)} aria-disabled={again || undefined}>
                    <span key={again ? "sent" : "resend"} style={{ animation: `kit-tm-swap .3s ${CURVE}` }}>
                      {again ? "Sent" : "Resend"}
                    </span>
                  </Button>
                  <Button data-tm-focus={`revoke-${inv.id}`} variant="ghost" size="xs" onClick={() => revoke(inv)}>
                    Revoke
                  </Button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default TeamMembers;
