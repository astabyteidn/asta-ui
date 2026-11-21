import type { ComponentType } from "react";
import { CardBreakpoints, CardSlots, StatUnits } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { breakpoints: CardBreakpoints, slots: CardSlots, units: StatUnits };

export default demos;
