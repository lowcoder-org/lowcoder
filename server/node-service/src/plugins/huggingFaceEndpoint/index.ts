import _ from "lodash";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

import spec from "./huggingFace.spec.json";
import { specsToOptions, version2spec } from "../../common/util";
const specs = {
  "v1.0": spec,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "textInput",
      key: "endpoint",
      label: "Endpoint URL",
      rules: [{ required: true }],
      tooltip:
        "Learn more about [Endpoint](https://huggingface.co/docs/inference-endpoints/guides/create_endpoint)",
    },
    {
      type: "password",
      key: "token.value",
      label: "Access Token",
      rules: [{ required: true }],
      tooltip:
        "You can get an Access Token [in your profile setting page](https://huggingface.co/settings/tokens)",
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
    return _.upperFirst(operation.operationId?.split("_").join(" ") || "");
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const huggingFacePlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "huggingFaceEndpoint",
  name: "Hugging Face Endpoints",
  icon: "huggingFace.svg",
  category: "AI",
  dataSourceConfig,
  queryConfig: async (data) => {
    const { actions, categories } = await parseOpenApi(
      version2spec(specs, data.specVersion) as unknown as OpenAPI.Document,
      parseOptions
    );
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
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion) as unknown as OpenAPIV3.Document);
  },
};

export default huggingFacePlugin;
