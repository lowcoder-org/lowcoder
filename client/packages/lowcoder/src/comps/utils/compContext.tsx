import React from "react";

// Only the specific fields consumers read (styleControl, withIsLoading, remoteComp).
// Deliberately not the full comp JSON - keeping this cheap to compute matters,
// since gridLayout.tsx rebuilds this value on every canvas render.
export type CompContextInnerFields = {
  appliedThemeId?: string;
  preventStyleOverwriting?: boolean;
  showDataLoadingIndicators?: boolean;
  version?: string;
};

export type CompContextCompInfo = {
  comp?: CompContextInnerFields;
};

export const CompContext = React.createContext<{
  comp?: CompContextCompInfo;
  compType: string;
}>({ comp: undefined, compType: '' });
