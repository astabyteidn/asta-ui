"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";

const load = (fn: () => Promise<{ default: ComponentType }>) => dynamic(fn, { ssr: false });

/** variant slug → demo. The installable file is `components/kit/variants/<slug>.tsx`. Keep in sync with `lib/variants.ts`. */
export const variantDemos: Record<string, ComponentType> = {
  "textarea-aui-001": load(() => import("./variants/demos/textarea-aui-001")),
  "textarea-aui-002": load(() => import("./variants/demos/textarea-aui-002")),
  "textarea-aui-003": load(() => import("./variants/demos/textarea-aui-003")),
  "textarea-aui-004": load(() => import("./variants/demos/textarea-aui-004")),
  "textarea-aui-005": load(() => import("./variants/demos/textarea-aui-005")),
  "textarea-aui-006": load(() => import("./variants/demos/textarea-aui-006")),
  "textarea-aui-007": load(() => import("./variants/demos/textarea-aui-007")),
  "textarea-aui-008": load(() => import("./variants/demos/textarea-aui-008")),
};
