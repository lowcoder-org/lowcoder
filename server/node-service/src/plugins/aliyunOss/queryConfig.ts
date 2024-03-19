import { ActionParamConfig, Config, ConfigToType, QueryConfig } from "lowcoder-sdk/dataSource";
import { AliyunOssI18nTranslator } from "./i18n";

function getQueryConfig(i18n: AliyunOssI18nTranslator) {
  const bucketActionParam = {
    key: "bucket",
    type: "textInput",
    label: i18n.trans("bucket"),
  } as const;

  const queryConfig = {
    type: "query",
    label: i18n.trans("actions"),
    actions: [
      // {
      //   actionName: "listBuckets",
      //   label: i18n.trans("actionName.listBuckets"),
      //   params: [],
      // },
      {
        actionName: "listObjects",
        label: i18n.trans("actionName.listObjects"),
        params: [
          bucketActionParam,
          {
            key: "prefix",
            type: "textInput",
            label: i18n.trans("prefix"),
          },
          {
            key: "delimiter",
            type: "textInput",
            label: i18n.trans("delimiter"),
          },
          {
            key: "limit",
            type: "numberInput",
            defaultValue: 10,
            label: i18n.trans("limit"),
          }
        ],
      },
      {
        actionName: "uploadData",
        label: i18n.trans("actionName.uploadFile"),
        params: [
          bucketActionParam,
          {
            key: "fileName",
            type: "textInput",
            label: i18n.trans("fileName"),
          },
          {
            key: "data",
            type: "textInput",
            label: i18n.trans("data"),
            tooltip: i18n.trans("dataTooltip"),
          },
        ],
      },
      // {
      //   actionName: "deleteFile",
      //   label: i18n.trans("actionName.deleteFile"),
      //   params: [
      //     bucketActionParam,
      //     {
      //       key: "fileName",
      //       type: "textInput",
      //       label: i18n.trans("fileName"),
      //     },
      //   ],
      // },
    ],
  } as const;
  return queryConfig;
}

export type ActionDataType = ConfigToType<ReturnType<typeof getQueryConfig>>;

export default getQueryConfig;
