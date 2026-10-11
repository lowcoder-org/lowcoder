import { AUTOMATOR_COMPONENTS } from "./entries";
import type { AutomatorComponentEntry } from "./types";

/** Returns the curated set of components Automator is allowed to use. */
export function getAutomatorComponents(): AutomatorComponentEntry[] {
  return [...AUTOMATOR_COMPONENTS];
}

export const AUTOMATOR_COMPONENT_TYPES: string[] = AUTOMATOR_COMPONENTS.map(
  (component) => component.type
);

export { AUTOMATOR_COMPONENTS } from "./entries";
export type {
  AutomatorComponentEntry,
  AutomatorLayoutPropertyDescriptor,
  AutomatorStylePropertyMap,
} from "./types";
