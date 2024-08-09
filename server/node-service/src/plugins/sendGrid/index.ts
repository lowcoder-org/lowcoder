import _ from "lodash";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from "./sendGrid.spec.json";
import { specsToOptions, version2spec } from "../../common/util";
const specs = {
  "v1.0": spec,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "password",
      key: "Authorization.value",
      label: "API Key",
      tooltip:
        "[Documentation](https://docs.sendgrid.com/ui/account-and-settings/api-keys#creating-an-api-key)",
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

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) =>
    operation.operationId?.replace("_", " ") || "",
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const sendGridPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "sendGrid",
  name: "SendGrid",
  icon: "sendGrid.svg",
  category: "Messaging",
  dataSourceConfig,
  queryConfig: async (data) => {
    const { actions, categories } = await parseOpenApi(
      version2spec(specs, data.specVersion) as unknown as OpenAPI.Document,
      parseOptions
    );
    return {
      type: "query",
      label: "Action",
      categories: {
        label: "Resources",
        items: categories,
      },
      actions,
    };
  },
  run: function (actionData, dataSourceConfig): Promise<any> {
    const runApiDsConfig = {
      url: "",
      serverURL: "https://api.sendgrid.com/v3",
      dynamicParamsConfig: {
        ...dataSourceConfig,
        "Authorization.value": "Bearer " + dataSourceConfig["Authorization.value"],
      },
      specVersion: dataSourceConfig.specVersion,
    };
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion) as unknown as OpenAPIV3.Document);
  },
};

export default sendGridPlugin;
