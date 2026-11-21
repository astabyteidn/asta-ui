import type { ComponentType } from "react";
import { SmoothLanes, SmoothPause } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { lanes: SmoothLanes, pause: SmoothPause };

export default demos;
