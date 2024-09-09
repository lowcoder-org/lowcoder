import { dirToSpecList, specsToOptions, version2spec } from "../../common/util";
import _ from "lodash";
import path from "path";
import { OpenAPI } from "openapi-types";
import { ConfigToType, DataSourcePlugin, QueryConfig } from "lowcoder-sdk/dataSource";
import { runOpenApi } from "../openApi";
import { parseMultiOpenApi, ParseOpenApiOptions } from "../openApi/parse";


const specs = {
  "v1.0": dirToSpecList(path.join(__dirname, "./twilio.spec.v1")),
  "v2.0": dirToSpecList(path.join(__dirname, "./twilio.spec.v2")),
  "v3.0": dirToSpecList(path.join(__dirname, "./twilio.spec.v3")),
  "v2010": dirToSpecList(path.join(__dirname, "./twilio.spec.v2010")),
}

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "textInput",
      key: "accountSid_authToken.username",
      label: "SID",
      placeholder: "<SID>",
    },
    {
      type: "password",
      key: "accountSid_authToken.password",
      label: "Secret",
      placeholder: "<Secret>",
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

let queryConfig: any = {};

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;

const twilioPlugin: DataSourcePlugin<any, DataSourceConfigType> = {
  id: "twilio",
  name: "Twilio",
  icon: "twilio.svg",
  category: "Messaging",
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

export default twilioPlugin;
