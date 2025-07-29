import { AppPathParams } from "constants/applicationConstants";
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { DATASOURCE_URL, QUERY_LIBRARY_URL } from "../constants/routesURL";
import { AuthSearchParams } from "constants/authConstants";
import { checkIsMobile } from "util/commonUtils";
import { EditorContext } from "comps/editorState";
import { getDataSourceStructures } from "redux/selectors/datasourceSelectors";
import { DatasourceStructure } from "api/datasourceApi";
import { loadAuthSearchParams } from "pages/userAuth/authUtils";
import { ThemeContext } from "@lowcoder-ee/comps/utils/themeContext";
import { defaultTheme } from "constants/themeConstants";
import { CompTypeContext } from "@lowcoder-ee/comps/utils/compTypeContext";
import { setInitialCompStyles } from "@lowcoder-ee/comps/utils/themeUtil";
import { CompAction, changeChildAction } from "lowcoder-core";
import { ThemeDetail } from "@lowcoder-ee/api/commonSettingApi";
import { uniq } from "lodash";
import { constantColors } from "components/colorSelect/colorUtils";
import { AppState } from "@lowcoder-ee/redux/reducers";
import { getOrgUserStats } from "@lowcoder-ee/redux/selectors/orgSelectors";
import { fetchGroupsAction } from "@lowcoder-ee/redux/reduxActions/orgActions";
import debounce from "lodash/debounce";

export const ForceViewModeContext = React.createContext<boolean>(false);

export function isUserViewMode(params?: AppPathParams) {
  if (!params) {
    return false;
  }
  const { viewMode } = params;
  return viewMode === "preview" || viewMode === "view" || viewMode === "view_marketplace";
}

/**
 * whether it's user view mode (not editing)
 */
export function useUserViewMode() {
  const params = useParams<AppPathParams>();
  return isUserViewMode(params);
}

export function useAppPathParam() {
  return useParams<AppPathParams>();
}

export function useMaxWidth() {
  const search = useLocation().search;
  const searchParams = new URLSearchParams(search);
  return Number(searchParams.get("mjMaxWidth")) || undefined;
}

export function useTemplateViewMode() {
  const search = useLocation().search;
  if (!useUserViewMode) {
    return false;
  }
  const searchParams = new URLSearchParams(search);
  return !!searchParams.get("template");
}

export function useApplicationId() {
  return useParams<AppPathParams>().applicationId;
}

export function useRedirectUrl() {
  const authSearchParams = loadAuthSearchParams()
  const redirectUrl = authSearchParams && authSearchParams.redirectUrl
  return redirectUrl && decodeURIComponent(redirectUrl);
}

export function useFixedDelay(callback: () => Promise<unknown>, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = () => callback();
  }, [callback]);

  useEffect(() => {
    if (!delay || delay < 100 || Number.isNaN(delay)) {
      return;
    }

    let stop = false; // make sure effect destroyed before the next timer period
    let timer: number | undefined = undefined;

    const reload = () =>
      (timer = window.setTimeout(() => callback().finally(() => !stop && reload()), delay));

    reload();

    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [delay]);
}

/**
 * delay update state according to delay condition
 *
 * @param initialState the initial state
 * @param delay if set as not-true, hold the new state as an internal state; if set as true, make the internal state as the new external state
 * @returns [delayState, setState]
 *  delayState: the external state
 *  setState: the same setState as `useState`
 */
export function useDelayState<S>(
  initialState: S | (() => S),
  delay?: boolean
): [S, Dispatch<SetStateAction<S>>] {
  const [state, setState] = useState(initialState);
  const [delayState, setDelayState] = useState(state);
  useEffect(() => {
    if (state !== delayState && !delay) {
      setDelayState(state);
    }
  }, [delay, delayState, state]);
  return [delayState, setState];
}

export function useShallowEqualSelector<TState = {}, TSelected = unknown>(
  selector: (state: TState) => TSelected
) {
  return useSelector(selector, shallowEqual);
}

export type PageType = "application" | "module" | "datasource" | "queryLibrary";

export function useCurrentPage(): PageType {
  const pathname = useLocation().pathname;
  if (pathname.startsWith("MODULE_APPLICATIONS_URL")) {
    return "module";
  } else if (pathname.startsWith(DATASOURCE_URL)) {
    return "datasource";
  } else if (pathname.startsWith(QUERY_LIBRARY_URL)) {
    return "queryLibrary";
  } else {
    return "application";
  }
}

export function useIsMobile() {
  const editorState = useContext(EditorContext);
  return checkIsMobile(editorState?.getAppSettings().maxWidth);
}

function getMetaData(
  datasourceStructure: Record<string, DatasourceStructure[]>,
  selectedDatasourceId: string
): Record<string, string> {
  let ret: Record<string, string> = {};
  datasourceStructure[selectedDatasourceId]?.forEach((table) => {
    ret[table.name] = "table";
    table.columns?.forEach((c) => {
      ret[c.name] = c.type;
    });
  });
  return ret;
}

export function useMetaData(datasourceId: string) {
  const datasourceStructure = useSelector(getDataSourceStructures);
  return useMemo(
    () => getMetaData(datasourceStructure, datasourceId),
    [datasourceStructure, datasourceId]
  );
}

export function useMergeCompStyles(
  props: Record<string, any>,
  dispatch: (action: CompAction) => void
) {
  const editorState = useContext(EditorContext);
  const theme = useContext(ThemeContext);
  const compType = useContext(CompTypeContext);
  const compTheme = theme?.theme?.components?.[compType];
  const themeId = theme?.themeId;
  const appSettingsComp = editorState?.getAppSettingsComp();
  const preventAppStylesOverwriting = appSettingsComp?.getView()?.preventAppStylesOverwriting;
  const { preventStyleOverwriting, appliedThemeId } = props;

  const styleKeys = Object.keys(props).filter(key => key.toLowerCase().endsWith('style') || key.toLowerCase().endsWith('styles'));
  const styleProps: Record<string, any> = {};
  styleKeys.forEach((key: string) => {
    styleProps[key] = (props as any)[key];
  });

  const mergeStyles = useCallback(
    ({
      dispatch,
      compTheme,
      styleProps,
      themeId
    }: any) => {
      setInitialCompStyles({
        dispatch,
        compTheme,
        styleProps,
        themeId,
      })
    },
    []
  );

  useEffect(() => {
    if (
      preventAppStylesOverwriting
      || preventStyleOverwriting
      || themeId === appliedThemeId
    ) return;
    mergeStyles({
      dispatch,
      compTheme,
      styleProps,
      themeId,
    })
  }, [
    themeId,
    JSON.stringify(styleProps),
    JSON.stringify(compTheme),
    mergeStyles,
    preventAppStylesOverwriting,
    preventStyleOverwriting,
  ]);
}

type ColorKey = 'primary' | 'textDark' | 'textLight' | 'canvas' | 'primarySurface' | 'border';
type ColorKeys = ColorKey[];

export function useThemeColors(allowGradient?: boolean) {
  const currentTheme = useContext(ThemeContext)?.theme ?? {} as ThemeDetail;
  const colorKeys: ColorKeys = ['primary', 'textDark', 'textLight', 'canvas', 'primarySurface', 'border'];

  return useMemo(() => {
    let colors: string[] = [];

    colorKeys.forEach(colorKey => {
      if (Boolean(defaultTheme[colorKey])) {
        colors.push(defaultTheme[colorKey] ?? '');
      }
      if (Boolean(currentTheme[colorKey])) {
        colors.push(currentTheme[colorKey] ?? '');
      }
    })
    if (!allowGradient) {
      colors = colors.concat(constantColors);
    }
    return uniq(colors);
  }, [
    currentTheme,
    defaultTheme,
  ]);
}

export const useOrgUserCount = (orgId: string) => {
  const dispatch = useDispatch();
  const orgUserStats = useSelector((state: AppState) => getOrgUserStats(state)); // Use selector to get orgUsers from state
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    // Dispatch action to fetch organization users
    if (orgId) {
      dispatch(fetchGroupsAction(orgId));
    }
  }, [dispatch, orgId]);

  useEffect(() => {
    // Update user count when orgUsers state changes
    if (Object.values(orgUserStats).length && orgUserStats.hasOwnProperty('totalAdminsAndDevelopers')) {
      setUserCount(orgUserStats.totalAdminsAndDevelopers);
    }
  }, [orgUserStats]);

  return userCount;
};

/**
 * Returns a debounced version of the incoming value that only updates
 */
export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  const updater = useMemo(() => debounce(setDebouncedValue, delay), [delay]);

  useEffect(() => {
    updater(value);
    return () => {
      updater.cancel();
    };
  }, [value, updater]);

  return debouncedValue;
}
