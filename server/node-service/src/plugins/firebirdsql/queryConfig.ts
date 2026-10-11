import { ConfigToType } from "lowcoder-sdk/dataSource";
import { FirebirdI18nTranslator } from "./i18n";

function getQueryConfig(i18n: FirebirdI18nTranslator) {
  const queryConfig = {
    type: "query",
    label: i18n.trans("actions"),
    actions: [
      {
        actionName: "Query",
        label: i18n.trans("actionName"),
        params: [
          {
            label: i18n.trans("sqlInputField"),
            key: "sql",
            type: "sqlInput",
          },
          {
            label: i18n.trans("paramsInputField"),
            key: "params",
            type: "jsonInput",
          },
        ],
      },
    ],
  } as const;
  return queryConfig;
}

export type ActionDataType = ConfigToType<ReturnType<typeof getQueryConfig>>;

export default getQueryConfig;
