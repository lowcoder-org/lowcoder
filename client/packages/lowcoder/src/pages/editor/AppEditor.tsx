import { AppPathParams, AppTypeEnum } from "constants/applicationConstants";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import EditorSkeletonView from "./editorSkeletonView";
import {ErrorBoundary, FallbackProps} from 'react-error-boundary';
import { ALL_APPLICATIONS_URL } from "@lowcoder-ee/constants/routesURL";
import history from "util/history";
import Flex from "antd/es/flex";
import React from "react";
import dayjs from "dayjs";
import { currentApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";
import { notificationInstance } from "components/GlobalInstances";
import { AppState } from "@lowcoder-ee/redux/reducers";

const AppSnapshot = lazy(() => {
  return import("pages/editor/appSnapshot")
    .then(moduleExports => ({default: moduleExports.AppSnapshot}));
});

const AppEditorInternalView = lazy(
  () => import("pages/editor/appEditorInternal")
    .then(moduleExports => ({default: moduleExports.AppEditorInternalView}))
);

const AppEditor = React.memo(() => {
  const dispatch = useDispatch();
  const params = useParams<AppPathParams>();
  const isUserViewModeCheck = useUserViewMode();
  const showAppSnapshot = useSelector(showAppSnapshotSelector);
  const currentUser = useSelector(getUser);
  const fetchOrgGroupsFinished = useSelector(getFetchOrgGroupsFinished);
  const isCommonSettingsFetching = useSelector(getIsCommonSettingFetching);
  const application = useSelector(currentApplication);
  const isLowcoderCompLoading = useSelector((state: AppState) => state.npmPlugin.loading.lowcoderComps);

  const isUserViewMode = useMemo(
    () => params.viewMode ? isUserViewModeCheck : true,
    [params.viewMode, isUserViewModeCheck]
  );
  const applicationId = useMemo(
    () => params.applicationId || window.location.pathname.split("/")[2],
    [params.applicationId, window.location.pathname]
  );
  const paramViewMode = useMemo(
    () => params.viewMode || window.location.pathname.split("/")[3],
    [params.viewMode, window.location.pathname]
  );
  const viewMode = useMemo(
    () => (paramViewMode === "view" || paramViewMode === "admin")
      ? "published"
      : paramViewMode === "view_marketplace" ? "view_marketplace" : "editing",
    [paramViewMode]
  );

  const firstRendered = useRef(false);
  const orgId = useMemo(() => currentUser.currentOrgId, [currentUser.currentOrgId]);
  const [isDataSourcePluginRegistered, setIsDataSourcePluginRegistered] = useState(false);
  const [appError, setAppError] = useState('');
  const [blockEditing, setBlockEditing] = useState<boolean>(false);

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
  const compInstance = useRootCompInstance(
    appInfo,
    readOnly,
    isDataSourcePluginRegistered,
    blockEditing,
  );

  useEffect(() => {
    if (currentUser && application) {
      const lastEditedAt = dayjs(application?.lastEditedAt);
      const lastEditedDiff = dayjs().diff(lastEditedAt, 'minutes');
      const shouldBlockEditing = Boolean(application?.editingUserId) && currentUser.id !== application?.editingUserId && lastEditedDiff < 3;
      setBlockEditing(shouldBlockEditing);
    }
  }, [application, currentUser]);

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
  
  const fetchJSDataSourceByApp = useCallback(() => {
    DatasourceApi.fetchJsDatasourceByApp(applicationId).then((res) => {
      res.data.data.forEach((i) => {
        registryDataSourcePlugin(i.type, i.id, i.pluginDefinition);
      });
      setIsDataSourcePluginRegistered(true);
    });
    dispatch(setShowAppSnapshot(false));
  }, [
    applicationId,
    registryDataSourcePlugin,
    setIsDataSourcePluginRegistered,
    setShowAppSnapshot,
    dispatch,
  ]);

  useEffect(() => {
    if (!fetchOrgGroupsFinished) {
      dispatch(fetchGroupsAction(orgId));
    }
  }, [dispatch, fetchOrgGroupsFinished, orgId]);

  const fetchApplication = useCallback(() => {
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
        onError: (errorMessage) => {
          setAppError(errorMessage);
        }
      })
    );
  }, [viewMode, applicationId, dispatch, fetchJSDataSourceByApp]);

  useEffect(() => {
    if(!isLowcoderCompLoading) {
      fetchApplication();
    }
  }, [isLowcoderCompLoading, fetchApplication]);

  const fallbackUI = useMemo(() => (
    <Flex align="center" justify="center" vertical style={{
      height: '300px',
      width: '400px',
      margin: '0 auto',
    }}>
      <h4 style={{margin: 0}}>Something went wrong while displaying this webpage</h4>
      <button onClick={() => history.push(ALL_APPLICATIONS_URL)} style={{background: '#4965f2',border: '1px solid #4965f2', color: '#ffffff',borderRadius:'6px'}}>Go to Apps</button>
    </Flex>
  ), []);

  if (Boolean(appError)) {
    return (
      <Flex align="center" justify="center" vertical style={{
        height: '300px',
        width: '400px',
        margin: '0 auto',
      }}>
        <h4>{appError}</h4>
        <button onClick={() => history.push(ALL_APPLICATIONS_URL)} style={{background: '#4965f2',border: '1px solid #4965f2', color: '#ffffff',borderRadius:'6px'}}>Back to Home</button>
      </Flex>
    )
  }

  return (
    <ErrorBoundary fallback={fallbackUI}>
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
            blockEditing={blockEditing}
            loading={
              !fetchOrgGroupsFinished || !isDataSourcePluginRegistered || isCommonSettingsFetching
            }
            compInstance={compInstance}
            fetchApplication={fetchApplication}
          />
        </Suspense>
      )}
    </ErrorBoundary>
  );
});

export default AppEditor;
