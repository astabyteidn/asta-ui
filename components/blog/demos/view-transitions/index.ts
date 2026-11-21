import type { ComponentType } from "react";
import { VtLayout, VtShared, VtTiming } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { layout: VtLayout, shared: VtShared, timing: VtTiming };

export default demos;
