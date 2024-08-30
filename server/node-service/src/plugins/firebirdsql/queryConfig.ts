import { ConfigToType } from "lowcoder-sdk/dataSource";
import { FirebirdI18nTranslator } from "./i18n";

function getQueryConfig(i18n: FirebirdI18nTranslator) {
  const queryConfig = {
    type: "query",
    label: i18n.trans("actions"),
    actions: [
      {
        actionName: "Query",
        label: "Query",
        params: [
          {
            label: i18n.trans("actionName"),
            key: "sql",
            type: "sqlInput",
          },
        ],
      },
    ],
  } as const;
  return queryConfig;
}

export type ActionDataType = ConfigToType<ReturnType<typeof getQueryConfig>>;

export default getQueryConfig;
