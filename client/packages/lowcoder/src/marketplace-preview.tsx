// Separate capture entry: no login bootstrap, analytics, application queries or user session.
import "core-js/actual";
import "regenerator-runtime/runtime";
import "virtual:globals";
import "./index.less";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { ConfigProvider } from "antd";
import { reduxStore } from "redux/store/store";
import { ReduxActionTypes } from "constants/reduxActionConstants";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { setGlobalSettings } from "comps/utils/globalSettings";
import ubuntuRegular from "assets/fonts/ubuntu-400.woff2";
import { loaders } from "comps/comps/remoteComp/loaders";
import { loadComps } from "comps";
import { RootComp } from "comps/comps/rootComp";
import { useCompInstance } from "comps/utils/useCompInstance";
import { ApplicationDetail } from "constants/applicationConstants";
import "comps/comps/layout/navLayout";
import "comps/comps/layout/mobileTabLayout";

function Capture({ view }: { view: ApplicationDetail }) {
  const app = view.applicationInfoView;
  const params = useMemo(
    () => ({
      Comp: RootComp,
      initialValue: view.applicationDSL,
      reduceContext: {
        applicationId: app.applicationId,
        parentApplicationPath: [],
        moduleDSL: view.moduleDSL,
        readOnly: true,
      },
      initHandler: async (comp: RootComp) => {
        comp.preloadId = `app-${app.applicationId}`;
        await comp.children.preload.children.css.run(comp.preloadId);
        await comp.children.preload.children.globalCSS.run(comp.preloadId);
        comp.preloaded = true;
        return comp;
      },
      isReady: true,
    }),
    [view, app.applicationId],
  );
  const [comp] = useCompInstance(params);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Wait for the lazy canvas component, rather than capturing its loading skeleton.
    const observer = new MutationObserver(() => {
      if (document.querySelector("#marketplace-canvas .react-grid-layout")) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(document.getElementById("marketplace-canvas")!, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);
  return (
    <Provider store={reduxStore}>
      <MemoryRouter initialEntries={[`/apps/${app.applicationId}/view`]}>
        <Route path="/apps/:applicationId/:viewMode">
          <ConfigProvider>
            <ExternalEditorContext.Provider
              value={{
                applicationId: app.applicationId,
                appType: app.applicationType,
                readOnly: true,
                hideHeader: true,
                rootContainerOverflow: "hidden",
              }}
            >
              <div
                id="marketplace-canvas"
                data-marketplace-capture-ready={ready}
                style={{ width: 1280, height: 800 }}
              >
                {comp?.getView()}
              </div>
            </ExternalEditorContext.Provider>
          </ConfigProvider>
        </Route>
      </MemoryRouter>
    </Provider>
  );
}

async function render() {
  loadComps();
  const loadNpm = loaders.npm;
  loaders.npm = (info) => {
    if (info.packageName !== "lowcoder-comps")
      return Promise.reject(
        new Error("External components are unavailable in layout previews"),
      );
    return loadNpm({ ...info, appId: "none" });
  };
  const fonts = document.createElement("style");
  fonts.textContent = `@font-face{font-family:Ubuntu;src:url('${ubuntuRegular}')}body{font-family:Ubuntu,Arial,sans-serif;}`;
  document.head.appendChild(fonts);
  // Fulfilled only inside the capture worker. This is not a public data endpoint.
  const response = await fetch("/__marketplace_capture_payload__", {
    credentials: "omit",
  });
  if (!response.ok) throw new Error("Capture payload unavailable");
  const view: ApplicationDetail = await response.json();
  setGlobalSettings({
    applicationId: view.applicationInfoView.applicationId,
    isViewMode: true,
    orgCommonSettings: view.orgCommonSettings,
  });
  reduxStore.dispatch({
    type: ReduxActionTypes.FETCH_APP_PUBLISH_DETAIL_SUCCESS,
    payload: view,
  });
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary fallback={<div data-marketplace-capture-error="true" />}>
      <Capture view={view} />
    </ErrorBoundary>,
  );
}
render().catch(() => {
  document
    .getElementById("root")!
    .setAttribute("data-marketplace-capture-error", "true");
});
