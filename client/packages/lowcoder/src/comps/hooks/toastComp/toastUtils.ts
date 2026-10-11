import { notificationInstance } from "lowcoder-design";
import type { ArgsProps, NotificationPlacement } from "antd/es/notification/interface";
import { EvalParamType } from "comps/controls/actionSelector/executeCompTypes";
import { JSONObject } from "util/jsonTypes";
import React from "react";
import { ToastType } from "./toastConstants";

export interface ToastConfig {
  title: string;
  description: string;
  type: ToastType;
  duration: number;
  placement: NotificationPlacement;
  dismissible: boolean;
  showProgress: boolean;
  pauseOnHover: boolean;
  key?: string;
  style?: React.CSSProperties;
  instanceId: string;
}

/**
 * Show notification with event callbacks.
 */
export const showNotificationWithEvents = (
  config: ToastConfig,
  onEvent: (eventName: "click" | "close") => Promise<unknown[]>,
  setVisible: (visible: boolean) => void
): string => {
  const notificationKey = config.key || `toast-${Date.now()}`;

  const notificationArgs: ArgsProps = {
    message: config.title,
    description: config.description || undefined,
    duration: config.duration === 0 ? null : config.duration,
    key: notificationKey,
    placement: config.placement,
    closeIcon: config.dismissible ? undefined : false,
    showProgress: config.showProgress,
    pauseOnHover: config.pauseOnHover,
    className: `lowcoder-toast-${config.instanceId}`,
    style: config.style,
    onClick: () => {
      onEvent("click");
    },
    onClose: () => {
      setVisible(false);
      onEvent("close");
    },
  };

  // Show notification based on type
  if (config.title || config.description) {
    setVisible(true);
    notificationInstance[config.type](notificationArgs);
  }
  
  return notificationKey;
};

/**
 * Show notification programmatically (for method API like toast1.info(), toast1.success(), etc.)
 */
export const showNotificationProgrammatic = (
  params: EvalParamType[],
  level: ToastType,
  comp: any
): string => {
  const text = params?.[0] as string;
  const options = (params?.[1] as JSONObject) || {};
  
  const {
    description,
    duration,
    key,
    placement,
    dismissible,
    showProgress,
    pauseOnHover,
    style,
  } = options;

  // Use component config as defaults, override with params
  const config: ToastConfig = {
    title: text || comp.children.title.getView(),
    description: (description as string) ?? comp.children.description.getView(),
    type: level,
    duration: typeof duration === "number" ? duration : comp.children.duration.getView(),
    placement: (placement as NotificationPlacement) ?? comp.children.placement.getView(),
    dismissible: typeof dismissible === "boolean" ? dismissible : comp.children.dismissible.getView(),
    showProgress: typeof showProgress === "boolean" ? showProgress : comp.children.showProgress.getView(),
    pauseOnHover: typeof pauseOnHover === "boolean" ? pauseOnHover : comp.children.pauseOnHover.getView(),
    key: key as string | undefined,
    style: style as React.CSSProperties | undefined,
    instanceId: comp.children.instanceId.getView() as string,
  };

  const onEvent = comp.children.onEvent.getView();
  const setVisible = (visible: boolean) => {
    comp.children.visible.dispatchChangeValueAction(visible);
  };

  return showNotificationWithEvents(config, onEvent, setVisible);
};
