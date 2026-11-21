import type { ComponentType } from "react";
import { EasingMenu, EasingNumbers, EasingRace } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { race: EasingRace, menu: EasingMenu, numbers: EasingNumbers };

export default demos;
