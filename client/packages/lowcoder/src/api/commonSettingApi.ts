import Api from "./api";
import { AxiosPromise } from "axios";
import { ApiResponse, GenericApiResponse } from "./apiResponses";
import { trans } from "i18n";
import { JSONObject } from "@lowcoder-ee/util/jsonTypes";

export type FetchCommonSettingPayload = {
  orgId: string;
  onSuccess?: (data: CommonSettingResponseData) => void;
};

export interface CommonSettingResponseData {
  themeList?: ThemeType[];
  defaultTheme?: string | null;
  preloadCSS?: string | null;
  preloadGlobalCSS?: string | null;
  preloadJavaScript?: string | null;
  runJavaScriptInHost?: boolean | null;
  preloadLibs?: string[] | null;
  npmPlugins?: string[] | null;
  applyPreloadCSSToHomePage?: boolean | null;
  defaultHomePage?: string | null;
}

export type SetCommonSettingPayload<T = any> = {
  orgId: string;
  isPublicApp?: boolean;
  data: {
    key: string;
    value: T;
  };
  onSuccess?: () => void;
};

export interface ThemeType {
  name: string;
  id: string;
  updateTime: number;
  theme: ThemeDetail;
}

export interface ThemeDetail {
  primary: string; // brand color
  textDark: string;
  textLight: string;
  canvas: string; // app bg-color
  primarySurface: string; // comp bg-color
  borderRadius?: string; // will be depreceated
  borderColor?: string; // will be depreceated
  radius?: string;
  border?: string;
  borderWidth?: string;
  borderStyle?: string;
  chart?: string;
  margin?: string;
  direction?: string;
  padding?: string;
  gridPaddingX?: number;
  gridPaddingY?: number;
  gridColumns?: string;
  gridRowHeight?: string;
  gridRowCount?: number;
  gridBgImage?: string;
  gridBgImageRepeat?: string;
  gridBgImageSize?: string;
  gridBgImagePosition?: string;
  gridBgImageOrigin?: string;
  text?: string;
  textSize?: string;
  fontFamily?: string;
  animation?: string;
  animationDelay?: string;
  animationDuration?: string;
  opacity?: string;
  boxShadow?: string;
  lineHeight?: string;
  boxShadowColor?: string;
  animationIterationCount?: string;
  components?: Record<string, JSONObject>;
  showComponentLoadingIndicators?: boolean;
  showDataLoadingIndicators?: boolean;
  dataLoadingIndicator?: string;
}

export interface BrandingSettings {
  logo: string | null;
  squareLogo: string | null;
  mainBrandingColor: string;
  appHeaderColor: string;
  adminSidebarColor: string;
  adminSidebarFontColor: string;
  adminSidebarActiveBgColor: string;
  adminSidebarActiveFontColor: string;
  editorSidebarColor: string;
  editorSidebarFontColor: string;
  editorSidebarActiveBgColor: string;
  editorSidebarActiveFontColor: string;
  font: string;
  errorPageText: string;
  errorPageImage: string | null;
  signUpPageText: string;
  signUpPageImage: string | null;
  loggedOutPageText: string;
  loggedOutPageImage: string | null;
  standardDescription: string;
  standardTitle: string;
  showDocumentation: boolean;
  documentationLink: string | null;
  submitIssue: boolean;
  whatsNew: boolean;
  whatsNewLink: string | null;
}

export function getThemeDetailName(key: keyof ThemeDetail) {
  switch (key) {
    case "primary": return trans("themeDetail.primary");
    case "textDark": return trans("themeDetail.textDark");
    case "textLight": return trans("themeDetail.textLight");
    case "canvas": return trans("themeDetail.canvas");
    case "primarySurface": return trans("themeDetail.primarySurface");
    case "radius": return trans("themeDetail.borderRadius");
    case "border": return trans("themeDetail.borderColor");
    case "borderWidth": return trans("themeDetail.borderWidth");
    case "borderStyle": return trans("themeDetail.borderStyle");
    case "fontFamily": return trans("themeDetail.fontFamily");
    case "margin": return trans("style.margin");
    case "direction": return trans("style.direction");
    case "padding":	return trans("style.padding");
    case "gridColumns": return trans("themeDetail.gridColumns");
    case "textSize": return trans("style.textSize");
    case "lineHeight": return trans("themeDetail.lineHeight"); 
  }
  return "";
}

export function isThemeColorKey(key: string) {
  switch (key as keyof ThemeDetail) {
    case "primary":
    case "textDark":
    case "textLight":
    case "canvas":
    case "primarySurface":
    case "borderRadius":
    case "borderColor":
    case "radius":
    case "border":
    case "borderWidth":
    case "borderStyle":
    case "fontFamily":
    case "margin":
    case "direction":
    case "padding":
    case "gridColumns":
    case "textSize":
      case "lineHeight":
      return true;
  }
  return false;
}

export interface SetCommonSettingResponse extends ApiResponse {
  data: boolean;
}

class CommonSettingApi extends Api {
  static commonSettingUrl = (orgId: string) => `/organizations/${orgId}/common-settings`;

  static fetchCommonSetting(
    request: FetchCommonSettingPayload
  ): AxiosPromise<GenericApiResponse<CommonSettingResponseData>> {
    return Api.get(CommonSettingApi.commonSettingUrl(request.orgId));
  }

  static setCommonSetting<T>(
    request: SetCommonSettingPayload<T>
  ): AxiosPromise<SetCommonSettingResponse> {
    const { orgId, ...rest } = request;
    return Api.put(CommonSettingApi.commonSettingUrl(request.orgId), rest.data);
  }
}

export default CommonSettingApi;
