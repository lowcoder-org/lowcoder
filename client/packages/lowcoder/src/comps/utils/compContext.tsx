import React from "react";

export const CompContext = React.createContext<{
  comp?: any;
  compType: string;
}>({ comp: undefined, compType: '' });
