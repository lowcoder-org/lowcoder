export type PlacementType = 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom' | 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'center' | '';
export type TourStepType = 'default' | 'primary' | '';

export const PlacementOptions: {label: string, value: PlacementType}[] = [
  { label: "​", value: ""},
  { label: "Center", value: "center"},
  { label: "Left", value: "left"},
  { label: "Left Top", value: "leftTop"},
  { label: "Left Bottom", value: "leftBottom"},
  { label: "Right", value: "right"},
  { label: "Right Top", value: "rightTop"},
  { label: "Right Bottom", value: "rightBottom"},
  { label: "Top", value: "top"},
  { label: "Top Left", value: "topLeft"},
  { label: "Top Right", value: "topRight"},
  { label: "Bottom", value: "bottom"},
  { label: "Bottom Left", value: "bottomLeft"},
  { label: "Bottom Right", value: "bottomRight"},
];

export const TypeOptions: {label: string, value: TourStepType}[] = [
  { label: "​", value: ""},
  { label: "Default", value: "default"},
  { label: "Primary", value: "primary"},
];

export {};