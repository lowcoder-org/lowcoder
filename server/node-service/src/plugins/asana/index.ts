import { readYaml, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";


const spec = readYaml(path.join(__dirname, "./asana.spec.yaml"));
const specs = {
  "v1.0": spec,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      "type": "groupTitle",
      "key": "personalAccessToken",
      "label": "Api Token Auth"
    },
    {
      "type": "password",
      "key": "personalAccessToken.value",
      "label": "Token",
      "tooltip": "A [personal access token](https://developers.asana.com/docs/personal-access-token) allows access to the api for the user who created it. This should be kept a secret and be treated like a password.",
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

const asanaPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "asana",
  name: "Asana",
  icon: "asana.svg",
  category: "Project Management",
  dataSourceConfig,
  queryConfig: async (data) => {
    const { actions, categories } = await parseOpenApi(version2spec(specs, data.specVersion) as OpenAPI.Document, parseOptions);
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

export default asanaPlugin;
