import { ConfigToType } from "lowcoder-sdk/dataSource";
import { AliyunOssI18nTranslator } from "./i18n";

const getDataSourceConfig = (i18n: AliyunOssI18nTranslator) => {
  const dataSourceConfig = {
    type: "dataSource",
    params: [
      {
        key: "accessKeyId",
        label: "Access key ID",
        type: "textInput",
        placeholder: "<Your Access key ID>",
        rules: [{ required: true, message: i18n.trans("akRequiredMessage") }],
      },
      {
        key: "accessKeySecret",
        label: "Secret key",
        type: "password",
        placeholder: "<Your Access key Secrect>",
        rules: [{ required: true, message: i18n.trans("skRequiredMessage") }],
      },
      {
        key: "arn",
        label: "ARN",
        type: "password",
        tooltip: i18n.trans("arnTooltip"),
        placeholder: "<Your Aliyun ARN>",
        rules: [{ required: true, message: i18n.trans("arnRequiredMessage") }],
      },
      {
        key: "endpointUrl",
        label: "STS Endpoint",
        type: "textInput",
        tooltip: i18n.trans("endpointUrlTooltip"),
        default: "sts.cn-hangzhou.aliyuncs.com",
        rules: [{ required: true }],
      },
      {
        key: "region",
        type: "textInput",
        label: i18n.trans("region"),
        defaultValue: "oss-cn-hangzhou",
        rules: [{ required: true }],
      },
    ],
  } as const;
  return dataSourceConfig;
};

export default getDataSourceConfig;

export type DataSourceDataType = ConfigToType<ReturnType<typeof getDataSourceConfig>>;
