import { readYaml } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from './carboneIo.spec.json';

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "serverURL",
      type: "textInput",
      label: "Service URL",
      rules: [{ required: true }],
      placeholder: "https://api.carbone.io",
      tooltip: "Input the Service url of your Carbone instance.",
    },
    {
      "type": "password",
      "key": "bearerAuth.value",
      "label": "Token",
      "tooltip": "For Carbone Cloud, find your API key on your Carbone account https://account.carbone.io. Home page > Copy the `production` or `testing` API key.",
      "placeholder": "<your Carbone API Key>"
    }
  ]
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const carboneIoPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "carboneIo",
  name: "carboneIo",
  icon: "carboneIo.svg",
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
      dynamicParamsConfig: dataSourceConfig,
    };
    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default carboneIoPlugin;
