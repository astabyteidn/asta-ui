"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui037-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui037-star { 0% { transform: scale(.6) rotate(-14deg) } 55% { transform: scale(1.22) rotate(4deg) } 100% { transform: none } }
@keyframes aui037-word { from { opacity: 0; transform: translateY(7px) } to { opacity: 1; transform: none } }
@keyframes aui037-chip { from { opacity: 0; transform: scale(.85) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui037 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui037-rise .6s ${EASE} ${i * 55}ms both` });

const WORDS = ["Tap a star", "Not for me", "Could be better", "It's good", "Really good", "Loved it"];
const PROMPTS = ["How was it?", "What went wrong?", "What would make it better?", "What did you like?", "What stood out?", "What did you love about it?"];

export interface ReviewPhoto {
  src: string;
  alt: string;
}

export interface ReviewTextareaProps {
  /** What is being reviewed. */
  product?: string;
  /** Small line under the product, e.g. an order number. */
  meta?: string;
  image?: string;
  rating?: number;
  defaultRating?: number;
  onRatingChange?: (rating: number) => void;
  defaultText?: string;
  photos?: ReviewPhoto[];
  maxPhotos?: number;
  onSubmit?: (review: { rating: number; text: string; photos: ReviewPhoto[]; files: File[] }) => void;
  className?: string;
}

function Star({ on, delay, pop }: { on: boolean; delay: number; pop: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("h-7 w-7 transition-colors duration-200", on ? "text-brand" : "text-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]")}
      style={pop && on ? { animation: `aui037-star .5s ${EASE} ${delay}ms both` } : undefined}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 2.8Z" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * aui-037 · A product review box. Signature: stars fill in a quick wave up to the one you pick, the verdict word and the
 * prompt change with the score, and photos sit as small chips you can add or remove under the text.
 */
export function ReviewTextarea({
  product = "Studio headphones",
  meta = "Delivered 12 Nov · Order A-2041",
  image = "/lab/headphones.jpg",
  rating,
  defaultRating = 0,
  onRatingChange,
  defaultText = "",
  photos: initial = [],
  maxPhotos = 4,
  onSubmit,
  className,
}: ReviewTextareaProps) {
  const id = useId();
  const [innerRating, setInnerRating] = useState(defaultRating);
  const score = rating ?? innerRating;
  const [hover, setHover] = useState(0);
  const [wave, setWave] = useState(0);
  const [text, setText] = useState(defaultText);
  const [photos, setPhotos] = useState<(ReviewPhoto & { file?: File })[]>(initial);
  const [sent, setSent] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const stars = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const pick = (n: number) => {
    if (rating === undefined) setInnerRating(n);
    onRatingChange?.(n);
    setWave((w) => w + 1);
  };
  const shown = hover || score;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = Math.min(5, Math.max(1, (score || 0) + d));
    pick(n);
    stars.current[n - 1]?.focus();
  };

  const remove = (i: number) => {
    const p = photos[i];
    if (p.file) {
      URL.revokeObjectURL(p.src);
      urls.current = urls.current.filter((u) => u !== p.src);
    }
    setPhotos((all) => all.filter((_, j) => j !== i));
  };

  const ready = score > 0 && !sent;

  return (
    <div
      className={cx(
        "aui037 w-full max-w-[440px] rounded-[14px] bg-paper p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-textarea-aui-037" precedence="asta">{CSS}</style>
      <div className="flex items-center gap-3" style={rise(0)}>
        <img src={image} alt="" width={44} height={44} loading="lazy" decoding="async" className="h-11 w-11 rounded-[9px] bg-paper-2 object-cover" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[14px] font-medium text-ink">{product}</p>
          <p className="mt-0.5 truncate text-[12px] text-mute">{meta}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3" style={rise(1)}>
        <div role="radiogroup" aria-label={`Rate ${product}`} className="-ml-1 flex" onKeyDown={onKey} onPointerLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              ref={(el) => {
                stars.current[n - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={score === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              tabIndex={score ? (score === n ? 0 : -1) : n === 1 ? 0 : -1}
              onPointerEnter={() => setHover(n)}
              onClick={() => pick(n)}
              className="rounded-[7px] p-1 outline-none transition-transform duration-200 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50"
              style={{ transitionTimingFunction: EASE }}
            >
              <span key={wave} className="block">
                <Star on={n <= shown} pop={wave > 0 && !hover} delay={(n - 1) * 45} />
              </span>
            </button>
          ))}
        </div>
        <span className="relative h-5 overflow-hidden text-right text-[13.5px] font-medium text-ink">
          <span key={shown} className="block" style={{ animation: `aui037-word .3s ${EASE} both` }}>
            {WORDS[shown]}
          </span>
        </span>
      </div>

      <label htmlFor={id} className="sr-only">
        Your review
      </label>
      <div
        className="mt-4 rounded-[11px] bg-paper-2 transition-shadow duration-300 focus-within:bg-paper focus-within:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]"
        style={rise(2)}
      >
        <textarea
          id={id}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PROMPTS[shown]}
          className="block w-full resize-none bg-transparent px-3.5 pt-3 text-[14px] leading-[1.55] text-ink outline-none placeholder:text-mute"
        />
        <ul className="flex flex-wrap items-center gap-2 px-3 pb-3 pt-2" aria-label="Photos">
          {photos.map((p, i) => (
            <li key={p.src} className="group relative" style={{ animation: `aui037-chip .35s ${EASE} both` }}>
              <img src={p.src} alt={p.alt} width={44} height={44} loading="lazy" decoding="async" className="h-11 w-11 rounded-[8px] object-cover shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${p.alt}`}
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-paper opacity-0 outline-none transition-[opacity,transform] duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-90 [@media(hover:none)]:opacity-100"
              >
                <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
              </button>
            </li>
          ))}
          {photos.length < maxPhotos && (
            <li>
              <input
                ref={picker}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const list = Array.from(e.target.files ?? []).slice(0, maxPhotos - photos.length);
                  const added = list.map((f) => {
                    const url = URL.createObjectURL(f);
                    urls.current.push(url);
                    return { src: url, alt: f.name, file: f };
                  });
                  setPhotos((all) => [...all, ...added]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => picker.current?.click()}
                className="flex h-11 items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-medium text-ink outline-none shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-[transform,background-color] duration-200 hover:bg-paper active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4 text-mute" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="3.5" width="12" height="9.5" rx="2" />
                  <circle cx="8" cy="8.2" r="2.2" />
                  <path d="M5.5 3.5 6.4 2h3.2l.9 1.5" />
                </svg>
                Add photo
                <span className="font-normal text-mute">
                  {photos.length}/{maxPhotos}
                </span>
              </button>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3" style={rise(3)}>
        <span className="text-[12px] text-mute" aria-live="polite">
          {sent ? "Thanks. Your review is live." : "Shown with your first name"}
        </span>
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            onSubmit?.({
              rating: score,
              text: text.trim(),
              photos: photos.filter((p) => !p.file).map(({ src, alt }) => ({ src, alt })),
              files: photos.flatMap((p) => (p.file ? [p.file] : [])),
            });
            setSent(true);
          }}
          className={cx(
            "group inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] px-4 text-[13.5px] font-medium outline-none transition-[background-color,color,transform] duration-300 active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2",
            ready ? "bg-ink text-paper" : sent ? "bg-brand text-white" : "bg-paper-2 text-mute",
          )}
        >
          {sent ? "Posted" : "Post review"}
          {!sent && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-enabled:group-hover:translate-x-0.5" style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default ReviewTextarea;
