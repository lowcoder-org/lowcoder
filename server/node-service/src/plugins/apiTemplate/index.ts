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
    "type": "groupTitle",
    "key": "ApiKeyAuth",
    "label": "Api Key Auth"
  },
  {
    "type": "password",
    "key": "ApiKeyAuth.value",
    "label": "X-API-KEY",
    "tooltip": "An API key is needed to be set in the Authorization header of every API call.\nFor additional support you can contact us.\n\n- APITemplate.io expects the API key to be part of all API requests to the server in a header in this format:\n  ```\n  X-API-KEY: [API_KEY]\n  ```\n\n- Optionally we also support Authorization header\n  ```\n  Authorization: Token [API_KEY]\n  ```\n\n**Note: You must replace the API KEY(6fa6g2pdXGIyHRhVlGh7U56Ada1eF) with your API key in the request samples.**\n",
    "placeholder": "An API key is needed to be set in the Authorization header of every API call.\nFor additional support you can contact us.\n\n- APITemplate.io expects the API key to be part of all API requests to the server in a header in this format:\n  ```\n  X-API-KEY: [API_KEY]\n  ```\n\n- Optionally we also support Authorization header\n  ```\n  Authorization: Token [API_KEY]\n  ```\n\n**Note: You must replace the API KEY(6fa6g2pdXGIyHRhVlGh7U56Ada1eF) with your API key in the request samples.**\n"
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
  category: "Assets",
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
    const runApiDsConfig = {
      url: "",
      serverURL: "",
      dynamicParamsConfig: dataSourceConfig,
    };
    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default apiTemplatePlugin;
