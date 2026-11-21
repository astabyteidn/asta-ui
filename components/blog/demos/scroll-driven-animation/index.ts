import type { ComponentType } from "react";
import { SdaGallery, SdaProgress, SdaReveal } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { progress: SdaProgress, reveal: SdaReveal, gallery: SdaGallery };

export default demos;
