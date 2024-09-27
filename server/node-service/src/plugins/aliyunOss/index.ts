import { DataSourcePluginFactory, PluginContext } from "lowcoder-sdk/dataSource";
import getI18nTranslator from "./i18n";
import getDataSourceConfig, { DataSourceDataType } from "./dataSourceConfig";
import run, { validateDataSourceConfig } from "./run";
import getQueryConfig, { ActionDataType } from "./queryConfig";
import { ServiceError } from "../../common/error";

const ossPlugin: DataSourcePluginFactory = (context: PluginContext) => {
    const i18n = getI18nTranslator(context.languages);
    return {
      id: "oss",
      name: i18n.trans("name"),
      icon: "alibabaOss.svg",
      description: i18n.trans("description"),
      category: "Assets",
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
        } catch (e:any) {
            throw new ServiceError(e.message, 400);
        }
      },
    };
  };
  
  export default ossPlugin;
  