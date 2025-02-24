import { AppPathParams, AppTypeEnum } from "constants/applicationConstants";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppSummaryInfo, fetchApplicationInfo } from "redux/reduxActions/applicationActions";
import { fetchDataSourceTypes } from "redux/reduxActions/datasourceActions";
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
import { clearGlobalSettings, setGlobalSettings } from "comps/utils/globalSettings";
import { fetchFolderElements } from "redux/reduxActions/folderActions";
import { registryDataSourcePlugin } from "constants/queryConstants";
import { useRootCompInstance } from "./useRootCompInstance";
import EditorSkeletonView from "./editorSkeletonView";
import {ErrorBoundary} from 'react-error-boundary';
import { ALL_APPLICATIONS_URL } from "@lowcoder-ee/constants/routesURL";
import history from "util/history";
import Flex from "antd/es/flex";
import React from "react";
import { currentApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";
import { AppState } from "@lowcoder-ee/redux/reducers";
import { resetIconDictionary } from "@lowcoder-ee/constants/iconConstants";
import {fetchJsDSPaginationByApp} from "@lowcoder-ee/util/pagination/axios";
import { PUBLIC_APP_ID, PUBLIC_APP_ORG_ID } from "@lowcoder-ee/constants/publicApp";

const AppEditorInternalView = lazy(
  () => import("pages/editor/appEditorInternal")
    .then(moduleExports => ({default: moduleExports.AppEditorInternalView}))
);

const AppEditorPublic = React.memo(() => {
  const dispatch = useDispatch();
  const params = useParams<AppPathParams>();
  const isUserViewModeCheck = useUserViewMode();
  const showAppSnapshot = useSelector(showAppSnapshotSelector);
  const currentUser = useSelector(getUser);
  const fetchOrgGroupsFinished = useSelector(getFetchOrgGroupsFinished);
  const isCommonSettingsFetching = useSelector(getIsCommonSettingFetching);
  const application = useSelector(currentApplication);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [elements, setElements] = useState({ elements: [], total: 1 })
  const isLowcoderCompLoading = useSelector((state: AppState) => state.npmPlugin.loading.lowcoderComps);

  const isUserViewMode = useMemo(
    () => params.viewMode ? isUserViewModeCheck : true,
    [params.viewMode, isUserViewModeCheck]
  );
  const applicationId = useMemo(
    () => {
      const appId = params.applicationId || window.location.pathname.split("/")[2];
      return appId === 'public' ? PUBLIC_APP_ID : appId;
    }, [params.applicationId, window.location.pathname]
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
  const orgId = PUBLIC_APP_ORG_ID;
  const [isDataSourcePluginRegistered, setIsDataSourcePluginRegistered] = useState(false);
  const [appError, setAppError] = useState('');
  const [blockEditing, setBlockEditing] = useState<boolean>(true);
  const [fetchingAppDetails, setFetchingAppDetails] = useState<boolean>(false);

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
  
  const readOnly = applicationId === PUBLIC_APP_ID ? false : isUserViewMode;

  const compInstance = useRootCompInstance(
    appInfo,
    readOnly,
    isDataSourcePluginRegistered,
    blockEditing,
  );

  // fetch dataSource and plugin
  useEffect(() => {
    dispatch(fetchDataSourceTypes({ organizationId: orgId }));
  }, [dispatch]);

  
  const fetchJSDataSourceByApp = useCallback(() => {
    fetchJsDSPaginationByApp({
      appId: applicationId,
      pageNum: currentPage,
      pageSize: pageSize
    }).then((res) => {
      setElements({elements: [], total: res.total || 1})
      res.data!.forEach((i: any) => {
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
    currentPage,
    pageSize
  ]);

  useEffect(() => {
    if (!fetchOrgGroupsFinished) {
      dispatch(fetchGroupsAction(orgId));
    }
  }, [dispatch, fetchOrgGroupsFinished, orgId]);

  const fetchApplication = useCallback(() => {
    setFetchingAppDetails(true);
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
          setFetchingAppDetails(false);
        },
        onError: (errorMessage) => {
          setAppError(errorMessage);
          setFetchingAppDetails(false);
        }
      })
    );
  }, [viewMode, applicationId, dispatch, fetchJSDataSourceByApp]);

  useEffect(() => {
    if(!isLowcoderCompLoading) {
      fetchApplication();
      resetIconDictionary();
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
      <Suspense fallback={<EditorSkeletonView />}>
        {fetchingAppDetails
          ? <EditorSkeletonView />
          : (
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
          )
        }
      </Suspense>
    </ErrorBoundary>
  );
});

export default AppEditorPublic;
