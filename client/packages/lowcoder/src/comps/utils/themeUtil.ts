import { ThemeType } from "api/commonSettingApi";
import { getLocalThemeId } from "util/localStorageUtil";
import { getGlobalSettings } from "./globalSettings";
import { CompAction, multiChangeAction, changeValueAction, deferAction } from "lowcoder-core";
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
  themeId,
}: {
  dispatch: (action: CompAction) => void,
  compTheme?: JSONObject,
  styleProps: Record<string, any>,
  themeId?: string,
}) {
  const styleKeys = Object.keys(styleProps);
  const actions: Record<string, any> = {
    appliedThemeId: changeValueAction(themeId || '', true),
  };
  styleKeys.forEach(styleKey => {
    actions[styleKey] = changeValueAction({
      ...(compTheme?.[styleKey] as object || {}),
      // ...styleProps[styleKey],
    }, true);
  })

  setTimeout(() => {
    dispatch(
      deferAction(
        multiChangeAction(actions),
      )
    );
  }, 1000)
}