import { readYaml, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPIV3, OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseOpenApi, ParseOpenApiOptions } from "../openApi/parse";
import { readFileSync } from "fs";
import { parse } from "yaml";

const yamlContent = readFileSync(path.join(__dirname, "./stripe.spec.yaml"), "utf-8");
const specs = {
  "v1.0": yamlContent,
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "groupTitle",
      key: "bearerAuth",
      label: "Api Token Auth",
    },
    {
      type: "password",
      key: "bearerAuth.value",
      label: "Secret Key",
      tooltip: "You can gen a Secret Key [here](https://dashboard.stripe.com/test/apikeys)",
      placeholder: "<Secret Key>",
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
};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const stripePlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "stripe",
  name: "Stripe",
  icon: "stripe.svg",
  category: "eCommerce",
  dataSourceConfig,
  queryConfig: async (data) => {
    const spec = parse(version2spec(specs, data.specVersion));
    const { actions, categories } = await parseOpenApi(spec as OpenAPI.Document, parseOptions);
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
    // always use a new spec object
    // because of this bug: https://github.com/APIDevTools/json-schema-ref-parser/issues/271
    const spec = parse(version2spec(specs, dataSourceConfig.specVersion));
    return runOpenApi(actionData, runApiDsConfig, spec as OpenAPIV3.Document);
  },
};

export default stripePlugin;
