import { dirToSpecList, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin, QueryConfig } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseMultiOpenApi, ParseOpenApiOptions } from "../openApi/parse";

const specs = {
  "v1.0": dirToSpecList(path.join(__dirname, "./did.spec")),
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "groupTitle",
      key: "basic",
      label: "HTTP Basic Auth",
    },
    {
      type: "textInput",
      key: "basic.username",
      label: "Username",
      tooltip: "Basic auth username",
      placeholder: "<Basic Auth Username>",
    },
    {
      type: "password",
      key: "basic.password",
      label: "Password",
      tooltip: "Basic auth password",
      placeholder: "<Basic Auth Password>",
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

let queryConfig: any = {};

const didPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "did",
  name: "D-ID",
  icon: "did.svg",
  category: "AI",
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
      serverURL: "",
      dynamicParamsConfig: dataSourceConfig,
      specVersion: dataSourceConfig.specVersion,
    };
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion));
  },
};

export default didPlugin;
