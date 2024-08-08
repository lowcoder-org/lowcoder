import _ from "lodash";
import { OpenAPIV2, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { defaultParseOpenApiOptions, parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";
import spec from "./CouchDB-3.1.1-resolved.json";
import { specsToOptions, version2spec } from "../../common/util";
const specs = {
  "v1.0": spec,
}
const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "serverURL",
      type: "textInput",
      label: "Server URL",
      rules: [{ required: true, message: "The server url is required" }],
      placeholder: "https://<your couchdb server host>",
    },
    { type: "groupTitle", key: "BasicAuth", label: "HTTP Basic Auth" },
    {
      type: "textInput",
      key: "BasicAuth.username",
      label: "Username",
      tooltip: "Basic auth username",
      placeholder: "<username>",
    },
    {
      type: "password",
      key: "BasicAuth.password",
      label: "Password",
      tooltip: "",
      placeholder: "<password>",
    },
    { type: "groupTitle", key: "JwtAuth", label: "Api Key Auth" },
    {
      type: "password",
      key: "JwtAuth.value",
      label: "Authorization",
      tooltip: "",
      placeholder: "",
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

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const parseOptions: ParseOpenApiOptions = {
  actionLabel: (method: string, path: string, operation: OpenAPI.Operation) => {
    const label = defaultParseOpenApiOptions.actionLabel(method, path, operation);
    return _.upperFirst(label);
  },
  actionDescription: (method: string, path: string, operation: OpenAPI.Operation) => {
    return operation.summary || "";
  },
};

const couchdbPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "couchdb",
  name: "CouchDB",
  icon: "couchdb.svg",
  category: "database",
  dataSourceConfig,
  queryConfig: async (data) => {
    const { actions, categories } = await parseOpenApi(version2spec(specs, data.specVersion) as OpenAPI.Document, parseOptions);
    return {
      type: "query",
      label: "Operation",
      categories: {
        label: "Resource",
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
      specVersion: dataSourceConfig.specVersion
    };
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion) as OpenAPIV2.Document);
  },
};

export default couchdbPlugin;
