import { readYaml, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, parseMultiOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec_1_2_0 from "./openAI_v1.2.0.json";
import spec_2_3_0 from "./openAI_v2.3.0.json";

/** scheme names of the bundled specs: v1.0 (openAI_v1.2.0.json) "ApiKey", v2.3 (openAI_v2.3.0.json) "ApiKeyAuth" */
const API_KEY_V1_SCHEME_VALUE = "ApiKey.value";
const API_KEY_V2_SCHEME_VALUE = "ApiKeyAuth.value";

const specs = {
  "v1.0": spec_1_2_0,
  "v2.3": spec_2_3_0,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "serverURL",
      type: "textInput",
      label: "Service URL",
      rules: [{ required: true }],
      placeholder: "https://<your-cloud-instance>",
      tooltip: "Input the Service url of your OpenAI or compatible instance. For OpenAI, it is https://api.openai.com/v1",
    },
    {
      key: "apiKey",
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
      options: specsToOptions(specs)
    },
  ],
} as const;

const parseOptions: ParseOpenApiOptions = {
  /* actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId || "");
  }, */
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    return _.upperFirst(operation.operationId) || operation.summary || "";
  },
  actionDescription(method, path, operation) {
    return operation.description || "";
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const openAiPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "OpenAI",
  name: "Open AI",
  icon: "openAI.svg",
  category: "AI",
  dataSourceConfig,
  queryConfig: async (data) => {
    const { actions, categories } = await parseOpenApi(version2spec(specs, data.specVersion), parseOptions);
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
    const { serverURL, apiKey } = dataSourceConfig;
    const runApiDsConfig = {
      url: "",
      serverURL: serverURL,
      dynamicParamsConfig: apiKey ? { [API_KEY_V1_SCHEME_VALUE]: apiKey, [API_KEY_V2_SCHEME_VALUE]: apiKey } : {},
      specVersion: dataSourceConfig.specVersion,
    };
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion) as OpenAPIV3.Document);
  },
};

export default openAiPlugin;
