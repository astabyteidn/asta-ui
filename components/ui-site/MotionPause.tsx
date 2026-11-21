"use client";

import { useSyncExternalStore } from "react";
import Icon from "@/components/icons/Icon";
import { MOTION_KEY } from "@/lib/motion";

/**
 * One switch that pauses every live demo on the site (WCAG 2.2.2: anything that moves on its own for more than five
 * seconds needs a pause). It is saved per browser and mirrored on `<html data-motion="paused">` before first paint
 * (MOTION_SCRIPT in lib/motion.ts), so CSS loops stop without a flash. `Live` and `LiveSlot` freeze their demo into a
 * still while it is on; the blog frames stop their JS loops through `usePaused`. Reduced motion is still handled by
 * each component.
 */
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
// 0 while motion plays; a new number for every pause, so a demo can tell "frozen for this pause" from an older one.
let epoch = -1;
let count = 1;
const read = () => {
  if (epoch < 0) epoch = document.documentElement.dataset.motion === "paused" ? count++ : 0;
  return epoch;
};

export function setMotionPaused(paused: boolean) {
  epoch = paused ? count++ : 0;
  if (paused) document.documentElement.dataset.motion = "paused";
  else delete document.documentElement.dataset.motion;
  try {
    if (paused) localStorage.setItem(MOTION_KEY, "paused");
    else localStorage.removeItem(MOTION_KEY);
  } catch {}
  listeners.forEach((l) => l());
}

/** 0 while motion plays, otherwise an id for the current pause. 0 on the server and during hydration. */
export const useMotionEpoch = () => useSyncExternalStore(subscribe, read, () => 0);

/** True while the visitor has paused motion. False on the server and during hydration. */
export const useMotionPaused = () => useMotionEpoch() !== 0;

/** The pause / play button. Every copy drives the same switch, so pausing in one frame pauses the whole page. */
export function MotionToggle({ className = "btn btn-quiet btn-sm btn-icon" }: { className?: string }) {
  const paused = useMotionPaused();
  const label = paused ? "Play motion" : "Pause motion";
  return (
    <button type="button" onClick={() => setMotionPaused(!paused)} className={className} aria-label={label} title={label}>
      <Icon name={paused ? "play" : "pause"} className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );
}
