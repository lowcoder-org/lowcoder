import { PluginContext } from "lowcoder-sdk/dataSource";
import queryConfig, { ActionDataType } from "./queryConfig";
import { dataSourceConfig, DataSourceDataType } from "./dataSourceConfig";
import run, { validateDataSourceConfig } from "./run";

const bigQueryPlugin = {
  id: "bigQuery",
  name: "Google Big Query",
  icon: "bigQuery.svg",
  category: "Big Data",
  dataSourceConfig,
  queryConfig: queryConfig,

  validateDataSourceConfig: async (dataSourceConfig: DataSourceDataType) => {
    return validateDataSourceConfig(dataSourceConfig);
  },

  run: async (action: ActionDataType, dataSourceConfig: DataSourceDataType, ctx: PluginContext) => {
    try {
      return await run(action, dataSourceConfig);
    } catch (e) {
      throw e;
    }
  },
};

export default bigQueryPlugin;
