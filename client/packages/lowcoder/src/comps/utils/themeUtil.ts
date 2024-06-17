import { ThemeType } from "api/commonSettingApi";
import { getLocalThemeId } from "util/localStorageUtil";
import { getGlobalSettings } from "./globalSettings";
import { CompAction, multiChangeAction, changeValueAction } from "lowcoder-core";
import { JSONObject, JSONValue } from "@lowcoder-ee/util/jsonTypes";

export const DEFAULT_THEMEID = "default";

function findTheme(themeList: ThemeType[], id?: string | null) {
  return id ? themeList.find((t) => t.id === id) : undefined;
}

export function getCurrentTheme(themeList: ThemeType[], appThemeId: string) {
  const theme = findTheme(themeList, getLocalThemeId());
  if (theme) {
    return theme;
  }
  return findTheme(
    themeList,
    appThemeId === DEFAULT_THEMEID
      ? getGlobalSettings().orgCommonSettings?.defaultTheme
      : appThemeId
  );
}

export function setInitialCompStyles({
  dispatch,
  compTheme,
  styleProps,
}: {
  dispatch: (action: CompAction) => void,
  compTheme?: JSONObject,
  styleProps: Record<string, any>,
}) {
  const styleKeys = Object.keys(styleProps);
  const actions: Record<string, any> = {};
  styleKeys.forEach(styleKey => {
    actions[styleKey] = changeValueAction({
      ...(compTheme?.[styleKey] as object || {}),
      ...styleProps[styleKey],
    }, false);
  })
  actions['themeApplied'] = changeValueAction(true, false);

  dispatch(
    multiChangeAction(actions),
  );
}