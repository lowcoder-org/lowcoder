import { readYaml, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";

const spec = readYaml(path.join(__dirname, "./notion.spec.yaml"));
const specs = {
  "v1.0": spec,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "textInput",
      key: "notionVersion",
      label: "Version",
      defaultValue: "2022-06-28",
      tooltip:
        "Version list can be found [here](https://developers.notion.com/reference/changes-by-version).",
    },
    {
      type: "password",
      key: "bearerAuth.value",
      label: "Token",
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
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const notionPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "notion",
  name: "Notion",
  icon: "notion.svg",
  category: "Project Management",
  dataSourceConfig,
  queryConfig: async (data) => {
    const { actions, categories } = await parseOpenApi(version2spec(specs, data.specVersion), parseOptions);
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
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion) as OpenAPIV3.Document, {
      "Notion-Version": dataSourceConfig.notionVersion,
    });
  },
};

export default notionPlugin;
