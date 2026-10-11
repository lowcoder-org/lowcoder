import { readYaml } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from './uiPath.spec.json';

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "serverURL",
      type: "textInput",
      label: "Service URL",
      rules: [{ required: true }],
      placeholder: "https://uipath-orch.<your-uipath-instance>",
      tooltip: "Input the Service url of your UIPath instance.",
    },
    {
      key: "Authorization.value",
      type: "password",
      label: "Personal Access Token",
      rules: [{ required: true }],
      placeholder: "<Your Personal Access Token>",
      tooltip:
        "[How to generate my Personal Access Token:](https://docs.uipath.com/automation-cloud/automation-cloud/latest/api-guide/personal-access-tokens)",
    }
  ]
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const uiPathPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "uiPath",
  name: "UiPath",
  icon: "uiPath.svg",
  category: "RPA",
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
    const { serverURL } = dataSourceConfig;
    const runApiDsConfig = {
      url: "",
      serverURL: serverURL,
      dynamicParamsConfig: {
        ...dataSourceConfig,
        "Authorization.value": "Bearer " + dataSourceConfig["Authorization.value"],
      },
    };
    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default uiPathPlugin;
