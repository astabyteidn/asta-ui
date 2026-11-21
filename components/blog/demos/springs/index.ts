import type { ComponentType } from "react";
import { SpringRace, SpringTabs, SpringToast } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { tabs: SpringTabs, race: SpringRace, toast: SpringToast };

export default demos;
