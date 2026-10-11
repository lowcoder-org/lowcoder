import { ConfigToType } from "lowcoder-sdk/dataSource";
import { specsToOptions } from "../../common/util";

const specs = {
  "v1.0": ""
}
export const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "privateKey",
      label: "Private Key",
      type: "password",
      tooltip:
        "The private key associated with a Service Account with GCS privileges, [Documentation](https://cloud.google.com/iam/docs/service-accounts) for service accounts.",
      rules: [
        { required: true, message: "Please input your private key of google Service Account" },
      ],
    },
    {
      key: "region",
      type: "textInput",
      label: "Region",
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

export type DataSourceDataType = ConfigToType<typeof dataSourceConfig>;

