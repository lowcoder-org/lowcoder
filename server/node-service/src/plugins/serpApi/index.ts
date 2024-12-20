import _ from "lodash";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from './serpApi.search.spec.json';

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      "type": "groupTitle",
      "key": "apikey-query-api_key",
      "label": "Api Key Auth"
    },
    {
      "type": "password",
      "key": "apikey-query-api_key.value",
      "label": "API Key",
      "tooltip" : "SerpAPI allows you to scrape the results from Google search engine via our SerpApi service. Start here https://serpapi.com/pricing to get an API Key."
    }
  ]
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const serpApiPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "serpApi",
  name: "serpApi",
  icon: "serpApi.svg",
  category: "Webscrapers",
  dataSourceConfig,
  queryConfig: async () => {
    const { actions, categories } = await parseOpenApi(spec as OpenAPI.Document, parseOptions);
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
      serverURL: "https://serpapi.com",
      dynamicParamsConfig: dataSourceConfig,
    };
    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default serpApiPlugin;
