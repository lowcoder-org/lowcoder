import { AppSummaryInfo } from "redux/reduxActions/applicationActions";
import { useMemo } from "react";
import { useUnmount } from "react-use";
import { RootComp } from "comps/comps/rootComp";
import { useAppHistory } from "util/editoryHistory";
import { useCompInstance } from "comps/utils/useCompInstance";
import { MarkAppInitialized, perfMark } from "util/perfUtils";
import { QueryApi } from "api/queryApi";

export function useRootCompInstance(appInfo: AppSummaryInfo, readOnly: boolean, isReady: boolean) {
  const appId = appInfo.id;
  const params = useMemo(() => {
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
        const root = await comp.preload(`app-${appId}`);
        perfMark(MarkAppInitialized);
        return root;
      },
      isReady,
    };
  }, [appId, appInfo.dsl, appInfo.moduleDsl, isReady, readOnly]);
  const [comp, container] = useCompInstance(params);
  const history = useAppHistory(container, readOnly, appId);

  useUnmount(() => {
    comp?.clearPreload();
    QueryApi.cancelAllQuery();
  });

  return useMemo(() => {
    return { comp, history, appId };
  }, [appId, comp, history]);
}

export type RootCompInstanceType = ReturnType<typeof useRootCompInstance>;
