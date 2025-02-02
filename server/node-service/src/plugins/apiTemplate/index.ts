import { readYaml } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from './apiTemplate.spec.json';

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "serverURL",
      type: "textInput",
      label: "Service URL",
      rules: [{ required: true }],
      placeholder: "https://rest.apitemplate.io",
      tooltip: "Input the Service URL of your ApiTemplate Endpoint.",
    },
    {
      "type": "password",
      "key": "ApiKeyAuth.value",
      "label": "X-API-KEY",
      "tooltip": "For additional support you can contact us. hello@apitemplate.io",
      "placeholder": "<Your ApiTemplate Secret Key>"
    }
  ]
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const apiTemplatePlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "apiTemplate",
  name: "ApiTemplate",
  icon: "apiTemplate.svg",
  category: "DocumentHandling",
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
        "X-API-KEY" : dataSourceConfig["ApiKeyAuth.value"],
      },
    };
    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default apiTemplatePlugin;
