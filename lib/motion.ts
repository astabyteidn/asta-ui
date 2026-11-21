// Shared by the root layout (server) and the pause switch in components/ui-site/MotionPause.tsx.
export const MOTION_KEY = "asta-motion";

/** Runs before first paint (inlined in the root layout): a saved pause sets `<html data-motion="paused">`, so CSS loops never start. */
export const MOTION_SCRIPT = `try{if(localStorage.getItem("${MOTION_KEY}")==="paused")document.documentElement.dataset.motion="paused"}catch(e){}`;
