import { withMethodExposing } from "../generators/withMethodExposing";
import { simpleMultiComp } from "../generators";
import { withExposingConfigs } from "../generators/withExposing";
import { isEmpty } from "lodash";
import copy from "copy-to-clipboard";
import { saveDataAsFile } from "../../util/fileUtils";
import { openApp, recordToSearchStr } from "../../util/appUtils";
import { trans } from "i18n";
import { logoutAction } from "redux/reduxActions/userActions";
import StoreRegistry from "@lowcoder-ee/redux/store/storeRegistry";
import UserApi from "@lowcoder-ee/api/userApi";
import { messageInstance } from "components/GlobalInstances";
import { isEditMode } from "../utils/globalSettings";

const UtilsCompBase = simpleMultiComp({});
export let UtilsComp = withExposingConfigs(UtilsCompBase, []);

interface OpenUrlOptions {
  newTab?: boolean;
}

interface OpenAppOptions {
  queryParams?: Record<string, string>;
  hashParams?: Record<string, string>;
  newTab?: boolean;
}

interface DownloadFileOptions {
  fileType?: string;
  dataType?: "url" | "base64";
}

UtilsComp = withMethodExposing(UtilsComp, [
  {
    method: {
      name: "isEditMode",
      description: trans("utilsComp.isEditMode"),
      params: [],
    },
    execute: (comp, params) => {
      return isEditMode();
    },
  },
  {
    method: {
      name: "openUrl",
      description: trans("utilsComp.openUrl"),
      params: [
        { name: "url", type: "string" },
        { name: "options", type: "JSON" },
      ],
    },
    execute: (comp, params) => {
      const url = params?.[0];
      const options = params?.[1] as unknown as OpenUrlOptions;
      const newTab = options?.newTab ?? true;
      if (typeof url === "string" && !isEmpty(url)) {
        window.open(url, newTab ? "_blank" : "_self");
      }
    },
  },
  {
    method: {
      name: "openApp",
      description: trans("utilsComp.openApp"),
      params: [
        { name: "applicationId", type: "string" },
        { name: "options", type: "JSON" },
      ],
    },
    execute: (comp, params) => {
      const applicationId = params?.[0];
      const options = params?.[1] as unknown as OpenAppOptions;
      const newTab = options?.newTab ?? true;
      const queryParams = options?.queryParams ?? {};
      const hashParams = options?.hashParams ?? {};

      openApp({
        applicationId: applicationId as string,
        queryParams: recordToSearchStr(queryParams),
        hashParams: recordToSearchStr(hashParams),
        newTab: newTab,
      });
    },
  },
  {
    method: {
      name: "copyToClipboard",
      description: trans("utilsComp.copyToClipboard"),
      params: [{ name: "url", type: "string" }],
    },
    execute: (comp, params) => {
      const text = params?.[0];
      if (typeof text === "string" && !isEmpty(text)) {
        copy(text);
      }
    },
  },
  {
    method: {
      name: "downloadFile",
      description: trans("utilsComp.downloadFile"),
      params: [
        { name: "url", type: "string" },
        { name: "options", type: "JSON" },
      ],
    },
    execute: (comp, params) => {
      const data = params?.[0];
      const fileName = params?.[1];
      const options = params?.[2] as unknown as DownloadFileOptions;
      const fileType = options?.fileType ?? "empty";
      const dataType = options?.dataType;

      if (data && fileName && !isEmpty(fileName)) {
        saveDataAsFile({
          data: data,
          filename: fileName as string,
          fileType: fileType,
          dataType: dataType,
        });
      }
    },
  },
  {
    method: {
      name: "logoutUser",
      description: trans("utilsComp.logoutUser"),
      params: [],
    },
    execute: (comp, params) => {
      StoreRegistry.getStore().dispatch(
        logoutAction({})
      );
    },
  },
  {
    method: {
      name: "resetPassword",
      description: trans("utilsComp.resetPassword"),
      params: [
        { name: "oldPassword", type: "string" },
        { name: "newPassword", type: "string" },
      ],
    },
    execute: async (comp, params) => {
      const oldPassword = params?.[0];
      const newPassword = params?.[1];
      try {
        if (Boolean(oldPassword) && Boolean(newPassword)) {
          const response = await UserApi.updatePassword({
            oldPassword: oldPassword as string,
            newPassword: newPassword as string,
          });
          if (!response.data.success) {
            throw (new Error(response.data.message));
          }
        } else {
          throw(new Error('Reset password requires both old and new passwords'))
        }
      } catch(e: any) {
        messageInstance.error(e.message)
      }
    },
  }
]);
