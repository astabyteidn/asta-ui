import type { ComponentType } from "react";
import { HasBulk, HasField, HasPlans } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { field: HasField, plans: HasPlans, bulk: HasBulk };

export default demos;
