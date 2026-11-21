import type { ComponentType } from "react";
import { DurationDistance, DurationDrawer, DurationExit } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { drawer: DurationDrawer, distance: DurationDistance, exit: DurationExit };

export default demos;
