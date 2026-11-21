import type { ComponentType } from "react";
import { ClampMath, FluidPage, WrapDemo } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { page: FluidPage, math: ClampMath, wrap: WrapDemo };

export default demos;
