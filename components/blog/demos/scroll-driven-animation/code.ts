// The real code behind the scroll-driven demos. The demos inject these strings, and the post shows them as-is.

export const PROGRESS_CSS = `.sda-progress .bar {
  display: none;
}

@supports (animation-timeline: scroll()) {
  .sda-progress .bar {
    display: block;
    transform-origin: left;
    animation: sda-progress-grow auto linear both;
    /* The nearest scroll container on the block axis: the article box. */
    animation-timeline: scroll(nearest block);
  }
}

@keyframes sda-progress-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}`;

export const REVEAL_CSS = `@supports (animation-timeline: view()) {
  .sda-reveal .card {
    animation: sda-reveal-rise auto linear both;
    /* Progress = how far this card has entered the scroll box. */
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
  }
}

@keyframes sda-reveal-rise {
  from { opacity: 0; transform: translateY(24px) scale(.98); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .sda-reveal .card { animation: none; }
}`;

export const GALLERY_CSS = `.sda-gallery {
  /* Lets the counter bar, a sibling of the track, see its timeline. */
  timeline-scope: --sda-gallery;
}
.sda-gallery .track {
  scroll-timeline: --sda-gallery inline;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
.sda-gallery .bar { display: none; }

@supports (animation-timeline: view()) and (timeline-scope: none) {
  .sda-gallery .bar {
    display: block;
    transform-origin: left;
    animation: sda-gallery-grow auto linear both;
    animation-timeline: --sda-gallery;
  }
  .sda-gallery .photo {
    animation: sda-gallery-focus auto linear both;
    animation-timeline: view(inline);
  }
}

@keyframes sda-gallery-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
/* Dim at the edges, full strength in the middle. */
@keyframes sda-gallery-focus {
  0%, 100% { opacity: .35; }
  50%      { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .sda-gallery .photo { animation: none; }
}`;
