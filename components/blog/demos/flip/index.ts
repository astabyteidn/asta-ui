import type { ComponentType } from "react";
import { FlipFilter, FlipReorder, FlipSteps } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { steps: FlipSteps, reorder: FlipReorder, filter: FlipFilter };

export default demos;
