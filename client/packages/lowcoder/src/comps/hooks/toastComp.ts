import { withMethodExposing } from "../generators/withMethodExposing";
import { simpleMultiComp } from "../generators";
import { withExposingConfigs } from "../generators/withExposing";
import { EvalParamType, ParamsConfig } from "../controls/actionSelector/executeCompTypes";
import { JSONObject } from "../../util/jsonTypes";
import { trans } from "i18n";
import { notificationInstance } from "lowcoder-design";
import type { ArgsProps, NotificationPlacement } from 'antd/es/notification/interface';

const params: ParamsConfig = [
  { name: "text", type: "string" },
  { name: "options", type: "JSON" },
];

const showNotification = (
  params: EvalParamType[], 
  level: "open" | "info" | "success" | "warning" | "error"
) => {
  const text = params?.[0] as string;
  const options = params?.[1] as JSONObject;

  const { message , duration, id, placement } = options;

  // Convert duration to a number or null, if it's not a valid number, default to null
  const durationNumberOrNull: number | null = typeof duration === 'number' ? duration : null;

  const notificationArgs: ArgsProps = {
    message: text,
    description: message as React.ReactNode,
    duration: durationNumberOrNull ?? 3,
    key: id as React.Key, // Ensure id is a valid React.Key
    placement: placement as NotificationPlacement ?? "bottomRight", // Ensure placement is a valid NotificationPlacement or undefined
  };

  // Use notificationArgs to trigger the notification

  text && notificationInstance[level](notificationArgs);
};

//what we would like to expose: title, text, duration, id, btn-obj, onClose, placement

const ToastCompBase = simpleMultiComp({});

export let ToastComp = withExposingConfigs(ToastCompBase, []);

/*
export declare const NotificationPlacements: readonly ["top", "topLeft", "topRight", "bottom", "bottomLeft", "bottomRight"];
export type NotificationPlacement = (typeof NotificationPlacements)[number];
export type IconType = 'success' | 'info' | 'error' | 'warning';
export interface ArgsProps {
    message: React.ReactNode;
    description?: React.ReactNode;
    btn?: React.ReactNode;
    key?: React.Key;
    onClose?: () => void;
    duration?: number | null;
    icon?: React.ReactNode;
    placement?: NotificationPlacement;
    style?: React.CSSProperties;
    className?: string;
    readonly type?: IconType;
    onClick?: () => void;
    closeIcon?: React.ReactNode;
    props?: DivProps;
    role?: 'alert' | 'status';
}
*/

ToastComp = withMethodExposing(ToastComp, [
  {
    method: { name: "open", description: trans("toastComp.info"), params: params },
    execute: (comp, params) => {
      showNotification(params, "open");
    },
  },
  {
    method: { name: "info", description: trans("toastComp.info"), params: params },
    execute: (comp, params) => {
      showNotification(params, "info");
    },
  },
  {
    method: { name: "success", description: trans("toastComp.success"), params: params },
    execute: (comp, params) => {
      showNotification(params, "success");
    },
  },
  {
    method: { name: "warn", description: trans("toastComp.warn"), params: params },
    execute: (comp, params) => {
      showNotification(params, "warning");
    },
  },
  {
    method: { name: "error", description: trans("toastComp.error"), params: params },
    execute: (comp, params) => {
      showNotification(params, "error");
    },
  },
]);


