import { simpleMultiComp, withPropertyViewFn, withViewFn } from "comps/generators";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import { withExposingConfigs } from "comps/generators/withExposing";
import { notificationInstance } from "lowcoder-design";
import { trans } from "i18n";
import type { NotificationPlacement } from "antd/es/notification/interface";
import React from "react";

import { childrenMap, showParams, closeParams, ToastType } from "./toastConstants";
import { showNotificationWithEvents, showNotificationProgrammatic, ToastConfig } from "./toastUtils";
import { ToastPropertyView } from "./ToastPropertyView";
import { ToastRuntimeView } from "./ToastRuntimeView";

// Build the component
let ToastCompBase = simpleMultiComp(childrenMap);

ToastCompBase = withViewFn(ToastCompBase, (comp) => <ToastRuntimeView comp={comp} />);

ToastCompBase = withPropertyViewFn(ToastCompBase, (comp) => (
  <ToastPropertyView comp={comp} />
));


let ToastCompWithExposing = withExposingConfigs(ToastCompBase, []);

// Add method exposing
export let ToastComp = withMethodExposing(ToastCompWithExposing, [
  {
    method: {
      name: "show",
      description: trans("toastComp.showMethod"),
      params: [],
    },
    execute: (comp) => {
      const config: ToastConfig = {
        title: comp.children.title.getView(),
        description: comp.children.description.getView(),
        type: comp.children.type.getView() as ToastType,
        duration: comp.children.duration.getView(),
        placement: comp.children.placement.getView() as NotificationPlacement,
        dismissible: comp.children.dismissible.getView(),
        showProgress: comp.children.showProgress.getView(),
        pauseOnHover: comp.children.pauseOnHover.getView(),
        instanceId: comp.children.instanceId.getView() as string,
      };
      
      const onEvent = comp.children.onEvent.getView();
      const setVisible = (visible: boolean) => {
        comp.children.visible.dispatchChangeValueAction(visible);
      };
      
      showNotificationWithEvents(config, onEvent, setVisible);
    },
  },
  {
    method: {
      name: "info",
      description: trans("toastComp.info"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "info", comp),
  },
  {
    method: {
      name: "success",
      description: trans("toastComp.success"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "success", comp),
  },
  {
    method: {
      name: "warn",
      description: trans("toastComp.warn"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "warning", comp),
  },
  {
    method: {
      name: "error",
      description: trans("toastComp.error"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "error", comp),
  },
  {
    method: {
      name: "close",
      description: trans("toastComp.closeMethod"),
      params: closeParams,
    },
    execute: (comp, params) => {
      const key = params?.[0] as string;
      if (key) {
        notificationInstance.destroy(key);
      }
      comp.children.visible.dispatchChangeValueAction(false);
      comp.children.onEvent.getView()("close");
    },
  },
  // Legacy method for backwards compatibility
  {
    method: {
      name: "destroy",
      description: trans("toastComp.destroy"),
      params: closeParams,
    },
    execute: (comp, params) => {
      const key = params?.[0] as string;
      notificationInstance.destroy(key);
    },
  },
  {
    method: {
      name: "open",
      description: trans("toastComp.openMethod"),
      params: showParams,
    },
    execute: (comp, params) => showNotificationProgrammatic(params, "info", comp),
  },
]);
