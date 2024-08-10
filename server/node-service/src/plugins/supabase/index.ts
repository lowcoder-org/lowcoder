import _ from "lodash";
import { DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { dataSourceConfig, DataSourceDataType } from "./dataSourceConfig";
import queryConfig, { ActionDataType } from "./queryConfig";
import run from "./run";
import { ServiceError } from "../../common/error";

const supabasePlugin: DataSourcePlugin<ActionDataType, DataSourceDataType> = {
  id: "supabase",
  name: "Supabase Assets",
  icon: "supabase.svg",
  category: "Assets",
  dataSourceConfig,
  queryConfig,
  run: async function (actionData, dataSourceConfig) {
    try {
      return await run(actionData, dataSourceConfig);
    } catch (e: any) {
      if ((e as any).__isStorageError) {
        throw new ServiceError(e.message || e.cause);
      }
      throw e;
    }
  },
};

export default supabasePlugin;
