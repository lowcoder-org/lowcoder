/**
 * Component instructions exposed to the Automator model.
 *
 * These are curated references, not a dump of every Lowcoder component. If a
 * component appears here, Automator is allowed to place it and has enough shape
 * information to configure it with reasonable confidence.
 */
export interface AutomatorLayoutPropertyDescriptor {
  /** Human-readable hint shown to the model. */
  description?: string;
  /** Allowed string values when this property is a fixed enum. */
  enum?: readonly string[];
  /** Primitive type when the value is not enum-restricted. */
  type?: "string" | "number" | "boolean" | "object";
  /** Sample value the model can imitate verbatim. */
  example?: unknown;
}

/**
 * Map of style namespace -> list of style keys that can be passed to
 * `set_style`. The executor expects values grouped by explicit namespace.
 */
export type AutomatorStylePropertyMap = Record<string, readonly string[]>;

export interface AutomatorComponentEntry {
  /** Component type used by Lowcoder action executors. */
  type: string;
  /** Whether the component can have children nested under `<name>.container`. */
  isContainer?: boolean;
  /** Default grid layout (w / h) for sensible initial sizing. */
  defaultLayout: { w: number; h: number };
  /** Required property keys for `action_parameters`. */
  required: string[];
  /** Optional property keys worth knowing about. */
  optional?: string[];
  /** Realistic example `action_parameters` payload. */
  example: Record<string, unknown>;
  /** Notes the model should heed. */
  notes?: string;
  /** Top-level UI / behavior properties for `set_properties`. */
  layoutProperties?: Record<string, AutomatorLayoutPropertyDescriptor>;
  /** Style properties grouped by style namespace, used by `set_style`. */
  styleProperties?: AutomatorStylePropertyMap;
}
