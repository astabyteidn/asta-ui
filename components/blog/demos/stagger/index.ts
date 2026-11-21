import type { ComponentType } from "react";
import { StaggerCap, StaggerList, StaggerOrder } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { list: StaggerList, order: StaggerOrder, cap: StaggerCap };

export default demos;
