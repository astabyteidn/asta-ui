"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ClipboardButton } from "@/components/kit/copy-button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

export interface ApiKey {
  id: string;
  name: string;
  /** Start of the key, e.g. "ak_live". */
  prefix: string;
  /** Last four characters of the secret. */
  last4: string;
  scopes: string[];
  created: Date;
  lastUsed?: Date | null;
  /** When it stops working. Leave out for no expiry. */
  expires?: Date | null;
}

export interface ApiKeyScope {
  value: string;
  label: string;
  hint?: string;
}

export interface NewApiKey {
  name: string;
  scopes: string[];
  /** null means it never expires. */
  expiresInDays: number | null;
}

export interface ApiKeysProps {
  defaultKeys?: ApiKey[];
  scopes?: ApiKeyScope[];
  expiryOptions?: { label: string; days: number | null }[];
  /** Create the key on your server and return it with the full secret. Reject to keep the form and show an error. */
  onCreate?: (input: NewApiKey) => Promise<{ key: ApiKey; secret: string }> | { key: ApiKey; secret: string };
  /** Called once the undo window has passed. */
  onRevoke?: (id: string) => void;
  /** Shows placeholder rows in the final layout. */
  loading?: boolean;
  /** Load error. Shown instead of the list, with a retry button when `onRetry` is set. */
  error?: string | null;
  onRetry?: () => void;
  /** How long a revoke can be undone, in ms. */
  undoMs?: number;
  /** Override "now" for relative times. */
  now?: Date;
  title?: string;
  description?: ReactNode;
  className?: string;
}

const DEFAULT_SCOPES: ApiKeyScope[] = [
  { value: "projects:read", label: "Read projects", hint: "List projects and their settings" },
  { value: "projects:write", label: "Change projects", hint: "Create, rename and archive" },
  { value: "deploys:write", label: "Start deploys", hint: "Trigger and roll back builds" },
  { value: "billing:read", label: "Read billing", hint: "Invoices and usage" },
];

const DEFAULT_EXPIRY = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
  { label: "Never", days: null },
];

const KEYFRAMES = `@keyframes kit-ak-in { from { opacity: 0; transform: translateY(6px) } }
@keyframes kit-ak-count { from { transform: scaleX(1) } to { transform: scaleX(0) } }
@keyframes kit-ak-pulse { 50% { opacity: .45 } }
@media (prefers-reduced-motion: reduce) { .kit-ak, .kit-ak * { animation-duration: 0s !important; transition-duration: 0s !important } .kit-ak [data-ak-count] { animation: none !important; opacity: .5 } }`;

const BTN =
  "inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium tracking-[-0.01em] outline-none transition-[background-color,color,box-shadow,transform,opacity] duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-45";
const SOLID = `${BTN} h-8 px-3 text-[13px] bg-ink text-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.16),0_6px_14px_-8px_rgb(0_0_0/0.45)] hover:bg-[color-mix(in_srgb,var(--color-ink)_84%,var(--color-paper))]`;
const GHOST = `${BTN} h-8 px-3 text-[13px] text-ink-2 hover:bg-paper-2 hover:text-ink`;
const GHOST_XS = `${BTN} h-7 px-2.5 text-[12px] text-ink-2 hover:bg-ink/7 hover:text-ink`;
const LBL = "text-[13px] font-medium";
const LINE = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]";
const FIELD = `h-10 w-full rounded-lg bg-paper px-3 text-[16px] text-ink outline-none transition-shadow duration-200 placeholder:text-mute sm:text-[14px] ${LINE} hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] focus:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_18%,transparent)] aria-[invalid=true]:shadow-[inset_0_0_0_1.5px_var(--color-ink)]`;

const DAY = 86_400_000;
const mask = (k: ApiKey) => `${k.prefix}_…${k.last4}`;
const dateFmt = (d: Date, now: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(d.getFullYear() !== now.getFullYear() && { year: "numeric" }) });
function ago(d: Date | null | undefined, now: Date) {
  if (!d) return "Never";
  const s = Math.max(0, (now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return dateFmt(d, now);
}

const Icon = ({ d, className = "h-4 w-4" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const KEY = "M10.5 2.5a3 3 0 1 1-2.6 4.5L3 11.9V13.5h1.6v-1.2h1.2v-1.2H7l1.1-1.1A3 3 0 0 1 10.5 2.5ZM11 5h.01";
const PLUS = "M8 3.5v9M3.5 8h9";
const WARN = "M8 2.5 14 13H2zM8 6.5v3M8 11.2h.01";

/** Status in words, with a filled dot for active and a ring for expired. */
function Status({ k, now }: { k: ApiKey; now: Date }) {
  const left = k.expires ? k.expires.getTime() - now.getTime() : Infinity;
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap", left <= 0 ? "text-mute" : "text-ink")}>
      <span aria-hidden className={cx("h-2 w-2 shrink-0 rounded-full", left <= 0 ? "shadow-[inset_0_0_0_1.5px_currentColor]" : "bg-brand")} />
      {left <= 0 ? "Expired" : left < 14 * DAY ? `Expires in ${Math.ceil(left / DAY)} d` : "Active"}
    </span>
  );
}

/** A hint under a field that turns into the error, with a warning icon. */
const Msg = ({ id, error, hint }: { id: string; error?: string; hint: string }) => (
  <p id={id} className={cx("flex min-h-4 items-center gap-1.5 text-[12px]", error ? "font-medium text-ink" : "text-mute")}>
    {error && <Icon d={WARN} className="h-3.5 w-3.5 shrink-0" />}
    {error ?? hint}
  </p>
);

function Scopes({ list }: { list: string[] }) {
  const [first, ...rest] = list;
  return (
    <span className="flex min-w-0 flex-wrap gap-1">
      {first && (
        <span className="rounded-[5px] bg-ink/6 px-1.5 font-mono text-[11.5px] leading-5 text-ink-2">
          {first}
        </span>
      )}
      {rest.length > 0 && (
        <span title={rest.join(", ")} className="rounded-[5px] bg-ink/6 px-1.5 text-[11.5px] leading-5 text-mute">
          +{rest.length}
          <span className="sr-only"> more: {rest.join(", ")}</span>
        </span>
      )}
    </span>
  );
}

const COLS = "@2xl:grid-cols-[minmax(0,1.3fr)_120px_minmax(0,1.4fr)_minmax(0,.7fr)_minmax(0,1fr)_64px]";
const CELL_LABEL = "text-[11.5px] text-mute @2xl:sr-only";
const CELL = "col-span-2 flex min-w-0 items-center gap-2 @2xl:col-span-1 @2xl:row-start-1";
const META = "flex flex-col gap-0.5 text-[12.5px] @2xl:row-start-1";

let seq = 0;
/** Without `onCreate` the key is made up locally and marked demo, so it can't pass for a real one. */
function demoCreate({ name, scopes, expiresInDays: days }: NewApiKey) {
  const tail = Array.from({ length: 24 }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
  const now = Date.now();
  return {
    secret: `ak_live_demo_${tail}`,
    key: { id: `k${now.toString(36)}${seq++}`, name, prefix: "ak_live", last4: tail.slice(-4), scopes, created: new Date(now), expires: days ? new Date(now + days * DAY) : null },
  };
}

/**
 * A settings section for API keys: a list of keys with masked prefixes, scopes, last use and status. Create a key
 * in an inline form and its secret shows once in a highlighted row with a copy button, then masks for good.
 * Revoking asks first and leaves a few seconds to undo. Stacks into cards on narrow screens.
 */
export function ApiKeys({
  defaultKeys = [],
  scopes = DEFAULT_SCOPES,
  expiryOptions = DEFAULT_EXPIRY,
  onCreate = demoCreate,
  onRevoke,
  loading,
  error,
  onRetry,
  undoMs = 8000,
  now: nowProp,
  title = "API keys",
  description = "Keys let your servers call the Astabyte API. Keep them out of client code and rotate them often.",
  className,
}: ApiKeysProps) {
  const [keys, setKeys] = useState(defaultKeys);
  const [mounted] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<{ name?: string; scopes?: string; form?: string }>({});
  const [form, setForm] = useState({ name: "", scopes: [scopes[0]?.value].filter(Boolean) as string[], expiry: String(Math.min(1, expiryOptions.length - 1)) });
  const [reveal, setReveal] = useState<{ id: string; secret: string; copied: boolean; warned: boolean } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [revoked, setRevoked] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [focusTick, setFocusTick] = useState(0);
  const focusRef = useRef<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const id = useId();

  const clock = nowProp ?? mounted;

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(clearTimeout);
  }, []);

  // Focus moves after the DOM updates, as rows swap states.
  const setFocusTo = (key: string) => {
    focusRef.current = key;
    setFocusTick((t) => t + 1);
  };
  useEffect(() => {
    if (!focusRef.current) return;
    root.current?.querySelector<HTMLElement>(`[data-ak-focus="${focusRef.current}"]`)?.focus();
    focusRef.current = null;
  }, [focusTick]);

  const startCreate = () => {
    setOpen(true);
    setFormError({});
    setFocusTo("name");
  };
  const cancelCreate = () => {
    setOpen(false);
    setFormError({});
    setForm((f) => ({ ...f, name: "" }));
    setFocusTo("create");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: typeof formError = {};
    if (!form.name.trim()) err.name = "Give the key a name so you can tell it apart later.";
    if (!form.scopes.length) err.scopes = "Pick at least one permission.";
    setFormError(err);
    if (err.name || err.scopes) return setFocusTo(err.name ? "name" : "scope-0");
    setBusy(true);
    try {
      const { key, secret } = await onCreate({ name: form.name.trim(), scopes: form.scopes, expiresInDays: expiryOptions[Number(form.expiry)]?.days ?? null });
      setKeys((all) => [key, ...all]);
      setReveal({ id: key.id, secret, copied: false, warned: false });
      setOpen(false);
      setForm((f) => ({ ...f, name: "" }));
      setStatus(`Key ${key.name} created. Copy it now, it won't be shown again.`);
      setFocusTo("copy");
    } catch {
      setFormError({ form: "Couldn't create the key. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    if (!reveal) return;
    if (!reveal.copied && !reveal.warned) {
      setReveal({ ...reveal, warned: true });
      setStatus("You haven't copied the key yet. Close anyway?");
      return;
    }
    setReveal(null);
    setStatus("Key hidden. Only its last four characters stay visible.");
    setFocusTo("list");
  };

  const revoke = (k: ApiKey) => {
    setConfirm(null);
    setRevoked((r) => [...r, k.id]);
    setStatus(`${k.name} revoked. Undo within ${Math.round(undoMs / 1000)} seconds.`);
    setFocusTo(`undo-${k.id}`);
    timers.current.set(
      k.id,
      setTimeout(() => {
        timers.current.delete(k.id);
        // If Undo had focus, hand it to the next row (or the one before, or Create key).
        const btn = document.activeElement;
        if (btn instanceof HTMLElement && btn.dataset.akFocus === `undo-${k.id}`) {
          const li = btn.closest("li");
          const next = (li?.nextElementSibling ?? li?.previousElementSibling)?.querySelector<HTMLElement>("[data-ak-focus]");
          setFocusTo(next?.dataset.akFocus ?? "create");
        }
        setKeys((all) => all.filter((x) => x.id !== k.id));
        setRevoked((r) => r.filter((x) => x !== k.id));
        onRevoke?.(k.id);
      }, undoMs),
    );
  };
  const keep = (k: ApiKey) => {
    setConfirm(null);
    setFocusTo(`revoke-${k.id}`);
  };
  const undo = (k: ApiKey) => {
    clearTimeout(timers.current.get(k.id));
    timers.current.delete(k.id);
    setRevoked((r) => r.filter((x) => x !== k.id));
    setStatus(`${k.name} restored.`);
    setFocusTo(`revoke-${k.id}`);
  };

  const live = keys.filter((k) => !revoked.includes(k.id)).length;
  const toggleScope = (v: string) => setForm((f) => ({ ...f, scopes: f.scopes.includes(v) ? f.scopes.filter((s) => s !== v) : [...f.scopes, v] }));

  return (
    <div ref={root} className={cx("kit-ak @container w-full text-ink", className)}>
      <style href="asta-api-keys" precedence="asta">{KEYFRAMES}</style>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-[520px]">
          <h3 className="text-[17px] font-medium tracking-[-0.02em]">{title}</h3>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-mute">{description}</p>}
        </div>
        <button type="button" data-ak-focus="create" aria-expanded={open} aria-controls={`${id}-form`} onClick={startCreate} disabled={loading || !!error} className={SOLID}>
          <Icon d={PLUS} className="h-3.5 w-3.5" />
          Create key
        </button>
      </header>

      {open && (
        <form id={`${id}-form`} onSubmit={submit} noValidate onKeyDown={(e) => e.key === "Escape" && (e.preventDefault(), cancelCreate())} className="mt-5 rounded-[12px] bg-paper-2 p-4 sm:p-5" style={{ animation: `kit-ak-in .3s ${CURVE}` }}>
          <div className="grid gap-5 @min-[640px]:grid-cols-[1fr_200px]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-name`} className={LBL}>
                Key name
              </label>
              <input
                id={`${id}-name`}
                data-ak-focus="name"
                name="name"
                type="text"
                autoComplete="off"
                maxLength={60}
                placeholder="e.g. Production server"
                value={form.name}
                aria-invalid={!!formError.name}
                aria-describedby={`${id}-name-msg`}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={FIELD}
              />
              <Msg id={`${id}-name-msg`} error={formError.name} hint="Only your team sees this." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${id}-exp`} className={LBL}>
                Expires
              </label>
              <span className="relative">
                <select id={`${id}-exp`} name="expires" value={form.expiry} onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))} className={cx(FIELD, "cursor-pointer appearance-none pr-9")}>
                  {expiryOptions.map((o, i) => (
                    <option key={o.label} value={i}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Icon d="m4.5 6.5 3.5 3.5 3.5-3.5" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
              </span>
            </div>
          </div>

          <fieldset className="mt-5" aria-describedby={`${id}-scope-msg`}>
            <legend className={LBL}>Permissions</legend>
            <div className="mt-2 grid gap-1 @min-[560px]:grid-cols-2">
              {scopes.map((s, i) => (
                <label key={s.value} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-ink/4">
                  <span className="relative mt-px grid h-[18px] w-[18px] shrink-0 place-items-center">
                    <input
                      type="checkbox"
                      name="scopes"
                      value={s.value}
                      data-ak-focus={`scope-${i}`}
                      checked={form.scopes.includes(s.value)}
                      onChange={() => toggleScope(s.value)}
                      className="peer col-start-1 row-start-1 h-[18px] w-[18px] cursor-pointer appearance-none rounded-[6px] bg-paper shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)] outline-none transition-[background-color,box-shadow] duration-200 checked:bg-brand checked:shadow-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-2"
                    />
                    <Icon d="m4 8.5 2.5 2.5 5.5-6" className="pointer-events-none col-start-1 row-start-1 h-3 w-3 scale-50 text-white opacity-0 transition-[opacity,transform] duration-300 peer-checked:scale-100 peer-checked:opacity-100" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] leading-[18px] text-ink">{s.label}</span>
                    <span className="mt-0.5 block text-[12px] text-mute">
                      <span className="font-mono text-[11.5px] text-ink-2">{s.value}</span>
                      {s.hint && ` · ${s.hint}`}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <Msg id={`${id}-scope-msg`} error={formError.scopes} hint="Give it only what it needs." />
          </fieldset>

          {formError.form && (
            <p role="alert" className={cx("mt-4 flex items-center gap-2 rounded-lg bg-paper px-3 py-2 text-[13px] text-ink", LINE)}>
              <Icon d={WARN} className="h-4 w-4 shrink-0" />
              {formError.form}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={cancelCreate} className={GHOST}>
              Cancel
            </button>
            <button type="submit" disabled={busy} aria-busy={busy || undefined} className={cx(SOLID, "disabled:opacity-70")}>
              {busy ? "Creating key…" : "Create key"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <div className={cx("hidden gap-4 px-3 pb-2 text-[12px] text-mute", (loading || (!error && keys.length > 0)) && "@2xl:grid", COLS)} aria-hidden>
          <span>Name</span>
          <span>Key</span>
          <span>Permissions</span>
          <span>Last used</span>
          <span>Status</span>
          <span />
        </div>
        <h4 data-ak-focus="list" tabIndex={-1} className="sr-only">
          {live} {live === 1 ? "key" : "keys"}
        </h4>

        {loading ? (
          <ul aria-busy="true" aria-label="Loading API keys" className="flex flex-col gap-2 @2xl:gap-0.5">
            {[0, 1, 2].map((i) => (
              <li key={i} className={cx("grid h-[76px] grid-cols-[1fr_auto] items-center gap-4 rounded-[12px] bg-paper-2 px-4 @2xl:h-[60px] @2xl:bg-transparent @2xl:px-3", COLS)} style={{ animation: `kit-ak-pulse 1.6s ease-in-out ${i * 150}ms infinite` }}>
                {["w-36", "w-28", "w-32", "w-16", "w-14", "w-16 justify-self-end"].map((w, j) => (
                  <span key={j} className={cx("h-3 rounded-full bg-ink/8", w, j > 0 && j < 5 && "hidden @2xl:block")} />
                ))}
              </li>
            ))}
          </ul>
        ) : error ? (
          <div role="alert" className="flex flex-col items-center rounded-[12px] bg-paper-2 px-6 py-10 text-center">
            <Icon d={WARN} className="h-5 w-5 text-ink" />
            <p className="mt-3 text-[14px] font-medium">{error}</p>
            <p className="mt-1 text-[12.5px] text-mute">Your keys still work. Only this page couldn&apos;t load them.</p>
            {onRetry && (
              <button type="button" onClick={onRetry} className={cx(GHOST, "mt-4 bg-paper", LINE)}>
                Try again
              </button>
            )}
          </div>
        ) : keys.length === 0 ? (
          !open && (
            <div className="flex flex-col items-center rounded-[12px] bg-paper-2 px-6 py-12 text-center" style={{ animation: `kit-ak-in .4s ${CURVE}` }}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-paper text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
                <Icon d={KEY} className="h-5 w-5" />
              </span>
              <p className="mt-4 text-[14px] font-medium">No API keys yet</p>
              <p className="mt-1 max-w-[300px] text-[12.5px] text-mute">Create one to call the Astabyte API from your server or CI.</p>
              <button type="button" onClick={startCreate} className={cx(SOLID, "mt-5")}>
                <Icon d={PLUS} className="h-3.5 w-3.5" />
                Create your first key
              </button>
            </div>
          )
        ) : (
          <ul aria-label={title} className="flex flex-col gap-2 @2xl:gap-0.5">
            {keys.map((k) => {
              const expired = !!k.expires && k.expires.getTime() <= clock.getTime();
              const warn = reveal?.warned && !reveal.copied;
              if (reveal?.id === k.id)
                return (
                  <li key={k.id} className="rounded-[12px] bg-[color-mix(in_srgb,var(--color-brand)_6%,var(--color-paper))] p-4 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_35%,transparent)] sm:p-5" style={{ animation: `kit-ak-in .4s ${CURVE}` }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 break-words text-[14px] font-medium">{k.name}</p>
                      <span className="rounded-[5px] bg-brand px-1.5 text-[11px] font-medium leading-5 text-white">New</span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-2">Copy this key and store it somewhere safe, like a secrets manager.</p>
                    <div className="mt-3 flex flex-col gap-2 @min-[480px]:flex-row">
                      <input
                        readOnly
                        aria-label={`Secret for ${k.name}`}
                        value={reveal.secret}
                        onFocus={(e) => e.target.select()}
                        className={cx("h-10 min-w-0 shrink-0 rounded-lg @min-[480px]:flex-1 bg-paper px-3 font-mono text-[13px] text-ink outline-none focus:shadow-[inset_0_0_0_1px_var(--color-brand)]", LINE)}
                      />
                      <ClipboardButton data-ak-focus="copy" value={reveal.secret} label="Copy key" variant="outline" onCopy={() => setReveal((r) => r && { ...r, copied: true })} className="h-10 bg-paper" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                        <Icon d={WARN} className="h-3.5 w-3.5 shrink-0" />
                        {warn ? "You haven't copied it. It can't be shown again." : "You won't see this key again."}
                      </p>
                      <button type="button" onClick={dismiss} className={warn ? SOLID : GHOST}>
                        {warn ? "Close anyway" : "I've saved it"}
                      </button>
                    </div>
                  </li>
                );
              if (revoked.includes(k.id))
                return (
                  <li key={k.id} className="relative flex min-h-[60px] items-center gap-3 overflow-hidden rounded-[10px] bg-paper-2 px-3 py-2" style={{ animation: `kit-ak-in .3s ${CURVE}` }}>
                    <p className="min-w-0 flex-1 text-[13px] text-ink-2">
                      Revoked <span className="font-medium text-ink">{k.name}</span>
                      <span className="hidden text-mute @min-[480px]:inline">. Requests with {mask(k)} now fail.</span>
                    </p>
                    <button type="button" data-ak-focus={`undo-${k.id}`} onClick={() => undo(k)} className={cx(GHOST_XS, "text-brand hover:text-brand")}>
                      Undo
                    </button>
                    <span data-ak-count aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand/40" style={{ animation: `kit-ak-count ${undoMs}ms linear forwards` }} />
                  </li>
                );
              const asking = confirm === k.id;
              return (
                <li key={k.id} className={cx("rounded-[12px] transition-colors duration-200 @2xl:rounded-[10px]", asking ? "bg-paper-2" : "bg-paper-2 @2xl:bg-transparent @2xl:hover:bg-paper-2/60")} style={{ animation: `kit-ak-in .35s ${CURVE}` }}>
                  <div className={cx("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 p-4 @2xl:min-h-[60px] @2xl:px-3 @2xl:py-2.5", COLS)}>
                    <div className="min-w-0">
                      <p title={k.name} className="line-clamp-2 break-words text-[13.5px] font-medium @2xl:line-clamp-1 @2xl:truncate">
                        {k.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-mute">Created {dateFmt(k.created, clock)}</p>
                    </div>
                    <div className="row-start-1 col-start-2 @2xl:col-start-6 @2xl:justify-self-end">
                      <button
                        type="button"
                        data-ak-focus={`revoke-${k.id}`}
                        aria-label={`Revoke ${k.name}`}
                        aria-expanded={asking}
                        onClick={() => {
                          setConfirm(asking ? null : k.id);
                          if (!asking) setFocusTo(`keep-${k.id}`);
                        }}
                        className={GHOST_XS}
                      >
                        Revoke
                      </button>
                    </div>
                    <div className={cx(CELL, "@2xl:col-start-2")}>
                      <span className={CELL_LABEL}>Key</span>
                      <code className="truncate font-mono text-[12.5px] text-ink-2">{mask(k)}</code>
                    </div>
                    <div className={cx(CELL, "@2xl:col-start-3")}>
                      <span className={CELL_LABEL}>Permissions</span>
                      <Scopes list={k.scopes} />
                    </div>
                    <div className={cx(META, "@2xl:col-start-4")}>
                      <span className={CELL_LABEL}>Last used</span>
                      <span className="tabular-nums text-ink-2">{ago(k.lastUsed, clock)}</span>
                    </div>
                    <div className={cx(META, "@2xl:col-start-5")}>
                      <span className={CELL_LABEL}>Status</span>
                      <Status k={k} now={clock} />
                    </div>
                  </div>
                  {asking && (
                    <div
                      role="group"
                      aria-label={`Confirm revoking ${k.name}`}
                      onKeyDown={(e) => e.key === "Escape" && (e.preventDefault(), keep(k))}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4 @2xl:px-3 @2xl:pb-3"
                      style={{ animation: `kit-ak-in .25s ${CURVE}` }}
                    >
                      <p className="text-[12.5px] text-ink-2">{expired ? "It has already expired. Revoking removes it from the list." : `Apps using ${mask(k)} stop working right away.`}</p>
                      <div className="flex gap-2">
                        <button type="button" data-ak-focus={`keep-${k.id}`} onClick={() => keep(k)} className={GHOST}>
                          Keep key
                        </button>
                        <button type="button" onClick={() => revoke(k)} className={SOLID}>
                          Revoke key
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ApiKeys;
