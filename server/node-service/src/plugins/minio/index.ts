import _ from "lodash";
import { DataSourcePluginFactory, PluginContext } from "lowcoder-sdk/dataSource";
import { ActionDataType } from "./queryConfig";
import { DataSourceDataType } from "./dataSourceConfig";
import run, { validateDataSourceConfig } from "./run";
import getI18nTranslator from "./i18n";
import getDataSourceConfig from "./dataSourceConfig";
import getQueryConfig from "./queryConfig";


const minioS3Plugin: DataSourcePluginFactory = (context: PluginContext) => {
  const i18n = getI18nTranslator(context.languages);
  return {
    id: "minio",
    name: i18n.trans("name"),
    icon: "minio.svg",
    description: i18n.trans("description"),
    category: "api",
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

export default minioS3Plugin;
