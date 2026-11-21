import type { ComponentType } from "react";
import { DialogDemo, PopoverDemo, ToastDemo } from "./demos";

/** Demo id → component. Server-safe: the components themselves are client modules in ./demos.tsx. */
const demos: Record<string, ComponentType> = { popover: PopoverDemo, dialog: DialogDemo, toast: ToastDemo };

export default demos;
