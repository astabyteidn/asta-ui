"use client";

import { useId, useRef, useState } from "react";
import { Avatar } from "@/components/kit/avatar";
import { Button } from "@/components/kit/button";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

export interface CommentAuthor {
  name: string;
  src?: string;
}
export interface CommentItem {
  id: string;
  author: CommentAuthor;
  /** Already formatted, e.g. "2h" or "Yesterday". */
  time: string;
  body: string;
  likes?: number;
  liked?: boolean;
  /** One level only. Replying to a reply adds to the same list. */
  replies?: CommentItem[];
}
export interface CommentsProps {
  defaultComments: CommentItem[];
  currentUser: CommentAuthor;
  title?: string;
  /** Called after a comment is added. `parentId` is set for replies. */
  onPost?: (body: string, parentId?: string) => void;
  className?: string;
}

/* ---------- composer ---------- */

function Composer({
  user,
  label,
  placeholder,
  initial = "",
  autoFocus,
  onSubmit,
  onCancel,
}: {
  user: CommentAuthor;
  label: string;
  placeholder: string;
  initial?: string;
  autoFocus?: boolean;
  onSubmit: (body: string) => void;
  onCancel?: () => void;
}) {
  const [text, setText] = useState(initial);
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const empty = !text.trim();
  const send = () => {
    if (empty) return;
    onSubmit(text.trim());
    setText("");
    area.current?.focus();
  };

  return (
    <div className="flex gap-3">
      <Avatar name={user.name} src={user.src} size="sm" />
      <div className="min-w-0 flex-1 rounded-[10px] bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent)] transition-shadow duration-200 focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        {/* field-sizing lets the box grow with its text, no JS needed. */}
        <textarea
          ref={area}
          id={id}
          name="body"
          rows={1}
          value={text}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            } else if (e.key === "Escape" && onCancel) {
              e.preventDefault();
              onCancel();
            }
          }}
          className="block max-h-40 min-h-[44px] w-full resize-none bg-transparent px-3 pt-2.5 text-[16px] sm:text-[14px] leading-relaxed text-ink outline-none [field-sizing:content] placeholder:text-mute"
        />
        <div className="flex items-center justify-end gap-1.5 px-2 pb-2">
          {onCancel && (
            <Button variant="ghost" size="xs" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button variant="accent" size="xs" disabled={empty} onClick={send} kbd="⌘↵">
            {label}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- one comment ---------- */

function Like({ count, liked, pop, onToggle }: { count: number; liked: boolean; pop: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={`Like, ${count}`}
      onClick={onToggle}
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] tabular-nums outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/50",
        liked ? "bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] text-brand" : "text-mute hover:bg-paper-2 hover:text-ink",
      )}
    >
      <svg
        key={liked ? "on" : "off"}
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden
        style={pop && liked ? { animation: `kit-cm-pop .45s ${CURVE}` } : undefined}
      >
        <path d="M8 13.5S2.5 10.3 2.5 6.4A2.9 2.9 0 0 1 8 5a2.9 2.9 0 0 1 5.5 1.4c0 3.9-5.5 7.1-5.5 7.1Z" />
      </svg>
      <span className="relative inline-flex overflow-hidden">
        <span key={count} style={pop ? { animation: `kit-cm-roll .35s ${CURVE}` } : undefined}>
          {count}
        </span>
      </span>
    </button>
  );
}

/**
 * A discussion thread: avatar, name and time on each comment, replies one level deep, a like pill that
 * pops, and a composer that grows with its text. New comments slide in. ⌘/Ctrl + Enter posts and
 * Escape closes a reply box.
 */
export function Comments({ defaultComments, currentUser, title = "Discussion", onPost, className }: CommentsProps) {
  const [comments, setComments] = useState(defaultComments);
  const [replyTo, setReplyTo] = useState<{ parent: string; mention?: string } | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);
  const [popped, setPopped] = useState<string | null>(null);
  const replyButtons = useRef(new Map<string, HTMLButtonElement>());
  const seq = useRef(0);

  const total = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

  const post = (body: string, parent?: string) => {
    const item: CommentItem = { id: `new-${++seq.current}`, author: currentUser, time: "Just now", body, likes: 0 };
    setComments((list) => (parent ? list.map((c) => (c.id === parent ? { ...c, replies: [...(c.replies ?? []), item] } : c)) : [...list, item]));
    setFresh((f) => [...f, item.id]);
    onPost?.(body, parent);
  };

  const toggleLike = (id: string) => {
    const flip = (c: CommentItem): CommentItem =>
      c.id === id ? { ...c, liked: !c.liked, likes: (c.likes ?? 0) + (c.liked ? -1 : 1) } : { ...c, replies: c.replies?.map(flip) };
    setComments((list) => list.map(flip));
    setPopped(id);
  };

  const closeReply = () => {
    const parent = replyTo?.parent;
    setReplyTo(null);
    if (parent) replyButtons.current.get(parent)?.focus();
  };

  const row = (c: CommentItem, parent: string) => (
    <article key={c.id} className="flex gap-3" style={fresh.includes(c.id) ? { animation: `kit-cm-in .5s ${CURVE} both` } : undefined}>
      <Avatar name={c.author.name} src={c.author.src} size="sm" />
      <div className="min-w-0 flex-1">
        <header className="flex items-baseline gap-2">
          <span className="text-[13.5px] font-medium text-ink">{c.author.name}</span>
          <span className="text-[12px] text-mute">{c.time}</span>
        </header>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-ink-2">{c.body}</p>
        <div className="-ml-2.5 mt-1.5 flex items-center gap-0.5">
          <Like count={c.likes ?? 0} liked={!!c.liked} pop={popped === c.id} onToggle={() => toggleLike(c.id)} />
          <button
            ref={(el) => {
              if (el && c.id === parent) replyButtons.current.set(parent, el);
            }}
            type="button"
            onClick={() => setReplyTo({ parent, mention: c.id === parent ? undefined : c.author.name.split(" ")[0] })}
            className="inline-flex h-7 items-center rounded-full px-2.5 text-[12px] text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            Reply
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <section aria-label={title} className={cx("kit-cm w-full max-w-[560px]", className)}>
      <style href="asta-comments" precedence="asta">{`
        @keyframes kit-cm-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes kit-cm-pop { 0% { transform: scale(.6); } 55% { transform: scale(1.25); } 100% { transform: none; } }
        @keyframes kit-cm-roll { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .kit-cm, .kit-cm * { animation: none !important; transition-duration: 0s !important; } }
      `}</style>

      <h3 className="mb-5 flex items-baseline gap-2 text-[15px] font-medium tracking-[-0.01em] text-ink">
        {title}
        <span className="text-[12.5px] font-normal tabular-nums text-mute">{total}</span>
      </h3>

      <div className="flex flex-col gap-6">
        {comments.map((c) => (
          <div key={c.id}>
            {row(c, c.id)}
            {(!!c.replies?.length || replyTo?.parent === c.id) && (
              <div className="relative mt-4 flex flex-col gap-4 pl-11">
                <span aria-hidden className="absolute bottom-1 left-4 top-0 w-px bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)]" />
                {c.replies?.map((r) => row(r, c.id))}
                {replyTo?.parent === c.id && (
                  <div style={{ animation: `kit-cm-in .4s ${CURVE} both` }}>
                    <Composer
                      key={replyTo.mention ?? "reply"}
                      user={currentUser}
                      label="Reply"
                      placeholder={`Reply to ${c.author.name.split(" ")[0]}…`}
                      initial={replyTo.mention ? `@${replyTo.mention} ` : ""}
                      autoFocus
                      onSubmit={(body) => {
                        post(body, c.id);
                        closeReply();
                      }}
                      onCancel={closeReply}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Composer user={currentUser} label="Comment" placeholder="Add a comment…" onSubmit={(body) => post(body)} />
      </div>
    </section>
  );
}

export default Comments;
