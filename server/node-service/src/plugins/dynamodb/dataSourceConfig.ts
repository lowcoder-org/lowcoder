import { ConfigToType } from "lowcoder-sdk/dataSource";
import { specsToOptions } from "../../common/util";
const specs = {
  "v1.0": ""
}
const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "accessKey",
      label: "Access key ID",
      type: "textInput",
      placeholder: "<Your Access key ID>",
      rules: [{ required: true, message: "Please input the Access Key ID" }],
    },
    {
      key: "secretKey",
      label: "Secret key",
      type: "password",
      rules: [{ required: true, message: "Please input the Secret Key" }],
    },
    {
      key: "endpointUrl",
      label: "Endpoint URL",
      type: "textInput",
    },
    {
      key: "region",
      type: "textInput",
      label: "Region",
      defaultValue: "us-west-1",
    },
    {
      label: "Spec Version",
      key: "specVersion",
      type: "select",
      tooltip: "Version of the spec file.",
      placeholder: "v1.0",
      options: specsToOptions(specs)
    },
  ],
} as const;

export default dataSourceConfig;

export type DataSourceDataType = ConfigToType<typeof dataSourceConfig>;
