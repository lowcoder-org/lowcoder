import { AppPathParams, AppTypeEnum } from "constants/applicationConstants";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppSummaryInfo, fetchApplicationInfo } from "redux/reduxActions/applicationActions";
import { fetchDataSourceByApp, fetchDataSourceTypes } from "redux/reduxActions/datasourceActions";
import { getUser } from "redux/selectors/usersSelectors";
import { useUserViewMode } from "util/hooks";
import "comps/uiCompRegistry";
import { showAppSnapshotSelector } from "redux/selectors/appSnapshotSelector";
import { setShowAppSnapshot } from "redux/reduxActions/appSnapshotActions";
import { fetchGroupsAction } from "redux/reduxActions/orgActions";
import { getFetchOrgGroupsFinished } from "redux/selectors/orgSelectors";
import { getIsCommonSettingFetching } from "redux/selectors/commonSettingSelectors";
import {
  MarkAppDSLLoaded,
  MarkAppEditorFirstRender,
  MarkAppEditorMounted,
  perfClear,
  perfMark,
} from "util/perfUtils";
import { useMount, useUnmount } from "react-use";
import { fetchQueryLibraryDropdown } from "../../redux/reduxActions/queryLibraryActions";
import { clearGlobalSettings, setGlobalSettings } from "comps/utils/globalSettings";
import { fetchFolderElements } from "redux/reduxActions/folderActions";
import { registryDataSourcePlugin } from "constants/queryConstants";
import { DatasourceApi } from "api/datasourceApi";
import { useRootCompInstance } from "./useRootCompInstance";
import ErrorBoundary from "antd/es/alert/ErrorBoundary";
import EditorSkeletonView from "./editorSkeletonView";

const AppSnapshot = lazy(() => {
  return import("pages/editor/appSnapshot")
    .then(moduleExports => ({default: moduleExports.AppSnapshot}));
});

const AppEditorInternalView = lazy(
  () => import("pages/editor/appEditorInternal")
    .then(moduleExports => ({default: moduleExports.AppEditorInternalView}))
);

export default function AppEditor() {
  const showAppSnapshot = useSelector(showAppSnapshotSelector);
  const params = useParams<AppPathParams>();
  const isUserViewModeCheck = useUserViewMode();
  const isUserViewMode = params.viewMode ? isUserViewModeCheck : true;
  const applicationId = params.applicationId || window.location.pathname.split("/")[2];
  const paramViewMode = params.viewMode || window.location.pathname.split("/")[3];
  const viewMode = (paramViewMode === "view" || paramViewMode === "admin") ? "published" : paramViewMode === "view_marketplace" ? "view_marketplace" : "editing";
  const currentUser = useSelector(getUser);
  const dispatch = useDispatch();
  const fetchOrgGroupsFinished = useSelector(getFetchOrgGroupsFinished);
  const isCommonSettingsFetching = useSelector(getIsCommonSettingFetching);
  const orgId = currentUser.currentOrgId;
  const firstRendered = useRef(false);
  const [isDataSourcePluginRegistered, setIsDataSourcePluginRegistered] = useState(false);

  setGlobalSettings({ applicationId, isViewMode: paramViewMode === "view" });

  if (!firstRendered.current) {
    perfClear();
    perfMark(MarkAppEditorFirstRender);
    firstRendered.current = true;
  }

  useMount(() => {
    perfMark(MarkAppEditorMounted);
  });

  useUnmount(() => {
    clearGlobalSettings();
  });

  // fetch dsl
  const [appInfo, setAppInfo] = useState<AppSummaryInfo>({
    id: "",
    appType: AppTypeEnum.Application,
  });

  const readOnly = isUserViewMode;
  const compInstance = useRootCompInstance(appInfo, readOnly, isDataSourcePluginRegistered);

  // fetch dataSource and plugin
  useEffect(() => {
    if (!orgId || paramViewMode !== "edit") {
      return;
    }
    dispatch(fetchDataSourceTypes({ organizationId: orgId }));
    dispatch(fetchFolderElements({}));
  }, [dispatch, orgId, paramViewMode]);

  useEffect(() => {
    if (applicationId && paramViewMode === "edit") {
      dispatch(fetchDataSourceByApp({ applicationId: applicationId }));
      dispatch(fetchQueryLibraryDropdown());
    }
  }, [dispatch, applicationId, paramViewMode]);
  
  const fetchJSDataSourceByApp = () => {
    DatasourceApi.fetchJsDatasourceByApp(applicationId).then((res) => {
      res.data.data.forEach((i) => {
        registryDataSourcePlugin(i.type, i.id, i.pluginDefinition);
      });
      setIsDataSourcePluginRegistered(true);
    });
    dispatch(setShowAppSnapshot(false));
  };

  useEffect(() => {
    if (!fetchOrgGroupsFinished) {
      dispatch(fetchGroupsAction(orgId));
    }
  }, [dispatch, fetchOrgGroupsFinished, orgId]);

  useEffect(() => {
    dispatch(
      fetchApplicationInfo({
        type: viewMode,
        applicationId: applicationId,
        onSuccess: (info) => {
          perfMark(MarkAppDSLLoaded);
          const runJsInHost =
            info.orgCommonSettings?.runJavaScriptInHost ?? !!REACT_APP_DISABLE_JS_SANDBOX;
          setGlobalSettings({
            orgCommonSettings: {
              ...info.orgCommonSettings,
              runJavaScriptInHost: runJsInHost,
            },
          });
          setAppInfo(info);
          fetchJSDataSourceByApp();
        },
      })
    );
  }, [viewMode, applicationId, dispatch]);

  return (
    <ErrorBoundary>
      {showAppSnapshot ? (
        <Suspense fallback={<EditorSkeletonView />}>
          <AppSnapshot
            currentAppInfo={{
              ...appInfo,
              dsl: compInstance.comp?.toJsonValue() || {},
            }}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<EditorSkeletonView />}>
          <AppEditorInternalView
            appInfo={appInfo}
            readOnly={readOnly}
            loading={
              !fetchOrgGroupsFinished || !isDataSourcePluginRegistered || isCommonSettingsFetching
            }
            compInstance={compInstance}
          />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
