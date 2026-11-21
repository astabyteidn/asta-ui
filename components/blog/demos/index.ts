import type { ComponentType } from "react";
import easing from "./easing";
import durationAndDistance from "./duration-and-distance";
import springs from "./springs";
import stagger from "./stagger";
import flip from "./flip";
import scrollDrivenAnimation from "./scroll-driven-animation";
import startingStyle from "./starting-style";
import viewTransitions from "./view-transitions";
import fluidType from "./fluid-type";
import containerQueries from "./container-queries";
import hasSelector from "./has-selector";
import smoothOnPhones from "./smooth-on-phones";

/** Post slug → demo id → component. Only server components import this. */
export const DEMOS: Record<string, Record<string, ComponentType>> = {
  "easing": easing,
  "duration-and-distance": durationAndDistance,
  "springs": springs,
  "stagger": stagger,
  "flip": flip,
  "scroll-driven-animation": scrollDrivenAnimation,
  "starting-style": startingStyle,
  "view-transitions": viewTransitions,
  "fluid-type": fluidType,
  "container-queries": containerQueries,
  "has-selector": hasSelector,
  "smooth-on-phones": smoothOnPhones,
};
