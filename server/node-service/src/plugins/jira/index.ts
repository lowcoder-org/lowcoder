import { readFileSync } from "fs";
import _ from "lodash";
import { OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin, QueryConfig } from "lowcoder-sdk/dataSource";
import path from "path";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";
import { specsToOptions, version2spec } from "../../common/util";

const specJson = readFileSync(path.join(__dirname, "./jira.spec.json")).toString();
const specs = {
  "v1.0": specJson,
}
//TODO: Thomas

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "textInput",
      key: "serverUrl",
      label: "Server URL",
      placeholder: "https://your-domain.atlassian.net",
    },
    {
      type: "groupTitle",
      key: "basicAuth",
      label: "HTTP Basic Auth",
    },
    {
      type: "textInput",
      key: "basicAuth.username",
      label: "Account Email",
      tooltip: "The email of your atlassian account",
      placeholder: "<The email of your atlassian account>",
    },
    {
      type: "password",
      key: "basicAuth.password",
      label: "Api Token",
      tooltip: "Basic auth password",
      placeholder: "<API Token>",
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
  actionDescription(method, path, operation) {
    return operation.description || "";
  },
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

let queryConfig: any = {};

const jiraPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "jira",
  name: "Jira",
  icon: "jira.svg",
  category: "Project Management",
  dataSourceConfig,
  queryConfig: async (data) => {
    if (!queryConfig[data.specVersion as keyof typeof queryConfig]) {
      const { actions, categories } = await parseOpenApi(JSON.parse(version2spec(specs, data.specVersion)), parseOptions);
      queryConfig[data.specVersion as keyof typeof queryConfig] = {
        type: "query",
        label: "Action",
        categories: {
          label: "Category",
          items: categories,
        },
        actions,
      };
    }
    return queryConfig[data.specVersion as keyof typeof queryConfig];
  },
  run: function (actionData, dataSourceConfig): Promise<any> {
    const spec = JSON.parse(version2spec(specs, dataSourceConfig.specVersion));
    const runApiDsConfig = {
      url: "",
      serverURL: dataSourceConfig.serverUrl,
      dynamicParamsConfig: dataSourceConfig,
      specVersion: dataSourceConfig.specVersion,
    };
    return runOpenApi(actionData, runApiDsConfig, spec);
  },
};

export default jiraPlugin;
