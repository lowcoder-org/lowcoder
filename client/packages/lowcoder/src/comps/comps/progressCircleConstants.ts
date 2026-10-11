import { trans } from "i18n";

// Progress type options (circle or dashboard)
export const ProgressTypeOptions = [
  { label: trans("progressCircle.circle"), value: "circle" },
  { label: trans("progressCircle.dashboard"), value: "dashboard" },
] as const;

// Stroke linecap options (line ending style)
export const StrokeLinecapOptions = [
  { label: trans("progressCircle.round"), value: "round" },
  { label: trans("progressCircle.butt"), value: "butt" },
  { label: trans("progressCircle.square"), value: "square" },
] as const;

// Gap position options (for dashboard type)
export const GapPositionOptions = [
  { label: trans("progressCircle.top"), value: "top" },
  { label: trans("progressCircle.bottom"), value: "bottom" },
  { label: trans("progressCircle.left"), value: "left" },
  { label: trans("progressCircle.right"), value: "right" },
] as const;
