import { badRequest } from "../../common/error";
import _ from "lodash";
import { OpenAPIV2, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { defaultParseOpenApiOptions, parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";
import spec from "./woocommerce-spec.json";
import { specsToOptions, version2spec } from "../../common/util";
const specs = {
  "v1.0": spec,
}

export function prepareServerUrl(url: string) {
  if (/\/wc\/v[12]$/.test(url)) {
    throw badRequest("only woocommerce api v3 is supported");
  }
  if (/\/wc\/v3$/.test(url)) {
    return url;
  }
  if (!url.endsWith("/")) {
    url += "/";
  }
  return url + "wp-json/wc/v3";
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "serverURL",
      type: "textInput",
      label: "Server URL",
      rules: [{ required: true, message: "The server url is required" }],
      placeholder: "https://localhost/wp-json/wc/v3",
      tooltip: "HTTPS is required",
    },
    { type: "groupTitle", key: "BasicAuth", label: "HTTP Basic Auth" },
    {
      type: "textInput",
      key: "basicAuth.username",
      label: "Username",
      tooltip: "Basic auth username",
      placeholder: "<username>",
    },
    {
      type: "password",
      key: "basicAuth.password",
      label: "Password",
      tooltip: "",
      placeholder: "<password>",
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
    return operation.summary || defaultParseOpenApiOptions.actionLabel(method, path, operation);
  },
  actionDescription: (method: string, path: string, operation: OpenAPI.Operation) => {
    return `${method} ${path}`;
  },
};

const wooCommercePlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "woocommerce",
  name: "WooCommerce",
  icon: "woocommerce.svg",
  category: "eCommerce",
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
      serverURL: prepareServerUrl(serverURL),
      dynamicParamsConfig: otherDataSourceConfig,
      specVersion: dataSourceConfig.specVersion
    };
    return runOpenApi(actionData, runApiDsConfig, version2spec(specs, dataSourceConfig.specVersion) as unknown as OpenAPIV2.Document);
  },
};

export default wooCommercePlugin;
