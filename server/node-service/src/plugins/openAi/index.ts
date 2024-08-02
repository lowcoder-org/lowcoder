import { readYaml } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

const spec = readYaml(path.join(__dirname, "./openAi.yaml"));

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "ApiKey.value",
      type: "password",
      label: "API Key",
      rules: [{ required: true }],
      placeholder: "<Your API KEY>",
      tooltip:
        "[In your Open AI account page](https://platform.openai.com/account/api-keys) on which you can create your api key",
    },
    {
      label: "Spec Version",
      key: "specVersion",
      type: "select",
      tooltip: "Version of the spec file.",
      placeholder: "v1.0",
      options: [
        {
          value: "v1.0",
          label: "v1.0",
        },
        {
          value: "v2.0",
          label: "v2.0",
        }
      ]
    },
  ],
} as const;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const openAiPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "OpenAI",
  name: "Open AI",
  icon: "openAI.svg",
  category: "api",
  dataSourceConfig,
  queryConfig: async () => {
    const { actions, categories } = await parseOpenApi(spec, parseOptions);
    return {
      type: "query",
      label: "Action",
      categories: {
        label: "Category",
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
    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default openAiPlugin;
