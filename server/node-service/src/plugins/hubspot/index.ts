import { dirToSpecList, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin, QueryConfig } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseMultiOpenApi, ParseOpenApiOptions } from "../openApi/parse";

const specs = {
  "v4": dirToSpecList(path.join(__dirname, "./specsV4")),
};

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "textInput",
      key: "authToken",
      label: "Private Access Token",
      placeholder: "<Your HubSpot private Apps Access Token>",
      tooltip: "Read more here: https://developers.hubspot.com/docs/guides/apps/private-apps/overview"
    },
    {
      label: "API Version",
      key: "specVersion",
      type: "select",
      tooltip: "Choose the HubSpot API Version.",
      placeholder: "v4",
      options: specsToOptions(specs)
    },
  ],
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

let queryConfig: any = {};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const hubspotPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "hubspot",
  name: "HubSpot",
  icon: "hubspot.svg",
  category: "CRM",
  dataSourceConfig,

  queryConfig: async (data) => {
    if (!queryConfig[data.specVersion as keyof typeof queryConfig]) {
      const { actions, categories } = await parseMultiOpenApi(version2spec(specs, data.specVersion), parseOptions);
      queryConfig[data.specVersion as keyof typeof queryConfig] = {
        type: "query",
        label: "Action",
        categories: {
          label: "Resources",
          items: categories,
        },
        actions,
      };
    }
    return queryConfig[data.specVersion as keyof typeof queryConfig];
  },

  run: function (actionData, dataSourceConfig): Promise<any> {
    const runApiDsConfig = {
      url: "",
      serverURL: "https://api.hubapi.com", // HubSpot API base URL
      dynamicParamsConfig: dataSourceConfig,
      specVersion: dataSourceConfig.specVersion,
      headers: {
        Authorization: `Bearer ${dataSourceConfig.authToken}`,
      },
    };
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion));
  },
};

export default hubspotPlugin;
