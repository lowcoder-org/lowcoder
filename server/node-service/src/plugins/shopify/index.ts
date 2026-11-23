import { kvToRecord } from "../../common/util";
import { ConfigToType, DataSourcePlugin, PluginContext } from "lowcoder-sdk/dataSource";
import { graphQLQueryConfig } from "../graphql/queryConfig";
import { runGraphQL } from "../graphql/run";

// The header name comes from Shopify's public API documentation and was not verified against a Shopify endpoint.
const SHOPIFY_TOKEN_HEADER = "X-Shopify-Access-Token";

export const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "textInput",
      label: "Endpoint",
      key: "endpoint",
      rules: [{ required: true }],
    },
    {
      type: "password",
      label: "Access Token",
      key: "accessToken",
      tooltip: "Admin API access token, sent as X-Shopify-Access-Token",
    },
  ],
} as const;

const shopifyPlugin: DataSourcePlugin<
  ConfigToType<typeof graphQLQueryConfig>,
  ConfigToType<typeof dataSourceConfig>
> = {
  id: "shopify",
  name: "Shopify",
  category: "eCommerce",
  icon: "shopify.svg",
  dataSourceConfig,
  queryConfig: graphQLQueryConfig,
  run: function (actionData, dataSourceConfig, context: PluginContext): Promise<any> {
    const { query, variables: variableKvs, headers: queryHeaders } = actionData;
    const { endpoint, accessToken } = dataSourceConfig;
    const headers = kvToRecord(queryHeaders);
    if (typeof accessToken === "string" && accessToken !== "") {
      for (const name of Object.keys(headers)) {
        if (name.toLowerCase() === SHOPIFY_TOKEN_HEADER.toLowerCase()) {
          delete headers[name];
        }
      }
      headers[SHOPIFY_TOKEN_HEADER] = accessToken;
    }
    const variables = kvToRecord(variableKvs);
    return runGraphQL(endpoint, query, variables, headers);
  },
};

export default shopifyPlugin;
