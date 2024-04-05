import { ActionParamConfig, Config, ConfigToType, QueryConfig } from "lowcoder-sdk/dataSource";
import { MinioI18nTranslator } from "./i18n";

function getQueryConfig(i18n: MinioI18nTranslator) {
  const bucketActionParam = {
    key: "bucket",
    type: "textInput",
    label: i18n.trans("bucket"),
  } as const;

  const queryConfig = {
    type: "query",
    label: i18n.trans("actions"),
    actions: [
      {
        actionName: "listBuckets",
        label: i18n.trans("actionName.listBuckets"),
        params: [],
      },
      {
        actionName: "getURL",
        label: i18n.trans("actionName.getURL"),
        params: [
          bucketActionParam,
          {
            key: "fileName",
            type: "textInput",
            label: i18n.trans("fileName"),
          },
          {
            key: "signURLTimeout",
            type: "numberInput",
            defaultValue: 900, // 15 minute
            label: i18n.trans("signURLTimeout"),
          },
        ]
      },
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
            key: "recursive",
            type: "switch",
            defaultValue: true,
            label: i18n.trans("recursive"),
          },
          {
            key: "withSignedURL",
            type: "switch",
            defaultValue: false,
            label: i18n.trans("withSignedURL"),
          },
          {
            key: "signURLTimeout",
            type: "numberInput",
            defaultValue: 900, // 15 minute
            label: i18n.trans("signURLTimeout"),
          },
        ],
      },
      {
        actionName: "readFile",
        label: i18n.trans("actionName.readFile"),
        params: [
          bucketActionParam,
          {
            key: "fileName",
            type: "textInput",
            label: i18n.trans("fileName"),
          },
          {
            key: "encoding",
            type: "select",
            label: i18n.trans("dataType"),
            options: [
              { label: "Base64", value: "base64" },
              { label: "Text", value: "utf8" },
            ],
          },
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
            key: "encoding",
            type: "select",
            label: i18n.trans("dataType"),
            options: [
              { label: "Base64", value: "base64" },
              { label: "Text", value: "utf8" },
            ],
          },
          {
            key: "data",
            type: "textInput",
            label: i18n.trans("data"),
          },
          {
            key: "contentType",
            type: "textInput",
            label: "Content-Type",
            placeholder: "image/png",
          },
        ],
      },
      {
        actionName: "deleteFile",
        label: i18n.trans("actionName.deleteFile"),
        params: [
          bucketActionParam,
          {
            key: "fileName",
            type: "textInput",
            label: i18n.trans("fileName"),
          },
        ],
      },
    ],
  } as const;
  return queryConfig;
}

export type ActionDataType = ConfigToType<ReturnType<typeof getQueryConfig>>;

export default getQueryConfig;
