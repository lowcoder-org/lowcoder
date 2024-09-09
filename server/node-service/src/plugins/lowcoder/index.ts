import { readYaml, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from './lowcoder.spec.json';
const specs = {
  "v1.0": spec,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "serverURL",
      type: "textInput",
      label: "Lowcoder API Service URL",
      rules: [{ required: true }],
      placeholder: "https://<your-lowcoder-api-service>:port",
      tooltip: "Input the server url of your self-hosting instance or api-service.lowcoder.cloud if you are running your apps on the free public Community Edition Cloud Service.",
    },
    {
      "type": "groupTitle",
      "key": "API Key",
      "label": "Api Key Auth"
    },
    {
      type: "password",
      key: "bearerAuth.value",
      label: "Authorization",
      "tooltip": "API Key Authentication with a Bearer token. Copy your API Key here. (e.g. 'Bearer eyJhbGciO...')",
      "placeholder": "API Key Authentication with a Bearer token. Copy your API Key here. (e.g. 'Bearer eyJhbGciO...')"
    },
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
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const lowcoderPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "lowcoder",
  name: "Lowcoder API",
  icon: "lowcoder.svg",
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
    const { serverURL, ...otherDataSourceConfig } = dataSourceConfig;
    const runApiDsConfig = {
      url: "",
      serverURL: serverURL,
      dynamicParamsConfig: otherDataSourceConfig,
      specVersion: dataSourceConfig.specVersion,
    };
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion) as OpenAPIV3.Document);
  },
};

export default lowcoderPlugin;
