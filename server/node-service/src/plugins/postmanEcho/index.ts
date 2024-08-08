import { readYaml, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from './postmanEcho.spec.json';
const specs = {
  "v1.0": spec,
}


const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      label: "Spec Version",
      key: "specVersion",
      type: "select",
      tooltip: "Version of the spec file.",
      placeholder: "v1.0",
      options: specsToOptions(specs)
    },
  ]
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.summary ? operation.summary : operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const postmanEchoPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "postmanEcho",
  name: "Postman Echo",
  icon: "postmanEcho.svg",
  category: "App Development",
  dataSourceConfig,
  queryConfig: async (data) => {
    const { actions, categories } = await parseOpenApi(version2spec(specs, data.specVersion) as unknown as OpenAPI.Document, parseOptions);
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

export default postmanEchoPlugin;
