import { readYaml, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin, QueryConfig } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseMultiOpenApi, parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";
import { mergeCategories } from "../../plugins/openApi/util";

// all OpenAPI specs generated from https://www.postman.com/cloudinaryteam/workspace/programmable-media/collection/16080251-d28221d4-b2f8-4244-a4eb-7e77abe3a857?ctx=documentation
const adminApiSpec = readYaml(path.join(__dirname, "./adminApi.spec.yaml"));
const uploadApiSpec = readYaml(path.join(__dirname, "./uploadApi.spec.yaml"));
const specList = [
  { spec: adminApiSpec, id: "admin" },
  { spec: uploadApiSpec, id: "upload" },
];
const specs = {
  "v1.0": specList,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "textInput",
      key: "basicAuth.username",
      label: "Username",
      tooltip: "Basic auth username",
      placeholder: "<Basic Auth Username>",
    },
    {
      type: "password",
      key: "basicAuth.password",
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
    return operation.summary || "";
  },
  actionDescription(method, path, operation) {
    return operation.description || "";
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

let queryConfig: any = {};

const cloudinaryPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "cloudinary",
  name: "Cloudinary",
  icon: "cloudinary.svg",
  category: "Assets",
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

export default cloudinaryPlugin;
