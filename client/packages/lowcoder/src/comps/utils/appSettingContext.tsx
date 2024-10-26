import React from "react";

export type AppSettingType = 'setting' | 'canvas';

export const AppSettingContext = React.createContext<{
  settingType: AppSettingType;
}>({ settingType: 'setting' });
