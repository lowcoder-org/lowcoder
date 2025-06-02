import { AppPathParams, AppTypeEnum } from "constants/applicationConstants";
import { ApplicationDSLType } from "constants/applicationConstants";
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
import React from "react";
import dayjs from "dayjs";
import { currentApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";
import { notificationInstance } from "components/GlobalInstances";
import { AppState } from "@lowcoder-ee/redux/reducers";
import { resetIconDictionary } from "@lowcoder-ee/constants/iconConstants";
import {fetchJsDSPaginationByApp} from "@lowcoder-ee/util/pagination/axios";
import PaginationComp from "@lowcoder-ee/util/pagination/Pagination";

const AppSnapshot = lazy(() => {
  return import("pages/editor/appSnapshot")
    .then(moduleExports => ({default: moduleExports.AppSnapshot}));
});

const AppEditorInternalView = lazy(
  () => import("pages/editor/appEditorInternal")
    .then(moduleExports => ({default: moduleExports.AppEditorInternalView}))
);

const ErrorFallback = lazy(() => import("components/ErrorFallback"));

const AppEditor = React.memo(() => {
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
  const [elements, setElements] = useState({ elements: [], total: 1 });
  const isLowcoderCompLoading = useSelector((state: AppState) => state.npmPlugin.loading.lowcoderComps);

  // Memoize selectors to prevent unnecessary re-renders
  const selectors = useMemo(() => ({
    isUserViewMode: params.viewMode ? isUserViewModeCheck : true,
    applicationId: params.applicationId || window.location.pathname.split("/")[2],
    paramViewMode: params.viewMode || window.location.pathname.split("/")[3],
    viewMode: (params.viewMode === "view" || params.viewMode === "admin")
      ? "published"
      : params.viewMode === "view_marketplace" ? "view_marketplace" : "editing",
  }), [params.viewMode, params.applicationId, window.location.pathname, isUserViewModeCheck]);

  const firstRendered = useRef(false);
  const orgId = useMemo(() => currentUser.currentOrgId, [currentUser.currentOrgId]);
  const [isDataSourcePluginRegistered, setIsDataSourcePluginRegistered] = useState(false);
  const [appError, setAppError] = useState('');
  const [blockEditing, setBlockEditing] = useState<boolean>(false);
  const [fetchingAppDetails, setFetchingAppDetails] = useState<boolean>(false);

  // Cleanup function for state management
  const cleanupState = useCallback(() => {
    setElements({ elements: [], total: 1 });
    setBlockEditing(false);
    setFetchingAppDetails(false);
    setAppError('');
    setIsDataSourcePluginRegistered(false);
  }, []);

  // Set global settings with cleanup
  useEffect(() => {
    setGlobalSettings({ applicationId: selectors.applicationId, isViewMode: selectors.paramViewMode === "view" });
    return () => {
      clearGlobalSettings();
    };
  }, [selectors.applicationId, selectors.paramViewMode]);

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
    cleanupState();
  });

  // fetch dsl with cleanup
  const [appInfo, setAppInfo] = useState<AppSummaryInfo>({
    id: "",
    appType: AppTypeEnum.Application,
  });

  const readOnly = selectors.isUserViewMode;
  const compInstance = useRootCompInstance(
    appInfo,
    readOnly,
    isDataSourcePluginRegistered,
    blockEditing,
  );

  // Cleanup for compInstance
  useEffect(() => {
    return () => {
      if (compInstance?.comp) {
        compInstance.comp = null;
      }
    };
  }, [compInstance]);

  useEffect(() => {
    if (currentUser && application) {
      const lastEditedAt = dayjs(application?.lastEditedAt);
      const lastEditedDiff = dayjs().diff(lastEditedAt, 'minutes');
      const shouldBlockEditing = Boolean(application?.editingUserId) && currentUser.id !== application?.editingUserId && lastEditedDiff < 3;
      setBlockEditing(shouldBlockEditing);
    }
  }, [application, currentUser]);

  // fetch dataSource and plugin with cleanup
  useEffect(() => {
    if (!orgId || selectors.paramViewMode !== "edit") {
      return;
    }
    dispatch(fetchDataSourceTypes({ organizationId: orgId }));
    dispatch(fetchFolderElements({}));
  }, [dispatch, orgId, selectors.paramViewMode]);

  useEffect(() => {
    if (selectors.applicationId && selectors.paramViewMode === "edit") {
      dispatch(fetchDataSourceByApp({ applicationId: selectors.applicationId }));
      dispatch(fetchQueryLibraryDropdown());
    }
  }, [dispatch, selectors.applicationId, selectors.paramViewMode]);
  
  const fetchJSDataSourceByApp = useCallback(() => {
    fetchJsDSPaginationByApp({
      appId: selectors.applicationId,
      pageNum: currentPage,
      pageSize: pageSize
    }).then((res) => {
      setElements({elements: [], total: res.total || 1});
      res.data!.forEach((i: any) => {
        registryDataSourcePlugin(i.type, i.id, i.pluginDefinition);
      });
      setIsDataSourcePluginRegistered(true);
    }).catch((error) => {
      setAppError(error.message || 'Failed to fetch JS data source');
    });
  }, [
    selectors.applicationId,
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
        type: selectors.viewMode as ApplicationDSLType,
        applicationId: selectors.applicationId,
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
          setAppError(errorMessage || 'Failed to fetch application info');
          setFetchingAppDetails(false);
        }
      })
    );
  }, [dispatch, selectors.viewMode, selectors.applicationId, fetchJSDataSourceByApp]);

  useEffect(() => {
    if(!isLowcoderCompLoading) {
      fetchApplication();
      resetIconDictionary();
    }
  }, [isLowcoderCompLoading, fetchApplication]);

  if (Boolean(appError)) {
    return <ErrorFallback errorMessage={appError} />
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {showAppSnapshot ? (
        <Suspense fallback={<EditorSkeletonView />}>
          <AppSnapshot
            currentAppInfo={{
              ...appInfo,
              dsl: compInstance?.comp?.toJsonValue() || {},
            }}
          />
        </Suspense>
      ) : (
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
      )}
    </ErrorBoundary>
  );
});

export default AppEditor;
