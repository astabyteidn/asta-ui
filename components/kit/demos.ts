"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";

const load = (fn: () => Promise<{ default: ComponentType }>) => dynamic(fn, { ssr: false });

/** slug → demo. The reusable file is `components/kit/<slug>.tsx`. Keep in sync with `lib/kit.ts`. */
export const kitDemos: Record<string, ComponentType> = {
  "button": load(() => import("./demos/button")),
  "motion-button": load(() => import("./demos/motion-button")),
  "input": load(() => import("./demos/input")),
  "textarea": load(() => import("./demos/textarea")),
  "checkbox": load(() => import("./demos/checkbox")),
  "switch": load(() => import("./demos/switch")),
  "slider": load(() => import("./demos/slider")),
  "badge": load(() => import("./demos/badge")),
  "avatar": load(() => import("./demos/avatar")),
  "kbd": load(() => import("./demos/kbd")),
  "spinner": load(() => import("./demos/spinner")),
  "tooltip": load(() => import("./demos/tooltip")),
  "skeleton": load(() => import("./demos/skeleton")),
  "radio-group": load(() => import("./demos/radio-group")),
  "segmented-control": load(() => import("./demos/segmented-control")),
  "tabs": load(() => import("./demos/tabs")),
  "field": load(() => import("./demos/field")),
  "select": load(() => import("./demos/select")),
  "dropdown-menu": load(() => import("./demos/dropdown-menu")),
  "accordion": load(() => import("./demos/accordion")),
  "toast": load(() => import("./demos/toast")),
  "number-input": load(() => import("./demos/number-input")),
  "tag-input": load(() => import("./demos/tag-input")),
  "dialog": load(() => import("./demos/dialog")),
  "navbar": load(() => import("./demos/navbar")),
  "sign-in": load(() => import("./demos/sign-in")),
  "pricing": load(() => import("./demos/pricing")),
  "command-palette": load(() => import("./demos/command-palette")),
  "settings-panel": load(() => import("./demos/settings-panel")),
  "footer": load(() => import("./demos/footer")),
};
