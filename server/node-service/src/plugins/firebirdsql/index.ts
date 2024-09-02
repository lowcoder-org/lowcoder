import { DataSourcePluginFactory, PluginContext } from "lowcoder-sdk/dataSource";
import getDataSourceConfig, { DataSourceDataType } from "./dataSourceConfig";
import getQueryConfig, { ActionDataType } from "./queryConfig";
import getI18nTranslator from "./i18n";
import run, { validateDataSourceConfig } from "./run";

const firebirdsqlPlugin: DataSourcePluginFactory = (context: PluginContext) => {
  const i18n = getI18nTranslator(context.languages);
  return {
    id: "firebird",
    name: i18n.trans("name"),
    icon: "firebirdsql.svg",
    description: i18n.trans("description"),
    category: "database",
    dataSourceConfig: getDataSourceConfig(i18n),
    queryConfig: getQueryConfig(i18n),

    validateDataSourceConfig: async (dataSourceConfig: DataSourceDataType) => {
      return validateDataSourceConfig(dataSourceConfig);
    },

    run: async (
      action: ActionDataType,
      dataSourceConfig: DataSourceDataType,
      ctx: PluginContext
    ) => {
      const i18n = getI18nTranslator(ctx.languages);
      try {
        return await run(action, dataSourceConfig, i18n);
      } catch (e) {
        throw e;
      }
    },
  };
};

export default firebirdsqlPlugin;
