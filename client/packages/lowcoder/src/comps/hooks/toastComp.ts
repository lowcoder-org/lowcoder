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

  const { message , duration, id, placement, dismissible } = options;

  const closeIcon: boolean | undefined = dismissible === true ? undefined : (dismissible === false ? false : undefined);

  const durationNumberOrNull: number | null = typeof duration === 'number' ? duration : null;

  const notificationArgs: ArgsProps = {
    message: text,
    description: message as React.ReactNode,
    duration: durationNumberOrNull ?? 3,
    key: id as React.Key,
    placement: placement as NotificationPlacement ?? "bottomRight",
    closeIcon: closeIcon as boolean,
  };

  // Use notificationArgs to trigger the notification

  text && notificationInstance[level](notificationArgs);
};

const destroy = (
  params: EvalParamType[]
) => {
  // Extract the id from the params
  const id = params[0] as React.Key;
  
  // Call notificationInstance.destroy with the provided id
  notificationInstance.destroy(id);
};

//what we would like to expose: title, text, duration, id, btn-obj, onClose, placement

const ToastCompBase = simpleMultiComp({});

export let ToastComp = withExposingConfigs(ToastCompBase, []);

ToastComp = withMethodExposing(ToastComp, [
  {
    method: { name: "destroy", description: trans("toastComp.destroy"), params: params },
    execute: (comp, params) => destroy(params),
  },
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


