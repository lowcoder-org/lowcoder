import { AppSummaryInfo, updateApplication } from "redux/reduxActions/applicationActions";
import { useDispatch, useSelector } from "react-redux";
import { getExternalEditorState } from "redux/selectors/configSelectors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalEditorContext,
  ExternalEditorContextState,
} from "util/context/ExternalEditorContext";
import { setEditorExternalStateAction } from "redux/reduxActions/configActions";
import { AppTypeEnum } from "constants/applicationConstants";
import EditorSkeletonView from "pages/editor/editorSkeletonView";
import { useThrottle, useUnmount } from "react-use";
import { Comp } from "lowcoder-core";
import { localEnv } from "util/envUtils";
import { saveMainComp } from "util/localStorageUtil";
import { RootComp } from "comps/comps/rootComp";
import { useAppHistory } from "util/editoryHistory";
import { useCompInstance } from "comps/utils/useCompInstance";
import { MarkAppInitialized, perfMark } from "util/perfUtils";
import { default as ConfigProvider } from "antd/es/config-provider";
import { default as message } from "antd/es/message";
import { getAntdLocale } from "i18n/antdLocale";
import { useUserViewMode } from "../../util/hooks";
import { QueryApi } from "api/queryApi";
import { RootCompInstanceType } from "./useRootCompInstance";
import { getCurrentUser } from "redux/selectors/usersSelectors";
import React from "react";
import { isEqual } from "lodash";
import { isPublicApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";

/**
 * FIXME: optimize the logic of saving comps
 * compose debounce + throttle
 * make sure savingComps succeed before executing
 */
function useSaveComp(
  applicationId: string,
  readOnly: boolean,
  rootCompInstance: RootCompInstanceType | undefined,
  blockEditing?: boolean,
) {
  const originalComp = rootCompInstance?.comp;
  // throttle comp change
  const comp = useThrottle(originalComp, 1000);
  const dispatch = useDispatch();
  const [prevComp, setPrevComp] = useState<Comp>();
  const [prevJsonStr, setPrevJsonStr] = useState<string>();
  const [prevAppId, setPrevAppId] = useState<string>();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (readOnly || blockEditing || !mountedRef.current) {
      return;
    }
    if (!comp || comp === prevComp) {
      return;
    }

    const curJson = comp.toJsonValue();
    const curJsonStr = JSON.stringify(curJson);

    if (!Boolean(prevAppId) && Boolean(applicationId)) {
      return setPrevAppId(applicationId);
    }
    if (prevAppId !== applicationId) {
      return setPrevAppId(applicationId);
    }
    if (!Boolean(prevJsonStr) && Boolean(curJsonStr)) {
      setPrevComp(comp)
      return setPrevJsonStr(curJsonStr);
    }
    if (prevJsonStr === curJsonStr) {
      return;
    }

    // the first time is a normal change, the latter is the manual update
    if (prevComp && mountedRef.current) {
      dispatch(
        updateApplication({
          applicationId: applicationId,
          editingApplicationDSL: curJson as object,
        })
      );
      // save to local
      localEnv() && saveMainComp(curJson);
    }
    setPrevComp(comp);
    setPrevJsonStr(curJsonStr);
    setPrevAppId(applicationId);
  }, [comp, applicationId, readOnly, dispatch, blockEditing, prevComp, prevJsonStr, prevAppId]);

  useUnmount(() => {
    setPrevComp(undefined);
    setPrevJsonStr(undefined);
    setPrevAppId(undefined);
  });
}

const exportAppToJson = (appDSL?: any) => {
  if (!appDSL) return;

  const id = `t--export-app-link`;
  const existingLink = document.getElementById(id);
  existingLink?.remove();
  
  const link = document.createElement("a");
  const time = new Date().getTime();
  const applicationName = `test_app_${time}`;
  const exportObj = {
    applicationInfo: {
      name: 'Test App',
      createAt: time,
      createBy: '',
      applicationId: '',
      applicationType: AppTypeEnum.Application,
    },
    applicationDSL: appDSL,
  };
  
  const blob = new Blob([JSON.stringify(exportObj)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  
  try {
    link.href = url;
    link.download = applicationName + ".json";
    link.id = id;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}

interface AppEditorInternalViewProps {
  readOnly: boolean;
  blockEditing?: boolean;
  appInfo: AppSummaryInfo;
  loading: boolean;
  compInstance: RootCompInstanceType;
  fetchApplication?: () => void;
}

export const AppEditorInternalView = React.memo((props: AppEditorInternalViewProps) => {
  const isUserViewMode = useUserViewMode();
  const extraExternalEditorState = useSelector(getExternalEditorState);
  const isPublicApp = useSelector(isPublicApplication);
  const dispatch = useDispatch();
  const { readOnly, blockEditing, appInfo, compInstance, fetchApplication } = props;
  const mountedRef = useRef(true);

  const [externalEditorState, setExternalEditorState] = useState<ExternalEditorContextState>({
    changeExternalState: (state: Partial<ExternalEditorContextState>) => {
      if (mountedRef.current) {
        dispatch(setEditorExternalStateAction(state));
      }
    },
    applicationId: appInfo.id,
    appType: AppTypeEnum.Application,
  });
  
  const exportPublicAppToJson = useCallback(() => {
    const appDsl = compInstance?.comp?.toJsonValue();
    exportAppToJson(appDsl);
  }, [compInstance?.comp]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    
    setExternalEditorState((s) => ({
      ...s,
      history: compInstance?.history,
      readOnly,
      appType: appInfo.appType,
      applicationId: appInfo.id,
      hideHeader: window.location.pathname.split("/")[3] === "admin",
      blockEditing,
      fetchApplication: fetchApplication,
      exportPublicAppToJson: isPublicApp ? exportPublicAppToJson : undefined,
      ...extraExternalEditorState,
    }));
  }, [
    exportPublicAppToJson,
    compInstance?.history,
    extraExternalEditorState,
    readOnly,
    appInfo.appType, appInfo.id,
    blockEditing,
    fetchApplication,
    isPublicApp,
  ]);

  useEffect(() => {
    if (!mountedRef.current) return;
    
    message.config({
      top: isUserViewMode ? 0 : 48,
    });
    
    return () => {
      message.destroy();
    };
  }, [isUserViewMode]);

  useSaveComp(appInfo.id, readOnly, compInstance, blockEditing);

  const loading =
    !compInstance || !compInstance.comp || !compInstance.comp.preloaded || props.loading;

  const currentUser = useSelector(getCurrentUser);

  useUnmount(() => {
    setExternalEditorState({
      changeExternalState: () => {},
      applicationId: "",
      appType: AppTypeEnum.Application,
    });
  });

  return loading ? (
    window.location.pathname.split("/")[3] === "admin" ? <div></div> : 
    <EditorSkeletonView />
  ) : (
    <ConfigProvider
      locale={getAntdLocale(currentUser.uiLanguage)}
      theme={{
        token: {
          fontFamily: `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Segoe UI", "PingFang SC",
            "Microsoft Yahei", "Hiragino Sans GB", sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", "Noto Color Emoji"`,
        },
      }}
    >
      <ExternalEditorContext.Provider value={externalEditorState}>
        {compInstance?.comp?.getView()}
      </ExternalEditorContext.Provider>
    </ConfigProvider>
  );
}, (prevProps, nextProps) => {
  return isEqual(prevProps, nextProps);
});
