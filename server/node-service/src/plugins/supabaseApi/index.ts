import { readYaml } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from './supabaseApi.spec.json';

const dataSourceConfig = {
  type: "dataSource",
  params: [
  {
    "type": "groupTitle",
    "key": "serverURL",
    "label": "Supabase API Url"
  },
  {
    key: "serverURL",
    type: "textInput",
    label: "Server URL",
    rules: [{ required: true, message: "The server url is required" }],
    placeholder: "https://<your couchdb server host>",
  },
  {
    "type": "groupTitle",
    "key": "bearerAuth",
    "label": "Api Token Auth"
  },
  {
    "type": "password",
    "key": "bearerAuth.value",
    "label": "Token",
    "tooltip": "API Key Authentication with a Bearer token. Copy your API Key from Supabase here. (e.g. 'eyJhbGciO...'",
    "placeholder": "API Key Authentication with a Bearer token. Copy your API Key from Supabase here. (e.g. 'eyJhbGciO...'"
  }
]
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const supabaseApiPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "supabaseApi",
  name: "Supabase Mgmt API",
  icon: "supabase.svg",
  category: "api",
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
      serverURL: serverURL,
      dynamicParamsConfig: otherDataSourceConfig,
    };

    console.log("runApiDsConfig", runApiDsConfig);

    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default supabaseApiPlugin;
