import { BoolControl } from "comps/controls/boolControl";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { eventHandlerControl } from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { NotificationStyle } from "comps/controls/styleControlConstants";
import { withDefault } from "comps/generators";
import { stateComp } from "comps/generators/simpleGenerators";
import { ParamsConfig } from "comps/controls/actionSelector/executeCompTypes";
import { trans } from "i18n";

// Toast type
export type ToastType = "info" | "success" | "warning" | "error";

// Toast type options
export const toastTypeOptions = [
  { label: trans("toastComp.typeInfo"), value: "info" },
  { label: trans("toastComp.typeSuccess"), value: "success" },
  { label: trans("toastComp.typeWarning"), value: "warning" },
  { label: trans("toastComp.typeError"), value: "error" },
] as const;

// Placement options
export const placementOptions = [
  { label: trans("toastComp.placementTopLeft"), value: "topLeft" },
  { label: trans("toastComp.placementTopRight"), value: "topRight" },
  { label: trans("toastComp.placementBottomLeft"), value: "bottomLeft" },
  { label: trans("toastComp.placementBottomRight"), value: "bottomRight" },
] as const;

// Event options
export const ToastEventOptions = [
  { label: trans("toastComp.click"), value: "click", description: trans("toastComp.clickDesc") },
  { label: trans("toastComp.close"), value: "close", description: trans("toastComp.closeDesc") },
] as const;

// Method params
export const showParams: ParamsConfig = [
  { name: "text", type: "string" },
  { name: "options", type: "JSON" },
];

export const closeParams: ParamsConfig = [
  { name: "key", type: "string" },
];

// Children map for toast component configuration
export const childrenMap = {
  // Basic configuration
  title: withDefault(StringControl, ""),
  description: withDefault(StringControl, ""),
  type: dropdownControl(toastTypeOptions, "info"),
  
  // Timing
  duration: withDefault(NumberControl, 4.5),
  
  // Position & Appearance
  placement: dropdownControl(placementOptions, "bottomRight"),
  dismissible: withDefault(BoolControl, true),
  showProgress: withDefault(BoolControl, false),
  pauseOnHover: withDefault(BoolControl, true),
  
  // Layout
  width: withDefault(StringControl, ""),
  progressHeight: withDefault(StringControl, ""),
  
  // Event handlers
  onEvent: eventHandlerControl(ToastEventOptions),

  // Style (applied via global CSS in ToastRuntimeView)
  style: styleControl(NotificationStyle),
  
  // Internal state for tracking visibility
  visible: stateComp<boolean>(false),
  
  // Unique instance ID for scoped styling (set by ToastRuntimeView)
  instanceId: stateComp<string>(""),
};
