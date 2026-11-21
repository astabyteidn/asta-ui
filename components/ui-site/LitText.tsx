"use client";

import { useEffect, useRef } from "react";

/**
 * A paragraph that lights up word by word (grey to black) as it scrolls through the viewport.
 * `**bold**` segments stay heavier. Plain text for screen readers and without JS.
 */
export default function LitText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  const words: { w: string; b: boolean }[] = [];
  text.split(/(\*\*[^*]+\*\*)/).forEach((part) => {
    const b = part.startsWith("**");
    part
      .replace(/\*\*/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => words.push({ w, b }));
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = [...el.querySelectorAll<HTMLSpanElement>("span[data-w]")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      spans.forEach((s) => (s.style.color = "var(--color-ink)"));
      return;
    }
    let raf = 0;
    const paint = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top reaches 85% of the viewport, 1 when the bottom reaches 45%.
      const k = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.4)));
      const lit = Math.round(k * spans.length);
      spans.forEach((s, n) => (s.style.color = n < lit ? "var(--color-ink)" : ""));
    };
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  return (
    <p ref={ref} className={`ui-lit text-mute ${className}`}>
      {words.map(({ w, b }, n) => (
        <span key={n} data-w className={b ? "font-semibold" : undefined}>
          {w}
          {n < words.length - 1 ? " " : null}
        </span>
      ))}
    </p>
  );
}
