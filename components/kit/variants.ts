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
  "navbar-aui-009": load(() => import("./variants/demos/navbar-aui-009")),
  "navbar-aui-010": load(() => import("./variants/demos/navbar-aui-010")),
  "navbar-aui-011": load(() => import("./variants/demos/navbar-aui-011")),
  "navbar-aui-012": load(() => import("./variants/demos/navbar-aui-012")),
  "navbar-aui-013": load(() => import("./variants/demos/navbar-aui-013")),
  "navbar-aui-014": load(() => import("./variants/demos/navbar-aui-014")),
  "sign-in-aui-015": load(() => import("./variants/demos/sign-in-aui-015")),
  "sign-in-aui-016": load(() => import("./variants/demos/sign-in-aui-016")),
  "sign-in-aui-017": load(() => import("./variants/demos/sign-in-aui-017")),
  "sign-in-aui-018": load(() => import("./variants/demos/sign-in-aui-018")),
  "sign-in-aui-019": load(() => import("./variants/demos/sign-in-aui-019")),
  "sign-in-aui-020": load(() => import("./variants/demos/sign-in-aui-020")),
  "pricing-aui-021": load(() => import("./variants/demos/pricing-aui-021")),
  "pricing-aui-022": load(() => import("./variants/demos/pricing-aui-022")),
  "pricing-aui-023": load(() => import("./variants/demos/pricing-aui-023")),
  "pricing-aui-024": load(() => import("./variants/demos/pricing-aui-024")),
  "footer-aui-025": load(() => import("./variants/demos/footer-aui-025")),
  "footer-aui-026": load(() => import("./variants/demos/footer-aui-026")),
  "footer-aui-027": load(() => import("./variants/demos/footer-aui-027")),
  "footer-aui-028": load(() => import("./variants/demos/footer-aui-028")),
};
