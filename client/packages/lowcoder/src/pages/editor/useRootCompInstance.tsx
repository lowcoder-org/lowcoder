import { AppSummaryInfo } from "redux/reduxActions/applicationActions";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useUnmount } from "react-use";
import { RootComp } from "comps/comps/rootComp";
import { useAppHistory } from "util/editoryHistory";
import { useCompInstance, GetContainerParams } from "comps/utils/useCompInstance";
import { MarkAppInitialized, perfMark } from "util/perfUtils";
import { QueryApi } from "api/queryApi";

export function useRootCompInstance(
  appInfo: AppSummaryInfo,
  readOnly: boolean,
  isReady: boolean,
  blockEditing?: boolean,
) {
  const appId = appInfo.id;
  const mountedRef = useRef(true);
  const containerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const params = useMemo<GetContainerParams<typeof RootComp>>(() => {
    if (!mountedRef.current) {
      return {
        Comp: RootComp,
        initialValue: undefined,
        isReady: false
      };
    }
    return {
      Comp: RootComp,
      initialValue: appInfo.dsl,
      reduceContext: {
        applicationId: appId,
        parentApplicationPath: [],
        moduleDSL: appInfo.moduleDsl || {},
        readOnly,
      },
      initHandler: async (comp: RootComp) => {
        if (!mountedRef.current) return comp;
        const root = await comp.preload(`app-${appId}`);
        if (mountedRef.current) {
          perfMark(MarkAppInitialized);
        }
        return root;
      },
      isReady,
    };
  }, [appId, appInfo.dsl, appInfo.moduleDsl, isReady, readOnly]);

  const [comp, container] = useCompInstance(params);
  containerRef.current = container;

  const history = useAppHistory(container, readOnly, appId, blockEditing);

  const cleanup = useCallback(() => {
    if (comp) {
      comp.clearPreload();
      // Clear any other resources
      if (comp.children) {
        Object.values(comp.children).forEach(child => {
          if (child && 'clearPreload' in child && typeof child.clearPreload === 'function') {
            child.clearPreload();
          }
        });
      }
    }
    if (containerRef.current) {
      containerRef.current = null;
    }
    QueryApi.cancelAllQuery();
  }, [comp]);

  useUnmount(() => {
    cleanup();
  });

  return useMemo(() => {
    if (!mountedRef.current) return null;
    return { comp, history, appId };
  }, [appId, comp, history]);
}

export type RootCompInstanceType = ReturnType<typeof useRootCompInstance>;
