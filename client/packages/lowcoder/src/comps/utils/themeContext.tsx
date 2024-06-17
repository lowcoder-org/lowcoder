import { ThemeDetail } from "api/commonSettingApi";
import React from "react";

export class Theme {
  readonly theme?: ThemeDetail;
  readonly previewTheme?: ThemeDetail;
  readonly overwriteStyles?: boolean;
}
export const ThemeContext = React.createContext<Theme | undefined>(undefined);
