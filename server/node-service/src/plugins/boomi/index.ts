import { readYaml } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from './boomi.spec.json';

const dataSourceConfig = {
  type: "dataSource",
  params: [
  {
    key: "serverURL",
    type: "textInput",
    label: "Boomi API URL",
    rules: [{ required: true, message: "The Boomi API url is required" }],
    placeholder: "https://api.boomi.com/api/rest/v1/<atomsphere_account_ID>/",
  },
  {
    "type": "groupTitle",
    "key": "basicAuth",
    "label": "HTTP Basic Auth"
  },
  {
    "type": "textInput",
    "key": "basicAuth.username",
    "label": "Username",
    "tooltip": "Basic auth username",
    "placeholder": "<Basic Auth Username>"
  },
  {
    "type": "password",
    "key": "basicAuth.password",
    "label": "Password",
    "tooltip": "Basic auth password",
    "placeholder": "<Basic Auth Password>"
  }
]
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const boomiPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "boomi",
  name: "Boomi",
  icon: "boomi.svg",
  category: "Workflow",
  dataSourceConfig,
  queryConfig: async () => {
    const { actions, categories } = await parseOpenApi(spec as unknown as OpenAPI.Document, parseOptions);
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
    const { serverURL, ...otherDataSourceConfig } = dataSourceConfig;
    const runApiDsConfig = {
      url: "",
      serverURL: "",
      dynamicParamsConfig: otherDataSourceConfig,
    };
    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default boomiPlugin;
  