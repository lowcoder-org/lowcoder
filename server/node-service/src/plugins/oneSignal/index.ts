import _ from "lodash";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from "./oneSignal.spec.json";
import { specsToOptions, version2spec } from "../../common/util";
const specs = {
  "v1.0": spec,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "password",
      key: "app_key.value",
      label: "REST API Key",
      tooltip:
        "Private key used for most API calls like sending push notifications and updating users. [Documentation](https://documentation.onesignal.com/docs/accounts-and-keys#rest-api-key)",
    },
    {
      type: "password",
      key: "user_key.value",
      label: "User Auth Key",
      tooltip:
        "Another type of REST API key used for viewing Apps and related updates. [Documentation](https://documentation.onesignal.com/docs/accounts-and-keys#user-auth-key)",
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
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const oneSignalPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "oneSignal",
  name: "OneSignal",
  icon: "oneSignal.svg",
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
      serverURL: "",
      dynamicParamsConfig: dataSourceConfig,
      specVersion: dataSourceConfig.specVersion,
    };
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion) as OpenAPIV3.Document);
  },
};

export default oneSignalPlugin;
